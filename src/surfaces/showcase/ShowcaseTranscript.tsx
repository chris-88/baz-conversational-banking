import { useEffect, useRef, type ReactNode } from 'react'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { TypingBubble } from '@/baz/TypingBubble'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { Reveal } from '@/components/Primitives'
import type { TranscriptView } from './transcript'
import { ScriptedComposer } from './ScriptedComposer'

/** The scroller's own padding, so an entry held at the top keeps its margin. */
const PADDING = 16

/**
 * The conversation on the phone, from the product's own parts.
 *
 * `ChatBubble`, `MessageText`, `TypingBubble` and every card through `CardRenderer`, with no
 * actions and every control disabled: what is on screen is what is on a customer's phone and
 * nothing can be started from it. Where the script says the customer tapped, the card shows
 * the same settled state the product shows the moment a real tap lands.
 */
export function ShowcaseTranscript({
  view,
  still,
}: {
  readonly view: TranscriptView
  readonly still: boolean
}): ReactNode {
  const scroller = useRef<HTMLDivElement>(null)

  /*
   * To the bottom, unless the newest entry is taller than the screen.
   *
   * There is no reader to respect here, unlike the live transcript, so each new entry brings
   * the view down with it. A card taller than the screen is the exception: brought to the
   * bottom it shows its last rows and loses its title, and nobody in the room can scroll up
   * for it. Its top is held on screen instead, and the view moves on with the next line.
   */
  useEffect(() => {
    const element = scroller.current
    if (element === null) return
    const newest = element.lastElementChild
    const bottom = element.scrollHeight - element.clientHeight
    const top = newest instanceof HTMLElement ? Math.max(0, newest.offsetTop - PADDING) : bottom
    const target = Math.min(bottom, top)
    // jsdom has no scrollTo on elements; the property assignment is the same instruction.
    if (typeof element.scrollTo !== 'function') {
      element.scrollTop = target
      return
    }
    element.scrollTo({ top: target, behavior: still ? 'auto' : 'smooth' })
  }, [view.revision, still])

  const firstBaz = view.entries.findIndex(
    (entry) => entry.kind === 'message' && entry.author === 'baz',
  )

  return (
    <>
      <div
        ref={scroller}
        className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
        aria-label="The conversation"
      >
        {view.entries.map((entry, index) => {
          if (entry.kind === 'card') {
            const card = (
              <CardRenderer
                card={entry.card}
                actions={{}}
                disabled
                {...(entry.settled === undefined ? {} : { settled: entry.settled })}
              />
            )
            return (
              <div key={entry.id} className="pl-10">
                {still ? card : <Reveal mode="mount">{card}</Reveal>}
              </div>
            )
          }

          const next = view.entries[index + 1]
          const endsRun =
            next === undefined || next.kind !== 'message' || next.author !== entry.author

          const bubble = (
            <ChatBubble author={entry.author} showAvatar={endsRun} first={index === firstBaz}>
              {entry.author === 'baz' ? <MessageText text={entry.text} /> : entry.text}
            </ChatBubble>
          )
          return still ? (
            <div key={entry.id}>{bubble}</div>
          ) : (
            <Reveal key={entry.id} mode="mount">
              {bubble}
            </Reveal>
          )
        })}

        {view.thinking && <TypingBubble first={firstBaz < 0} />}
      </div>

      <ScriptedComposer text={view.composer.text} sending={view.composer.sending} still={still} />
    </>
  )
}
