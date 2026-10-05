import type { ReactNode } from 'react'
import { BellIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * §35 — what the customer sees when something happened while they were away.
 *
 * The quoted line is deliberately about the conversation, never about the application: a
 * notification can be read by whoever picks up the phone, so it says there is a message and
 * nothing about what is in it. The detail is behind the sign-in that `href` leads to.
 */
export function NotificationCard({
  title,
  when,
  preview,
  actionLabel = 'View message',
  onAction,
  className,
}: {
  title: string
  when: string
  preview: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}): ReactNode {
  return (
    <Card className={cn('gap-0 p-4', className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full"
        >
          <BellIcon className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="text-muted-foreground block text-xs">{when}</span>
        </span>
      </div>

      <p className="bg-muted text-foreground mt-3 rounded-lg px-3 py-2.5 text-sm text-pretty">
        {preview}
      </p>

      {onAction && (
        <Button type="button" variant="outline" onClick={onAction} className="mt-3 w-full">
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}
