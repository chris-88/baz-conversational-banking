import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'

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
})

export type HistoryMessage = {
  readonly id: string
  readonly author: 'baz' | 'customer'
  readonly text: string
}

export async function loadHistory(caseId: string): Promise<readonly HistoryMessage[]> {
  const supabase = requireSupabase()

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw new Error(error.message)

  return messageSchema
    .array()
    .parse(data ?? [])
    // System messages are internal: they belong in the event log, not the conversation.
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      id: message.id,
      author: message.role === 'customer' ? ('customer' as const) : ('baz' as const),
      text: message.content,
    }))
}
