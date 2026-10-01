import { env } from '@/lib/env'
import { requireSupabase } from '@/lib/supabase'
import { parseStreamEvent, type StreamEvent } from '@contracts/stream.ts'

/**
 * Calls `baz-turn` and reports stream events as they arrive.
 *
 * `fetch` rather than `EventSource`: the turn is a POST carrying an Authorization header, and
 * EventSource supports neither.
 */
export type BazTurnInput = {
  readonly caseId: string
  readonly trigger?: 'message' | 'opening' | 'return'
  readonly message?: string
  readonly signal?: AbortSignal
}

export async function streamBazTurn(
  input: BazTurnInput,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const supabase = requireSupabase()
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token
  if (!token || !env) throw new Error('Not signed in.')

  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/baz-turn`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caseId: input.caseId,
      trigger: input.trigger ?? 'message',
      ...(input.message === undefined ? {} : { message: input.message }),
    }),
    ...(input.signal ? { signal: input.signal } : {}),
  })

  if (!response.ok || !response.body) {
    // A non-streaming failure still answers with the standard envelope.
    const text = await response.text()
    onEvent({
      type: 'error',
      error: { code: 'upstream_unavailable', message: extractMessage(text) },
    })
    return
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += value

    // SSE frames are separated by a blank line; a partial frame stays in the buffer.
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      for (const line of frame.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const event = parseStreamEvent(line.slice(6))
        // An unparseable frame is dropped rather than allowed to break the turn.
        if (event) onEvent(event)
      }

      boundary = buffer.indexOf('\n\n')
    }
  }
}

function extractMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } }
    if (typeof parsed.error?.message === 'string') return parsed.error.message
  } catch {
    // Fall through to the generic message.
  }
  return 'Baz is unavailable right now.'
}
