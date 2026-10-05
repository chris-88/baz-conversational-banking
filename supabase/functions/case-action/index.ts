// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  caseActionRequestSchema,
  type CaseActionResponse,
} from '../_shared/contracts/case-action.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { factCatalogue, isFactKey, parseFactValue } from '../_shared/domain/facts.ts'
import { transition } from '../_shared/domain/state-machine.ts'
import { loadCase, writeEvent, type Db, type Insert } from '../_shared/db/case-repository.ts'
import { canTransition } from '../_shared/domain/plans/engine.ts'
import type { PlanStatus } from '../_shared/domain/plans/types.ts'
import {
  createApplications,
  evaluateFor,
  findApplication,
  recomputeApplications,
  recordReuse,
} from '../_shared/db/applications.ts'

/**
 * `case-action` — the customer's taps (Invariant 1, §27, §48).
 *
 * The model cannot reach any of this. Each action re-reads the case, checks the caller owns
 * it, and puts every state change through the state machine, so an illegal move is refused
 * rather than written.
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

  const parsed = caseActionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('bad_request', parsed.error.issues.map((i) => i.message).join('; '))
  }
  const action = parsed.data

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in first.')

  // Resolve the case from the action, then check the caller actually owns it.
  const caseId =
    'caseId' in action
      ? action.caseId
      : await caseIdForApplication(admin, action.applicationId)

  if (!caseId) return errorResponse('not_found', 'That application does not exist.')

  const sessions = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', caller.data.user.id)
    .limit(50)

  const session = (sessions.data ?? []).find((row: any) => row.participants?.case_id === caseId)
  if (!session) return errorResponse('forbidden', 'This is not your case.')

  let loaded = await loadCase(admin, caseId)
  if (!loaded) return errorResponse('not_found', 'That case does not exist.')

  let summary = ''
  let inviteUrl: string | undefined

  switch (action.action) {
    case 'select_products': {
      const created = await createApplications(admin, loaded, action.products)
      loaded = (await loadCase(admin, caseId))!

      // §53 — count what each new application never had to ask for.
      let reused = 0
      for (const application of loaded.applications) {
        if (!created.includes(application.product)) continue
        reused += await recordReuse(admin, loaded, application, evaluateFor(loaded, application))
      }

      const names = created.map((product) => journeyFor(product).displayName)
      summary =
        created.length === 0
          ? 'Those were already started.'
          : `Started ${names.join(', ')}.` +
            (reused > 0 ? ` ${String(reused)} things carried over from what we already knew.` : '')
      break
    }

    case 'decline_product': {
      await admin
        .from('product_interests')
        .upsert(
          { case_id: caseId, product: action.product, status: 'declined' },
          { onConflict: 'case_id,product' },
        )
      await writeEvent(admin, {
        caseId,
        type: 'product_declined',
        actor: 'customer',
        payload: { product: action.product },
      })
      summary = 'Noted — I will not bring that up again.'
      break
    }

    case 'confirm_requirement': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // The requirement must actually belong to this journey; a confirmation for something
      // that is not asked for would satisfy nothing and should not be stored.
      const journey = journeyFor(application.product)
      const known = [
        ...journey.requirements,
        ...journey.branches.flatMap((branch) => branch.requirements),
      ].some((requirement) => requirement.id === action.requirementId)

      if (!known) return errorResponse('bad_request', 'That is not part of this application.')

      await admin.from('application_confirmations').upsert(
        {
          application_id: action.applicationId,
          requirement_id: action.requirementId,
          participant_id: session.participant_id,
          kind: 'confirmation',
        },
        { onConflict: 'application_id,requirement_id' },
      )
      summary = 'Confirmed.'
      break
    }

    case 'submit_application': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // The ticked confirmations land first, so the application can actually reach `ready`.
      // Each is checked against the journey, as `confirm_requirement` does.
      if (action.confirmations.length > 0) {
        const journey = journeyFor(application.product)
        const known = new Set(
          [
            ...journey.requirements,
            ...journey.branches.flatMap((branch) => branch.requirements),
          ].map((requirement) => requirement.id),
        )

        const unknown = action.confirmations.filter((id) => !known.has(id))
        if (unknown.length > 0) {
          return errorResponse('bad_request', 'Those are not part of this application.')
        }

        await admin.from('application_confirmations').upsert(
          action.confirmations.map((requirementId) => ({
            application_id: action.applicationId,
            requirement_id: requirementId,
            participant_id: session.participant_id,
            kind: 'confirmation',
          })),
          { onConflict: 'application_id,requirement_id' },
        )

        // Recompute so the application reaches `ready` before submission is attempted.
        loaded = (await loadCase(admin, caseId))!
        await recomputeApplications(admin, loaded)
        loaded = (await loadCase(admin, caseId))!
      }

      const current = findApplication(loaded, action.applicationId) ?? application

      // §48 — the state machine is the rule, not a condition written here.
      const result = transition(current, { type: 'submission_confirmed' })
      if (!result.ok) {
        return errorResponse(
          'illegal_transition',
          current.state === 'ready' ? result.error.message : 'That is not ready to submit yet.',
        )
      }

      await admin
        .from('applications')
        .update({ state: result.application.state, submitted_at: new Date().toISOString() })
        .eq('id', action.applicationId)

      await writeEvent(admin, {
        caseId,
        type: 'application_submitted',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { applicationName: journeyFor(application.product).displayName },
      })

      summary = `${journeyFor(application.product).displayName} submitted.`
      break
    }

    /**
     * §10, §37 — the customer decides what happens to the plan.
     *
     * The transition table refuses anything incoherent, so a completed plan cannot quietly
     * reactivate and an abandoned one cannot be paused. Nothing here infers intent: every
     * change came from a tap.
     */
    case 'decide_plan': {
      const row = await admin
        .from('plans')
        .select('id, status, title')
        .eq('id', action.planId)
        .eq('case_id', caseId)
        .maybeSingle()

      const current = row.data as { id: string; status: PlanStatus; title: string } | null
      if (!current) return errorResponse('not_found', 'There is no such plan.')

      const target: PlanStatus =
        action.decision === 'keep'
          ? 'active'
          : action.decision === 'not_now' || action.decision === 'abandon'
            ? 'abandoned'
            : action.decision === 'pause'
              ? 'paused'
              : 'active'

      if (!canTransition(current.status, target)) {
        return errorResponse('conflict', `That plan cannot move from ${current.status}.`)
      }

      const now = new Date().toISOString()
      await admin
        .from('plans')
        .update({
          status: target,
          ...(action.decision === 'keep' ? { confirmed_at: now, last_confirmed_at: now } : {}),
          ...(target === 'paused' ? { paused_at: now } : {}),
        })
        .eq('id', current.id)

      await writeEvent(admin, {
        caseId,
        type:
          action.decision === 'keep'
            ? 'plan_created'
            : action.decision === 'pause'
              ? 'plan_paused'
              : action.decision === 'resume'
                ? 'plan_resumed'
                : 'plan_abandoned',
        actor: 'customer',
        payload: { planId: current.id, title: current.title },
      })

      summary =
        action.decision === 'keep'
          ? `Kept "${current.title}" as a plan.`
          : action.decision === 'pause'
            ? `Paused "${current.title}".`
            : action.decision === 'resume'
              ? `Picked "${current.title}" back up.`
              : `Dropped "${current.title}".`
      break
    }

    case 'invite_partner': {
      const existing = loaded.participants.find((participant) => participant.role === 'partner')

      const partnerId =
        existing?.id ??
        ((
          await admin
            .from('participants')
            .insert({ case_id: caseId, role: 'partner', display_name: action.name })
            .select('id')
            .single()
        ).data as { id: string }).id

      if (existing) {
        await admin.from('participants').update({ display_name: action.name }).eq('id', partnerId)
      }

      // Opaque, hashed, single-use, and good for a day — longer than a handoff because the
      // customer has to pass it to someone else (§58, Invariant 8).
      const token = crypto.randomUUID().replaceAll('-', '')
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
      const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

      await admin.from('tokens').insert({
        case_id: caseId,
        kind: 'partner_invite',
        token_hash: hash,
        participant_id: partnerId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      await writeEvent(admin, {
        caseId,
        type: 'partner_invited',
        actor: 'customer',
        payload: { partnerName: action.name },
      })

      const base = (globalThis as any).Deno?.env?.get('APP_BASE_URL') ?? ''
      inviteUrl = `${base}/#/join/${token}`
      summary = `${action.name} can join with that link.`
      break
    }

    case 'grant_consent': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      const journey = journeyFor(application.product)
      const requirement = [
        ...journey.requirements,
        ...journey.branches.flatMap((branch) => branch.requirements),
      ].find((candidate) => candidate.id === action.requirementId)

      // Consent is only meaningful for something this journey actually asks consent for.
      if (!requirement || requirement.kind !== 'confirmation') {
        return errorResponse('bad_request', 'That is not something to consent to here.')
      }

      await admin.from('application_confirmations').upsert(
        {
          application_id: action.applicationId,
          requirement_id: action.requirementId,
          participant_id: session.participant_id,
          kind: 'consent',
        },
        { onConflict: 'application_id,requirement_id' },
      )

      // Recorded as a consent in its own right, not only as a satisfied requirement (§9).
      await admin.from('consents').upsert(
        {
          case_id: caseId,
          participant_id: session.participant_id,
          kind: 'health_questions',
          granted: true,
        },
        { onConflict: 'participant_id,kind' },
      )

      await writeEvent(admin, {
        caseId,
        type: 'consent_granted',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { requirementId: action.requirementId, kind: 'health_questions' },
      })

      summary = 'Thanks — noted.'
      break
    }

    case 'submit_health_form': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // Invariant 6, enforced at the only door special-category data can come through: the
      // consent must already be recorded for THIS application. Without it, nothing is written.
      const consented = loaded.confirmations.some(
        (confirmation) =>
          String(confirmation.applicationId) === action.applicationId &&
          confirmation.requirementId.includes('health-consent'),
      )

      if (!consented) {
        return errorResponse('forbidden', 'Health questions cannot be answered before consent.')
      }

      const rows: Record<string, unknown>[] = []
      const problems: string[] = []

      for (const entry of action.values) {
        if (!isFactKey(entry.key)) {
          problems.push(`${entry.key} is not something we collect.`)
          continue
        }

        // This form exists for special-category data. Anything else belongs elsewhere, and
        // accepting it here would route ordinary facts around the normal checks.
        if (factCatalogue[entry.key].sensitivity !== 'special') {
          problems.push(`${entry.key} does not belong on this form.`)
          continue
        }

        const parsed = parseFactValue(entry.key, entry.value)
        if (!parsed.ok) {
          problems.push(`${factCatalogue[entry.key].label}: ${parsed.issues.join('; ')}`)
          continue
        }

        rows.push({
          case_id: caseId,
          key: entry.key,
          participant_id: session.participant_id,
          subject_kind: 'participant',
          value: parsed.value,
          source: 'customer_stated',
          verified: false,
          captured_for: action.applicationId,
        })
      }

      if (problems.length > 0) {
        return errorResponse('bad_request', problems.join(' '))
      }

      await admin.from('facts').insert(rows as Insert<'facts'>[])
      await writeEvent(admin, {
        caseId,
        type: 'health_form_completed',
        actor: 'customer',
        applicationId: action.applicationId,
        // The keys answered, never the values: nothing sensitive goes in an event payload.
        payload: { answered: rows.length },
      })

      summary = 'Thanks, that is everything I needed from you on the health side.'
      break
    }

    case 'pause_application':
    case 'resume_application': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      const pausing = action.action === 'pause_application'
      const result = transition(application, { type: pausing ? 'paused' : 'resumed' })
      if (!result.ok) return errorResponse('illegal_transition', result.error.message)

      await admin
        .from('applications')
        .update({ state: result.application.state, resume_to: result.application.resumeTo })
        .eq('id', action.applicationId)

      await writeEvent(admin, {
        caseId,
        type: pausing ? 'application_paused' : 'application_resumed',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { applicationName: journeyFor(application.product).displayName },
      })

      summary = `${journeyFor(application.product).displayName} ${pausing ? 'paused' : 'resumed'}.`
      break
    }
  }

  // Recompute after every action: what is outstanding is derived, never remembered.
  loaded = (await loadCase(admin, caseId))!
  const applications = await recomputeApplications(admin, loaded)

  return json(
    ok({
      applications: [...applications],
      summary,
      ...(inviteUrl === undefined ? {} : { inviteUrl }),
    } satisfies CaseActionResponse),
    200,
  )
})

async function caseIdForApplication(
  admin: Db,
  applicationId: string,
): Promise<string | null> {
  const result = await admin
    .from('applications')
    .select('case_id')
    .eq('id', applicationId)
    .maybeSingle()
  return (result.data as { case_id?: string } | null)?.case_id ?? null
}
