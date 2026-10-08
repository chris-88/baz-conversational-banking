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
import { EMPTY_USAGE, addUsage, type ModelUsage, type TurnUsage } from '../_shared/domain/cost.ts'
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
import {
  describePlan,
  dueCheckins,
  loadPlans,
  planContextFor,
  proposePlan,
  raiseDueCheckins,
  reconcilePlans,
} from '../_shared/db/plans.ts'
import { blueprintFor } from '../_shared/domain/goals/catalogue.ts'
import { buildQuote } from '../_shared/domain/quotes/engine.ts'
import { suggestionsFor } from '../_shared/domain/quotes/suitability.ts'
import { isProduct, type Product } from '../_shared/domain/journey.ts'
import { describeProspect, wouldInvolve } from '../_shared/domain/prospect.ts'
import { worthRaising, wouldContend } from '../_shared/domain/goals/engine.ts'
import { planDraftFor } from '../_shared/domain/goals/plan.ts'
import { describeGoals, goalContextFor } from '../_shared/db/goals.ts'
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
  'show_quote',
]

/** How far back a card still counts as "on screen" rather than scrolled into history. */
const INVITE_CARD_WINDOW = 8

/**
 * How many customer turns before the discovery gate lifts regardless.
 *
 * A customer who will not answer questions must still be able to get somewhere. Four was two
 * exchanges — enough to learn that somebody is renting and has savings, and nothing about what
 * they earn, what they are buying or who else is involved.
 */
const money = (amount: number): string => `€${Math.round(amount).toLocaleString('en-IE')}`

const DISCOVERY_PATIENCE = 7

/**
 * Status is worth refreshing as things change, so this window is short — it only stops the
 * same card appearing twice in a row, which is what happens when the model reaches for it as
 * something to say.
 */
const STATUS_CARD_WINDOW = 2

/** Short, so a genuinely different set of options can still follow a turn later. */
const OPTIONS_CARD_WINDOW = 2

/**
 * Longer than the options window: a quote is read and compared rather than acted on, so it
 * stays useful further up the conversation, and a second copy of the same figures is noise.
 */
const QUOTE_CARD_WINDOW = 4

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
  /**
   * Bounded, because the SDK default is ten minutes.
   *
   * That is far longer than this function is allowed to live, so a stalled API call does not
   * time out — it holds the connection until the platform kills the whole invocation, and the
   * customer is left watching a stream that will never say anything. A turn that has not
   * finished in ninety seconds has failed; failing as an error beats failing as a hang.
   */
  const anthropic = new Anthropic({
    apiKey: env('ANTHROPIC_API_KEY'),
    timeout: 90_000,
    maxRetries: 1,
  })
  /*
   * What this turn consumed, accumulated as it happens.
   *
   * Mutable and local to the turn: the gate and every model round add to it, and whatever it
   * holds when the reply is saved goes on the row. Measured, not modelled — the estimating is
   * all in the prices, which live in `domain/cost.ts`.
   */
  let spend: TurnUsage = EMPTY_USAGE

  const recordModel = (used: ModelUsage): void => {
    spend = addUsage(spend, { model: used, gate: EMPTY_USAGE.gate })
  }
  const recordGate = (used: ModelUsage): void => {
    spend = addUsage(spend, { model: EMPTY_USAGE.model, gate: used })
  }

  const classify = createClassifier({
    apiKey: env('ANTHROPIC_API_KEY'),
    model: env('GATE_MODEL'),
    domainConfig: boiDomainConfig,
    client: anthropic,
    onUsage: recordGate,
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

  /**
   * A tap is recorded as what it was.
   *
   * It used to be saved as a customer message, so "Started Savings account, Joint current
   * account, Mortgage. 7 things carried over from what we already knew." appeared in the
   * transcript as something the customer had typed. They had not — they had ticked two boxes.
   * The transcript is the record a person reads before phoning them, and putting words in
   * somebody's mouth there is not a cosmetic problem.
   *
   * `system` is already filtered out of the chat and out of the history Baz sees on later
   * turns, which is right: what the tap actually did is in the case, and the digest reports it
   * from there (Invariant 2).
   */
  if (turn.trigger === 'action' && customerMessage.length > 0) {
    await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: session.participant_id,
      role: 'system',
      content: customerMessage,
      gateCategory: 'banking',
    })
  }

  // A blocked turn never reaches the model (Invariant 4). The canned reply is persisted so
  // the conversation reads correctly afterwards, and the block is auditable (§52).
  if (!gate.allowed) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'request_blocked',
      actor: 'system',
      payload: {
        category: gate.category,
        reason: gate.reason,
        injectionFlagged: gate.injectionFlagged,
        /**
         * What was actually asked, capped.
         *
         * §39 wants enforcement observable, and a log of categories and timestamps does not
         * show that: "off topic at 14:06" proves nothing, "count to 10,000 — off topic" proves
         * the thing. The request never reaches the model either way (Invariant 4); this is the
         * record of what was turned away, which is the opposite of answering it.
         */
        request: customerMessage.slice(0, 200),
      },
    })
    const messageId = await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: null,
      role: 'baz',
      content: gate.response,
      usage: spend,
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
    /*
     * Only money actually arriving. This used to fire on any achieved milestone, so defining a
     * deposit target raised the check-in meant for reaching one — a customer €3,500 short had a
     * "mortgage readiness review" come due the moment their plan was created.
     */
    ...(achievedMilestones.some((entry) => entry.reachedTarget) ? ['savings_target_reached'] : []),
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
      const need = loaded.needs.find((candidate) => candidate.id === item.needId)
      return need === undefined ? null : { name: need.name, reason: item.reason }
    })
    .filter((item): item is { name: string; reason: string } => item !== null)

  // Whichever check-in is due now, with the agenda written when it was agreed.
  const dueNow = dueCheckins(loadedPlans, loaded, firedEvents)[0] ?? null

  /**
   * Where the customer is trying to get to, which is not the same as what they are applying for.
   *
   * Built after the plans load, because a goal that already has a plan is settled rather than a
   * candidate to raise again.
   */
  const goalContext = goalContextFor(loaded, loadedPlans, {
    sensitiveDisclosure: gate.suppressHumour,
  })
  const goals = describeGoals(goalContext, loaded.goals)

  /*
   * §9 — "top discovered goals" needs an event, and discovery is not a moment anything else
   * records. A goal reaching a tier worth raising is the closest thing to one: it is when Baz
   * first has grounds to bring it up, which is what the panel is actually asking about.
   *
   * Written once per goal per case. Tiering is recomputed every turn from the facts, so a goal
   * that stays established would otherwise write an event on every message and the chart would
   * measure how talkative somebody was.
   */
  const identifiedBefore = await admin
    .from('events')
    .select('payload')
    .eq('case_id', turn.caseId)
    .eq('type', 'goal_identified')

  /*
   * A failed read means writing nothing, not writing everything. Defaulting to an empty set
   * would make every turn look like the first one and double-count every goal on the chart,
   * which is a worse outcome than a gap — a missing event is visibly missing.
   */
  const alreadyIdentified =
    identifiedBefore.error === null
      ? new Set(
          (identifiedBefore.data as { payload: { goal?: string } }[])
            .map((row) => row.payload.goal)
            .filter((goal): goal is string => goal !== undefined),
        )
      : null

  for (const candidate of alreadyIdentified === null ? [] : goals.candidates) {
    if (candidate.tier === 'latent' || candidate.tier === 'deferred') continue
    if (alreadyIdentified?.has(candidate.goal.id) === true) continue

    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'goal_identified',
      actor: 'system',
      payload: {
        goal: candidate.goal.id,
        tier: candidate.tier,
        confidence: Number(candidate.confidence.toFixed(2)),
        // What actually raised it, so "why is this on the chart" has an answer.
        because: candidate.evidence[0]?.describe ?? null,
      },
    })
  }

  /**
   * Whether what they are looking at is what suits them.
   *
   * Evaluated against whatever borrowing is actually in play — an application they have started,
   * or the product they have been quoted. Silent until they have said both what they want and
   * how soon they mean to repay it, because guessing a recommendation from an amount alone is
   * how cross-selling works.
   */
  const borrowing = loaded.applications.find((application) =>
    ['personal_loan', 'credit_card'].includes(application.product),
  )?.product

  /**
   * An application if there is one, otherwise whatever they have described wanting.
   *
   * Looking only at started applications meant the rules never ran during the conversation that
   * decides which product to start — which is the one conversation they are for. Somebody who
   * has said an amount and a date is considering borrowing whether or not anything exists yet,
   * and a loan is what people ask for by default.
   */
  const considering: Product | null =
    (borrowing as Product | undefined) ??
    (goalContext !== null && goalContext.facts.has('borrowing.requestedAmount', 'household')
      ? 'personal_loan'
      : null)

  const suitability =
    considering === null || goalContext === null
      ? []
      : suggestionsFor(considering, {
          facts: goalContext.facts,
          variants: {
            personal_loan: boiProducts.personal_loan.variants,
            credit_card: boiProducts.credit_card.variants,
            savings: boiProducts.savings.variants,
          },
        }).map((suggestion) => `${productInfo(suggestion.to).name}: ${suggestion.because}`)

  /*
   * What applying for the quoted product would involve.
   *
   * Only for something they have been shown figures for and have not applied for — once an
   * application exists the digest already describes it properly, and two accounts of the same
   * product would let the model pick the wrong one. Computed from the real journey so that
   * "what would I need?" has an answer that is not improvised (§51, Invariant 3).
   */
  /*
   * Quoted or offered, whichever happened last.
   *
   * Only quoting was too narrow: a customer shown the product options card and asked "what
   * documents do I need?" got "I don't have a fixed document list", because the list is only
   * assembled for something they have been given figures for. Both events mean the same thing
   * here — this product is the one on the table.
   */
  const quoted = await admin
    .from('events')
    .select('payload')
    .eq('case_id', turn.caseId)
    .in('type', ['product_quoted', 'product_offered'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const quotedProduct = (quoted.data?.payload as { product?: string } | undefined)?.product
  const primaryParticipant = participantFor(loaded, 'primary')

  const prospect =
    quotedProduct === undefined ||
    primaryParticipant === null ||
    !isProduct(quotedProduct) ||
    loaded.applications.some((application) => application.product === quotedProduct)
      ? []
      : describeProspect(
          wouldInvolve(quotedProduct, {
            facts: loaded.facts,
            primary: primaryParticipant,
            partner: participantFor(loaded, 'partner'),
          }),
          productInfo(quotedProduct).name,
        )

  const digest = buildCaseDigest(loaded, {
    sensitiveDisclosure: gate.suppressHumour,
    plans: keptPlans,
    ...(goals.lines.length === 0 ? {} : { goals: [...goals.lines] }),
    ...(suitability.length === 0 ? {} : { suitability }),
    ...(prospect.length === 0 ? {} : { prospect: [...prospect] }),
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

  if (turn.trigger === 'action') {
    // Told as an event, not quoted as speech, so Baz does not answer a question nobody asked.
    history.push({
      role: 'user',
      content:
        `(The customer did this in the app: ${customerMessage} They did not type anything, so ` +
        'do not reply as though they had and do not thank them for a message. ' +
        `${turn.note ?? 'Say what it means for them and what you need next.'} Keep it brief.)`,
    })
  }

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
          onUsage: recordModel,
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
                 * §5, §6 — is there enough understanding of this person to be offering anything?
                 *
                 * Two different questions were being conflated. "Is a need established" is
                 * answered the moment somebody says the word mortgage, and the gate passed on
                 * that — so a customer who had said they wanted a broad conversation about their
                 * whole position, and had given one round of answers, was handed a mortgage card
                 * in the same turn Baz was still asking them what price range they had in mind.
                 *
                 * Being sure what somebody needs is not the same as understanding their
                 * position, and a person doing this job would keep asking. The Goal Engine
                 * already works out what a goal needs to know before it can be acted on, so the
                 * gate is whether the case can answer most of it.
                 */
                const candidates = needsFor(loaded, {
                  sensitiveDisclosure: gate.suppressHumour,
                })
                const established = candidates.some(
                  (candidate) =>
                    candidate.state === 'ready_to_surface' || candidate.state === 'clarify',
                )
                const customerTurns = loaded.messages.filter((m) => m.role === 'customer').length

                // Whichever goal the offer is in service of: the one they named, or failing that
                // the best-evidenced one worth raising.
                const leading = worthRaising(goals.candidates, 1)[0] ?? null
                const needed = leading?.goal.informationNeeded.length ?? 0
                const unknown = leading?.missing.length ?? 0
                const understood = needed === 0 || unknown <= Math.floor(needed / 2)

                /**
                 * The escape hatch, raised from four turns.
                 *
                 * Somebody who will not answer questions still has to be able to get somewhere,
                 * and past a certain point continuing to ask is its own failure. But four turns
                 * is two exchanges, which is nowhere near enough to have understood anybody.
                 */
                if ((!established || !understood) && customerTurns < DISCOVERY_PATIENCE) {
                  const ask =
                    leading === null || leading.missing.length === 0
                      ? 'what has changed for them, who else is involved and what they are hoping to do'
                      : leading.missing
                          .slice(0, 4)
                          .map((key) => factCatalogue[key]?.label?.toLowerCase() ?? key)
                          .join(', ')

                  return {
                    result:
                      `Too early — you do not understand their position well enough to be offering anything yet. ` +
                      `Still unknown: ${ask}. Ask about those, in their language and a couple at a time, ` +
                      'and record what they tell you. Offer once you can actually see where they stand. ' +
                      'Do not mention that you were stopped, and do not ask a question and show options in the same breath.',
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

                /**
                 * Offering and asking at once reads as not listening.
                 *
                 * The card is a decision point: it asks the customer to choose. Putting a fresh
                 * question beside it gives them two things to answer and makes the offer look
                 * like something Baz was going to say regardless of their reply.
                 */
                return {
                  result:
                    'Options shown. The customer chooses in the card, so stop there — say in a ' +
                    'sentence why these and leave them to it. Do not ask another question in the ' +
                    'same turn; whatever it is will keep until they have decided.',
                  card,
                }
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
                return {
                  result:
                    'Status card shown, rendered from the case. Say one line about where things ' +
                    'stand — what just moved, or what is next. A card on its own, with nothing ' +
                    'said, reads as the conversation having dropped.',
                  card,
                }
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

                return {
                  result:
                    'Review shown. Nothing is submitted until the customer taps. Say in a line ' +
                    'what they are checking and that the tap is what sends it.',
                  card,
                }
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
                  result:
                    'Invite offered. Nothing is sent until the customer taps and shares it. Say ' +
                    'in a line who it is for and why they are needed.',
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

                /**
                 * A goal does not have to be about money.
                 *
                 * This used to refuse any plan without a target, which meant "get ready for the
                 * baby" or "organise the bills" could not be planned at all — both of which are
                 * exactly what a concierge is for. A goal whose blueprint has money milestones
                 * still needs a figure; one whose milestones are facts and applications does not.
                 */
                const target = input_.targetAmount ?? gap?.target ?? null
                const blueprint = blueprintFor(input_.goal)
                const needsFigure =
                  blueprint?.milestones.some((candidate) => candidate.binding?.kind === 'numeric') ?? false

                if (target === null && needsFigure) {
                  return {
                    result:
                      'There is nothing measurable to plan towards yet. Find out what they are aiming for first.',
                  }
                }

                /*
                 * A target they have already passed is not a plan.
                 *
                 * Somebody with €60,000 against a €320,000 house was offered a plan to save
                 * €32,000 — ten per cent of the price, which is what `depositGap` assumes when
                 * nobody has said otherwise — and the card rendered "€60,000 of €32,000, 100%"
                 * on a goal two years away. The figure was not wrong so much as beside the
                 * point: they had said they wanted to save more, and nobody had asked what for.
                 */
                if (target !== null && gap !== null && target <= gap.saved) {
                  return {
                    result:
                      `They already have ${money(gap.saved)} towards this, which is more than the ` +
                      `${money(target)} in that plan — so there is nothing to save towards and the ` +
                      'card would show it finished. Ask what they are actually aiming for before ' +
                      'planning towards a figure. A bigger deposit means less borrowing and a ' +
                      'better rate, so "more than the minimum" is a real answer worth pinning down.',
                  }
                }

                /*
                 * Whether this plan can actually be watched.
                 *
                 * A savings goal is watched by looking at the balance, and the bank can only see
                 * accounts it holds — `plan_watches` is deliberately only written once a savings
                 * account exists. That has always been true and nothing ever said it, so Baz
                 * promised to come back to somebody who banked elsewhere.
                 */
                const watchesAnAmount = target !== null
                const holdsSavings = loaded.applications.some((a) => a.product === 'savings')

                const existing = await admin
                  .from('plans')
                  .select('id, goal')
                  .eq('case_id', turn.caseId)
                  .in('status', ['draft', 'active'])

                if (existing.error) throw new Error(`plans: ${existing.error.message}`)
                const open = (existing.data ?? []) as { id: string; goal: string }[]

                if (open.some((plan) => plan.goal === input_.goal)) {
                  return {
                    result:
                      'They already have a plan for this goal. Talk about that one rather than starting another.',
                  }
                }

                /**
                 * §10 — the same money cannot be promised twice.
                 *
                 * Asked before the plan is written, so the clash is not announced in the same
                 * breath as confirming the plan that caused it. The engine raises it; what the
                 * customer's savings are actually for is their call, not the bank's.
                 */
                if (goalContext !== null && wouldContend(goalContext, input_.goal, target)) {
                  return {
                    result:
                      'That would have two plans counting on the same savings. Say so plainly, ' +
                      'and ask which one the money is for before proposing anything.',
                  }
                }

                const rawDate = input_.targetDate ?? null
                const draft = planDraftFor({
                  goal: input_.goal,
                  title: input_.title,
                  targetAmount: target,
                  // A month without a day is not a date the engine can measure against.
                  targetDate: rawDate === null || rawDate.length === 7 ? null : rawDate,
                  today: context.today,
                })

                if (draft === null) return { result: 'That is not a goal I can plan for.' }

                const planId = await proposePlan(admin, turn.caseId, draft)
                if (planId === null) return { result: 'That plan could not be saved just now.' }

                const months =
                  target !== null && context.monthlySaving !== null && context.monthlySaving > 0
                    ? Math.ceil(
                        Math.max(0, target - (context.savingsBalance ?? 0)) / context.monthlySaving,
                      )
                    : null

                const first = draft.checkins[0] ?? null

                const card: Card = {
                  type: 'plan_proposal',
                  planId,
                  title: draft.title,
                  targetAmount: target,
                  currentAmount: context.savingsBalance,
                  projectedDate: null,
                  monthsRemaining: months,
                  milestones: draft.milestones.map((milestone) => ({
                    label: milestone.label,
                    achieved: false,
                  })),
                  checkin:
                    first === null
                      ? null
                      : {
                          purpose: first.purpose,
                          when:
                            first.triggerKind === 'event'
                              ? 'when you reach the target'
                              : (first.dueAt ?? 'later'),
                          agenda: [...first.agenda],
                        },
                  confirmLabel: 'Keep this plan',
                }

                return {
                  result:
                    'Plan proposed. It is a draft and belongs to nobody until they tap it. ' +
                    'Explain what it does for them in a sentence; do not list the milestones ' +
                    'back.' +
                    (watchesAnAmount && !holdsSavings
                      ? ' This one waits on an amount, and they have no savings account here, ' +
                        'so nothing can see the balance and nobody will be able to come back to ' +
                        'them. Say so plainly — the plan still stands, it just cannot be watched ' +
                        'unless the saving happens here. Do not oversell it.'
                      : ''),
                  card,
                }
              }

              /**
               * §51 — a question about money, answered with figures.
               *
               * Everything on the card is computed here from the catalogue. The model chose to
               * show it and supplied what the customer said; it never sees a number it could
               * restate wrongly, which is the whole reason this tool exists.
               */
              case 'show_quote': {
                const ask = input as {
                  product: Product
                  amount?: number
                  months?: number
                  monthly?: number
                }

                /**
                 * One quote, not one per turn.
                 *
                 * Asked to go through an option, the model reached for the tool again and put a
                 * second card under the first — the same figures, one row shorter. The card is
                 * still on screen; what the customer wanted was the explanation.
                 */
                const quoteOnScreen = loaded.messages
                  .slice(-QUOTE_CARD_WINDOW)
                  .some((message) => message.cards.includes('quote'))

                if (quoteOnScreen) {
                  return {
                    result:
                      'That quote is already on screen. Talk about it rather than showing it ' +
                      'again — and keep finding out what they need it for and how they mean to ' +
                      'repay it.',
                  }
                }

                const info = productInfo(ask.product)
                const quote = buildQuote(info.variants ?? [], {
                  amount: ask.amount,
                  months: ask.months,
                  monthly: ask.monthly,
                })

                if (quote.problem !== null) {
                  return {
                    result:
                      `No options to show: ${quote.problem} Say that plainly and ask for what ` +
                      'would let you work it out.',
                  }
                }

                const card: Card = {
                  type: 'quote',
                  product: ask.product,
                  displayName: info.name,
                  basis: quote.basis,
                  options: quote.options.map((option) => ({
                    id: option.id,
                    name: option.name,
                    highlight: option.highlight,
                    headline: option.headline,
                    figures: [...option.figures],
                    footnote: option.footnote,
                  })),
                }

                /*
                 * Showing somebody what a mortgage would cost is significant (Invariant 9), and
                 * it is also the only record that this product is in play. The next turn reads
                 * it to work out what applying would involve, which it cannot do from a card
                 * payload nothing stores.
                 */
                await writeEvent(admin, {
                  caseId: turn.caseId,
                  type: 'product_quoted',
                  actor: 'model',
                  payload: { product: ask.product, basis: quote.basis },
                })

                return {
                  result:
                    `Showing ${String(quote.options.length)} options for ${info.name}, based on ` +
                    `${quote.basis}. The figures are on the card — do not repeat them. Say in a ` +
                    'sentence what the trade-off between them is, and invite them to tap one so ' +
                    'you can go through it properly. The rates are illustrative.',
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
                  result:
                    `Upload card shown for ${outstanding.requirement.label}. Nothing arrives ` +
                    'until they pick a file. Say in a line what it is for.',
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
          usage: spend,
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
