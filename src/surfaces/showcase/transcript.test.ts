import { describe, expect, it } from 'vitest'
import type { Card } from '@contracts/cards.ts'
import type { TranscriptEvent } from '@/content/showcase/types'
import { visibleTranscript } from './transcript'

const CARD: Card = {
  type: 'sign_in',
  title: 'Sign in',
  points: ['Keep this conversation'],
  reassurance: 'Nothing changes until you do.',
  whyHref: '#/privacy',
}

const events: readonly TranscriptEvent[] = [
  { kind: 'customer', id: 'c1', atMs: 4_000, typeFromMs: 1_500, text: 'Hello there, Baz' },
  { kind: 'baz', id: 'b1', atMs: 6_000, thinkingFromMs: 4_000, text: 'Hello.' },
  { kind: 'card', id: 'k1', atMs: 7_000, card: CARD, settleAtMs: 9_000, settled: { label: 'Signed in' } },
  { kind: 'cut', id: 'x1', atMs: 10_000 },
  { kind: 'baz', id: 'b2', atMs: 11_000, thinkingFromMs: 10_000, text: 'Again.' },
  { kind: 'cutaway', id: 'w1', atMs: 12_000, untilMs: 14_000, view: { kind: 'payload' } },
]

describe('the visible transcript', () => {
  it('is empty before anything happens', () => {
    const view = visibleTranscript(events, 0)
    expect(view.entries).toEqual([])
    expect(view.thinking).toBe(false)
    expect(view.composer.text).toBe('')
  })

  it('fills the composer as a prefix of the message, then sends it', () => {
    expect(visibleTranscript(events, 1_500).composer.text).toBe('')
    const mid = visibleTranscript(events, 2_750).composer.text
    expect('Hello there, Baz'.startsWith(mid)).toBe(true)
    expect(mid.length).toBeGreaterThan(0)
    expect(visibleTranscript(events, 3_900).composer.sending).toBe(true)
    const sent = visibleTranscript(events, 4_000)
    expect(sent.composer.text).toBe('')
    expect(sent.entries).toEqual([{ kind: 'message', id: 'c1', author: 'customer', text: 'Hello there, Baz' }])
  })

  it('thinks only inside the thinking window', () => {
    expect(visibleTranscript(events, 3_999).thinking).toBe(false)
    expect(visibleTranscript(events, 4_000).thinking).toBe(true)
    expect(visibleTranscript(events, 5_999).thinking).toBe(true)
    expect(visibleTranscript(events, 6_000).thinking).toBe(false)
  })

  it('settles a card only once the customer has tapped', () => {
    const before = visibleTranscript(events, 8_000).entries[2]
    expect(before).toEqual({ kind: 'card', id: 'k1', card: CARD })
    const after = visibleTranscript(events, 9_000).entries[2]
    expect(after).toEqual({ kind: 'card', id: 'k1', card: CARD, settled: { label: 'Signed in' } })
  })

  it('a cut clears what came before it', () => {
    expect(visibleTranscript(events, 9_999).entries).toHaveLength(3)
    expect(visibleTranscript(events, 10_000).entries).toHaveLength(0)
    expect(visibleTranscript(events, 11_000).entries.map((entry) => entry.id)).toEqual(['b2'])
  })

  it('a cutaway is on for its window and off outside it', () => {
    expect(visibleTranscript(events, 11_999).cutaway).toBeNull()
    expect(visibleTranscript(events, 12_000).cutaway).toEqual({ kind: 'payload' })
    expect(visibleTranscript(events, 14_000).cutaway).toBeNull()
  })

  it('is the same from a cold call as after playing through', () => {
    const played = [0, 2_000, 4_000, 6_000, 8_000, 9_500].map((t) => visibleTranscript(events, t))
    expect(played[played.length - 1]).toEqual(visibleTranscript(events, 9_500))
    // Seeking back yields a strict prefix of what was there.
    expect(visibleTranscript(events, 5_000).entries).toEqual(
      visibleTranscript(events, 8_000).entries.slice(0, 1),
    )
  })

  it('revision grows as things arrive', () => {
    const a = visibleTranscript(events, 3_999).revision
    const b = visibleTranscript(events, 4_500).revision
    const c = visibleTranscript(events, 6_000).revision
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(a)
  })
})
