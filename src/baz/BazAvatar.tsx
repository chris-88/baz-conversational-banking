import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Baz's mark. Portable: no tenant, no shell (Invariant 11, §32). */
export function BazAvatar({ className }: { className?: string }): ReactNode {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-full',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 9a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H9l-4 3z" />
        <path d="M9.5 11h.01M14.5 11h.01" />
      </svg>
    </span>
  )
}
