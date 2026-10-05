// deno-lint-ignore-file no-explicit-any
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { bazTurnRequestSchema } from '../_shared/contracts/baz-turn.ts'
import { fail, statusFor } from '../_shared/contracts/common.ts'
import { toSseFrame, type StreamEvent } from '../_shared/contracts/stream.ts'
import type { Card } from '../_shared/contracts/cards.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { evaluateAdvisories } from '../_shared/domain/advisories.ts'
import { evaluateFor, findApplication, recomputeApplications } from '../_shared/db/applications.ts'
import { confirmationsForReview, readyForReview } from '../_shared/domain/requirements.ts'
import { factCatalogue } from '../_shared/domain/facts.ts'
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

/** The partner and upload tools arrive with M5, so they are not offered yet. */
const ENABLED_TOOLS: readonly ToolName[] = [
  'record_facts',
  'show_product_options',
  'show_status',
  'show_review',
  'show_pause_prompt',
  'show_form',
]

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

                // A fact can complete an application. What is outstanding is recomputed here,
                // not remembered by the model (Invariant 3).
                let progressed = ''
                if (outcome.accepted.length > 0) {
                  const reloaded = await loadCase(admin, turn.caseId)
                  if (reloaded) {
                    const summaries = await recomputeApplications(admin, reloaded)
                    const ready = summaries.filter((a) => a.state === 'ready')
                    if (ready.length > 0) {
                      progressed = ` Ready to review: ${ready.map((a) => a.displayName).join(', ')}.`
                    }
                  }
                }

                return {
                  result:
                    `Recorded ${outcome.accepted.length}.` +
                    (rejected ? ` Not recorded — ${rejected}` : '') +
                    progressed,
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

              case 'show_review': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.' }

                const evaluation = evaluateFor(loaded, application)
                if (!readyForReview(evaluation)) {
                  // §48 — a review card is a promise that submission is one tap away, so it is
                  // refused while real information is still missing.
                  const remaining = evaluation.outstanding
                    .filter((item) => item.blocking)
                    .map((item) => item.requirement.label)
                  return {
                    result: `Not ready to review. Still needed: ${remaining.join(', ')}.`,
                  }
                }

                const journey = journeyFor(application.product)

                // Built from the case, not from the model's words (Invariant 2).
                const card: Card = {
                  type: 'review',
                  applicationId,
                  displayName: journey.displayName,
                  summary: evaluation.satisfied
                    .filter((item) => item.fact !== null)
                    .slice(0, 12)
                    .map((item) => ({
                      label: item.requirement.label,
                      value: String(item.fact?.value ?? ''),
                    })),
                  confirmations: confirmationsForReview(evaluation).map((item) => ({
                    requirementId: item.requirement.id,
                    label: item.requirement.label,
                    kind:
                      item.requirement.kind === 'declaration'
                        ? ('declaration' as const)
                        : item.requirement.kind === 'confirmation'
                          ? ('confirmation' as const)
                          : ('reuse' as const),
                    knownValue: item.knownFact === null ? null : String(item.knownFact.value),
                  })),
                  confirmLabel: `Submit ${journey.displayName.toLowerCase()}`,
                }

                return { result: 'Review shown. Nothing is submitted until the customer taps.', card }
              }

              case 'show_pause_prompt': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.' }

                // The advisory is deterministic; the model may only explain one that applies.
                const advisory = evaluateAdvisories(loaded.applications).find(
                  (candidate) => String(candidate.appliesTo) === applicationId,
                )
                if (!advisory) {
                  return { result: 'There is no advisory for that application, so do not offer to pause it.' }
                }

                const card: Card = {
                  type: 'pause_prompt',
                  applicationId,
                  displayName: journeyFor(application.product).displayName,
                  advisoryTitle: advisory.title,
                  advisoryExplanation: advisory.explanation,
                }

                return { result: 'Pause offered. The customer decides in the card.', card }
              }

              case 'show_form': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.' }

                const evaluation = evaluateFor(loaded, application)
                const blocking = evaluation.outstanding.filter((item) => item.blocking)
                const journey = journeyFor(application.product)

                // Consent first, always. The server picks, not the model, so the health
                // questions are unreachable until consent is recorded (§7.5, Invariant 6).
                const consent = blocking.find(
                  (item) => item.requirement.kind === 'confirmation' && item.waitingOn === 'primary',
                )

                if (consent) {
                  const card: Card = {
                    type: 'consent',
                    applicationId,
                    requirementId: consent.requirement.id,
                    title: 'Before we go any further',
                    explanation:
                      'Life cover depends on health information, which I will not ask for in ' +
                      'conversation and cannot work out from anything else you have told me. ' +
                      'You answer these yourself, in a form, and only if you agree to.',
                    covers: [
                      'Whether you smoke',
                      'Your height and weight',
                      'Any medical conditions you have',
                    ],
                    confirmLabel: 'I agree to answer these',
                  }
                  return { result: 'Consent asked for. Nothing sensitive is asked until they agree.', card }
                }

                // Consent given: the health branch is active, so its facts are now outstanding.
                const sensitive = blocking.filter(
                  (item) =>
                    item.requirement.kind === 'fact' &&
                    factCatalogue[item.requirement.fact].sensitivity === 'special',
                )

                if (sensitive.length === 0) {
                  return { result: 'There is no form outstanding for that application.' }
                }

                const card: Card = {
                  type: 'health_form',
                  applicationId,
                  title: `${journey.displayName} — health questions`,
                  fields: sensitive.map((item) => {
                    const key = item.requirement.kind === 'fact' ? item.requirement.fact : ''
                    const definition = factCatalogue[key as keyof typeof factCatalogue]
                    const schema = definition.schema as { _def?: { type?: string } }
                    const type = schema._def?.type ?? ''

                    return {
                      key,
                      label: definition.label,
                      kind:
                        type === 'boolean'
                          ? ('boolean' as const)
                          : type === 'array'
                            ? ('text_list' as const)
                            : ('number' as const),
                      unit: key.endsWith('heightCm') ? 'cm' : key.endsWith('weightKg') ? 'kg' : null,
                    }
                  }),
                }

                return { result: 'Health form shown. They answer it themselves.', card }
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
