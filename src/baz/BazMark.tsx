import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Baz's face mark, from the supplied dev kit (`svg/baz-face-mark.svg`).
 *
 * The kit's use for it is narrow and worth keeping to: the chat avatar and the zero state, and
 * not as a logo beside the name — that is the wordmark's job, and the kit is explicit that the
 * full wordmark is not a chat avatar either.
 *
 * It is drawn here rather than imported as a file for two reasons. The orbit dot has to move on
 * its own, which a single `<img>` cannot do. And it has to be able to take a colour: the kit
 * supplies a blue and a black variant of the same artwork, which is `currentColor` wearing two
 * hats.
 *
 * Geometry is the kit's exactly — a solid disc with a white counter punched out of it, not a
 * stroked ring. The two look similar at a glance and are not the same: the kit's wall is 30
 * units on a 78 radius where a 24-unit stroke centred on 78 would be thinner and reach further
 * out, which also changes whether the orbit dot touches. It does not. It sits clear of the
 * disc by about six units, and that gap is the mark.
 *
 * Nothing here is a raster image and nothing animates but `transform` and `opacity`, which is
 * what keeps it at sixty frames on a phone (opening-transition spec §15).
 */
export function BazMark({
  className,
  breathing = false,
  title,
}: {
  readonly className?: string
  /**
   * Idle motion, for the hero state only (spec §3).
   *
   * A slow scale and a drifting dot — no bounce, no halo, no spin. The spec is explicit about
   * which of those reads as present and which reads as a gimmick.
   */
  readonly breathing?: boolean
  /**
   * An accessible name. Omitted where visible "Baz" text sits beside it, which is the usual
   * case — a decorative repeat of an adjacent word is noise to a screen reader (spec §16).
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
      <circle cx="120" cy="132" r="78" fill="currentColor" />
      {/*
        White, not the page colour. The face is white in the kit on every ground it supplies,
        including the dark one — it is part of the artwork rather than a hole for the background
        to show through.
      */}
      <circle cx="120" cy="132" r="48" fill="#ffffff" />
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
