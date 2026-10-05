import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The Bank of Ireland lockup, from the supplied asset pack.
 *
 * The pack states that this mark is a POC placeholder to be replaced with official brand
 * artwork before any external use, so it stays a placeholder here too (Invariant 10).
 */
export function Wordmark({
  className,
  tone = 'inherit',
  showName = true,
}: {
  className?: string | undefined
  tone?: 'inherit' | 'primary' | undefined
  showName?: boolean | undefined
}): ReactNode {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cn('size-6 shrink-0', tone === 'primary' && 'text-primary')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6.5 12 10l8-3.5" />
        <path d="M4 11.5 12 15l8-3.5" />
        <path d="M4 16.5 12 20l8-3.5" />
      </svg>
      {showName && (
        <span className="text-[0.95rem] leading-none font-bold tracking-tight whitespace-nowrap">
          Bank of Ireland
        </span>
      )}
    </span>
  )
}
