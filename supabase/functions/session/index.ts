// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../_shared/db/database.types.ts'
import type { Db } from '../_shared/db/case-repository.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { sessionRequestSchema, type SessionResponse } from '../_shared/contracts/session.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'
import { NARRATABLE_EVENTS } from '../_shared/db/digest.ts'

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

/**
 * §36 — did anything happen that is worth leading with?
 *
 * Imported rather than restated: see NARRATABLE_EVENTS.
 */
const NARRATABLE = NARRATABLE_EVENTS

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

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'No session.')
  const authUserId = caller.data.user.id

  async function updatesSince(caseId: string): Promise<boolean> {
    const theCase = await admin.from('cases').select('last_seen_at').eq('id', caseId).maybeSingle()
    const lastSeen = (theCase.data as { last_seen_at?: string | null } | null)?.last_seen_at
    if (!lastSeen) return false

    const since = await admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .in('type', NARRATABLE as unknown as string[])
      .gt('created_at', lastSeen)

    return (since.count ?? 0) > 0
  }

  /**
   * The handoff used to live here: a single-use code that carried a public conversation into the
   * app behind a simulated login. There is no app behind a login any more — Baz is the same
   * screen in a browser tab and on a home screen — so the code, its token row and the
   * authenticated case it produced have all gone with it.
   */

  const startMode = parsed.data.mode

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
        authLevel: theCase.data?.auth_level === 'authenticated' ? 'authenticated' : 'anonymous',
        customerFirstName: theCase.data?.customer_id ? canonicalCase.customer.firstName : null,
        created: false,
        hasUpdates: await updatesSince(found.participants.case_id),
      } satisfies SessionResponse),
      200,
    )
  }

  // §47 — a hard ceiling, so a room full of people cannot exhaust the project. Configured
  // rather than hard-coded.
  const maxCases = Number((globalThis as any).Deno?.env?.get('AUDIENCE_MAX_CASES') ?? '50')
  const openCases = await admin
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'customer')

  if ((openCases.count ?? 0) >= maxCases) {
    return errorResponse(
      'rate_limited',
      'The demonstration is at capacity right now. Try again in a few minutes.',
    )
  }

  /**
   * A case of their own, which knows nothing about them yet.
   *
   * Everyone gets one — there is no rehearsed case to join. The bank learns who somebody is
   * when they sign in, which is the same thing that happens to a real customer and the reason
   * the reuse story lands at all.
   */
  const created = await admin
    .from('cases')
    .insert({ kind: 'customer', auth_level: 'anonymous', label: null })
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

  /**
   * `known` starts them as somebody the bank already deals with: signed in, with the details
   * it holds already loaded. Not a demonstration shortcut — it is the difference between a new
   * customer and an existing one, and the existing one is where §53 has anything to show.
   */
  if (startMode === 'known') {
    const customer = await admin
      .from('customers')
      .select('id')
      .eq('bank_reference', canonicalCase.customer.bankReference)
      .maybeSingle()

    await admin
      .from('cases')
      .update({
        auth_level: 'authenticated',
        customer_id: (customer.data as { id?: string } | null)?.id ?? null,
        label: 'Audience · demo customer',
      })
      .eq('id', created.data.id)

    await admin.from('facts').insert(
      canonicalCase.bankHeldFacts.map((fact) => ({
        case_id: created.data.id,
        key: fact.key,
        participant_id: fact.subject === 'household' ? null : participant.data.id,
        subject_kind: fact.subject === 'household' ? 'household' : 'participant',
        value: fact.value as Json,
        source: fact.source,
        verified: fact.verified,
      })),
    )
  }

  await admin.from('events').insert({
    case_id: created.data.id,
    type: 'case_created',
    actor: 'system',
    payload: { mode: startMode },
  })

  return json(
    ok({
      caseId: created.data.id,
      participantId: participant.data.id,
      role: 'primary',
      authLevel: startMode === 'known' ? 'authenticated' : 'anonymous',
      customerFirstName: startMode === 'known' ? canonicalCase.customer.firstName : null,
      created: true,
      hasUpdates: false,
    } satisfies SessionResponse),
    200,
  )
})

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function writeEventRow(
  admin: Db,
  caseId: string,
  type: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await admin
    .from('events')
    .insert({ case_id: caseId, type, actor: 'customer', payload: payload as Json })
}
