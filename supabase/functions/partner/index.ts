// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  partnerRequestSchema,
  type PartnerTask,
  type PartnerView,
} from '../_shared/contracts/partner.ts'
import { factCatalogue, isFactKey, parseFactValue } from '../_shared/domain/facts.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { stateLabel } from '../_shared/domain/state-machine.ts'
import { loadCase, writeEvent, type Db, type Insert } from '../_shared/db/case-repository.ts'
import { evaluateFor, recomputeApplications } from '../_shared/db/applications.ts'
import type { LoadedCase } from '../_shared/db/loaded-case.ts'

/**
 * The partner's own surface (§6 Stage 9, §33, Invariant 7).
 *
 * A partner never reads a table. This returns scoped DTOs only: their own tasks, and the names
 * and states of applications they are party to. The primary's conversation and facts are never
 * in scope here, which is why none of this goes through RLS — it goes through code that cannot
 * accidentally widen.
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

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Prettifies a catalogue enum value for a human: `employed_full_time` → `Employed full time`. */
function prettify(value: string): string {
  const spaced = value.replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Every partner requirement, grouped so one answer covers every application that needs it.
 * The grouping key is the fact itself, which is exactly why answering once is enough.
 *
 * Satisfied requirements are included and marked done rather than dropped, so the partner can
 * see what they have already finished instead of watching rows disappear.
 */
function buildTasks(loaded: LoadedCase, partnerId: string): readonly PartnerTask[] {
  const byKey = new Map<string, PartnerTask>()

  for (const application of loaded.applications) {
    const journey = journeyFor(application.product)
    const evaluation = evaluateFor(loaded, application)

    const items = [
      ...evaluation.outstanding
        .filter((item) => item.blocking && item.waitingOn === 'partner')
        .map((item) => ({ requirement: item.requirement, done: false })),
      ...evaluation.satisfied
        .filter((item) => item.requirement.subject === 'partner')
        .map((item) => ({ requirement: item.requirement, done: true })),
    ]

    for (const entry of items) {
      const requirement = entry.requirement
      const key =
        requirement.kind === 'fact' ? `fact:${requirement.fact}` : `req:${requirement.id}`

      const existing = byKey.get(key)
      if (existing) {
        byKey.set(key, {
          ...existing,
          appliesTo: existing.appliesTo.includes(journey.displayName)
            ? existing.appliesTo
            : [...existing.appliesTo, journey.displayName],
          done: existing.done || entry.done,
        })
        continue
      }

      // Enum facts become a chooser. Asking a person to type `employed_full_time` is how a
      // form ends up rejecting perfectly reasonable answers.
      const schema =
        requirement.kind === 'fact'
          ? (factCatalogue[requirement.fact].schema as {
              _def?: { type?: string; entries?: Record<string, string> }
            })
          : undefined

      const enumValues =
        schema?._def?.type === 'enum' ? Object.values(schema._def.entries ?? {}) : []

      const inputKind = ((): PartnerTask['inputKind'] => {
        if (requirement.kind !== 'fact') return 'none'
        if (enumValues.length > 0) return 'select'
        if (schema?._def?.type === 'boolean') return 'boolean'
        if (schema?._def?.type === 'number') return 'number'
        if (requirement.fact.includes('dateOf') || requirement.fact.includes('startDate')) {
          return 'date'
        }
        return 'text'
      })()

      byKey.set(key, {
        id: key,
        kind: requirement.kind === 'fact' ? 'fact' : requirement.kind === 'document' ? 'document' : 'declaration',
        // Said to the partner directly, so the primary's phrasing ("your partner's…") is wrong.
        label: requirement.label.replace(/^Your partner['’]s /i, 'Your ').replace(/^Does your partner /i, 'Do you '),
        inputKind,
        ...(enumValues.length > 0
          ? { options: enumValues.map((value) => ({ value, label: prettify(value) })) }
          : {}),
        appliesTo: [journey.displayName],
        done: entry.done,
      })
    }
  }

  // A fact the partner has given is done even if the journey still wants it confirmed.
  for (const fact of loaded.facts) {
    if (String(fact.subject) !== partnerId || fact.supersededBy !== null) continue
    const existing = byKey.get(`fact:${fact.key}`)
    if (existing) byKey.set(`fact:${fact.key}`, { ...existing, done: true })
  }

  // Outstanding first: the partner should open this and see what is left, not scroll past
  // what they have finished.
  return [...byKey.values()].sort((a, b) => Number(a.done) - Number(b.done))
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
    return errorResponse('bad_request', 'Body must be JSON.')
  }

  const parsed = partnerRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('bad_request', 'Unrecognised request.')

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'No session.')
  const authUserId = caller.data.user.id

  // ---- Join -------------------------------------------------------------
  if (parsed.data.action === 'join') {
    const hash = await sha256(parsed.data.token)
    const found = await admin
      .from('tokens')
      .select('id, case_id, participant_id, expires_at, consumed_at')
      .eq('token_hash', hash)
      .eq('kind', 'partner_invite')
      .maybeSingle()

    const token = found.data as any
    if (!token || token.consumed_at || new Date(token.expires_at) < new Date()) {
      return errorResponse('not_found', 'That invitation has expired. Ask for a new one.')
    }

    await admin.from('tokens').update({ consumed_at: new Date().toISOString() }).eq('id', token.id)
    await admin
      .from('participant_sessions')
      .upsert(
        { participant_id: token.participant_id, auth_user_id: authUserId },
        { onConflict: 'participant_id,auth_user_id' },
      )

    await writeEvent(admin, {
      caseId: token.case_id,
      type: 'partner_joined',
      actor: 'partner',
      payload: {},
    })
  }

  // ---- Everything else needs an existing partner session ----------------
  const sessions = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(id, case_id, role, display_name)')
    .eq('auth_user_id', authUserId)
    .limit(10)

  const partnerSession = (sessions.data ?? []).find(
    (row: any) => row.participants?.role === 'partner',
  ) as any

  if (!partnerSession) return errorResponse('forbidden', 'This is not your invitation.')

  const caseId = partnerSession.participants.case_id
  const partnerId = partnerSession.participant_id

  let loaded = await loadCase(admin, caseId)
  if (!loaded) return errorResponse('not_found', 'That case no longer exists.')

  if (parsed.data.action === 'submit') {
    const rows: Record<string, unknown>[] = []
    const problems: string[] = []

    for (const answer of parsed.data.answers) {
      if (!answer.id.startsWith('fact:')) continue
      const key = answer.id.slice('fact:'.length)

      if (!isFactKey(key)) {
        problems.push(`${key} is not something we collect.`)
        continue
      }
      // A partner cannot be asked for special-category data this way either (Invariant 6).
      if (factCatalogue[key].sensitivity === 'special') {
        problems.push(`${factCatalogue[key].label} is collected through its own form.`)
        continue
      }

      const value = parseFactValue(key, answer.value)
      if (!value.ok) {
        problems.push(`${factCatalogue[key].label}: ${value.issues.join('; ')}`)
        continue
      }

      rows.push({
        case_id: caseId,
        key,
        participant_id: partnerId,
        subject_kind: factCatalogue[key].subject === 'household' ? 'household' : 'participant',
        value: value.value,
        // §10 — provenance records that the partner said this, not the customer.
        source: 'partner_stated',
        verified: false,
      })
    }

    if (problems.length > 0) return errorResponse('bad_request', problems.join(' '))
    if (rows.length > 0) await admin.from('facts').insert(rows as Insert<'facts'>[])

    await writeEvent(admin, {
      caseId,
      type: 'partner_completed',
      actor: 'partner',
      payload: {
        answered: rows.length,
        partnerName: partnerSession.participants.display_name ?? 'Your partner',
      },
    })

    // One partner answer can complete several applications at once (§6 Stage 9).
    loaded = (await loadCase(admin, caseId))!
    await recomputeApplications(admin, loaded)
    loaded = (await loadCase(admin, caseId))!
  }

  const primary = loaded.participants.find((participant) => participant.role === 'primary')

  const view: PartnerView = {
    partnerName: partnerSession.participants.display_name,
    invitedBy: primary?.displayName ?? null,
    // Names and states only. Never the primary's facts, and never their conversation (§33).
    applications: loaded.applications
      .filter((application) => journeyFor(application.product).supportsPartner)
      .map((application) => ({
        displayName: journeyFor(application.product).displayName,
        stateLabel: stateLabel(application.state),
        waitingOnYou: evaluateFor(loaded as LoadedCase, application).waitingOn === 'partner',
      })),
    tasks: [...buildTasks(loaded, partnerId)],
  }

  return json(ok(view), 200)
})
