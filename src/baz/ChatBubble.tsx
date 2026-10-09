import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BazMark } from '@/baz/BazMark'
import { CustomerAvatar } from '@/baz/CustomerAvatar'

export type ChatAuthor = 'baz' | 'customer'

/**
 * One turn in the conversation. Baz speaks on the left in a light bubble, the customer on the
 * right in the action colour.
 *
 * Portable by construction: no tenant and no shell imports (Invariant 11).
 */
export function ChatBubble({
  author,
  children,
  showAvatar = true,
  first = false,
}: {
  author: ChatAuthor
  children: ReactNode
  showAvatar?: boolean
  /** The first Baz turn, which is where the opening transition lands. */
  first?: boolean
}): ReactNode {
  const isBaz = author === 'baz'

  return (
    <div className={cn('flex w-full items-start gap-2', isBaz ? 'justify-start' : 'justify-end')}>
      {isBaz &&
        (showAvatar ? (
          <span
            /*
             * The landing point for the opening transition (spec §5).
             *
             * Only the first Baz turn carries the name: `view-transition-name` has to be unique
             * on the page, and a transcript of six replies would otherwise declare it six times
             * and the browser would animate none of them.
             */
            {...(first === true ? { style: { viewTransitionName: 'baz-avatar' } } : {})}
            className="text-baz-primary size-8 shrink-0 self-start"
          >
            <BazMark />
          </span>
        ) : (
          <span className="size-8 shrink-0" />
        ))}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isBaz
            ? 'bg-muted text-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm',
        )}
      >
        {children}
      </div>

      {!isBaz &&
        (showAvatar ? (
          <CustomerAvatar className="self-start" />
        ) : (
          <span className="size-8 shrink-0" />
        ))}
    </div>
  )
}
