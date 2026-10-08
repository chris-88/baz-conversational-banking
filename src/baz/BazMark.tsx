import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Baz's mark (opening-transition spec §1, §15).
 *
 * Inline rather than an imported file, because the orbit dot has to move on its own and a
 * single `<img>` cannot animate one of its parts. It is also what lets the whole thing inherit
 * `currentColor`, so the same component works in the brand blue, in a muted header and on a
 * dark background without a second asset.
 *
 * Nothing here is a raster image and nothing animates anything but `transform` and `opacity`,
 * which is what keeps it at sixty frames on a phone.
 */
export function BazMark({
  className,
  breathing = false,
  title,
}: {
  readonly className?: string
  /**
   * Idle motion, for the hero state only (§3).
   *
   * A slow scale and a drifting dot — no bounce, no halo, no spin. The spec is explicit about
   * which of those reads as present and which reads as a gimmick.
   */
  readonly breathing?: boolean
  /**
   * An accessible name. Omitted where visible "Baz" text sits beside it, which is the usual
   * case — a decorative repeat of an adjacent word is noise to a screen reader (§16).
   */
  readonly title?: string
}): ReactNode {
  const labelled = title !== undefined

  return (
    <svg
      viewBox="0 0 256 256"
      className={cn('size-full', breathing && 'baz-mark-breathe', className)}
      {...(labelled
        ? { role: 'img' as const, 'aria-label': title }
        : { 'aria-hidden': true as const })}
    >
      <circle cx="120" cy="132" r="78" fill="none" stroke="currentColor" strokeWidth="24" />
      {/*
        The face fill is the page behind it, not white: on a muted chat bubble a white disc
        would read as a hole punched in the background.
      */}
      <circle cx="120" cy="132" r="48" className="fill-background" />
      <circle cx="102" cy="132" r="7.5" fill="currentColor" />
      <circle cx="138" cy="132" r="7.5" fill="currentColor" />
      <circle
        cx="188"
        cy="58"
        r="16"
        fill="currentColor"
        className={cn(breathing && 'baz-mark-orbit')}
      />
    </svg>
  )
}
