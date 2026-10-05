import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types.ts'

/**
 * The service-role client these helpers take, typed against the real schema.
 *
 * Generated from the linked project with `npm run db:types`. Untyped, every insert resolved
 * to `never` and every column name was a guess — which is how a call to a function that does
 * not exist, and a write naming a column that does not exist, both deployed cleanly. Nobody
 * saw either because the Edge Functions were never typechecked at all.
 */
export type Db = SupabaseClient<Database>

/** A row as the database wants it written, so a column typo is a compile error. */
export type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

import {
  asApplicationId,
  asFactId,
  asParticipantId,
  factCatalogue,
  parseFactValue,
  type Fact,
  type FactKey,
  type FactSource,
  type ParticipantRole,
} from '../domain/facts.ts'
import type { Application } from '../domain/state-machine.ts'
import { slidersFor, type PersonaSliders } from '../llm/persona.ts'
import type { LoadedCase } from './loaded-case.ts'
import * as rows from './rows.ts'

/**
 * Reads and writes for a turn. Takes the client rather than creating one, and touches no Deno
 * API, so it compiles and tests under Node as well as Deno.
 *
 * Every write here runs with the service role, which is why the schema has no client write
 * policies at all (Invariant 2).
 */

const MESSAGE_WINDOW = 24

type Query = { data: unknown; error: { message: string } | null }

function unwrap(result: Query, what: string): unknown {
  if (result.error) throw new Error(`Failed to load ${what}: ${result.error.message}`)
  return result.data
}

export async function loadCase(client: Db, caseId: string): Promise<LoadedCase | null> {
  const caseResult = (await client
    .from('cases')
    .select('id, kind, auth_level, last_seen_at, customer_id')
    .eq('id', caseId)
    .maybeSingle()) as Query

  const caseData = unwrap(caseResult, 'the case')
  if (caseData === null) return null
  const theCase = rows.caseRow.parse(caseData)

  const [
    participantsData,
    factsData,
    applicationsData,
    confirmationsData,
    documentsData,
    requestsData,
    interestsData,
    messagesData,
    personaData,
    domainData,
  ] = await Promise.all([
    client.from('participants').select('id, role, display_name').eq('case_id', caseId),
    client
      .from('facts')
      .select('id, key, participant_id, subject_kind, value, source, verified, captured_for, superseded_by, captured_at')
      .eq('case_id', caseId),
    client.from('applications').select('id, product, state, resume_to').eq('case_id', caseId),
    client.from('application_confirmations').select('application_id, requirement_id'),
    client.from('documents').select('application_id, requirement_id, verified').eq('case_id', caseId),
    client.from('application_requests').select('id, application_id, requirement_id, status, detail'),
    client.from('product_interests').select('product, status, reason').eq('case_id', caseId),
    client
      .from('messages')
      .select('role, content, cards')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(MESSAGE_WINDOW),
    client.from('persona_config').select('preset, sliders').eq('scope', 'global').maybeSingle(),
    client.from('domain_config').select('kill_switch').eq('scope', 'global').maybeSingle(),
  ])

  const customerName = await loadCustomerName(client, theCase.customer_id)

  const participants = rows.participantRow
    .array()
    .parse(unwrap(participantsData as Query, 'participants'))
    .map((row) => ({
      id: asParticipantId(row.id),
      role: row.role satisfies ParticipantRole,
      displayName: row.display_name,
    }))

  const facts: Fact[] = rows.factRow
    .array()
    .parse(unwrap(factsData as Query, 'facts'))
    .map((row) => ({
      id: asFactId(row.id),
      key: row.key,
      subject: row.subject_kind === 'household' ? 'household' : asParticipantId(row.participant_id ?? ''),
      value: row.value,
      source: row.source satisfies FactSource,
      verified: row.verified,
      capturedFor: row.captured_for === null ? null : asApplicationId(row.captured_for),
      supersededBy: row.superseded_by === null ? null : asFactId(row.superseded_by),
      capturedAt: row.captured_at,
    }))

  const applications: Application[] = rows.applicationRow
    .array()
    .parse(unwrap(applicationsData as Query, 'applications'))
    .map((row) => ({
      id: asApplicationId(row.id),
      product: row.product,
      state: row.state,
      resumeTo: row.resume_to,
    }))

  const applicationIds = new Set(applications.map((application) => String(application.id)))

  const persona = parsePersona(unwrap(personaData, 'persona'))
  const domainConfig = unwrap(domainData, 'domain config')

  const eventsSinceLastSeen = await loadEventsSince(client, caseId, theCase.last_seen_at)

  return {
    caseId: theCase.id,
    kind: theCase.kind,
    authLevel: theCase.auth_level,
    customerName,
    lastSeenAt: theCase.last_seen_at,
    participants,
    facts,
    applications,
    // Confirmations and requests are not scoped by case in the query, so they are filtered
    // to this case's applications here.
    confirmations: rows.confirmationRow
      .array()
      .parse(unwrap(confirmationsData as Query, 'confirmations'))
      .filter((row) => applicationIds.has(row.application_id))
      .map((row) => ({
        applicationId: asApplicationId(row.application_id),
        requirementId: row.requirement_id,
      })),
    documents: rows.documentRow
      .array()
      .parse(unwrap(documentsData as Query, 'documents'))
      .filter((row) => row.application_id !== null && row.requirement_id !== null)
      .map((row) => ({
        applicationId: asApplicationId(row.application_id ?? ''),
        requirementId: row.requirement_id ?? '',
        verified: row.verified,
      })),
    requests: rows.requestRow
      .array()
      .parse(unwrap(requestsData as Query, 'requests'))
      .filter((row) => applicationIds.has(row.application_id))
      .map((row) => ({
        id: row.id,
        applicationId: asApplicationId(row.application_id),
        requirementId: row.requirement_id,
        status: row.status,
        detail: row.detail,
      })),
    productInterests: rows.productInterestRow
      .array()
      .parse(unwrap(interestsData, 'product interests')),
    // Fetched newest-first for the limit, then reversed so the model reads them in order.
    messages: rows.messageRow
      .array()
      .parse(unwrap(messagesData, 'messages'))
      .reverse(),
    eventsSinceLastSeen,
    persona,
    killSwitch: domainConfig === null ? false : rows.domainConfigRow.parse(domainConfig).kill_switch,
  }
}

async function loadCustomerName(client: Db, customerId: string | null): Promise<string | null> {
  if (customerId === null) return null
  const result = (await client
    .from('customers')
    .select('full_name')
    .eq('id', customerId)
    .maybeSingle()) as Query
  const data = unwrap(result, 'the customer')
  if (data === null) return null
  return rows.customerRow.parse(data).full_name.split(' ')[0] ?? null
}

async function loadEventsSince(
  client: Db,
  caseId: string,
  since: string | null,
): Promise<LoadedCase['eventsSinceLastSeen']> {
  if (since === null) return []

  const result = (await client
    .from('events')
    .select('type, created_at, payload')
    .eq('case_id', caseId)
    .gt('created_at', since)
    .order('created_at', { ascending: true })) as Query

  return rows.eventRow
    .array()
    .parse(unwrap(result, 'events'))
    .map((row) => ({ type: row.type, createdAt: row.created_at, payload: row.payload ?? {} }))
}

function parsePersona(data: unknown): PersonaSliders {
  if (data === null) return slidersFor('default')
  const parsed = rows.personaRow.safeParse(data)
  // A malformed persona row must never stop a turn: style is the least important thing here.
  return parsed.success ? parsed.data.sliders : slidersFor('default')
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function saveMessage(
  client: Db,
  message: {
    caseId: string
    participantId: string | null
    role: 'customer' | 'baz' | 'system'
    content: string
    gateCategory?: string | null
    /** Rendered alongside this turn, so a reload restores the whole thing. */
    cards?: readonly unknown[]
  },
): Promise<string> {
  const result = (await client
    .from('messages')
    .insert({
      case_id: message.caseId,
      participant_id: message.participantId,
      role: message.role,
      content: message.content,
      gate_category: message.gateCategory ?? null,
      cards: (message.cards ?? []) as Json,
    })
    .select('id')
    .single()) as Query

  const data = unwrap(result, 'the saved message')
  return z_id(data)
}

export async function writeEvent(
  client: Db,
  event: {
    caseId: string
    type: string
    actor: 'customer' | 'partner' | 'model' | 'admin' | 'system'
    applicationId?: string | null
    payload?: Record<string, unknown>
  },
): Promise<void> {
  const result = (await client.from('events').insert({
    case_id: event.caseId,
    type: event.type,
    actor: event.actor,
    application_id: event.applicationId ?? null,
    payload: (event.payload ?? {}) as Json,
  })) as Query
  unwrap(result, 'the event')
}

export type FactWrite = {
  readonly key: FactKey
  /** Only meaningful for person-level keys. Defaults to the primary customer. */
  readonly subject?: 'primary' | 'partner' | undefined
  readonly value: unknown
}

export type FactWriteOutcome = {
  readonly accepted: readonly FactKey[]
  readonly rejected: readonly { readonly key: string; readonly reason: string }[]
}

/**
 * Writes facts the model extracted from conversation.
 *
 * Three checks, all server-side and none of them the model's to skip: the key must be in the
 * catalogue, the catalogue must mark it extractable (Invariant 6), and the value must satisfy
 * the key's schema. A rejection is returned to the model as a tool error, never shown to the
 * customer.
 *
 * Whether a fact is household-level or personal comes from the catalogue, not from the model.
 * Asking the model to classify it lost facts: it would send a household key under `primary`
 * and the write would be refused for a reason the customer never caused.
 */
export async function recordFacts(
  client: Db,
  input: {
    caseId: string
    facts: readonly FactWrite[]
    participants: Readonly<Record<'primary' | 'partner', string | null>>
    /**
     * Widened from the two conversational sources so the console can write a bank-held
     * figure through the same door. Hand-rolled inserts got the household/participant pairing
     * wrong and were rejected by the schema silently; one writer that reads the catalogue is
     * the fix.
     */
    source: FactSource
    capturedFor?: string | null
  },
): Promise<FactWriteOutcome> {
  const accepted: FactKey[] = []
  const rejected: { key: string; reason: string }[] = []
  const inserts: Insert<'facts'>[] = []

  for (const fact of input.facts) {
    const definition = factCatalogue[fact.key]

    if (!definition.extractable) {
      rejected.push({
        key: fact.key,
        reason: 'This cannot be recorded from conversation. It is collected through a form with consent.',
      })
      continue
    }

    const parsed = parseFactValue(fact.key, fact.value)
    if (!parsed.ok) {
      rejected.push({ key: fact.key, reason: parsed.issues.join('; ') })
      continue
    }

    const household = definition.subject === 'household'
    const role = fact.subject ?? 'primary'
    const participantId = household ? null : input.participants[role]

    if (!household && participantId === null) {
      rejected.push({ key: fact.key, reason: `There is no ${role} on this case yet.` })
      continue
    }

    accepted.push(fact.key)
    inserts.push({
      case_id: input.caseId,
      key: fact.key,
      participant_id: participantId,
      subject_kind: household ? 'household' : 'participant',
      value: parsed.value as Json,
      source: input.source,
      verified: false,
      captured_for: input.capturedFor ?? null,
    })
  }

  if (inserts.length === 0) return { accepted, rejected }

  /**
   * A new answer replaces the old one rather than sitting beside it.
   *
   * `superseded_by` was never written, so every correction left both values live and the
   * domain's "superseded facts never satisfy anything" rule was dead code. Worse, a value
   * recorded against the wrong person — a partner's salary attributed to the customer —
   * silently became the newer of two and won.
   *
   * An identical value is not written at all: re-stating something is not a correction, and
   * recording it again inflates the captured-facts count and clutters the inspector.
   */
  const keys = [...new Set(inserts.map((row) => row.key))]
  const current = (await client
    .from('facts')
    .select('id, key, participant_id, value')
    .eq('case_id', input.caseId)
    .in('key', keys)
    .is('superseded_by', null)) as Query

  const live = ((current.data ?? []) as {
    id: string
    key: string
    participant_id: string | null
    value: unknown
  }[])

  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const matching = (row: Insert<'facts'>) =>
    live.filter(
      (existing) =>
        existing.key === row.key && existing.participant_id === (row.participant_id ?? null),
    )

  const changed = inserts.filter((row) => !matching(row).some((e) => same(e.value, row.value)))
  if (changed.length === 0) return { accepted, rejected }

  const written = (await client
    .from('facts')
    .insert(changed)
    .select('id, key, participant_id')) as Query

  unwrap(written, 'the recorded facts')

  for (const row of (written.data ?? []) as {
    id: string
    key: string
    participant_id: string | null
  }[]) {
    const replaced = live
      .filter((e) => e.key === row.key && e.participant_id === row.participant_id)
      .map((e) => e.id)

    if (replaced.length > 0) {
      await client.from('facts').update({ superseded_by: row.id }).in('id', replaced)
    }
  }

  return { accepted, rejected }
}

export async function touchLastSeen(client: Db, caseId: string): Promise<void> {
  const result = (await client
    .from('cases')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', caseId)) as Query
  unwrap(result, 'the last-seen timestamp')
}

function z_id(data: unknown): string {
  const parsed = data as { id?: unknown }
  if (typeof parsed.id !== 'string') throw new Error('Insert returned no id')
  return parsed.id
}
