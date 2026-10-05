// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  caseActionRequestSchema,
  type CaseActionResponse,
} from '../_shared/contracts/case-action.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { transition } from '../_shared/domain/state-machine.ts'
import { loadCase, writeEvent } from '../_shared/db/case-repository.ts'
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

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
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

      // §48 — the state machine is the rule, not a condition written here.
      const result = transition(application, { type: 'submission_confirmed' })
      if (!result.ok) {
        return errorResponse(
          'illegal_transition',
          application.state === 'ready'
            ? result.error.message
            : 'That is not ready to submit yet.',
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

  return json(ok({ applications, summary } satisfies CaseActionResponse), 200)
})

async function caseIdForApplication(
  admin: ReturnType<typeof createClient>,
  applicationId: string,
): Promise<string | null> {
  const result = await admin
    .from('applications')
    .select('case_id')
    .eq('id', applicationId)
    .maybeSingle()
  return (result.data as { case_id?: string } | null)?.case_id ?? null
}
