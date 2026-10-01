import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A synthetic mark. Deliberately NOT a reproduction of Bank of Ireland's actual logo, which is
 * a registered trademark — three stacked strokes suggesting a wordmark lockup, nothing more
 * (Invariant 10).
 */
export function Wordmark({
  className,
  tone = 'inherit',
}: {
  className?: string
  tone?: 'inherit' | 'primary'
}): ReactNode {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cn('size-5 shrink-0', tone === 'primary' && 'text-primary')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <path d="M3 7.5c3-2 6-2 9 0s6 2 9 0" />
        <path d="M3 12c3-2 6-2 9 0s6 2 9 0" />
        <path d="M3 16.5c3-2 6-2 9 0s6 2 9 0" />
      </svg>
      <span className="text-[0.95rem] font-semibold tracking-tight whitespace-nowrap">
        Bank of Ireland
      </span>
    </span>
  )
}
