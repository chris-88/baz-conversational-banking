import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The Baz wordmark, from the supplied dev kit (`svg/baz-wordmark-horizontal.svg`).
 *
 * A stylised lowercase `b` whose counter is Baz's face, followed by `az`. The kit's own note is
 * that the `az` ships "as a clean starter asset using SVG text", to be outlined properly later
 * — so it is set here in the application's own typeface rather than in the kit's DejaVu, which
 * is not installed on a phone and would silently become something else.
 *
 * ## The `b`
 *
 * Drawn to the kit's measurements exactly: stem 28 wide and 80 tall with fully rounded ends,
 * bowl of radius 44 centred at (44, 86), counter 25, eyes 5.5 at ±9. The stem's bottom finishes
 * inside the bowl rather than meeting its edge, which is what gives the letter a continuous
 * silhouette with no seam at the join.
 *
 * ## Fitting the two halves together
 *
 * Every measurement below is a ratio taken off the kit file, so the lockup holds at any size.
 * Against its 118px `az`, the glyph is 88 wide and 126 tall and its baseline sits 28 up from
 * the bottom — meaning the bowl deliberately hangs below the baseline of the letters beside it,
 * which is the detail that makes the mark read as drawn rather than typed. `items-baseline`
 * puts the element's bottom on the baseline and the translate pushes it back down by that
 * overhang.
 *
 * The one substitution is the typeface, so the `az` carries the kit's weight (800) and its
 * tracking (-6 on 118, or -0.051em) rather than Inter's defaults.
 */
export function BazWordmark({ className }: { readonly className?: string }): ReactNode {
  return (
    <span
      role="img"
      aria-label="Baz"
      className={cn('text-baz-ink inline-flex items-baseline', className)}
    >
      <span
        aria-hidden
        className="text-baz-primary mr-[0.017em] inline-block h-[1.068em] w-[0.746em] translate-y-[0.237em]"
      >
        <svg viewBox="0 0 88 126" className="size-full">
          {/* The kit's own coordinates, shifted up by its 4-unit top margin. */}
          <g transform="translate(0,-4)">
            <rect x="0" y="4" width="28" height="80" rx="14" fill="currentColor" />
            <circle cx="44" cy="86" r="44" fill="currentColor" />
            <circle cx="44" cy="86" r="25" fill="#ffffff" />
            <circle cx="35" cy="86" r="5.5" fill="currentColor" />
            <circle cx="51" cy="86" r="5.5" fill="currentColor" />
          </g>
        </svg>
      </span>
      <span aria-hidden className="font-extrabold tracking-[-0.051em]">
        az
      </span>
    </span>
  )
}
