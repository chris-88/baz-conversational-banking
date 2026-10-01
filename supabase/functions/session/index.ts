// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { sessionStartRequestSchema, type SessionResponse } from '../_shared/contracts/session.ts'
import { canonicalCustomer } from '../_shared/domain/seed/canonical.ts'

/**
 * Attaches an anonymous visitor to a case (§12, §28).
 *
 * Identity comes from the caller's JWT, never from the body, and the mapping lives in
 * `participant_sessions` so one participant can span several auth users.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

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
  if (!authorization) return errorResponse('unauthorised', 'No session.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const parsed = sessionStartRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('bad_request', 'Unrecognised request.')

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'No session.')
  const authUserId = caller.data.user.id

  // Already attached? Return the same case — this is what makes a PWA and a browser tab land
  // on the same conversation rather than starting two.
  const existing = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(id, case_id, role)')
    .eq('auth_user_id', authUserId)
    .limit(1)

  const found = (existing.data ?? [])[0] as any
  if (found?.participants) {
    const theCase = await admin
      .from('cases')
      .select('auth_level, customer_id')
      .eq('id', found.participants.case_id)
      .maybeSingle()

    return json(
      ok({
        caseId: found.participants.case_id,
        participantId: found.participants.id,
        role: found.participants.role,
        authLevel: theCase.data?.auth_level ?? 'anonymous',
        customerFirstName: theCase.data?.customer_id ? canonicalCustomer.firstName : null,
        created: false,
      } satisfies SessionResponse),
      200,
    )
  }

  if (parsed.data.mode === 'demo') {
    const presenter = await admin
      .from('participants')
      .select('id, case_id, cases!inner(kind, auth_level, customer_id)')
      .eq('role', 'primary')
      .eq('cases.kind', 'presenter')
      .limit(1)

    const participant = (presenter.data ?? [])[0] as any
    if (!participant) {
      return errorResponse('not_found', 'The demonstration case has not been seeded yet.')
    }

    await admin
      .from('participant_sessions')
      .insert({ participant_id: participant.id, auth_user_id: authUserId })

    return json(
      ok({
        caseId: participant.case_id,
        participantId: participant.id,
        role: 'primary',
        authLevel: participant.cases.auth_level,
        customerFirstName: participant.cases.customer_id ? canonicalCustomer.firstName : null,
        created: false,
      } satisfies SessionResponse),
      200,
    )
  }

  // A fresh case knows nothing about the visitor (§46 "start fresh").
  const created = await admin
    .from('cases')
    .insert({ kind: 'audience', auth_level: 'anonymous', label: 'Audience case' })
    .select('id')
    .single()

  if (created.error || !created.data) return errorResponse('internal', 'Could not start a case.')

  const participant = await admin
    .from('participants')
    .insert({ case_id: created.data.id, role: 'primary' })
    .select('id')
    .single()

  if (participant.error || !participant.data) {
    return errorResponse('internal', 'Could not start a case.')
  }

  await admin
    .from('participant_sessions')
    .insert({ participant_id: participant.data.id, auth_user_id: authUserId })

  await admin.from('events').insert({
    case_id: created.data.id,
    type: 'case_created',
    actor: 'system',
    payload: { mode: 'fresh' },
  })

  return json(
    ok({
      caseId: created.data.id,
      participantId: participant.data.id,
      role: 'primary',
      authLevel: 'anonymous',
      customerFirstName: null,
      created: true,
    } satisfies SessionResponse),
    200,
  )
})
