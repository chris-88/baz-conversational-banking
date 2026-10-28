import type { CutawayView, TranscriptEvent } from '@/content/showcase/types'
import type { TurnEntry } from '@/baz/useConversation'

/**
 * What the phone shows at a moment in the walkthrough.
 *
 * A pure function of the events and the clock. No state accumulates between calls, so a
 * seek to any point renders what continuous playback would have shown there, and pausing
 * freezes everything including a half-typed message.
 */

export type TranscriptView = {
  /** The entries on screen, in the shape the live conversation uses. */
  readonly entries: readonly TurnEntry[]
  /** Baz is thinking: the typing bubble sits after the last entry. */
  readonly thinking: boolean
  readonly composer: { readonly text: string; readonly sending: boolean }
  readonly cutaway: CutawayView | null
  /** Changes whenever something is appended, so the scroll effect has something to key on. */
  readonly revision: number
}

/** The button tints for this long before the message goes. */
const SENDING_MS = 200

export function visibleTranscript(
  events: readonly TranscriptEvent[],
  timeMs: number,
): TranscriptView {
  // Everything before the latest cut has left the screen.
  let from = 0
  events.forEach((event, index) => {
    if (event.kind === 'cut' && event.atMs <= timeMs) from = index + 1
  })

  const entries: TurnEntry[] = []
  for (const event of events.slice(from)) {
    if (event.atMs > timeMs) break
    switch (event.kind) {
      case 'customer':
        entries.push({ kind: 'message', id: event.id, author: 'customer', text: event.text })
        break
      case 'baz':
        entries.push({ kind: 'message', id: event.id, author: 'baz', text: event.text })
        break
      case 'card': {
        const settled =
          event.settleAtMs !== undefined && timeMs >= event.settleAtMs ? event.settled : undefined
        entries.push(
          settled === undefined
            ? { kind: 'card', id: event.id, card: event.card }
            : { kind: 'card', id: event.id, card: event.card, settled },
        )
        break
      }
      case 'cut':
      case 'cutaway':
        break
    }
  }

  const nextBaz = events.find((event) => event.kind === 'baz' && event.atMs > timeMs)
  const thinking =
    nextBaz !== undefined && nextBaz.kind === 'baz' && nextBaz.thinkingFromMs <= timeMs

  const nextCustomer = events.find((event) => event.kind === 'customer' && event.atMs > timeMs)
  let composer = { text: '', sending: false }
  if (
    nextCustomer !== undefined &&
    nextCustomer.kind === 'customer' &&
    nextCustomer.typeFromMs <= timeMs
  ) {
    const window = nextCustomer.atMs - nextCustomer.typeFromMs
    const progress = window <= 0 ? 1 : (timeMs - nextCustomer.typeFromMs) / window
    const shown = Math.floor(nextCustomer.text.length * Math.min(Math.max(progress, 0), 1))
    composer = {
      text: nextCustomer.text.slice(0, shown),
      sending: nextCustomer.atMs - timeMs <= SENDING_MS,
    }
  }

  const cutawayEvent = events.find(
    (event) => event.kind === 'cutaway' && event.atMs <= timeMs && timeMs < event.untilMs,
  )
  const cutaway = cutawayEvent !== undefined && cutawayEvent.kind === 'cutaway' ? cutawayEvent.view : null

  return {
    entries,
    thinking,
    composer,
    cutaway,
    revision: entries.length * 2 + (thinking ? 1 : 0),
  }
}
