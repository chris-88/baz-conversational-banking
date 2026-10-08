import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGhostPrompt } from '@/baz/useGhostPrompt'

/** Roughly six lines. Past that it scrolls, so the composer can never eat the conversation. */
const MAX_HEIGHT = 160

/**
 * The message composer.
 *
 * A textarea rather than an input, because people write more than one line and a single-line
 * box hides the start of what they typed just as they are deciding whether to send it. It grows
 * with the text and stops at six lines.
 *
 * Enter sends, shift-enter breaks the line — the convention everywhere this is modelled on, and
 * the one thing it would be annoying to get wrong.
 */
export function Composer({
  onSend,
  disabled,
  placeholder,
  className,
}: {
  onSend?: ((message: string) => void) | undefined
  disabled?: boolean | undefined
  /** Overrides the typed suggestions. Used where a fixed instruction is clearer than a hint. */
  placeholder?: string | undefined
  className?: string | undefined
}): ReactNode {
  const [draft, setDraft] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  const canSend = draft.trim().length > 0 && !disabled

  // Only while there is nothing to read. An animation under live text is a distraction.
  const ghost = useGhostPrompt(draft.length === 0 && placeholder === undefined)

  /*
   * Measured, not calculated. Reset to `auto` first so the box can shrink again when text is
   * deleted — without that it only ever grows, and a line removed leaves a gap behind it.
   */
  useLayoutEffect(() => {
    const el = box.current
    if (el === null) return

    el.style.height = 'auto'
    el.style.height = `${String(Math.min(el.scrollHeight, MAX_HEIGHT))}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [draft])

  function submit(event?: FormEvent): void {
    event?.preventDefault()
    if (!canSend) return
    onSend?.(draft.trim())
    setDraft('')
  }

  return (
    <form onSubmit={submit} className={cn('flex items-end gap-2', className)}>
      {/*
        The border is around the text and nothing else. It used to enclose the send button too,
        which set a floor on how tight the box could be — a 36px target inside a 24px line of
        text leaves padding that exists for the button's sake, not the text's. Outside, the box
        can hug the line and the button keeps a size somebody can actually hit.
      */}
      <div className="border-input bg-card focus-within:ring-ring/40 relative min-w-0 flex-1 rounded-3xl border px-4 py-0.5 focus-within:ring-2">
        {/*
          The hint is drawn behind the box rather than put in `placeholder`, so that a string
          changing forty times a second is never read out, and never becomes the field's
          accessible name. `aria-label` below is the stable one.
        */}
        {draft.length === 0 && ghost.length > 0 && (
          <p
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute inset-x-4 inset-y-0.5 truncate text-base leading-6 sm:text-sm"
          >
            {ghost}
            <span className="border-muted-foreground ml-px inline-block h-4 animate-pulse border-l align-middle" />
          </p>
        )}

        <textarea
          ref={box}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            // A composition is a half-typed character in another script; Enter commits it
            // rather than sending, and sending here would swallow the word.
            if (event.nativeEvent.isComposing) return
            event.preventDefault()
            submit()
          }}
          disabled={disabled}
          placeholder={placeholder ?? ''}
          aria-label="Message Baz"
          /*
           * 16px, not 14. iOS zooms the whole page the moment a focused field computes smaller
           * than that, and once it has zoomed the layout viewport no longer matches the screen —
           * which is why the reply and the options slid out of view rather than just looking big.
           * Scaled back down above the phone breakpoint, where nothing zooms.
           */
          className="placeholder:text-muted-foreground block max-h-40 w-full resize-none bg-transparent text-base leading-6 outline-none disabled:opacity-60 sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className="bg-primary text-primary-foreground focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-full transition-opacity focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        <ArrowUpIcon aria-hidden className="size-4" />
      </button>
    </form>
  )
}
