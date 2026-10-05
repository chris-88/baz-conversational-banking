import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'
import { cardSchema, type Card } from '@contracts/cards.ts'

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
  | { readonly kind: 'message'; readonly id: string; readonly author: 'baz' | 'customer'; readonly text: string }
  | { readonly kind: 'card'; readonly id: string; readonly card: Card }

export async function loadHistory(caseId: string): Promise<readonly HistoryEntry[]> {
  const supabase = requireSupabase()

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, cards')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw new Error(error.message)

  return messageSchema
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
        return parsed.success
          ? [{ kind: 'card', id: `${message.id}-card-${String(index)}`, card: parsed.data }]
          : []
      }),
    ])
}
