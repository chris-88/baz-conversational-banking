// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { sessionRequestSchema, type SessionResponse } from '../_shared/contracts/session.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'

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

  const parsed = sessionRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('bad_request', 'Unrecognised request.')

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'No session.')
  const authUserId = caller.data.user.id

  // ---- Handoff (§29, §58) --------------------------------------------------
  if (parsed.data.action === 'create_handoff') {
    const attached = await admin
      .from('participant_sessions')
      .select('participant_id, participants!inner(case_id)')
      .eq('auth_user_id', authUserId)
      .limit(1)

    const row = (attached.data ?? [])[0] as any
    if (!row) return errorResponse('not_found', 'There is no conversation to carry over.')

    // 128 bits of randomness, stored only as a hash, valid for ten minutes, single use.
    const code = crypto.randomUUID().replaceAll('-', '')
    const hash = await sha256(code)

    await admin.from('tokens').insert({
      case_id: row.participants.case_id,
      kind: 'handoff',
      token_hash: hash,
      participant_id: row.participant_id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    await writeEventRow(admin, row.participants.case_id, 'handoff_created')
    return json(ok({ code }), 200)
  }

  if (parsed.data.action === 'redeem_handoff') {
    const hash = await sha256(parsed.data.code)
    const found = await admin
      .from('tokens')
      .select('id, case_id, participant_id, expires_at, consumed_at')
      .eq('token_hash', hash)
      .eq('kind', 'handoff')
      .maybeSingle()

    const token = found.data as any
    // One check per failure mode, and the same answer for all of them: a caller learns
    // nothing about which part was wrong.
    if (!token || token.consumed_at || new Date(token.expires_at) < new Date()) {
      return errorResponse('not_found', 'That link has expired. Start again from the website.')
    }

    await admin.from('tokens').update({ consumed_at: new Date().toISOString() }).eq('id', token.id)

    // The new session joins the SAME participant, which is what makes the conversation
    // continue rather than restart (§12, §29).
    await admin
      .from('participant_sessions')
      .upsert(
        { participant_id: token.participant_id, auth_user_id: authUserId },
        { onConflict: 'participant_id,auth_user_id' },
      )

    // §6 Stage 5 — signing in is what links the case to the customer the bank already knows,
    // and loads what it holds.
    const customer = await admin
      .from('customers')
      .select('id')
      .eq('bank_reference', canonicalCase.customer.bankReference)
      .maybeSingle()

    const customerId = (customer.data as { id?: string } | null)?.id ?? null

    await admin
      .from('cases')
      .update({ auth_level: 'authenticated', customer_id: customerId })
      .eq('id', token.case_id)

    const existing = await admin.from('facts').select('key').eq('case_id', token.case_id)
    const known = new Set(((existing.data ?? []) as { key: string }[]).map((f) => f.key))

    const toLoad = canonicalCase.bankHeldFacts.filter((fact) => !known.has(fact.key))
    if (toLoad.length > 0) {
      await admin.from('facts').insert(
        toLoad.map((fact) => ({
          case_id: token.case_id,
          key: fact.key,
          participant_id: fact.subject === 'household' ? null : token.participant_id,
          subject_kind: fact.subject === 'household' ? 'household' : 'participant',
          value: fact.value,
          source: fact.source,
          verified: fact.verified,
        })),
      )
    }

    await writeEventRow(admin, token.case_id, 'customer_authenticated', { loaded: toLoad.length })

    return json(
      ok({
        caseId: token.case_id,
        participantId: token.participant_id,
        role: 'primary',
        authLevel: 'authenticated',
        customerFirstName: canonicalCase.customer.firstName,
        created: false,
      } satisfies SessionResponse),
      200,
    )
  }

  const startMode = parsed.data.action === 'start' ? parsed.data.mode : 'fresh'

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
        customerFirstName: theCase.data?.customer_id ? canonicalCase.customer.firstName : null,
        created: false,
      } satisfies SessionResponse),
      200,
    )
  }

  if (startMode === 'demo') {
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
        customerFirstName: participant.cases.customer_id ? canonicalCase.customer.firstName : null,
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

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function writeEventRow(
  admin: ReturnType<typeof createClient>,
  caseId: string,
  type: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await admin.from('events').insert({ case_id: caseId, type, actor: 'customer', payload })
}
