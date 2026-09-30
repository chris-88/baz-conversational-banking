import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Synthetic BOI wordmark. No real brand assets are used in this POC (Invariant 10). */
export function BoiHeader({ className }: { className?: string }): ReactNode {
  return (
    <header
      className={cn(
        'bg-primary text-primary-foreground flex h-14 items-center gap-3 px-4',
        className,
      )}
    >
      <span className="bg-accent text-accent-foreground grid size-7 place-items-center rounded-sm text-[11px] font-bold">
        BOI
      </span>
      <span className="text-sm font-semibold tracking-tight">Bank of Ireland</span>
      <span className="ml-auto text-[10px] uppercase tracking-widest opacity-70">Prototype</span>
    </header>
  )
}
