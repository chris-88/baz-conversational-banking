// deno-lint-ignore-file no-explicit-any
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { bazTurnRequestSchema } from '../_shared/contracts/baz-turn.ts'
import { fail, statusFor } from '../_shared/contracts/common.ts'
import { toSseFrame, type StreamEvent } from '../_shared/contracts/stream.ts'
import type { Card } from '../_shared/contracts/cards.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { stateLabel } from '../_shared/domain/state-machine.ts'
import { runGate } from '../_shared/llm/gate.ts'
import { createClassifier } from '../_shared/llm/classifier.ts'
import { runBazTurn } from '../_shared/llm/baz.ts'
import { toneBucket } from '../_shared/llm/persona.ts'
import type { ToolName } from '../_shared/llm/tools.ts'
import { boiDomainConfig } from '../_shared/tenants/boi/domain-config.ts'
import { boiProducts, productInfo } from '../_shared/tenants/boi/products.ts'
import {
  loadCase,
  recordFacts,
  saveMessage,
  writeEvent,
} from '../_shared/db/case-repository.ts'
import { buildCaseDigest } from '../_shared/db/digest.ts'
import { participantFor, previousAssistantTurn } from '../_shared/db/loaded-case.ts'

/**
 * `baz-turn` — gate, then model, then persist (CLAUDE.md > A Baz turn).
 *
 * The order is the point. Nothing reaches the model that the gate has not allowed, and the
 * model's output is persisted only after the tools it called have taken effect, so what the
 * next turn reads is what actually happened.
 */

/** M2 exposes only the tools whose cards exist. The rest arrive with M3. */
const ENABLED_TOOLS: readonly ToolName[] = ['record_facts', 'show_product_options', 'show_status']

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function errorResponse(code: Parameters<typeof statusFor>[0], message: string): Response {
  return new Response(JSON.stringify(fail(code, message)), {
    status: statusFor(code),
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function env(name: string): string {
  const value = (globalThis as any).Deno?.env?.get(name)
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing environment variable ${name}`)
  }
  return value
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return errorResponse('bad_request', 'Use POST.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return errorResponse('unauthorised', 'Sign in first.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('bad_request', 'Body must be JSON.')
  }

  const parsed = bazTurnRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('bad_request', parsed.error.issues.map((i) => i.message).join('; '))
  }
  const turn = parsed.data

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  // Identity comes from the caller's own JWT, never from the request body.
  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in first.')

  const sessionLookup = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', caller.data.user.id)
    .limit(50)

  const session = (sessionLookup.data ?? []).find(
    (row: any) => row.participants?.case_id === turn.caseId,
  )
  if (!session) return errorResponse('forbidden', 'This is not your case.')

  const loaded = await loadCase(admin, turn.caseId)
  if (!loaded) return errorResponse('not_found', 'That case does not exist.')

  const tone = toneBucket(loaded.persona)

  // ---- Gate -------------------------------------------------------------
  const anthropic = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') })
  const classify = createClassifier({
    apiKey: env('ANTHROPIC_API_KEY'),
    model: env('GATE_MODEL'),
    domainConfig: boiDomainConfig,
    client: anthropic,
  })

  const customerMessage = turn.message ?? ''
  const isCustomerTurn = turn.trigger === 'message'

  const gate = isCustomerTurn
    ? await runGate(customerMessage, {
        classify: (message) => {
          const previous = previousAssistantTurn(loaded)
          return classify({ message, ...(previous === undefined ? {} : { previousAssistantTurn: previous }) })
        },
        domainConfig: boiDomainConfig,
        killSwitch: loaded.killSwitch,
        tone,
      })
    : ({ allowed: true, category: 'banking', clarifyInScope: false, suppressHumour: false,
        suppressProductOffers: false, profanity: false, injectionFlagged: false } as const)

  if (isCustomerTurn) {
    await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: session.participant_id,
      role: 'customer',
      content: customerMessage,
      gateCategory: gate.category,
    })
  }

  // A blocked turn never reaches the model (Invariant 4). The canned reply is persisted so
  // the conversation reads correctly afterwards, and the block is auditable (§52).
  if (!gate.allowed) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'request_blocked',
      actor: 'system',
      payload: { category: gate.category, reason: gate.reason, injectionFlagged: gate.injectionFlagged },
    })
    const messageId = await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: null,
      role: 'baz',
      content: gate.response,
    })

    return streamOf([
      { type: 'text_delta', text: gate.response },
      { type: 'done', messageId, gateCategory: gate.category },
    ])
  }

  // ---- Generate ---------------------------------------------------------
  const primary = participantFor(loaded, 'primary')
  const digest = buildCaseDigest(loaded)

  const history = loaded.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role === 'customer' ? 'user' as const : 'assistant' as const, content: message.content }))

  if (isCustomerTurn) history.push({ role: 'user', content: customerMessage })
  if (history.length === 0) {
    history.push({ role: 'user', content: '(The customer has just arrived. Open the conversation.)' })
  }

  const spoken: string[] = []

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(toSseFrame(event)))

      try {
        const events = runBazTurn({
          client: anthropic,
          model: env('BAZ_MODEL'),
          enabledTools: ENABLED_TOOLS,
          prompt: {
            domainConfig: boiDomainConfig,
            products: boiProducts,
            sliders: loaded.persona,
            digest,
            sensitive: gate.suppressHumour,
            clarifyInScope: gate.clarifyInScope,
          },
          history,
          executeTool: async (name, input) => {
            switch (name) {
              case 'record_facts': {
                const { facts } = input as { facts: { key: any; subject?: any; value: unknown }[] }
                const outcome = await recordFacts(admin, {
                  caseId: turn.caseId,
                  facts,
                  participants: { primary, partner: participantFor(loaded, 'partner') },
                  source: 'customer_stated',
                })

                for (const key of outcome.accepted) {
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'context_captured',
                    actor: 'model',
                    payload: { key },
                  })
                }

                const rejected = outcome.rejected
                  .map((item) => `${item.key}: ${item.reason}`)
                  .join('; ')

                return {
                  result:
                    `Recorded ${outcome.accepted.length}.` +
                    (rejected ? ` Not recorded — ${rejected}` : ''),
                }
              }

              case 'show_product_options': {
                const { products } = input as { products: { product: any; reason: string }[] }
                const declined = new Set(
                  loaded.productInterests.filter((i) => i.status === 'declined').map((i) => i.product),
                )

                const card: Card = {
                  type: 'product_options',
                  options: products.map((option) => ({
                    product: option.product,
                    displayName: productInfo(option.product).name,
                    oneLine: productInfo(option.product).oneLine,
                    reason: option.reason,
                    previouslyDeclined: declined.has(option.product),
                  })),
                }

                for (const option of products) {
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'product_offered',
                    actor: 'model',
                    payload: { product: option.product, reason: option.reason },
                  })
                }

                return { result: 'Options shown. The customer chooses in the card.', card }
              }

              case 'show_status': {
                const card: Card = {
                  type: 'status',
                  applications: loaded.applications.map((application) => {
                    const match = digest.applications.find((a) => a.id === application.id)
                    return {
                      id: String(application.id),
                      product: application.product,
                      displayName: journeyFor(application.product).displayName,
                      state: application.state,
                      stateLabel: stateLabel(application.state),
                      outstandingCount: match?.outstanding.length ?? 0,
                      waitingOn: match?.waitingOn ?? null,
                    }
                  }),
                }
                return { result: 'Status card shown, rendered from the case.', card }
              }

              default:
                return { result: 'That is not available yet.' }
            }
          },
        })

        for await (const event of events) {
          if (event.type === 'text_delta') spoken.push(event.text)
          send(event)
        }

        const messageId = await saveMessage(admin, {
          caseId: turn.caseId,
          participantId: null,
          role: 'baz',
          content: spoken.join(''),
        })

        send({ type: 'status', caseId: turn.caseId, invalidate: ['case', 'facts', 'applications'] })
        send({ type: 'done', messageId, gateCategory: gate.category })
      } catch (error) {
        send({
          type: 'error',
          error: {
            code: 'upstream_unavailable',
            message: error instanceof Error ? error.message : 'Something went wrong.',
          },
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
})

function streamOf(events: readonly StreamEvent[]): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) controller.enqueue(encoder.encode(toSseFrame(event)))
        controller.close()
      },
    }),
    { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
  )
}
