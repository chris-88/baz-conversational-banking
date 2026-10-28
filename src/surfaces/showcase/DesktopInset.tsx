import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A desktop window, for the screens that are not phone screens.
 *
 * The console is built for a laptop, and squeezing it into the phone frame would make it
 * unreadable and misrepresent it. A browser bar with the route it lives at, and the screen
 * underneath at a scale a room can read.
 */
export function DesktopInset({
  address,
  children,
  className,
}: {
  readonly address: string
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  return (
    <div className={cn('bg-card flex h-full max-h-[720px] w-full flex-col overflow-hidden rounded-xl border shadow-2xl', className)}>
      <div className="bg-muted/60 flex items-center gap-3 border-b px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
        </span>
        <span className="bg-background text-muted-foreground min-w-0 flex-1 truncate rounded-md border px-3 py-1 font-mono text-[11.5px]">
          {address}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
