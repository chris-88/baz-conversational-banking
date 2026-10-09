import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The Baz wordmark, from `docs/baz-name.svg`.
 *
 * Three drawn letters rather than type: a `b` built from a stem and a ring, an `a` from a ring
 * and a stem the other way up, and a `z` from two bars and a diagonal. Only the `b` carries
 * eyes, which is what makes the first letter the icon and the icon the first letter.
 *
 * Outlines, not text — so it renders identically on every device, which is the whole reason a
 * logotype gets drawn rather than set. It also means there is no typeface to keep in step.
 *
 * Sized by height, like any logo: pass `h-7`, `h-9`. The width follows the artwork.
 *
 * Do not put it inside a shadcn `Button`. Button sets
 * `[&_svg:not([class*='size-'])]:size-4` on its descendants, which overrides the height and
 * squashes this to sixteen pixels square. Use a plain link styled as one.
 */
export function BazWordmark({ className }: { readonly className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 202 87"
      role="img"
      aria-label="Baz"
      className={cn('text-baz-primary h-7 w-auto', className)}
    >
      {/* b */}
      <circle cx="32" cy="55" r="24.5" fill="none" stroke="currentColor" strokeWidth="15" />
      <circle cx="26" cy="52" r="3" fill="currentColor" />
      <circle cx="37" cy="52" r="3" fill="currentColor" />
      <path d="M34 52H40" stroke="currentColor" />
      <path d="M23 52H29" stroke="currentColor" />
      <path
        d="M0 7.5C0 3.35786 3.35786 0 7.5 0V0C11.6421 0 15 3.35786 15 7.5V55H0V7.5Z"
        fill="currentColor"
      />

      {/* a */}
      <circle cx="101" cy="55" r="24.5" fill="none" stroke="currentColor" strokeWidth="15" />
      <path
        d="M133 79.5C133 83.6421 129.642 87 125.5 87V87C121.358 87 118 83.6421 118 79.5L118 53L133 53L133 79.5Z"
        fill="currentColor"
      />

      {/* z */}
      <path
        d="M145.5 38C141.358 38 138 34.6421 138 30.5V30.5C138 26.3579 141.358 23 145.5 23L194 23L194 38L145.5 38Z"
        fill="currentColor"
      />
      <path d="M146 79L194 31" stroke="currentColor" strokeWidth="15" />
      <path
        d="M194.5 72C198.642 72 202 75.3579 202 79.5V79.5C202 83.6421 198.642 87 194.5 87L146 87L146 72L194.5 72Z"
        fill="currentColor"
      />
      <circle cx="194.5" cy="30.5" r="7.5" fill="currentColor" />
      <circle cx="145.5" cy="79.5" r="7.5" fill="currentColor" />
    </svg>
  )
}
