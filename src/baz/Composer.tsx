import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The message composer.
 *
 * The draft is local state here; when turns start persisting it moves to the Zustand store,
 * which is where ephemeral UI state belongs. Submit is disabled on an empty draft so the gate
 * never sees a blank turn.
 */
export function Composer({
  onSend,
  disabled,
  placeholder = 'Tell me what you’re trying to do…',
  className,
}: {
  onSend?: ((message: string) => void) | undefined
  disabled?: boolean | undefined
  placeholder?: string | undefined
  className?: string | undefined
}): ReactNode {
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0 && !disabled

  function submit(event: FormEvent): void {
    event.preventDefault()
    if (!canSend) return
    onSend?.(draft.trim())
    setDraft('')
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'border-input bg-card focus-within:ring-ring/40 flex items-center gap-1 rounded-full border py-1 pr-1 pl-4 focus-within:ring-2',
        className,
      )}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Message Baz"
        /*
         * 16px, not 14. iOS zooms the whole page the moment a focused field computes smaller
         * than that, and once it has zoomed the layout viewport no longer matches the screen —
         * which is why the reply and the options slid out of view rather than just looking big.
         * Scaled back down above the phone breakpoint, where nothing zooms.
         */
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-base outline-none disabled:opacity-60 sm:text-sm"
      />


      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className="bg-primary text-primary-foreground focus-visible:ring-ring grid size-9 shrink-0 place-items-center rounded-full transition-opacity focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        <ArrowUpIcon aria-hidden className="size-4" />
      </button>
    </form>
  )
}
