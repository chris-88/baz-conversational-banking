import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamBazTurn } from '@/baz/bazTurnClient'
import type { StreamEvent } from '@contracts/stream.ts'

vi.mock('@/lib/env', () => ({
  env: { VITE_SUPABASE_URL: 'https://example.test', VITE_SUPABASE_ANON_KEY: 'anon' },
}))

vi.mock('@/lib/supabase', () => ({
  requireSupabase: () => ({
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'token' } } }) },
  }),
}))

/** A response whose body opens and then says nothing at all, which is how a turn hangs. */
function silentStream(): Response {
  const body = new ReadableStream<Uint8Array>({
    start() {
      // Deliberately never enqueues and never closes.
    },
  })

  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

function framed(events: readonly StreamEvent[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a turn that stops answering', () => {
  /**
   * Reported live: the typing indicator ran forever with nothing to click.
   *
   * A read that never settles is the worst way for a turn to fail — the connection stays open,
   * no bytes arrive, and the customer has no way out. It has to become an ordinary error.
   */
  it('gives up on a stream that opens and says nothing', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(silentStream()))

    const events: StreamEvent[] = []
    const turn = streamBazTurn({ caseId: 'case-1', message: 'hello' }, (event) => events.push(event))

    await vi.advanceTimersByTimeAsync(60_000)
    await turn

    expect(events).toHaveLength(1)
    const [first] = events
    expect(first?.type).toBe('error')
    // Phrased so the customer knows what to do, not what broke.
    if (first?.type !== 'error') throw new Error('expected an error event')
    expect(first.error.message).toMatch(/say it again/i)
  })

  it('leaves a stream that is answering alone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        framed([
          { type: 'text_delta', text: 'Hello' },
          { type: 'done', messageId: '11111111-2222-4333-8444-555555555555', gateCategory: 'banking' },
        ]),
      ),
    )

    const events: StreamEvent[] = []
    await streamBazTurn({ caseId: 'case-1', message: 'hello' }, (event) => events.push(event))

    expect(events.map((event) => event.type)).toEqual(['text_delta', 'done'])
  })
})
