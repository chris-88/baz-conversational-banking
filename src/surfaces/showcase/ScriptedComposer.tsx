import type { ReactNode } from 'react'
import { ArrowUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The composer, with the words put in it by the script.
 *
 * The product's `Composer` owns its text in an editable region and has no way to be told
 * what to show, and giving it one to serve a demonstration would be a change to the thing
 * every customer downloads. This copies its two class strings and nothing else. Presentation
 * only: a screen reader gets the transcript drawer, not a field it cannot type in.
 */
export function ScriptedComposer({
  text,
  sending,
  still,
}: {
  readonly text: string
  readonly sending: boolean
  readonly still: boolean
}): ReactNode {
  return (
    <div role="presentation" className="flex items-end gap-2 border-t px-4 pt-3 pb-4">
      <div className="border-input bg-card relative min-w-0 flex-1 rounded-3xl border px-4 py-0.5">
        <p aria-hidden className="min-h-6 text-base leading-6 break-words whitespace-pre-wrap sm:text-sm">
          {text.length === 0 ? (
            <span className="text-muted-foreground">Message Baz</span>
          ) : (
            <>
              {text}
              <span
                className={cn(
                  'border-foreground ml-px inline-block h-4 border-l align-middle',
                  !still && 'animate-pulse',
                )}
              />
            </>
          )}
        </p>
      </div>
      <span
        aria-hidden
        className={cn(
          'bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-full transition-opacity',
          text.length === 0 && 'opacity-40',
          sending && 'bg-primary/80',
        )}
      >
        <ArrowUpIcon className="size-4" />
      </span>
    </div>
  )
}
