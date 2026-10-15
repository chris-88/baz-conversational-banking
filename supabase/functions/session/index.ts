import { mustWrite } from '../_shared/db/case-repository.ts'
import { serveJson } from '../_shared/http/serve.ts'
// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../_shared/db/database.types.ts'
import type { Db } from '../_shared/db/case-repository.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { sessionRequestSchema, type SessionResponse } from '../_shared/contracts/session.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'
import { NARRATABLE_EVENTS } from '../_shared/db/digest.ts'
import { env } from '../_shared/env.ts'
import {
  landingFor,
  worthCarrying,
  type CaseSubstance,
} from '../_shared/domain/continuity.ts'

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


/**
 * §36 — did anything happen that is worth leading with?
 *
 * Imported rather than restated: see NARRATABLE_EVENTS.
 */
const NARRATABLE = NARRATABLE_EVENTS

serveJson(CORS, async (request: Request): Promise<Response> => {
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

  /** The conversation this browser was last in. Ordered, because there can now be several. */
  async function currentMapping(): Promise<
    { participantId: string; caseId: string; role: string } | null
  > {
    const existing = await admin
      .from('participant_sessions')
      .select('participant_id, last_used_at, participants!inner(id, case_id, role)')
      .eq('auth_user_id', authUserId)
      .order('last_used_at', { ascending: false })
      .limit(1)

    const found = (existing.data ?? [])[0] as any
    if (!found?.participants) return null
    return {
      participantId: found.participants.id,
      caseId: found.participants.case_id,
      role: found.participants.role,
    }
  }

  /**
   * Somebody who has signed in since they last called.
   *
   * Signing in attaches an address to the anonymous user that is already here, so the auth id
   * usually does not change and there is nothing to migrate — but the case still says
   * `anonymous` and the participant is still called nobody. This is where that catches up, on
   * the first call afterwards, rather than through an action the client has to remember to
   * send. When the id *did* change, `claim_participant` has already moved the participant and
   * this runs on the far side of it.
   *
   * The name goes on the participant rather than into `facts`: it is not something the customer
   * told Baz, and `identity.fullName` is a fact with a provenance that would be a lie here.
   */
  async function adoptIdentity(participantId: string, caseId: string): Promise<void> {
    const user = caller.data.user
    if (!user || user.is_anonymous === true) return

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
    const named = ['full_name', 'name']
      .map((key) => metadata[key])
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0)

    const theCase = await admin
      .from('cases')
      .select('auth_level')
      .eq('id', caseId)
      .maybeSingle()

    if ((theCase.data as { auth_level?: string } | null)?.auth_level !== 'authenticated') {
      mustWrite(
        await admin.from('cases').update({ auth_level: 'authenticated' }).eq('id', caseId),
        'the case',
      )
      /*
       * The provider as the token actually states it, rather than the one this function used
       * to name unconditionally. An events row is where §53 counts things from, so it should
       * say how somebody actually got in.
       */
      const provider = (user.app_metadata as Record<string, unknown> | null)?.['provider']
      await writeEventRow(admin, caseId, 'customer_signed_in', {
        provider: typeof provider === 'string' ? provider : 'unknown',
      })
    }

    if (named !== undefined) {
      const participant = await admin
        .from('participants')
        .select('display_name')
        .eq('id', participantId)
        .maybeSingle()

      if (!(participant.data as { display_name?: string | null } | null)?.display_name) {
        mustWrite(
          await admin
            .from('participants')
            .update({ display_name: named.trim() })
            .eq('id', participantId),
          'the participant',
        )
      }
    }

    /*
     * What signing in actually saves them typing.
     *
     * Baz offers this with "it would let me fill in your details rather than ask you to type
     * them", and that has to be true or it is a promise the next turn breaks. A name on the
     * participant record is how Baz greets somebody; a name in `facts` is what satisfies the
     * requirement every journey opens with.
     *
     * `system_derived`, because nobody stated it: it came from the account. Not `verified` —
     * confirming an address confirms the address, not that the person is who the name says,
     * and a bank reading `verified: true` would take it to mean something it does not.
     *
     * Never overwrites. Somebody who has already told Baz their name has told Baz their name,
     * and a name off an account is not grounds to correct them.
     */
    const existing = await admin
      .from('facts')
      .select('key')
      .eq('case_id', caseId)
      .in('key', ['identity.fullName', 'identity.email'])
      .is('superseded_by', null)

    const held = new Set(((existing.data ?? []) as { key: string }[]).map((row) => row.key))

    const rows: Record<string, unknown>[] = []
    if (named !== undefined && !held.has('identity.fullName')) {
      rows.push({
        case_id: caseId,
        key: 'identity.fullName',
        participant_id: participantId,
        subject_kind: 'participant',
        value: named.trim() as unknown as Json,
        source: 'system_derived',
        verified: false,
      })
    }
    if (user.email && !held.has('identity.email')) {
      rows.push({
        case_id: caseId,
        key: 'identity.email',
        participant_id: participantId,
        subject_kind: 'participant',
        value: user.email as unknown as Json,
        source: 'system_derived',
        verified: false,
      })
    }

    if (rows.length > 0) {
      mustWrite(await admin.from('facts').insert(rows as never), 'the signed-in details')
      for (const row of rows) {
        await writeEventRow(admin, caseId, 'context_captured', { key: row['key'] })
      }
    }
  }

  /** The response every action that lands on a conversation returns. */
  async function sessionFor(
    participantId: string,
    caseId: string,
    role: string,
    created: boolean,
  ): Promise<Response> {
    await adoptIdentity(participantId, caseId)

    const theCase = await admin
      .from('cases')
      .select('auth_level, customer_id')
      .eq('id', caseId)
      .maybeSingle()

    const participant = await admin
      .from('participants')
      .select('display_name')
      .eq('id', participantId)
      .maybeSingle()

    const signedInName = (participant.data as { display_name?: string | null } | null)?.display_name

    return json(
      ok({
        caseId,
        participantId,
        role: role === 'partner' ? 'partner' : 'primary',
        authLevel: theCase.data?.auth_level === 'authenticated' ? 'authenticated' : 'anonymous',
        customerFirstName: theCase.data?.customer_id
          ? canonicalCase.customer.firstName
          : (signedInName?.split(' ')[0] ?? null),
        created,
        hasUpdates: await updatesSince(caseId),
      } satisfies SessionResponse),
      200,
    )
  }

  /**
   * Whether this caller is running the demonstration.
   *
   * A key rather than nothing at all. The switcher lists every case in the system, which is
   * what a presenter needs and precisely what a stranger must not have: the conversations hold
   * what real people typed, which is the whole reason the data notice exists. Set
   * PRESENTER_KEY and the menu opens up on the device that has it; leave it unset and nobody
   * gets the wider list, including whoever guesses the parameter name.
   */
  function isPresenter(offered: string | undefined): boolean {
    const expected = (globalThis as any).Deno?.env?.get('PRESENTER_KEY') ?? ''
    return expected.length > 0 && offered === expected
  }

  if (parsed.data.action === 'list_cases') {
    const presenter = isPresenter(parsed.data.presenterKey)
    const current = await currentMapping()

    const mine = await admin
      .from('participant_sessions')
      .select('participants!inner(case_id)')
      .eq('auth_user_id', authUserId)

    const myCaseIds = new Set(
      ((mine.data ?? []) as any[]).map((row) => row.participants.case_id as string),
    )

    /*
     * `test` cases are left out on purpose. They are the ones automated probes create, they
     * are deleted without warning, and a switcher full of them is a switcher nobody can find
     * anything in.
     */
    const rows = presenter
      ? await admin
          .from('cases')
          .select('id, label, created_at, updated_at, kind')
          .neq('kind', 'test')
          .order('updated_at', { ascending: false })
          .limit(60)
      : await admin
          .from('cases')
          .select('id, label, created_at, updated_at, kind')
          .in('id', [...myCaseIds, '00000000-0000-4000-8000-000000000000'])
          .order('updated_at', { ascending: false })
          .limit(60)

    const cases = ((rows.data ?? []) as any[]).filter((row) => myCaseIds.has(row.id) || presenter)
    const ids = cases.map((row) => row.id as string)

    const [messages, applications] = await Promise.all([
      admin.from('messages').select('case_id, role, content, created_at').in('case_id', ids),
      admin.from('applications').select('case_id').in('case_id', ids),
    ])

    const summaries = cases.map((row) => {
      const theirs = ((messages.data ?? []) as any[]).filter((m) => m.case_id === row.id)
      const opening = theirs
        .filter((m) => m.role === 'customer')
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0]
      const latest = theirs
        .map((m) => String(m.created_at))
        .sort()
        .pop()

      return {
        caseId: row.id as string,
        label: (row.label as string | null) ?? null,
        opening: opening ? String(opening.content).slice(0, 120) : null,
        messages: theirs.length,
        applications: ((applications.data ?? []) as any[]).filter((a) => a.case_id === row.id)
          .length,
        lastActivityAt: latest ?? (row.updated_at as string | null) ?? null,
        current: row.id === current?.caseId,
        mine: myCaseIds.has(row.id),
      }
    })

    /*
     * A conversation nobody has spoken in is not a conversation.
     *
     * Every visit creates a case before anybody types, so most of them are empty and they sort
     * to the top by `updated_at` — the first build of this switcher listed forty-five rows,
     * forty-four of them saying "nothing said yet". The one you are in stays regardless, because
     * it is empty exactly when you have just started it.
     */
    const worthShowing = summaries.filter((row) => row.messages > 0 || row.current)

    return json(ok({ cases: worthShowing, presenter }), 200)
  }

  /**
   * The conversation follows the person across a change of auth user (§12, §28).
   *
   * The comment above `adoptIdentity` used to be the whole story: signing in attaches an
   * address to the user already here, the id never changes, nothing to migrate. That is true
   * of an address Supabase has not seen. It is false the moment the address already has an
   * account — Supabase cannot attach it twice, so the person is signed into the
   * account that exists, lands on a different `auth.uid()`, and the participant holding their
   * conversation is left behind on the anonymous user. It happened on a live case: thirteen
   * facts, a plan and a transcript, all still there, and an empty screen in front of the
   * person they belonged to.
   *
   * Two conditions make this safe to do on a bare id. The caller must have just become
   * somebody, because an anonymous caller claiming a conversation is how one visitor walks
   * into another's. And the conversation must still be held by an anonymous session: once an
   * account has claimed a participant it belongs to that account, and producing an old id does
   * not take it back.
   */
  if (parsed.data.action === 'claim_participant') {
    const prior = parsed.data.priorAuthUserId

    /*
     * The id did not change, so there is nothing to move.
     *
     * Answered rather than refused: the client cannot know in advance which of the two sign-in
     * shapes it got, and making it find out is how it ends up not asking.
     */
    if (prior === authUserId) {
      const here = await currentMapping()
      if (!here) return errorResponse('not_found', 'Nothing to carry over.')
      return await sessionFor(here.participantId, here.caseId, here.role, false)
    }

    if (caller.data.user.is_anonymous === true) {
      return errorResponse('forbidden', 'Sign in before carrying a conversation over.')
    }

    const was = await admin.auth.admin.getUserById(prior)
    if (was.error || !was.data.user || was.data.user.is_anonymous !== true) {
      return errorResponse('forbidden', 'That conversation is not available to carry over.')
    }

    const mapping = await admin
      .from('participant_sessions')
      .select('participant_id, last_used_at, participants!inner(id, case_id, role)')
      .eq('auth_user_id', prior)
      .order('last_used_at', { ascending: false })
      .limit(1)

    const held = (mapping.data ?? [])[0] as any
    if (!held?.participants) return errorResponse('not_found', 'Nothing to carry over.')

    /*
     * What this account already has, read before anything is attached to it.
     *
     * Order matters: attaching first would make every claim look like an account that already
     * had a conversation, and every returning customer would land on the empty case they
     * created by arriving.
     */
    const own = await admin
      .from('participant_sessions')
      .select('participant_id, last_used_at, participants!inner(id, case_id, role)')
      .eq('auth_user_id', authUserId)
      .order('last_used_at', { ascending: false })

    const mine = ((own.data ?? []) as any[]).find(
      (row) => row.participants.case_id !== held.participants.case_id,
    )

    const heldCase = held.participants.case_id as string

    const [messages, facts, applications, plans] = await Promise.all([
      admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', heldCase)
        .eq('role', 'customer'),
      admin
        .from('facts')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', heldCase)
        .is('superseded_by', null),
      admin.from('applications').select('id', { count: 'exact', head: true }).eq('case_id', heldCase),
      admin.from('plans').select('id', { count: 'exact', head: true }).eq('case_id', heldCase),
    ])

    const substance: CaseSubstance = {
      customerMessages: messages.count ?? 0,
      facts: facts.count ?? 0,
      applications: applications.count ?? 0,
      plans: plans.count ?? 0,
    }

    const landing = landingFor({ prior: substance, accountHasConversation: mine !== undefined })

    /*
     * Attached when it is worth keeping, and also whenever it is the one being opened: a case
     * on screen with no row mapping it to this user is a case that disappears again on the
     * next call, which is the bug this whole action exists to fix.
     */
    if (worthCarrying(substance) || landing.on === 'prior') {
      mustWrite(
        await admin.from('participant_sessions').upsert(
          {
            participant_id: held.participants.id,
            auth_user_id: authUserId,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: 'participant_id,auth_user_id' },
        ),
        'the session',
      )
    }

    /*
     * The anonymous row is left where it is. It costs nothing, and it is the only record that
     * these two auth users were the same person — which is the thing that was missing when a
     * case went missing.
     */
    if (landing.on === 'account' && mine !== undefined) {
      return await sessionFor(
        mine.participants.id,
        mine.participants.case_id,
        mine.participants.role,
        false,
      )
    }

    return await sessionFor(held.participants.id, heldCase, held.participants.role, false)
  }

  if (parsed.data.action === 'switch_case') {
    const target = parsed.data.caseId
    const presenter = isPresenter(parsed.data.presenterKey)

    /*
     * Already a participant, or holding the key. Nothing else opens a conversation, because
     * the id alone is not an authorisation — it travels in links and sits in the console.
     */
    const already = await admin
      .from('participant_sessions')
      .select('participant_id, participants!inner(id, case_id, role)')
      .eq('auth_user_id', authUserId)

    const existingHere = ((already.data ?? []) as any[]).find(
      (row) => row.participants.case_id === target,
    )

    if (!existingHere && !presenter) return errorResponse('forbidden', 'Not your conversation.')

    if (existingHere) {
      mustWrite(
        await admin
          .from('participant_sessions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('auth_user_id', authUserId)
          .eq('participant_id', existingHere.participants.id),
        'the session',
      )

      return await sessionFor(
        existingHere.participants.id,
        target,
        existingHere.participants.role,
        false,
      )
    }

    // The presenter adopts the conversation's own primary participant rather than joining as a
    // second person: they are driving it, not taking part in it.
    const primary = await admin
      .from('participants')
      .select('id, role')
      .eq('case_id', target)
      .eq('role', 'primary')
      .maybeSingle()

    if (!primary.data) return errorResponse('not_found', 'That conversation has no one in it.')

    mustWrite(
      await admin.from('participant_sessions').upsert(
        {
          participant_id: (primary.data as any).id,
          auth_user_id: authUserId,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'participant_id,auth_user_id' },
      ),
      'the session',
    )

    return await sessionFor((primary.data as any).id, target, 'primary', false)
  }

  const startMode = parsed.data.action === 'start' ? parsed.data.mode : parsed.data.mode

  // Already attached? Return the same case — this is what makes a PWA and a browser tab land
  // on the same conversation rather than starting two.
  const found = parsed.data.action === 'start' ? await currentMapping() : null
  if (found) {
    return await sessionFor(found.participantId, found.caseId, found.role, false)
  }

  /*
   * §47 — a ceiling on a burst, not on a lifetime.
   *
   * This counted every customer case ever created, so the fiftieth conversation the product
   * ever had was the last one it would have until somebody purged. That is not what the cap is
   * for: it exists so a room full of people cannot exhaust the project in an afternoon, and a
   * room full of people is a rate, not a total.
   *
   * A day's window keeps the protection and cannot accumulate into a wall.
   */
  const maxCases = Number((globalThis as any).Deno?.env?.get('AUDIENCE_MAX_CASES') ?? '50')
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const openCases = await admin
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'customer')
    .gte('created_at', since)

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

  mustWrite(
    await admin
      .from('participant_sessions')
      .insert({ participant_id: participant.data.id, auth_user_id: authUserId }),
    'the session',
  )

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

    mustWrite(
      await admin
        .from('cases')
        .update({
          auth_level: 'authenticated',
          customer_id: (customer.data as { id?: string } | null)?.id ?? null,
          label: 'Audience · demo customer',
        })
        .eq('id', created.data.id),
      'the case',
    )

    mustWrite(
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
      ),
      'the facts',
    )
  }

  mustWrite(
    await admin.from('events').insert({
      case_id: created.data.id,
      type: 'case_created',
      actor: 'system',
      payload: { mode: startMode },
    }),
    'the event',
  )

  /*
   * Through the same responder as every other path, so a case created by somebody who is
   * already signed in is marked authenticated and carries their name.
   *
   * It used to build its own reply here and skip `adoptIdentity` entirely, which is how a
   * signed-in customer ended up on a case still recorded as anonymous with no name on it: the
   * one branch that could not benefit from signing in was the branch somebody signing in for
   * the first time on a new device actually takes.
   */
  return await sessionFor(participant.data.id, created.data.id, 'primary', true)
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
  mustWrite(
    await admin
      .from('events')
      .insert({ case_id: caseId, type, actor: 'customer', payload: payload as Json }),
    'the event',
  )
}
