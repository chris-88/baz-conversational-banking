import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Baz's mark, from the supplied asset pack: a face rather than a speech bubble, because Baz
 * is meant to read as someone rather than as a chat widget.
 *
 * Portable: no tenant, no shell (Invariant 11, §32).
 */
export function BazAvatar({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}): ReactNode {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full',
        size === 'sm' && 'size-7',
        size === 'md' && 'size-9',
        size === 'lg' && 'size-12',
        className,
      )}
    >
      <svg viewBox="0 0 64 64" className="size-full">
        <defs>
          <linearGradient id="baz-face" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1668F0" />
            <stop offset="1" stopColor="#0B3FC4" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#baz-face)" />
        <rect x="29" y="9" width="6" height="10" rx="3" fill="white" />
        <rect x="15" y="17" width="34" height="29" rx="11" fill="white" />
        <circle cx="24.5" cy="30" r="3.2" fill="#0B3FC4" />
        <circle cx="39.5" cy="30" r="3.2" fill="#0B3FC4" />
        <path
          d="M25 37.5c4.5 3.4 9.5 3.4 14 0"
          fill="none"
          stroke="#0B3FC4"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
