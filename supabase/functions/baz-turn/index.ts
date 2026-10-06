// deno-lint-ignore-file no-explicit-any
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/db/database.types.ts'
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
  touchLastSeen,
  writeEvent,
} from '../_shared/db/case-repository.ts'
import { buildCaseDigest } from '../_shared/db/digest.ts'
import { needContextFor, needsFor, revivableNeeds } from '../_shared/db/needs.ts'
import { needCatalogue } from '../_shared/domain/needs/catalogue.ts'
import {
  describePlan,
  dueCheckins,
  loadPlans,
  planContextFor,
  proposePlan,
  raiseDueCheckins,
  reconcilePlans,
} from '../_shared/db/plans.ts'
import { depositGap } from '../_shared/domain/needs/catalogue.ts'
import type { PlanGoal } from '../_shared/domain/plans/types.ts'
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
  'show_partner_invite',
  'request_upload',
  'propose_plan',
]

/** How far back a card still counts as "on screen" rather than scrolled into history. */
const INVITE_CARD_WINDOW = 8

/**
 * A customer who will not answer questions must still be able to get somewhere, so the needs
 * gate lifts once they have had their say regardless of what was established.
 */
const DISCOVERY_PATIENCE = 4

/**
 * Status is worth refreshing as things change, so this window is short — it only stops the
 * same card appearing twice in a row, which is what happens when the model reaches for it as
 * something to say.
 */
const STATUS_CARD_WINDOW = 2

/** Short, so a genuinely different set of options can still follow a turn later. */
const OPTIONS_CARD_WINDOW = 2

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

/**
 * Anything thrown before the stream opens would otherwise be answered by the runtime's own
 * handler: status 500, body "Internal Server Error", and — the part that matters — no CORS
 * headers, so the browser blocks the response and the customer sees "Load failed" with no
 * clue what failed. A turn is allowed to fail; it is not allowed to fail silently.
 */
Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleTurn(request)
  } catch (error) {
    console.error('baz-turn failed before the stream opened', error)
    return streamOf([
      {
        type: 'error',
        error: {
          code: 'upstream_unavailable',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        },
      },
    ])
  }
})

async function handleTurn(request: Request): Promise<Response> {
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

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
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
  // Catch the plan up with what has actually happened before anything is said about it.
  const achievedMilestones = await reconcilePlans(admin, turn.caseId, loaded)
  for (const { milestone } of achievedMilestones) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'plan_milestone_reached',
      actor: 'system',
      payload: { label: milestone.label },
    })
  }

  /**
   * A check-in waiting on an event becomes due when the event has actually happened. The
   * milestones just reconciled above are what makes that evaluable here rather than on a
   * schedule nothing is watching.
   */
  const firedEvents = [
    ...loaded.eventsSinceLastSeen.map((event) => event.type),
    ...(achievedMilestones.length > 0 ? ['savings_target_reached'] : []),
  ]

  const raised = await raiseDueCheckins(admin, turn.caseId, loaded, firedEvents)
  for (const { checkin } of raised) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'checkin_due',
      actor: 'system',
      payload: { purpose: checkin.purpose },
    })
  }

  const loadedPlans = await loadPlans(admin, turn.caseId, loaded)
  const keptPlans = loadedPlans
    .filter((entry) => entry.plan.status === 'active')
    .map((entry) => ({ title: entry.plan.title, lines: [...describePlan(entry)] }))

  const revivable = await revivableNeeds(admin, turn.caseId, loaded)
  const revived = revivable
    .map((item) => {
      const need = needCatalogue.find((candidate) => candidate.id === item.needId)
      return need === undefined ? null : { name: need.name, reason: item.reason }
    })
    .filter((item): item is { name: string; reason: string } => item !== null)

  // Whichever check-in is due now, with the agenda written when it was agreed.
  const dueNow = dueCheckins(loadedPlans, loaded, firedEvents)[0] ?? null

  const digest = buildCaseDigest(loaded, {
    sensitiveDisclosure: gate.suppressHumour,
    plans: keptPlans,
    ...(revived.length === 0 ? {} : { revived }),
    ...(dueNow === null
      ? {}
      : {
          checkin: {
            purpose: dueNow.checkin.purpose,
            plan: dueNow.plan.title,
            agenda: [...dueNow.checkin.agenda],
          },
        }),
  })
  const needContext = needContextFor(loaded, { sensitiveDisclosure: gate.suppressHumour })

  /**
   * Record what the bank has committed to watching for.
   *
   * Only once the customer has actually opened the savings account: telling someone you will
   * watch for something is a promise, and a promise attaches to the thing they chose to do,
   * not to Baz having mentioned a plan (Invariant 1).
   */
  const planWatch = digest.plan?.watchDetail ?? null
  if (planWatch !== null && loaded.applications.some((a) => a.product === 'savings')) {
    const open = await admin
      .from('plan_watches')
      .select('id')
      .eq('case_id', turn.caseId)
      .is('met_at', null)
      .limit(1)

    if (((open.data ?? []) as unknown[]).length === 0) {
      await admin.from('plan_watches').insert({
        case_id: turn.caseId,
        kind: planWatch.kind,
        target: planWatch.kind === 'savings_target' ? planWatch.target : null,
        on_date: planWatch.kind === 'date' ? planWatch.on : null,
        describe: planWatch.describe,
      })
    }
  }

  const history = loaded.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role === 'customer' ? 'user' as const : 'assistant' as const, content: message.content }))

  if (isCustomerTurn) history.push({ role: 'user', content: customerMessage })

  if (turn.trigger === 'return') {
    // §36 — the customer did not ask anything; they came back. Lead with what changed.
    history.push({
      role: 'user',
      content:
        '(The customer has just come back after being away. Open by naming each thing under ' +
        '"Changed since they were last here" — say what actually happened, in your own words, ' +
        'not that something "moved on". Then call show_status and ask what they want to deal ' +
        'with first. This is the one turn where a short list is right.)',
    })
  }

  if (history.length === 0) {
    history.push({ role: 'user', content: '(The customer has just arrived. Open the conversation.)' })
  }

  const spoken: string[] = []
  const shown: unknown[] = []

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

                /**
                 * §5, §6 — the needs engine decides whether there is enough to go on.
                 *
                 * This was a count of discovery facts, which was a guess at the same thing.
                 * The engine scores evidence properly, so the threshold it already applies is
                 * the one that should hold here.
                 */
                const candidates = needsFor(loaded, {
                  sensitiveDisclosure: gate.suppressHumour,
                })
                const established = candidates.some(
                  (candidate) =>
                    candidate.state === 'ready_to_surface' || candidate.state === 'clarify',
                )
                const customerTurns = loaded.messages.filter((m) => m.role === 'customer').length

                if (!established && customerTurns < DISCOVERY_PATIENCE) {
                  return {
                    result:
                      'Too early. Nothing about their situation is established yet, so any offer is a guess. ' +
                      'Ask what has changed for them, who else is involved and what they are hoping to do — ' +
                      'record what they tell you, then offer. Do not mention that you were stopped.',
                  }
                }

                /**
                 * One offer, not one per turn. The card persists in the transcript and stays
                 * tappable, so showing it again adds nothing and makes the conversation look
                 * like it is going in circles. The window is short, so genuinely new options
                 * can still be offered a turn later.
                 */
                const justOffered = loaded.messages
                  .slice(-OPTIONS_CARD_WINDOW)
                  .some((message) => message.cards.includes('product_options'))

                if (justOffered) {
                  return {
                    result:
                      'Those options are already on screen from the previous turn and still work. Answer what they asked and point at the card; do not show it again.',
                  }
                }

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
                const justShown = loaded.messages
                  .slice(-STATUS_CARD_WINDOW)
                  .some((message) => message.cards.includes('status'))

                if (justShown) {
                  return {
                    result:
                      'The status card is already on screen from the previous turn. Say what has changed in your own words rather than showing it again.',
                  }
                }

                const card: Card = {
                  type: 'status',
                  applications: loaded.applications.map((application) => {
                    const match = digest.applications.find((a) => a.id === application.id)
                    const evaluation = evaluateFor(loaded, application)

                    // Journey order, not satisfied-then-outstanding: the customer reads this as
                    // a path through the application, and reordering it as things complete
                    // would make the same card look different for no reason.
                    const steps = [
                      ...evaluation.satisfied.map((item) => ({
                        label: item.requirement.label,
                        done: true,
                        waitingOnPartner: false,
                      })),
                      ...evaluation.outstanding
                        .filter((item) => item.blocking)
                        .map((item) => ({
                          label: item.requirement.label,
                          done: false,
                          waitingOnPartner: item.waitingOn === 'partner',
                        })),
                    ]

                    return {
                      id: String(application.id),
                      product: application.product,
                      displayName: journeyFor(application.product).displayName,
                      state: application.state,
                      stateLabel: stateLabel(application.state),
                      outstandingCount: match?.outstanding.length ?? 0,
                      waitingOn: match?.waitingOn ?? null,
                      steps,
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

              case 'show_partner_invite': {
                const { applicationIds } = input as { applicationIds: string[] }
                const names = applicationIds
                  .map((id) => findApplication(loaded, id))
                  .filter((application) => application !== undefined)
                  .map((application) => journeyFor(application.product).displayName)

                if (names.length === 0) return { result: 'There is no such application.' }

                const partner = loaded.participants.find((p) => p.role === 'partner')
                if (partner) {
                  return {
                    result: `${partner.displayName ?? 'The second applicant'} has already joined. There is nothing left to invite.`,
                  }
                }

                /**
                 * One invite card, not one per turn. Asked nicely, the model re-offered it on
                 * almost every turn — four stacked in one transcript — and the customer kept
                 * tapping each new one, so the same invite was created three times. The card
                 * persists in the transcript, so the one already there is still live.
                 */
                const alreadyOnScreen = loaded.messages
                  .slice(-INVITE_CARD_WINDOW)
                  .some((message) => message.cards.includes('partner_invite'))

                if (alreadyOnScreen) {
                  return {
                    result:
                      'The invite card is already on screen from an earlier turn and still works. Point at it in your own words; do not make another.',
                  }
                }

                const card: Card = {
                  type: 'partner_invite',
                  applicationIds,
                  applicationNames: names,
                  // Always null by this point: a joined partner returned above, and a
                  // participant row does not exist before they join.
                  partnerName: null,
                }

                return {
                  result: 'Invite offered. Nothing is sent until the customer taps and shares it.',
                  card,
                }
              }

              /**
               * §10 — propose, never impose.
               *
               * The model picks the goal and the words; every figure comes from the plan
               * engine. A projected date is something the customer will act on, so it is not
               * the model's to invent (§40).
               */
              case 'propose_plan': {
                const input_ = input as {
                  goal: PlanGoal
                  title: string
                  targetAmount?: number
                  targetDate?: string
                }

                const context = planContextFor(loaded)
                const gap = needContext === null ? null : depositGap(needContext)
                const target = input_.targetAmount ?? gap?.target ?? null

                if (target === null) {
                  return {
                    result:
                      'There is nothing measurable to plan towards yet. Find out what they are aiming for first.',
                  }
                }

                const existing = await admin
                  .from('plans')
                  .select('id')
                  .eq('case_id', turn.caseId)
                  .in('status', ['draft', 'active'])
                  .limit(1)

                if (((existing.data ?? []) as unknown[]).length > 0) {
                  return {
                    result:
                      'They already have a plan open. Talk about that one rather than starting another.',
                  }
                }

                const targetDate = input_.targetDate ?? null
                const milestones = [
                  {
                    kind: 'numeric' as const,
                    label: `Deposit reaches €${Math.round(target / 2).toLocaleString('en-IE')}`,
                    targetAmount: Math.round(target / 2),
                    targetDate: null,
                    targetProduct: null,
                    targetState: null,
                  },
                  {
                    kind: 'numeric' as const,
                    label: `Deposit reaches €${target.toLocaleString('en-IE')}`,
                    targetAmount: target,
                    targetDate: null,
                    targetProduct: null,
                    targetState: null,
                  },
                  {
                    kind: 'application' as const,
                    label: 'Mortgage application submitted',
                    targetAmount: null,
                    targetDate: null,
                    targetProduct: 'mortgage' as const,
                    targetState: 'submitted' as const,
                  },
                  {
                    kind: 'application' as const,
                    label: 'Mortgage approved',
                    targetAmount: null,
                    targetDate: null,
                    targetProduct: 'mortgage' as const,
                    targetState: 'approved' as const,
                  },
                ]

                const planId = await proposePlan(admin, turn.caseId, {
                  goal: input_.goal,
                  title: input_.title,
                  targetAmount: target,
                  targetDate: targetDate === null || targetDate.length === 7 ? null : targetDate,
                  milestones,
                  checkin: {
                    purpose: 'Mortgage readiness review',
                    agenda: [
                      'Check how the deposit is going',
                      'Confirm income and outgoings have not changed',
                      'Decide whether to start the mortgage application',
                      'Revisit anything we parked',
                    ],
                    triggerKind: 'event',
                    dueAt: null,
                    triggerEvent: 'savings_target_reached',
                  },
                })

                if (planId === null) return { result: 'That plan could not be saved just now.' }

                const months =
                  context.monthlySaving !== null && context.monthlySaving > 0
                    ? Math.ceil(
                        Math.max(0, target - (context.savingsBalance ?? 0)) /
                          context.monthlySaving,
                      )
                    : null

                const card: Card = {
                  type: 'plan_proposal',
                  planId,
                  title: input_.title,
                  targetAmount: target,
                  currentAmount: context.savingsBalance,
                  projectedDate: null,
                  monthsRemaining: months,
                  milestones: milestones.map((milestone) => ({
                    label: milestone.label,
                    achieved: false,
                  })),
                  checkin: {
                    purpose: 'Mortgage readiness review',
                    when: 'when you reach the target',
                    agenda: [
                      'Check how the deposit is going',
                      'Confirm income and outgoings have not changed',
                      'Decide whether to start the mortgage application',
                    ],
                  },
                  confirmLabel: 'Keep this plan',
                }

                return {
                  result:
                    'Plan proposed. It is a draft and belongs to nobody until they tap it. Explain what it does for them in a sentence; do not list the milestones back.',
                  card,
                }
              }

              case 'request_upload': {
                const { applicationId, documentType } = input as {
                  applicationId: string
                  documentType?: string
                }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.' }

                // The journey decides what can be asked for, not the model (Invariant 3). The
                // named type narrows it; without one, the next outstanding document wins.
                const evaluation = evaluateFor(loaded, application)
                const documents = evaluation.outstanding.filter(
                  (item) => item.requirement.kind === 'document',
                )
                const outstanding =
                  documents.find(
                    (item) =>
                      item.requirement.kind === 'document' &&
                      item.requirement.documentType === documentType,
                  ) ?? documents[0]

                if (!outstanding || outstanding.requirement.kind !== 'document') {
                  return {
                    result: 'This application is not waiting on any documents.',
                  }
                }

                const requirementId = outstanding.requirement.id

                const journey = journeyFor(application.product)

                // One open request per requirement, so asking twice does not pile up rows.
                const existing = loaded.requests.find(
                  (request) =>
                    request.applicationId === application.id &&
                    request.requirementId === requirementId &&
                    request.status === 'open',
                )

                let requestId = existing?.id ?? null
                if (requestId === null) {
                  const created = await admin
                    .from('application_requests')
                    .insert({
                      application_id: application.id,
                      requirement_id: requirementId,
                      kind: 'document',
                      status: 'open',
                      detail: outstanding.requirement.label,
                    })
                    .select('id')
                    .single()

                  if (created.error) return { result: 'That could not be requested just now.' }
                  requestId = (created.data as { id: string }).id
                }

                const card: Card = {
                  type: 'upload_request',
                  requestId,
                  applicationId: String(application.id),
                  label: outstanding.requirement.label,
                  documentType: outstanding.requirement.documentType,
                  applicationName: journey.displayName,
                }

                return {
                  result: `Upload card shown for ${outstanding.requirement.label}. Nothing arrives until they pick a file.`,
                  card,
                }
              }

              default:
                return { result: 'That is not available yet.' }
            }
          },
        })

        for await (const event of events) {
          if (event.type === 'text_delta') spoken.push(event.text)
          if (event.type === 'card') shown.push(event.card)
          send(event)
        }

        const messageId = await saveMessage(admin, {
          caseId: turn.caseId,
          participantId: null,
          role: 'baz',
          content: spoken.join(''),
          cards: shown,
        })

        // Everything up to now has been seen, so the next return summarises only what is
        // genuinely new (§36).
        await touchLastSeen(admin, turn.caseId)

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
}

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
