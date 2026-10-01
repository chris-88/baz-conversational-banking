import { describe, expect, it } from 'vitest'
import { CARD_TYPES, cardSchema } from './cards.ts'
import { ERROR_CODES, fail, ok, statusFor } from './common.ts'
import { parseStreamEvent, streamEventSchema, toSseFrame } from './stream.ts'
import { bazTurnRequestSchema } from './baz-turn.ts'

describe('the result envelope', () => {
  it('discriminates success from failure', () => {
    expect(ok({ a: 1 })).toEqual({ ok: true, data: { a: 1 } })
    expect(fail('bad_request', 'nope').ok).toBe(false)
  })

  it('maps every error code to a status, exhaustively', () => {
    for (const code of ERROR_CODES) {
      const status = statusFor(code)
      expect(status, code).toBeGreaterThanOrEqual(400)
      expect(status, code).toBeLessThan(600)
    }
  })

  it('answers a paused demo with 503, not an error the customer reads as a fault', () => {
    expect(statusFor('demo_paused')).toBe(503)
  })
})

describe('stream events', () => {
  it('round-trips through an SSE frame', () => {
    const event = { type: 'text_delta', text: 'Hello' } as const
    const frame = toSseFrame(event)

    expect(frame.startsWith('data: ')).toBe(true)
    expect(frame.endsWith('\n\n')).toBe(true)
    expect(parseStreamEvent(frame.slice(6).trim())).toEqual(event)
  })

  it('returns null rather than throwing on a malformed frame', () => {
    expect(parseStreamEvent('not json')).toBeNull()
    expect(parseStreamEvent('{"type":"nonsense"}')).toBeNull()
    expect(parseStreamEvent('{}')).toBeNull()
  })

  it('covers exactly the five event types CLAUDE.md names', () => {
    const types = streamEventSchema.options.map((option) => option.shape.type.value)
    expect([...types].sort()).toEqual(['card', 'done', 'error', 'status', 'text_delta'])
  })
})

describe('cards', () => {
  it('covers every card type the tools can ask for', () => {
    const types = cardSchema.options.map((option) => option.shape.type.value)
    expect([...types].sort()).toEqual([...CARD_TYPES].sort())
  })

  it('carries the state label alongside the state, so colour is never the only signal', () => {
    const parsed = cardSchema.safeParse({
      type: 'status',
      applications: [
        {
          id: '3f8b0c7e-0000-4000-8000-000000000001',
          product: 'mortgage',
          displayName: 'Mortgage',
          state: 'under_review',
          stateLabel: 'Being assessed',
          outstandingCount: 0,
          waitingOn: null,
        },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a state the machine does not have', () => {
    const parsed = cardSchema.safeParse({
      type: 'status',
      applications: [
        {
          id: '3f8b0c7e-0000-4000-8000-000000000001',
          product: 'mortgage',
          displayName: 'Mortgage',
          state: 'nearly_done',
          stateLabel: 'Nearly done',
          outstandingCount: 0,
          waitingOn: null,
        },
      ],
    })
    expect(parsed.success).toBe(false)
  })
})

describe('the baz-turn request', () => {
  it('defaults the trigger to a customer message', () => {
    const parsed = bazTurnRequestSchema.parse({ caseId: '3f8b0c7e-0000-4000-8000-000000000001' })
    expect(parsed.trigger).toBe('message')
  })

  it('refuses a message longer than the gate would accept', () => {
    const parsed = bazTurnRequestSchema.safeParse({
      caseId: '3f8b0c7e-0000-4000-8000-000000000001',
      message: 'a'.repeat(5_000),
    })
    expect(parsed.success).toBe(false)
  })

  it('allows a turn with no message, for the opening and for a return', () => {
    for (const trigger of ['opening', 'return'] as const) {
      const parsed = bazTurnRequestSchema.safeParse({
        caseId: '3f8b0c7e-0000-4000-8000-000000000001',
        trigger,
      })
      expect(parsed.success, trigger).toBe(true)
    }
  })
})
