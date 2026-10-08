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
  tight,
  faceClassName = 'fill-background',
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
  /**
   * Crops the viewBox to the mark itself, for setting it in a line of text.
   *
   * The supplied artwork sits off-centre in a 256 box with room around it, which is right for
   * an avatar and wrong for a glyph: as the `a` in the wordmark it has to size against the
   * x-height and sit on the baseline, and padding it cannot see makes both impossible. The ring
   * happens to be exactly square — 180 across, at 30,42 — so the crop is the mark and nothing
   * else.
   */
  readonly tight?: boolean
  /**
   * The disc behind the eyes.
   *
   * It exists to punch the page colour through a muted chat bubble, so it is the page colour by
   * default. On a surface that is not the page colour — a white header over a slate ground —
   * that reads as a grey disc inside the ring, and the honest answer is to let the surface show
   * through instead.
   */
  readonly faceClassName?: string
}): ReactNode {
  const labelled = title !== undefined

  return (
    <svg
      viewBox={tight === true ? '30 42 180 180' : '0 0 256 256'}
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
      <circle cx="120" cy="132" r="48" className={faceClassName} />
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
