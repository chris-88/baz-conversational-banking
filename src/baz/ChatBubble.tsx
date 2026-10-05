import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BazAvatar } from '@/baz/BazAvatar'
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
}: {
  author: ChatAuthor
  children: ReactNode
  showAvatar?: boolean
}): ReactNode {
  const isBaz = author === 'baz'

  return (
    <div className={cn('flex w-full items-start gap-2', isBaz ? 'justify-start' : 'justify-end')}>
      {isBaz && (showAvatar ? <BazAvatar className="self-start" /> : <span className="size-8 shrink-0" />)}

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
