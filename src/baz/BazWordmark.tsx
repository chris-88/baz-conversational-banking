import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BazMark } from '@/baz/BazMark'

/**
 * The name, with the mark set as its own letter.
 *
 * Baz's mark is a ring with two eyes, which is already very nearly a lowercase `a` — so it
 * becomes one. The header then carries the mark without carrying a second floating avatar
 * beside the word, which is what it would otherwise take to have both.
 *
 * The mark is the one coloured thing. The letters stay in the surrounding ink so the word reads
 * as a word first and a logo second.
 *
 * Accessibility: the whole thing is one image named "Baz". Spelling it out as B, a picture, and
 * z is how a screen reader ends up announcing a logo as two letters and an unlabelled graphic.
 */
export function BazWordmark({ className }: { readonly className?: string }): ReactNode {
  return (
    <span role="img" aria-label="Baz" className={cn('inline-flex items-baseline', className)}>
      <span aria-hidden>B</span>
      {/*
        Sized against the x-height rather than the font size, with a little over for the optical
        correction every round letter needs — a circle set to the exact x-height reads small
        beside flat-topped letters. `items-baseline` puts its bottom edge on the baseline, and
        the nudge carries it the rest of the way down to where a round glyph's overshoot sits.

        The side bearing is wider than a letter's would be. The mark is an outline where B and z
        are solid, so it needs air around it or the three run together into one dark shape.
      */}
      <span
        aria-hidden
        className="text-primary mx-[0.075em] inline-block h-[0.7em] w-[0.7em] translate-y-[0.07em]"
      >
        <BazMark tight faceClassName="fill-transparent" />
      </span>
      <span aria-hidden>z</span>
    </span>
  )
}
