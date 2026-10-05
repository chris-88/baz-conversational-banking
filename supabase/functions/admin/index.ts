// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { adminRequestSchema, type AdminCase, type AdminOverview } from '../_shared/contracts/admin.ts'
import { factCatalogue, isFactKey } from '../_shared/domain/facts.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { stateLabel, transition, type TransitionEvent } from '../_shared/domain/state-machine.ts'
import { slidersFor } from '../_shared/llm/persona.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'
import { loadCase, recordFacts, type Insert, writeEvent } from '../_shared/db/case-repository.ts'
import { evaluateFor } from '../_shared/db/applications.ts'
import { needContextFor } from '../_shared/db/needs.ts'
import { loadPlans, planContextFor, reconcilePlans } from '../_shared/db/plans.ts'
import { canTransition } from '../_shared/domain/plans/engine.ts'
import type { PlanStatus } from '../_shared/domain/plans/types.ts'
import { evaluateNeeds } from '../_shared/domain/needs/engine.ts'
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

    case 'reset_case': {
      // §43 — the presenter case only. Audience cases are deliberately left alone.
      const presenter = await admin.from('cases').select('id').eq('kind', 'presenter')
      for (const row of (presenter.data ?? []) as { id: string }[]) {
        await admin.from('cases').delete().eq('id', row.id)
      }

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
        admin.from('events').select('type').order('created_at', { ascending: false }).limit(5000),
        admin
          .from('events')
          .select('payload, created_at')
          .eq('type', 'request_blocked')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const counts = new Map<string, number>()
      for (const row of (events.data ?? []) as { type: string }[]) {
        counts.set(row.type, (counts.get(row.type) ?? 0) + 1)
      }

      const caseRows = (cases.data ?? []) as { id: string; kind: string; label: string | null; updated_at: string }[]
      const caseIds = caseRows.map((row) => row.id)

      // Two queries, not two per case. This is a console someone drives live, and the N+1
      // version took long enough to look broken.
      const [allApps, allMessages, allNames] = await Promise.all([
        admin.from('applications').select('case_id').in('case_id', caseIds),
        admin.from('messages').select('case_id').in('case_id', caseIds),
        // Whoever the case is actually about. One query for every case, same as the others.
        admin
          .from('facts')
          .select('case_id, value, captured_at')
          .eq('key', 'identity.fullName')
          .is('superseded_by', null)
          .in('case_id', caseIds)
          .order('captured_at', { ascending: true }),
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
        kind: row.kind as 'presenter' | 'audience',
        label:
          row.kind === 'presenter'
            ? row.label
            : (names.get(row.id) ?? `Unnamed · ${row.id.slice(0, 8)}`),
        applications: appCounts.get(row.id) ?? 0,
        messages: messageCounts.get(row.id) ?? 0,
        updatedAt: row.updated_at,
      }))

      // Work out which one-click moves are possible from where the presenter case is now.
      const presenter = caseRows.find((row) => row.kind === 'presenter') ?? null
      const presenterApps = presenter
        ? ((
            await admin
              .from('applications')
              .select('product, state, resume_to, id')
              .eq('case_id', presenter.id)
          ).data ?? [])
        : []

      const demoActions = Object.entries(DEMO_MOVES).map(([id, move]) => {
        const application = (presenterApps as any[]).find((a) => a.product === move.product)
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
          { id: application.id, product: application.product, state: application.state, resumeTo: application.resume_to },
          { type: first } as TransitionEvent,
        ).ok

        return {
          id,
          label: move.label,
          available: possible,
          note: possible ? move.note : `Not possible from "${String(application.state)}".`,
        }
      })

      const overview: AdminOverview = {
        killSwitch: (config.data as { kill_switch?: boolean } | null)?.kill_switch ?? false,
        demoActions,
        presenterCaseId: presenter?.id ?? null,
        persona: {
          preset: (persona.data as { preset?: string } | null)?.preset ?? 'default',
          sliders: ((persona.data as { sliders?: unknown } | null)?.sliders ?? slidersFor('default')) as AdminOverview['persona']['sliders'],
        },
        cases: summaries,
        metrics: {
          questionsAvoided: counts.get('context_reused') ?? 0,
          factsCaptured: counts.get('context_captured') ?? 0,
          productsOffered: counts.get('product_offered') ?? 0,
          applicationsStarted: counts.get('application_created') ?? 0,
          requestsBlocked: counts.get('request_blocked') ?? 0,
        },
        blocked: ((blocked.data ?? []) as { payload: { category?: string }; created_at: string }[]).map(
          (row) => ({ category: row.payload?.category ?? 'unknown', at: row.created_at }),
        ),
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
            'Open the app to continue securely.',
          url: `${base}/#/app/login?n=${code}`,
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

    case 'purge_audience': {
      const audience = await admin.from('cases').select('id').eq('kind', 'audience')
      const ids = ((audience.data ?? []) as { id: string }[]).map((row) => row.id)
      for (const id of ids) await admin.from('cases').delete().eq('id', id)
      return json(ok({ purged: ids.length }), 200)
    }

    case 'inspect_case': {
      const loaded = await loadCase(admin, action.caseId)
      if (!loaded) return errorResponse('not_found', 'No such case.')

      const events = await admin
        .from('events')
        .select('type, actor, created_at')
        .eq('case_id', action.caseId)
        .order('created_at', { ascending: false })
        .limit(40)

      const needContext = needContextFor(loaded, { sensitiveDisclosure: false })
      const candidates = needContext === null ? [] : evaluateNeeds(needContext)
      const plan = needContext === null ? null : buildPlan(needContext, candidates)

      const watchRows = await admin
        .from('plan_watches')
        .select('describe, met_at, created_at')
        .eq('case_id', action.caseId)
        .order('created_at', { ascending: false })

      const inspected: AdminCase = {
        caseId: action.caseId,
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
        planSteps: (plan?.steps ?? []).map((step) => `${step.title} — ${step.because}`),
        // Every figure here is computed by the plan engine, so the console and the customer
        // are looking at the same arithmetic (§40).
        plans: (await loadPlans(admin, action.caseId, loaded)).map(({ plan: p, progress }) => ({
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
        events: ((events.data ?? []) as { type: string; actor: string; created_at: string }[]).map(
          (row) => ({ type: row.type, actor: row.actor, at: row.created_at }),
        ),
      }

      return json(ok(inspected), 200)
    }
  }
})
