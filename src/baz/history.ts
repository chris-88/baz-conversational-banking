import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'
import { cardSchema, type Card } from '@contracts/cards.ts'
import { loadCaseState, settledState, type Settled } from '@/baz/cardState'

/**
 * Loads the conversation so far.
 *
 * Without this the model and the customer see different conversations: the model reads
 * persisted history and will refer to a card it showed last time, while the screen starts
 * empty. It read as Baz apologising for something the customer never saw.
 *
 * Read directly under RLS, which only lets the primary customer of this case see it (§33).
 */
const messageSchema = z.object({
  id: z.uuid(),
  role: z.enum(['customer', 'baz', 'system']),
  content: z.string(),
  // A card that no longer parses is dropped rather than breaking the whole transcript.
  cards: z.array(z.unknown()).default([]),
})

export type HistoryEntry =
  | {
      readonly kind: 'message'
      readonly id: string
      readonly author: 'baz' | 'customer'
      readonly text: string
    }
  | {
      readonly kind: 'card'
      readonly id: string
      readonly card: Card
      /** What became of it, where that is a thing the case knows. */
      readonly settled?: Settled
    }

export async function loadHistory(caseId: string): Promise<readonly HistoryEntry[]> {
  const supabase = requireSupabase()

  /*
   * The transcript and the state of the case, together.
   *
   * A card is stored as what was offered, not as what happened next, so reloading a
   * conversation put every decision back on screen as though it were still open: the plan
   * could be kept again, the products chosen again, a sign-in requested by somebody already
   * signed in. Resolving them here is Invariant 2 applied to history.
   */
  const [{ data, error }, state] = await Promise.all([
    supabase
      .from('messages')
      .select('id, role, content, cards')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
      .limit(100),
    loadCaseState(caseId),
  ])

  if (error) throw new Error(error.message)

  const entries = messageSchema
    .array()
    .parse(data ?? [])
    // System messages are internal: they belong in the event log, not the conversation.
    .filter((message) => message.role !== 'system')
    .flatMap((message): HistoryEntry[] => [
      {
        kind: 'message',
        id: message.id,
        author: message.role === 'customer' ? ('customer' as const) : ('baz' as const),
        text: message.content,
      },
      ...message.cards.flatMap((raw, index): HistoryEntry[] => {
        const parsed = cardSchema.safeParse(raw)
        if (!parsed.success) return []

        const settled = settledState(parsed.data, state)
        return [
          {
            kind: 'card',
            id: `${message.id}-card-${String(index)}`,
            card: parsed.data,
            ...(settled === undefined ? {} : { settled }),
          },
        ]
      }),
    ])

  return supersedeOlderStatus(entries)
}

/**
 * Only the newest status card is current. The others say so.
 *
 * A status card renders the payload it was streamed with, which is the application state at
 * that moment. Left alone, two of them from different turns sit in one transcript disagreeing
 * about where things stand, with nothing to say which is right. The newest is the case as it
 * is; the rest settle into a line that says they were how it was.
 */
function supersedeOlderStatus(entries: readonly HistoryEntry[]): readonly HistoryEntry[] {
  const statuses = entries.flatMap((entry, index) =>
    entry.kind === 'card' && entry.card.type === 'status' ? [index] : [],
  )
  const newest = statuses[statuses.length - 1]

  return entries.map((entry, index) =>
    statuses.includes(index) && index !== newest
      ? {
          ...entry,
          settled: {
            label: 'Where things stood at the time',
            note: 'Things have moved since. The current status is further down.',
          },
        }
      : entry,
  )
}
