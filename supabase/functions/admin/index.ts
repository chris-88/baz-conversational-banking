// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  adminRequestSchema,
  PERIOD_DAYS,
  type AdminCase,
  type AdminOverview,
  type GuardrailTest,
} from '../_shared/contracts/admin.ts'
import Anthropic from '@anthropic-ai/sdk'
import { runGate } from '../_shared/llm/gate.ts'
import { createClassifier } from '../_shared/llm/classifier.ts'
import { boiDomainConfig } from '../_shared/tenants/boi/domain-config.ts'
import { composeSystemPrompt } from '../_shared/llm/prompt.ts'
import { boiProducts } from '../_shared/tenants/boi/products.ts'
import { knowledgeBaseSection } from '../_shared/tenants/boi/kb-prompt.ts'
import { caseStatus, type CaseKind } from '../_shared/domain/case.ts'
import { factCatalogue, isFactKey } from '../_shared/domain/facts.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import type { Product } from '../_shared/domain/journey.ts'
import { asApplicationId } from '../_shared/domain/facts.ts'
import { stateLabel, transition, type ApplicationState, type TransitionEvent } from '../_shared/domain/state-machine.ts'
import { slidersFor } from '../_shared/llm/persona.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'
import { loadCase, recordFacts, type Insert, writeEvent } from '../_shared/db/case-repository.ts'
import { evaluateFor } from '../_shared/db/applications.ts'
import { needContextFor, revivableNeeds } from '../_shared/db/needs.ts'
import { describeAdminEvent } from '../_shared/db/admin-events.ts'
import { catalogueOverrideRow, toOverride, toUsage } from '../_shared/db/rows.ts'
import {
  TYPICAL_TURN,
  costIn,
  sumUsage,
  tokensIn,
  type TurnUsage,
} from '../_shared/domain/cost.ts'
import type { Cost } from '../_shared/contracts/admin.ts'
import {
  CASE_OUTCOMES,
  CASE_OUTCOME_LABELS,
  CASE_OUTCOME_NOTES,
  caseOutcome,
  type CaseOutcome,
} from '../_shared/domain/case.ts'
import { checkinKey } from '../_shared/domain/catalogue/overlay.ts'
import { goalCatalogue } from '../_shared/domain/goals/catalogue.ts'
import { needCatalogue } from '../_shared/domain/needs/catalogue.ts'
import { loadPlans, planContextFor, reconcilePlans } from '../_shared/db/plans.ts'
import { canTransition } from '../_shared/domain/plans/engine.ts'
import type { PlanStatus } from '../_shared/domain/plans/types.ts'
import { evaluateNeeds } from '../_shared/domain/needs/engine.ts'
import { contentionIn, evaluateGoals, matchedClusters } from '../_shared/domain/goals/engine.ts'
import { goalContextFor } from '../_shared/db/goals.ts'
import { buildHandoffNote, handoffAsText } from '../_shared/db/handoff.ts'
import { buildPlan } from '../_shared/domain/needs/plan.ts'

/**
 * The presenter console (§37 to §44).
 *
 * Every action can break a live demonstration and the site is public, so admin status is
 * checked server-side on every call. Client-side routing only decides what is drawn.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const errorResponse = (code: Parameters<typeof statusFor>[0], message: string) =>
  json(fail(code, message), statusFor(code))

function env(name: string): string {
  const value = (globalThis as any).Deno?.env?.get(name)
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Missing ${name}`)
  return value
}

/**
 * What each one-click move means, in transitions.
 *
 * A sequence rather than one step, because "approved" from the presenter's point of view means
 * submitted, received, assessed — three transitions the machine insists on in order.
 */
const DEMO_MOVES: Record<
  string,
  { product: string; label: string; steps: readonly string[]; note: string }
> = {
  credit_card_approved: {
    product: 'credit_card',
    label: 'Credit card approved',
    steps: ['received_by_bank', 'assessment_approved'],
    note: 'Takes the submitted card through assessment to approved.',
  },
  joint_account_approved: {
    product: 'joint_account',
    label: 'Joint account approved',
    steps: ['received_by_bank', 'assessment_approved'],
    note: 'Takes the submitted joint account through to approved.',
  },
  mortgage_to_assessment: {
    product: 'mortgage',
    label: 'Mortgage moved to assessment',
    steps: ['received_by_bank'],
    note: 'Moves the submitted mortgage into assessment.',
  },
  mortgage_requests_document: {
    product: 'mortgage',
    label: 'Mortgage requests a document',
    steps: ['information_requested'],
    note: 'The mortgage team asks for one more payslip.',
  },
  protection_approved: {
    product: 'protection',
    label: 'Protection approved',
    steps: ['received_by_bank', 'assessment_approved'],
    note: 'Takes the submitted protection through to approved.',
  },
}

/**
 * Which hand-moves are possible on a case right now, and why not when they are not.
 *
 * Shared, because the case list and the case itself both offer them and a button that is live
 * on one screen and dead on the other is worse than no button. Each is checked against the
 * state machine rather than guessed, so nothing fails in front of anybody (§41).
 */
function movesFor(
  applications: readonly { id: string; product: string; state: string; resume_to: string | null }[],
): readonly { id: string; label: string; available: boolean; note: string }[] {
  return Object.entries(DEMO_MOVES).map(([id, move]) => {
    const application = applications.find((candidate) => candidate.product === move.product)

    if (!application) {
      return {
        id,
        label: move.label,
        available: false,
        note: `No ${move.product.replaceAll('_', ' ')} on the case yet.`,
      }
    }

    const first = move.steps[0]
    const possible = transition(
      {
        id: asApplicationId(application.id),
        product: application.product as Product,
        state: application.state as ApplicationState,
        resumeTo: application.resume_to as ApplicationState | null,
      },
      { type: first } as TransitionEvent,
    ).ok

    return {
      id,
      label: move.label,
      available: possible,
      note: possible ? move.note : `Not possible from "${application.state}".`,
    }
  })
}

/**
 * What a set of turns cost, from what was measured and an average for the rest.
 *
 * Turns recorded before cost tracking existed have no usage, and dropping them would make an
 * old conversation look free. So they are filled with `TYPICAL_TURN` — which was measured from
 * this system rather than guessed — and the result says how many of each there were, so the
 * console can be straight about which is which.
 */
function costOf(rows: readonly { usage: unknown }[]): Cost {
  const measured = rows.map((row) => toUsage(row.usage)).filter((u): u is TurnUsage => u !== null)
  const unmeasured = rows.length - measured.length

  const total = sumUsage([
    ...measured,
    ...Array.from({ length: unmeasured }, () => TYPICAL_TURN),
  ])

  return {
    tokens: tokensIn(total),
    euro: costIn(total),
    turns: rows.length,
    measuredTurns: measured.length,
  }
}

/** The five headline counts, from a tally of event types. */
function headlineCounts(counts: ReadonlyMap<string, number>): {
  questionsAvoided: number
  factsCaptured: number
  productsOffered: number
  applicationsStarted: number
  requestsBlocked: number
} {
  return {
    questionsAvoided: counts.get('context_reused') ?? 0,
    factsCaptured: counts.get('context_captured') ?? 0,
    productsOffered: counts.get('product_offered') ?? 0,
    applicationsStarted: counts.get('application_created') ?? 0,
    requestsBlocked: counts.get('request_blocked') ?? 0,
  }
}

/** What an event was about, from whatever the payload names. */
function objectOf(payload: Record<string, unknown>): string {
  for (const key of ['title', 'label', 'product', 'purpose', 'name']) {
    const value = payload[key]
    if (typeof value === 'string' && value.length > 0) return value.replaceAll('_', ' ')
  }
  return ''
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return errorResponse('bad_request', 'Use POST.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return errorResponse('unauthorised', 'Sign in as an administrator.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('bad_request', 'Body must be JSON.')
  }

  const parsed = adminRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('bad_request', 'Unrecognised request.')

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in.')

  // The whole protection. An anonymous visitor is never in this table.
  const isAdmin = await admin
    .from('admin_users')
    .select('auth_user_id')
    .eq('auth_user_id', caller.data.user.id)
    .maybeSingle()

  if (!isAdmin.data) return errorResponse('forbidden', 'You are not an administrator.')

  const action = parsed.data

  switch (action.action) {
    /**
     * §39 — the gate, run on demand.
     *
     * The real classifier and the real deterministic checks, through `runGate`, so what this
     * reports cannot drift from what a customer would meet. Nothing is written: a test is not
     * something that happened to anybody, and putting it in the event log would make the
     * blocked-requests metric a count of how often somebody demonstrated the feature.
     */
    case 'test_guardrail': {
      const config = await admin
        .from('domain_config')
        .select('kill_switch')
        .eq('scope', 'global')
        .maybeSingle()

      const anthropic = new Anthropic({
        apiKey: env('ANTHROPIC_API_KEY'),
        timeout: 20_000,
        maxRetries: 1,
      })

      const classify = createClassifier({
        apiKey: env('ANTHROPIC_API_KEY'),
        model: env('GATE_MODEL'),
        domainConfig: boiDomainConfig,
        client: anthropic,
      })

      // No previous turn: a test request stands alone, which is also the hardest case for the
      // classifier and therefore the honest one to show.
      const result = await runGate(action.message, {
        classify: (message) => classify({ message }),
        domainConfig: boiDomainConfig,
        killSwitch: (config.data as { kill_switch?: boolean } | null)?.kill_switch ?? false,
        tone: 'neutral',
      })

      return json(
        ok({
          category: result.category,
          reachesModel: result.allowed,
          response: result.allowed ? null : result.response,
          reason: result.allowed ? null : result.reason,
          injectionFlagged: result.injectionFlagged,
          profanity: result.allowed ? false : false,
          sensitive: result.allowed ? result.suppressHumour : false,
        } satisfies GuardrailTest),
        200,
      )
    }

    /**
     * §56 — what the persona on screen would sound like.
     *
     * The real prompt composer with the draft sliders, so the preview is the thing itself rather
     * than an impression of it. Deliberately not wired to the sliders as they move: a model call
     * per drag is both slow and expensive, and the point is to hear a setting, not to watch one.
     */
    case 'preview_persona': {
      const anthropic = new Anthropic({
        apiKey: env('ANTHROPIC_API_KEY'),
        timeout: 30_000,
        maxRetries: 1,
      })

      const stream = anthropic.messages.stream({
        model: env('BAZ_MODEL'),
        max_tokens: 400,
        system: composeSystemPrompt({
          domainConfig: boiDomainConfig,
          productCatalogue: knowledgeBaseSection(),
          sliders: action.sliders,
          digest: {
            customerName: null,
            authLevel: 'anonymous',
            facts: [],
            applications: [],
            declinedProducts: [],
            advisories: [],
            partner: null,
            eventsSinceLastSeen: [],
          },
        }),
        messages: [{ role: 'user', content: action.message }],
      })

      const message = await stream.finalMessage()
      const reply = message.content
        .filter((block): block is { type: 'text'; text: string; citations: null } => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim()

      return json(ok({ reply }), 200)
    }

    case 'set_kill_switch': {
      await admin
        .from('domain_config')
        .update({ kill_switch: action.enabled })
        .eq('scope', 'global')
      return json(ok({ killSwitch: action.enabled }), 200)
    }

    case 'set_persona': {
      const update: Record<string, unknown> = {}
      if (action.preset !== undefined) {
        update.preset = action.preset
        update.sliders = slidersFor(action.preset)
      }
      // Explicit sliders win, so a preset can be nudged without becoming a different preset.
      if (action.sliders !== undefined) {
        update.sliders = action.sliders
        update.preset = action.preset ?? 'custom'
      }
      if (Object.keys(update).length === 0) return errorResponse('bad_request', 'Nothing to set.')

      await admin
        .from('persona_config')
        .update(update as Insert<'persona_config'>)
        .eq('scope', 'global')
      return json(ok(update), 200)
    }

    /**
     * Plan §3.2 — reword a catalogue entry, or switch it off.
     *
     * Validated against the compiled catalogue before it is written: an override for a goal that
     * does not exist, or a milestone label keyed to a milestone that is not on it, is dead weight
     * that nothing will ever apply and that nobody will ever notice is doing nothing.
     */
    case 'set_catalogue_override': {
      const entry =
        action.kind === 'goal'
          ? goalCatalogue.find((goal) => goal.id === action.entryId)
          : needCatalogue.find((need) => need.id === action.entryId)

      if (entry === undefined) {
        return errorResponse('not_found', `No ${action.kind} called ${action.entryId}.`)
      }

      if (action.priority !== null && action.kind !== 'need') {
        return errorResponse('bad_request', 'Only a need has a priority. A goal is ranked by evidence.')
      }

      if ('milestones' in entry) {
        const ids = new Set(entry.milestones.map((milestone) => milestone.id))
        const unknown = Object.keys(action.milestoneLabels).find((id) => !ids.has(id))
        if (unknown !== undefined) {
          return errorResponse('bad_request', `${action.entryId} has no milestone ${unknown}.`)
        }

        const keys = new Set(entry.checkins.map(checkinKey))
        const strayCheckin = Object.keys(action.checkinAgendas).find((key) => !keys.has(key))
        if (strayCheckin !== undefined) {
          return errorResponse('bad_request', `${action.entryId} has no check-in ${strayCheckin}.`)
        }
      } else if (
        Object.keys(action.milestoneLabels).length > 0 ||
        Object.keys(action.checkinAgendas).length > 0
      ) {
        return errorResponse('bad_request', 'A need has no milestones or check-ins.')
      }

      /*
       * `version` is bumped in the upsert rather than by a trigger, so it counts saves from this
       * action and not any other write that might touch the row. It is lifecycle metadata for a
       * human reading the console, not a concurrency token.
       */
      const existing = await admin
        .from('catalogue_overrides')
        .select('version')
        .eq('kind', action.kind)
        .eq('entry_id', action.entryId)
        .maybeSingle()

      const version = ((existing.data?.version as number | undefined) ?? 0) + 1

      const upsert = await admin.from('catalogue_overrides').upsert(
        {
          kind: action.kind,
          entry_id: action.entryId,
          enabled: action.enabled,
          name: action.name,
          summary: action.summary,
          priority: action.priority,
          milestone_labels: action.milestoneLabels,
          checkin_agendas: action.checkinAgendas,
          version,
        } as Insert<'catalogue_overrides'>,
        { onConflict: 'kind,entry_id' },
      )

      if (upsert.error !== null) {
        return errorResponse('bad_request', upsert.error.message)
      }

      /*
       * No event row. `events` is per-case and a catalogue edit is global, which is also why
       * `set_persona` writes none. The row's own version and timestamps are the audit trail,
       * and they are the lifecycle metadata the console displays.
       */
      return json(ok({ version }), 200)
    }

    /** Plan §3.2 — drop the row and go back to what is compiled in. */
    case 'clear_catalogue_override': {
      await admin
        .from('catalogue_overrides')
        .delete()
        .eq('kind', action.kind)
        .eq('entry_id', action.entryId)

      return json(ok({ cleared: true }), 200)
    }

    /**
     * §9 — everything the analytics screen draws.
     *
     * Counted in Postgres where the shape suits it and in Deno where it does not. The daily
     * series is a function call because `generate_series` fills the quiet days with zero, and a
     * line that closes over its gaps is a lie about the shape; the rest are small enough to
     * tally here.
     */
    case 'analytics': {
      const days = PERIOD_DAYS[action.period]
      const to = new Date()
      /* `all` still needs a start for the series. The first event there has ever been is the
         honest one, and it is one query. */
      const earliest = await admin
        .from('events')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const from =
        days === null
          ? new Date((earliest.data?.created_at as string | undefined) ?? to.toISOString())
          : new Date(to.getTime() - days * 86_400_000)

      const previousFrom = days === null ? null : new Date(from.getTime() - days * 86_400_000)

      const [series, messageSeries, windowEvents, priorEvents, applications, caseFacts] =
        await Promise.all([
        admin.rpc('metrics_by_day', { from_ts: from.toISOString(), to_ts: to.toISOString() }),
        /* Volume is messages, not events: nothing writes a `message_sent` event, and adding one
           per message would double the log to record what the log already holds. Merged into
           the same series so every chart on the screen reads one array. */
        admin.rpc('messages_by_day', { from_ts: from.toISOString(), to_ts: to.toISOString() }),
        admin
          .from('events')
          .select('type, case_id, payload')
          .gte('created_at', from.toISOString())
          .lt('created_at', to.toISOString()),
        previousFrom === null
          ? Promise.resolve({ data: [], error: null })
          : admin
              .from('events')
              .select('type')
              .gte('created_at', previousFrom.toISOString())
              .lt('created_at', from.toISOString()),
        /* Application states are current, not historical — an application submitted inside the
           window may have moved on since. The funnel therefore describes where things stand,
           which is what a funnel is for. */
        admin.from('applications').select('case_id, state'),
        admin
          .from('messages')
          .select('case_id, role')
          .eq('role', 'customer')
          .gte('created_at', from.toISOString()),
      ])

      // The same count over the window before, so the comparison measures the same thing.
      const priorFacts =
        previousFrom === null
          ? { data: [] as { case_id: string }[], error: null }
          : await admin
              .from('messages')
              .select('case_id')
              .eq('role', 'customer')
              .gte('created_at', previousFrom.toISOString())
              .lt('created_at', from.toISOString())

      for (const result of [series, messageSeries, windowEvents, applications, caseFacts, priorFacts]) {
        if (result.error !== null) return errorResponse('conflict', result.error.message)
      }

      const rows = windowEvents.data as {
        type: string
        case_id: string
        payload: Record<string, unknown>
      }[]

      const countOf = (list: { type: string }[], type: string): number =>
        list.filter((row) => row.type === type).length

      // A conversation is a case somebody spoke in, counted once however much was said.
      const spokeIn = new Set(
        (caseFacts.data as { case_id: string }[]).map((row) => row.case_id),
      )

      const totals = {
        conversations: spokeIn.size,
        applications: countOf(rows, 'application_created'),
        goals: countOf(rows, 'goal_identified'),
        blocked: countOf(rows, 'request_blocked'),
      }

      const prior = (priorEvents.data ?? []) as { type: string }[]
      const previous =
        previousFrom === null
          ? null
          : {
              conversations: new Set(
                (priorFacts.data as { case_id: string }[]).map((row) => row.case_id),
              ).size,
              applications: countOf(prior, 'application_created'),
              goals: countOf(prior, 'goal_identified'),
              blocked: countOf(prior, 'request_blocked'),
            }

      const appRows = applications.data as { case_id: string; state: string }[]

      /* Each stage counts applications that reached it *or went past it*. A funnel that counted
         only current states would show nothing at "started" once everything had been submitted,
         which is the opposite of what a funnel is supposed to show. */
      const ORDER = [
        'not_started',
        'in_progress',
        'waiting_customer',
        'waiting_partner',
        'ready',
        'submitted',
        'under_review',
        'info_required',
        'approved',
        'completed',
      ]
      const rank = (state: string): number => {
        const index = ORDER.indexOf(state)
        // `declined` and `paused` are off the path rather than behind on it.
        return index === -1 ? 0 : index
      }

      const funnel = [
        { stage: 'started', label: 'Started', at: 1 },
        { stage: 'ready', label: 'Ready to submit', at: ORDER.indexOf('ready') },
        { stage: 'submitted', label: 'Submitted', at: ORDER.indexOf('submitted') },
        { stage: 'approved', label: 'Approved', at: ORDER.indexOf('approved') },
      ].map((stage) => ({
        stage: stage.stage,
        label: stage.label,
        count: appRows.filter((row) => rank(row.state) >= stage.at).length,
      }))

      const tallyBy = (key: string): Map<string, number> => {
        const counts = new Map<string, number>()
        for (const row of rows) {
          const value = row.payload[key]
          if (typeof value !== 'string') continue
          counts.set(value, (counts.get(value) ?? 0) + 1)
        }
        return counts
      }

      const goalCounts = new Map<string, number>()
      for (const row of rows) {
        if (row.type !== 'goal_identified') continue
        const goal = row.payload.goal
        if (typeof goal !== 'string') continue
        goalCounts.set(goal, (goalCounts.get(goal) ?? 0) + 1)
      }

      const topGoals = [...goalCounts.entries()]
        .map(([goal, count]) => ({
          goal,
          name: goalCatalogue.find((item) => item.id === goal)?.name ?? goal,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      const blockedCounts = new Map<string, number>()
      for (const row of rows) {
        if (row.type !== 'request_blocked') continue
        const category = row.payload.category
        if (typeof category !== 'string') continue
        blockedCounts.set(category, (blockedCounts.get(category) ?? 0) + 1)
      }

      const guardrails = [...blockedCounts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

      /* Outcomes are per case, from everything that happened to it — not only what happened
         inside the window. "How far did this conversation get" has no meaning clipped to seven
         days. The window decides which conversations are counted, not how far they got. */
      const byCase = new Map<string, { blocked: boolean; goals: number; plans: number }>()
      for (const id of spokeIn) byCase.set(id, { blocked: false, goals: 0, plans: 0 })

      const allForCases = await admin
        .from('events')
        .select('case_id, type, payload')
        .in('case_id', [...spokeIn])

      if (allForCases.error !== null) {
        return errorResponse('conflict', allForCases.error.message)
      }

      for (const row of allForCases.data as { case_id: string; type: string }[]) {
        const entry = byCase.get(row.case_id)
        if (entry === undefined) continue
        if (row.type === 'request_blocked') entry.blocked = true
        if (row.type === 'goal_identified') entry.goals += 1
        if (row.type === 'plan_created') entry.plans += 1
      }

      const appsByCase = new Map<string, { state: string }[]>()
      for (const row of appRows) {
        appsByCase.set(row.case_id, [...(appsByCase.get(row.case_id) ?? []), { state: row.state }])
      }

      const outcomeCounts = new Map<CaseOutcome, number>()
      for (const [caseId, entry] of byCase) {
        const outcome = caseOutcome({
          everBlocked: entry.blocked,
          applications: appsByCase.get(caseId) ?? [],
          plans: entry.plans,
          goalsIdentified: entry.goals,
          // Every case in `byCase` is one somebody spoke in; that is how it got there.
          customerMessages: 1,
        })
        if (outcome === null) continue
        outcomeCounts.set(outcome, (outcomeCounts.get(outcome) ?? 0) + 1)
      }

      const outcomes = CASE_OUTCOMES.map((outcome) => ({
        outcome,
        label: CASE_OUTCOME_LABELS[outcome],
        note: CASE_OUTCOME_NOTES[outcome],
        count: outcomeCounts.get(outcome) ?? 0,
      })).filter((entry) => entry.count > 0)

      return json(
        ok({
          period: action.period,
          from: from.toISOString(),
          to: to.toISOString(),
          totals,
          previous,
          series: [
            ...((series.data ?? []) as { day: string; type: string; count: number }[]),
            ...((messageSeries.data ?? []) as { day: string; role: string; count: number }[]).map(
              (row) => ({ day: row.day, type: `message:${row.role}`, count: row.count }),
            ),
          ],
          funnel,
          topGoals,
          guardrails,
          outcomes,
        }),
        200,
      )
    }

    /** Plan §3.2 — what is currently overridden, for the catalogue screen. */
    case 'catalogue_overrides': {
      const result = await admin
        .from('catalogue_overrides')
        .select(
          'kind, entry_id, enabled, name, summary, priority, milestone_labels, checkin_agendas, version, created_at, updated_at',
        )

      if (result.error !== null) {
        return errorResponse('bad_request', result.error.message)
      }

      const overrides = catalogueOverrideRow.array().parse(result.data).map(toOverride)

      return json(ok({ overrides }), 200)
    }

    case 'reset_case': {
      // §43 — the case named, or the most recent. Everyone else's is left alone.
      const target =
        action.caseId === undefined
          ? (
              (
                await admin
                  .from('cases')
                  .select('id')
                  .order('updated_at', { ascending: false })
                  .limit(1)
              ).data as { id: string }[] | null
            )?.[0]?.id
          : action.caseId

      if (target !== undefined) await admin.from('cases').delete().eq('id', target)

      const customer = await admin
        .from('customers')
        .upsert(
          {
            bank_reference: canonicalCase.customer.bankReference,
            full_name: canonicalCase.customer.fullName,
            date_of_birth: canonicalCase.customer.dateOfBirth,
            email: canonicalCase.customer.email,
            mobile: canonicalCase.customer.mobile,
            existing_products: [...canonicalCase.customer.existingProducts],
          },
          { onConflict: 'bank_reference' },
        )
        .select('id')
        .single()

      const created = await admin
        .from('cases')
        .insert({
          kind: 'presenter',
          label: canonicalCase.label,
          customer_id: (customer.data as { id: string }).id,
          auth_level: 'authenticated',
        })
        .select('id')
        .single()

      const caseId = (created.data as { id: string }).id

      const participant = await admin
        .from('participants')
        .insert({ case_id: caseId, role: 'primary', display_name: canonicalCase.customer.firstName })
        .select('id')
        .single()

      const participantId = (participant.data as { id: string }).id

      await admin.from('facts').insert(
        canonicalCase.bankHeldFacts.map((fact) => ({
          case_id: caseId,
          key: fact.key,
          participant_id: fact.subject === 'household' ? null : participantId,
          subject_kind: fact.subject === 'household' ? 'household' : 'participant',
          value: fact.value as Json,
          source: fact.source,
          verified: fact.verified,
        })),
      )

      await writeEvent(admin, {
        caseId,
        type: 'case_reset',
        actor: 'admin',
        payload: { facts: canonicalCase.bankHeldFacts.length },
      })

      return json(ok({ caseId, facts: canonicalCase.bankHeldFacts.length }), 200)
    }

    case 'overview': {
      const [config, persona, cases, events, blocked] = await Promise.all([
        admin.from('domain_config').select('kill_switch').eq('scope', 'global').maybeSingle(),
        admin.from('persona_config').select('preset, sliders').eq('scope', 'global').maybeSingle(),
        admin.from('cases').select('id, kind, label, updated_at').order('updated_at', { ascending: false }).limit(25),
        // Capped: metrics are a headline, not an audit, and the log grows without bound.
        admin
          .from('events')
          .select('type, created_at')
          .order('created_at', { ascending: false })
          .limit(5000),
        admin
          .from('events')
          .select('payload, created_at')
          .eq('type', 'request_blocked')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      /**
       * Two windows: the one asked for, and the one immediately before it.
       *
       * Counted here rather than in two more round trips, because the rows are already loaded
       * and a prototype's event log fits comfortably inside the cap above.
       */
      const days = PERIOD_DAYS[action.period]
      const now = Date.now()
      const windowStart = days === null ? null : now - days * 86_400_000
      const previousStart = days === null || windowStart === null ? null : windowStart - days * 86_400_000

      const counts = new Map<string, number>()
      const before = new Map<string, number>()

      for (const row of (events.data ?? []) as { type: string; created_at: string }[]) {
        const at = Date.parse(row.created_at)

        if (windowStart !== null && previousStart !== null && at < windowStart) {
          if (at >= previousStart) before.set(row.type, (before.get(row.type) ?? 0) + 1)
          continue
        }

        counts.set(row.type, (counts.get(row.type) ?? 0) + 1)
      }

      const caseRows = (cases.data ?? []) as { id: string; kind: string; label: string | null; updated_at: string }[]
      const caseIds = caseRows.map((row) => row.id)

      // Two queries, not two per case. This is a console someone drives live, and the N+1
      // version took long enough to look broken.
      const [allApps, allMessages, allNames, allBlocked, allCheckins] = await Promise.all([
        admin.from('applications').select('case_id, state').in('case_id', caseIds),
        // Role and content too: the list shows the latest thing said, and the status rules count
        // only what the customer said rather than everything in the transcript.
        admin
          .from('messages')
          .select('case_id, role, content, created_at, usage')
          .in('case_id', caseIds)
          .order('created_at', { ascending: true }),
        // Whoever the case is actually about. One query for every case, same as the others.
        admin
          .from('facts')
          .select('case_id, value, captured_at')
          .eq('key', 'identity.fullName')
          .is('superseded_by', null)
          .in('case_id', caseIds)
          .order('captured_at', { ascending: true }),
        admin.from('events').select('case_id').eq('type', 'request_blocked').in('case_id', caseIds),
        // A check-in the bank promised and has not kept is the clearest "somebody look at this".
        admin
          .from('plan_checkins')
          .select('state, plans!inner(case_id)')
          .eq('state', 'due'),
      ])

      const tally = (rows: unknown): Map<string, number> => {
        const counts = new Map<string, number>()
        for (const row of (rows ?? []) as { case_id: string }[]) {
          counts.set(row.case_id, (counts.get(row.case_id) ?? 0) + 1)
        }
        return counts
      }

      const appCounts = tally(allApps.data)
      const messageCounts = tally(allMessages.data)

      // Everything the status rules read, grouped by case in one pass each.
      const appStates = new Map<string, { state: string }[]>()
      for (const row of (allApps.data ?? []) as { case_id: string; state: string }[]) {
        appStates.set(row.case_id, [...(appStates.get(row.case_id) ?? []), { state: row.state }])
      }

      const customerCounts = new Map<string, number>()
      const latest = new Map<string, string>()
      for (const row of (allMessages.data ?? []) as {
        case_id: string
        role: string
        content: string
      }[]) {
        if (row.role === 'customer') {
          customerCounts.set(row.case_id, (customerCounts.get(row.case_id) ?? 0) + 1)
        }
        // Ordered oldest first, so the last one written wins.
        if (row.role !== 'system') latest.set(row.case_id, row.content)
      }

      const blockedCases = new Set(
        ((allBlocked.data ?? []) as { case_id: string }[]).map((row) => row.case_id),
      )

      const dueCases = new Set(
        ((allCheckins.data ?? []) as { plans?: { case_id?: string } }[])
          .map((row) => row.plans?.case_id)
          .filter((id): id is string => typeof id === 'string'),
      )

      /**
       * A list of eleven rows all called "Audience case" is unusable the moment more than one
       * person is talking. The primary applicant's name is the only thing that tells them
       * apart, so it is the label when it is known; until someone says who they are, a short
       * id at least stays stable while the presenter watches it.
       */
      const names = new Map<string, string>()
      for (const row of (allNames.data ?? []) as { case_id: string; value: unknown }[]) {
        if (typeof row.value === 'string' && row.value.trim().length > 0 && !names.has(row.case_id)) {
          names.set(row.case_id, row.value.trim())
        }
      }

      const summaries = caseRows.map((row) => ({
        id: row.id,
        kind: row.kind as CaseKind,
        label:
          row.kind === 'presenter'
            ? row.label
            : (names.get(row.id) ?? `Unnamed · ${row.id.slice(0, 8)}`),
        applications: appCounts.get(row.id) ?? 0,
        messages: messageCounts.get(row.id) ?? 0,
        updatedAt: row.updated_at,
        status: caseStatus({
          everBlocked: blockedCases.has(row.id),
          applications: appStates.get(row.id) ?? [],
          checkinDue: dueCases.has(row.id),
          customerMessages: customerCounts.get(row.id) ?? 0,
        }),
        // Trimmed here rather than in the browser: the list shows one line of it and there is no
        // reason to send a whole turn across the wire for every case.
        latest: (latest.get(row.id) ?? '').replace(/\s+/g, ' ').slice(0, 140),
      }))

      /**
       * The case the console is driving: the one asked for, else the most recently active.
       *
       * There is no rehearsed case any more, so "which case" is a live question — the
       * presenter is working with whoever is talking to Baz in front of them.
       */
      const asked = action.caseId
      const mostRecent = [...caseRows].sort((a, b) =>
        String(b.updated_at).localeCompare(String(a.updated_at)),
      )[0]

      const focus =
        (asked === undefined ? undefined : caseRows.find((row) => row.id === asked)) ??
        mostRecent ??
        null

      const presenter = focus
      const presenterApps = presenter
        ? ((
            await admin
              .from('applications')
              .select('product, state, resume_to, id')
              .eq('case_id', presenter.id)
          ).data ?? [])
        : []

      const demoActions = movesFor(
        (presenterApps as { id: string; product: string; state: string; resume_to: string | null }[]),
      )

      const recent = await admin
        .from('events')
        .select('type, actor, created_at, payload, case_id')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(30)

      const labelFor = new Map(summaries.map((row) => [row.id, row.label ?? 'Case']))

      const activity = (
        (recent.data ?? []) as {
          type: string
          actor: string
          created_at: string
          payload: Record<string, unknown> | null
          case_id: string
        }[]
      ).map((row) => ({
        at: row.created_at,
        actor: row.actor,
        caseLabel: labelFor.get(row.case_id) ?? 'Case',
        ...describeAdminEvent(row.type, row.payload ?? {}),
      }))

      /* Only Baz's turns carry usage: a customer message costs nothing to store. */
      const bazTurns = ((allMessages.data ?? []) as { role: string; usage: unknown }[]).filter(
        (row) => row.role === 'baz',
      )

      const overview: AdminOverview = {
        activity,
        cost: costOf(bazTurns),
        killSwitch: (config.data as { kill_switch?: boolean } | null)?.kill_switch ?? false,
        demoActions: [...demoActions],
        focusCaseId: focus?.id ?? null,
        persona: {
          preset: (persona.data as { preset?: string } | null)?.preset ?? 'default',
          sliders: ((persona.data as { sliders?: unknown } | null)?.sliders ?? slidersFor('default')) as AdminOverview['persona']['sliders'],
        },
        cases: summaries,
        metrics: headlineCounts(counts),
        period: action.period,
        // `all` has no earlier window, so there is nothing honest to compare against.
        previous: days === null ? null : headlineCounts(before),
        blocked: (
          (blocked.data ?? []) as {
            payload: { category?: string; request?: string }
            created_at: string
          }[]
        ).map((row) => ({
          category: row.payload?.category ?? 'unknown',
          at: row.created_at,
          request: row.payload?.request ?? '',
        })),
      }

      return json(ok(overview), 200)
    }

    case 'simulate_event': {
      const found = await admin
        .from('applications')
        .select('id, case_id, product, state, resume_to')
        .eq('id', action.applicationId)
        .maybeSingle()

      const row = found.data as any
      if (!row) return errorResponse('not_found', 'No such application.')

      // §41 — the state machine decides, so an illegal move is refused rather than faked.
      const result = transition(
        { id: row.id, product: row.product, state: row.state, resumeTo: row.resume_to },
        { type: action.event } as TransitionEvent,
      )

      if (!result.ok) return errorResponse('illegal_transition', result.error.message)

      await admin
        .from('applications')
        .update({ state: result.application.state, resume_to: result.application.resumeTo })
        .eq('id', action.applicationId)

      const names: Record<typeof action.event, string> = {
        received_by_bank: 'application_received',
        information_requested: 'information_requested',
        information_supplied: 'document_received',
        assessment_approved: 'application_approved',
        assessment_declined: 'application_declined',
        completed: 'application_completed',
      }

      await writeEvent(admin, {
        caseId: row.case_id,
        type: names[action.event],
        actor: 'admin',
        applicationId: action.applicationId,
        payload: {
          applicationName: journeyFor(row.product).displayName,
          ...(action.detail === undefined ? {} : { detail: action.detail }),
        },
      })

      return json(ok({ state: result.application.state }), 200)
    }

    /**
     * §41 — months pass and the money is there.
     *
     * Moves the balance to the target the bank said it would watch for, marks the watch met
     * and writes an event the customer would recognise. Everything downstream — `hasUpdates`,
     * the notification, the return conversation — is the machinery that already exists; this
     * is only the thing that happened.
     */
    case 'reach_savings_target': {
      const watches = await admin
        .from('plan_watches')
        .select('id, kind, target, describe')
        .eq('case_id', action.caseId)
        .is('met_at', null)
        .eq('kind', 'savings_target')
        .limit(1)

      const watch = ((watches.data ?? []) as { id: string; target: number | null }[])[0]
      if (!watch || watch.target === null) return json(ok({ reached: false, target: null }), 200)

      const participants = await admin
        .from('participants')
        .select('id')
        .eq('case_id', action.caseId)
        .eq('role', 'primary')
        .limit(1)

      const primary = ((participants.data ?? []) as { id: string }[])[0]

      const written = await recordFacts(admin, {
        caseId: action.caseId,
        facts: [{ key: 'assets.savingsBalance', value: watch.target }],
        participants: { primary: null, partner: null },
        source: 'bank_held',
      })

      if (written.accepted.length === 0) {
        return errorResponse('internal', 'That balance could not be written.')
      }

      await admin
        .from('plan_watches')
        .update({ met_at: new Date().toISOString() })
        .eq('id', watch.id)

      await writeEvent(admin, {
        caseId: action.caseId,
        type: 'savings_target_reached',
        actor: 'system',
        payload: { target: watch.target },
      })

      return json(ok({ reached: true, target: watch.target }), 200)
    }

    /**
     * §38 — one number that moves everything.
     *
     * Supersedes the balance rather than adding to it, so the case holds one figure. Every
     * milestone, projection and waiting check-in is computed from it, which is what makes
     * this the lever worth having in front of an audience.
     */
    case 'set_savings_balance': {
      /**
       * Written through `recordFacts`, which reads the catalogue to decide whether a key is a
       * household or a person fact. Hand-rolling the insert paired `subject_kind: household`
       * with a participant id, which the schema rejects — correctly — and the rejection went
       * unread, so the console reported setting a balance that was never written.
       */
      const outcome = await recordFacts(admin, {
        caseId: action.caseId,
        facts: [{ key: 'assets.savingsBalance', value: action.amount }],
        participants: { primary: null, partner: null },
        source: 'bank_held',
      })

      if (outcome.accepted.length === 0) {
        const why = outcome.rejected.map((item: { reason: string }) => item.reason).join('; ')
        return errorResponse('internal', `That balance was not written: ${why || 'unknown'}`)
      }

      const loadedCase = await loadCase(admin, action.caseId)
      const seen = loadedCase === null ? null : planContextFor(loadedCase).savingsBalance
      const reached = loadedCase === null ? [] : await reconcilePlans(admin, action.caseId, loadedCase)

      for (const { milestone } of reached) {
        await writeEvent(admin, {
          caseId: action.caseId,
          type: 'plan_milestone_reached',
          actor: 'system',
          payload: { label: milestone.label },
        })
      }

      await writeEvent(admin, {
        caseId: action.caseId,
        type: 'savings_balance_set',
        actor: 'admin',
        payload: { amount: action.amount, milestones: reached.length },
      })

      /**
       * Report what was evaluated, not just what changed.
       *
       * "No milestone reached" means the same thing whether nothing qualified, nothing was
       * looked at, or the read came back stale. The counts make the difference visible.
       */
      const after = loadedCase === null ? [] : await loadPlans(admin, action.caseId, loadedCase)
      const considered = after
        .filter((entry) => entry.plan.status === 'active')
        .flatMap((entry) => entry.plan.milestones)

      return json(
        ok({
          amount: action.amount,
          seen,
          plansActive: after.filter((entry) => entry.plan.status === 'active').length,
          milestonesConsidered: considered.length,
          milestonesReached: reached.length,
        }),
        200,
      )
    }

    case 'plan_move': {
      const row = await admin
        .from('plans')
        .select('id, status, title')
        .eq('id', action.planId)
        .eq('case_id', action.caseId)
        .maybeSingle()

      const plan = row.data as { id: string; status: PlanStatus; title: string } | null
      if (!plan) return errorResponse('not_found', 'There is no such plan.')

      // Bringing a check-in due is not a status change, so it is handled apart.
      if (action.move === 'trigger_checkin') {
        const checkins = await admin
          .from('plan_checkins')
          .select('id, purpose')
          .eq('plan_id', plan.id)
          .in('state', ['scheduled', 'due'])
          .limit(1)

        const checkin = ((checkins.data ?? []) as { id: string; purpose: string }[])[0]
        if (!checkin) return errorResponse('conflict', 'Nothing is scheduled on that plan.')

        await admin.from('plan_checkins').update({ state: 'due' }).eq('id', checkin.id)
        await writeEvent(admin, {
          caseId: action.caseId,
          type: 'checkin_due',
          actor: 'admin',
          payload: { planId: plan.id, purpose: checkin.purpose },
        })

        return json(ok({ status: plan.status, checkin: checkin.purpose }), 200)
      }

      const target: PlanStatus =
        action.move === 'pause'
          ? 'paused'
          : action.move === 'resume'
            ? 'active'
            : action.move === 'complete'
              ? 'completed'
              : 'abandoned'

      if (!canTransition(plan.status, target)) {
        return errorResponse('conflict', `That plan cannot move from ${plan.status}.`)
      }

      const now = new Date().toISOString()
      await admin
        .from('plans')
        .update({
          status: target,
          ...(target === 'paused' ? { paused_at: now } : {}),
          ...(target === 'completed' ? { completed_at: now } : {}),
        })
        .eq('id', plan.id)

      await writeEvent(admin, {
        caseId: action.caseId,
        type: target === 'completed' ? 'plan_completed' : `plan_${target}`,
        actor: 'admin',
        payload: { planId: plan.id, title: plan.title },
      })

      return json(ok({ status: target }), 200)
    }

    case 'verify_documents': {
      const applications = await admin
        .from('applications')
        .select('id')
        .eq('case_id', action.caseId)

      const ids = ((applications.data ?? []) as { id: string }[]).map((row) => row.id)

      const updated = await admin
        .from('documents')
        .update({ verified: true })
        .eq('case_id', action.caseId)
        .eq('verified', false)
        .select('id')

      const count = ((updated.data ?? []) as { id: string }[]).length

      if (count > 0) {
        await writeEvent(admin, {
          caseId: action.caseId,
          type: 'documents_verified',
          actor: 'admin',
          payload: { count, applications: ids.length },
        })
      }

      return json(ok({ verified: count }), 200)
    }

    case 'send_notification': {
      // §58 — the link carries an opaque single-use code, never anything about the case.
      const code = crypto.randomUUID().replaceAll('-', '')
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
      const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

      const participant = await admin
        .from('participants')
        .select('id')
        .eq('case_id', action.caseId)
        .eq('role', 'primary')
        .maybeSingle()

      await admin.from('tokens').insert({
        case_id: action.caseId,
        kind: 'notification',
        token_hash: hash,
        participant_id: (participant.data as { id?: string } | null)?.id ?? null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

      await writeEvent(admin, {
        caseId: action.caseId,
        type: 'notification_sent',
        actor: 'admin',
        payload: { channel: 'in_app' },
      })

      const base = (globalThis as any).Deno?.env?.get('APP_BASE_URL') ?? ''

      return json(
        ok({
          // Fixed copy, saying nothing about the application itself (§35).
          message:
            'Bank of Ireland: Baz has an update about something you’re working on with us. ' +
            'Open Baz to pick it up.',
          // The link used to go through a simulated login, which no longer exists. The token
          // still travels, still opaque and still single-use (§29, §58).
          url: `${base}/#/baz?n=${code}`,
        }),
        200,
      )
    }

    case 'demo_action': {
      const move = DEMO_MOVES[action.move]
      if (!move) return errorResponse('bad_request', 'Unknown action.')

      const found = await admin
        .from('applications')
        .select('id, case_id, product, state, resume_to')
        .eq('case_id', action.caseId)
        .eq('product', move.product)
        .maybeSingle()

      const row = found.data as any
      if (!row) {
        return errorResponse('not_found', `There is no ${move.product.replaceAll('_', ' ')} on this case yet.`)
      }

      let current = { id: row.id, product: row.product, state: row.state, resumeTo: row.resume_to }

      for (const step of move.steps) {
        const result = transition(current, { type: step } as TransitionEvent)
        // Stop at the first step the machine refuses rather than forcing it: the presenter
        // sees the real state, not a state we wished into place (§14).
        if (!result.ok) break
        current = result.application

        await admin
          .from('applications')
          .update({ state: current.state, resume_to: current.resumeTo })
          .eq('id', row.id)

        const names: Record<string, string> = {
          received_by_bank: 'application_received',
          information_requested: 'information_requested',
          assessment_approved: 'application_approved',
        }

        await writeEvent(admin, {
          caseId: action.caseId,
          type: names[step] ?? 'application_state_changed',
          actor: 'admin',
          applicationId: row.id,
          payload: {
            applicationName: journeyFor(row.product).displayName,
            ...(step === 'information_requested' ? { detail: 'one more payslip' } : {}),
          },
        })
      }

      return json(ok({ state: current.state }), 200)
    }

    case 'purge_cases': {
      /**
       * Every case, with no exceptions.
       *
       * It used to spare the one on screen, anything marked `presenter` and anything named,
       * which meant a button saying "purge" left cases behind and nobody could tell which or
       * why. The sample customer is one click to rebuild, so sparing it bought nothing and cost
       * the button its meaning.
       *
       * Deletes cascade: participants, facts, applications, messages, plans and events all go
       * with the case.
       */
      const rows = await admin.from('cases').select('id')
      if (rows.error) return errorResponse('conflict', 'Could not read the cases.')

      const ids = ((rows.data ?? []) as { id: string }[]).map((row) => row.id)
      if (ids.length === 0) return json(ok({ purged: 0 }), 200)

      /*
       * One statement, not one per case.
       *
       * This used to loop, and each iteration was a round trip that cascaded across seven
       * tables. Fifty-one cases took minutes, held locks the whole time, and every customer
       * hitting the app during it sat on "Connecting…" because their history query could not
       * get through. A purge is a demo convenience; it should not be able to take the product
       * down while it runs.
       */
      const deleted = await admin.from('cases').delete().in('id', ids)
      if (deleted.error) return errorResponse('conflict', deleted.error.message)

      return json(ok({ purged: ids.length }), 200)
    }

    case 'inspect_case': {
      const loaded = await loadCase(admin, action.caseId)
      if (!loaded) return errorResponse('not_found', 'No such case.')

      const events = await admin
        .from('events')
        .select('type, actor, created_at, payload')
        .eq('case_id', action.caseId)
        .order('created_at', { ascending: false })
        .limit(40)

      /**
       * §27 — what the customer parked and what would bring it back.
       *
       * Shown because a deferred need is otherwise invisible: it looks identical to a need
       * that was never raised, which is precisely the thing a parked need is not.
       */
      const parkedRows = await admin
        .from('need_decisions')
        .select('need_id, reason, revisit_when, revisit_on')
        .eq('case_id', action.caseId)
        .eq('state', 'deferred')
        .is('revisited_at', null)

      const ready = new Set(
        (await revivableNeeds(admin, action.caseId, loaded)).map((item) => item.needId),
      )

      const parked = (
        (parkedRows.data ?? []) as {
          need_id: string
          reason: string | null
          revisit_when: string | null
        }[]
      ).map((row) => ({
        needId: row.need_id,
        name: loaded.needs.find((need) => need.id === row.need_id)?.name ?? row.need_id,
        reason: row.reason ?? 'parked',
        revisitWhen: row.revisit_when,
        ready: ready.has(row.need_id),
      }))

      const needContext = needContextFor(loaded, { sensitiveDisclosure: false })
      const candidates = needContext === null ? [] : evaluateNeeds(needContext, loaded.needs)
      const plan = needContext === null ? null : buildPlan(needContext, candidates)

      // Plans are loaded once and shared: the goal engine treats a goal with a plan as settled
      // rather than a candidate, so it has to see the same plans the console displays.
      const loadedPlans = await loadPlans(admin, action.caseId, loaded)
      const goalContext = goalContextFor(loaded, loadedPlans, { sensitiveDisclosure: false })
      const goalCandidates = goalContext === null ? [] : evaluateGoals(goalContext, loaded.goals)

      const watchRows = await admin
        .from('plan_watches')
        .select('describe, met_at, created_at')
        .eq('case_id', action.caseId)
        .order('created_at', { ascending: false })

      /**
       * How long they have been here, and whether they have come back.
       *
       * `daysActive` is the honest answer to "returning customer" in a prototype with no
       * sign-in: distinct days on which they said something. One day is a first visit, more
       * than one means they came back.
       */
      /*
       * Its own query rather than `loaded.messages`, which is capped at the model's context
       * window — a long conversation would otherwise report the cost of its last two dozen
       * turns as the cost of the whole thing.
       */
      const turnRows = await admin
        .from('messages')
        .select('usage')
        .eq('case_id', action.caseId)
        .eq('role', 'baz')

      if (turnRows.error !== null) return errorResponse('conflict', turnRows.error.message)

      const spoken = loaded.messages.filter((message) => message.role === 'customer')
      const days = new Set(spoken.map((message) => message.createdAt.slice(0, 10)))

      const inspected: AdminCase = {
        caseId: action.caseId,
        customer: {
          name: loaded.customerName,
          authLevel: loaded.authLevel,
          firstSeen: loaded.messages[0]?.createdAt ?? null,
          lastSeen: loaded.messages.at(-1)?.createdAt ?? null,
          daysActive: days.size,
          messages: spoken.length,
        },
        cost: costOf(turnRows.data as { usage: unknown }[]),
        needs: candidates
          .filter((candidate) => candidate.confidence > 0 || candidate.state !== 'latent')
          .map((candidate) => ({
            id: candidate.need.id,
            name: candidate.need.name,
            state: candidate.state,
            confidence: candidate.confidence,
            evidence: candidate.evidence.map((item) => item.describe),
            reason: candidate.reason,
          })),
        goals: goalCandidates.map((candidate) => ({
          id: candidate.goal.id,
          name: candidate.goal.name,
          category: candidate.goal.category,
          tier: candidate.tier,
          confidence: candidate.confidence,
          evidence: candidate.evidence.map((item) => item.describe),
          clusters: [...candidate.clusters],
          reason: candidate.reason,
          revisitWhen: candidate.revisitWhen,
          missing: candidate.missing.map((key) => factCatalogue[key]?.label ?? key),
        })),
        lifeEvents:
          goalContext === null
            ? []
            : matchedClusters(goalContext).map((cluster) => ({
                id: cluster.id,
                name: cluster.name,
                because:
                  cluster.signals.find((signal) => signal.when(goalContext))?.describe ??
                  'their situation',
                note: cluster.note,
              })),
        contentions:
          goalContext === null
            ? []
            : contentionIn(goalContext).map((contention) => ({
                resource: contention.resource,
                describe: contention.describe,
                needed: contention.needed,
                available: contention.available,
              })),
        handoff: (() => {
          const note = buildHandoffNote({
            loaded,
            goals: goalCandidates,
            goalContext,
            needs: candidates,
            plans: loadedPlans,
          })

          return {
            who: note.who,
            turns: note.turns,
            lastSeen: note.lastSeen,
            sections: note.sections.map((section) => ({
              heading: section.heading,
              lines: [...section.lines],
              caution: section.caution ?? false,
            })),
            text: handoffAsText(note),
          }
        })(),
        demoActions: [
          ...movesFor(
            loaded.applications.map((application) => ({
              id: String(application.id),
              product: application.product,
              state: application.state,
              resume_to: application.resumeTo,
            })),
          ),
        ],
        conversation: loaded.messages.map((message) => ({
          role: message.role,
          content: message.content,
          cards: [...message.cards],
          at: message.createdAt,
        })),
        planSteps: (plan?.steps ?? []).map((step) => `${step.title} — ${step.because}`),
        // Every figure here is computed by the plan engine, so the console and the customer
        // are looking at the same arithmetic (§40).
        plans: loadedPlans.map(({ plan: p, progress }) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          targetAmount: p.targetAmount,
          currentAmount: progress.current,
          projectedDate: progress.projectedDate,
          monthsRemaining: progress.monthsRemaining,
          onTrack: progress.onTrack,
          milestones: p.milestones.map((milestone) => ({
            id: milestone.id,
            label: milestone.label,
            state: milestone.state,
            achievedAt: milestone.achievedAt,
          })),
          checkins: p.checkins.map((checkin) => ({
            id: checkin.id,
            purpose: checkin.purpose,
            state: checkin.state,
            when:
              checkin.dueAt === null
                ? `when ${checkin.triggerEvent ?? 'something changes'}`
                : checkin.dueAt.slice(0, 10),
            agenda: [...checkin.agenda],
          })),
        })),
        watches: (
          (watchRows.data ?? []) as { describe: string; met_at: string | null; created_at: string }[]
        ).map((row) => ({
          describe: row.describe,
          met: row.met_at !== null,
          createdAt: row.created_at,
        })),
        // The inspector DOES show that sensitive facts exist, flagged — this surface is for
        // the person running the demonstration, not for the model.
        facts: loaded.facts.map((fact) => ({
          key: fact.key,
          label: isFactKey(fact.key) ? factCatalogue[fact.key].label : fact.key,
          value: factCatalogue[fact.key].sensitivity === 'special' ? '(held)' : String(fact.value),
          source: fact.source,
          verified: fact.verified,
          superseded: fact.supersededBy !== null,
          sensitive: factCatalogue[fact.key].sensitivity === 'special',
        })),
        applications: loaded.applications.map((application) => ({
          id: String(application.id),
          product: application.product,
          displayName: journeyFor(application.product).displayName,
          state: application.state,
          stateLabel: stateLabel(application.state),
          outstanding: evaluateFor(loaded, application)
            .outstanding.filter((item) => item.blocking)
            .map((item) => item.requirement.label),
          // Only offer the presenter moves the machine will actually accept.
          canSimulate: (
            [
              'received_by_bank',
              'information_requested',
              'information_supplied',
              'assessment_approved',
              'assessment_declined',
              'completed',
            ] as const
          ).filter((event) => transition(application, { type: event } as TransitionEvent).ok),
        })),
        events: (
          (events.data ?? []) as {
            type: string
            actor: string
            created_at: string
            payload: Record<string, unknown> | null
          }[]
        ).map((row) => ({
          type: row.type,
          actor: row.actor,
          at: row.created_at,
          // What it was about, where the payload says. Most events name the thing they changed.
          object: objectOf(row.payload ?? {}),
          ...describeAdminEvent(row.type, row.payload ?? {}),
        })),
        parked,
      }

      return json(ok(inspected), 200)
    }
  }
})
