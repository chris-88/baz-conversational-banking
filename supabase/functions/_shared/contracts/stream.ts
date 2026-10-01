import { z } from 'zod'
import { cardSchema } from './cards.ts'
import { apiErrorSchema } from './common.ts'

/**
 * The SSE event stream from `baz-turn` (CLAUDE.md > Baz model tools).
 *
 * A discriminated union, parsed on arrival in the browser, so a malformed frame is a handled
 * error rather than a half-rendered turn.
 */

export const streamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text_delta'), text: z.string() }),
  z.object({ type: z.literal('card'), card: cardSchema }),
  /** The case changed, so the client should invalidate and refetch. */
  z.object({ type: z.literal('status'), caseId: z.uuid(), invalidate: z.array(z.string()) }),
  z.object({
    type: z.literal('done'),
    messageId: z.uuid(),
    /** The gate's verdict, for the admin domain view (§39). */
    gateCategory: z.string(),
  }),
  z.object({ type: z.literal('error'), error: apiErrorSchema }),
])

export type StreamEvent = z.infer<typeof streamEventSchema>
export type StreamEventType = StreamEvent['type']

/** Serialises one event as an SSE frame. */
export function toSseFrame(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Parses one SSE `data:` payload. Returns null for anything unparseable, so a stray frame
 * cannot crash the conversation.
 */
export function parseStreamEvent(payload: string): StreamEvent | null {
  try {
    const parsed: unknown = JSON.parse(payload)
    const result = streamEventSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
