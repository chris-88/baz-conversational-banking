import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Decides } from '@/components/Primitives'

/*
 * The pieces that turned out to be the product's, not the page's, live in
 * `src/components/Primitives.tsx` now and are re-exported here so nothing on this page had to
 * change to keep using them. What remains in this file is specific to the explainer.
 */
export { Claim, Reveal, Stat, Surface, Tile } from '@/components/Primitives'
export type { ClaimKind, Decides } from '@/components/Primitives'

/**
 * The pieces the explainer is built from.
 *
 * One file because they are only meaningful together. The page argues about a boundary — what
 * ordinary code decides against what a model decides — and carries that in two colours from the
 * first diagram to the last. A reader learns the pairing once and then reads it everywhere.
 *
 * The visual rules, which the first version of this page broke by having none:
 *
 *   - the page sits on a tinted surface and the evidence sits on white cards above it, so
 *     evidence looks like evidence rather than more paragraphs;
 *   - anything countable gets a tile, a colour and a size, because a wall of equal grey text is
 *     unreadable however good the sentences are;
 *   - colour is semantic. Tones come from the token set and mean something: who decides, what
 *     kind of claim it is, which product;
 *   - nothing is only legible once it has animated.
 */

export function Eyebrow({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
      {children}
    </p>
  )
}

/** Every chapter opens the same way, so the page has a rhythm rather than a layout per section. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  aside,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly lede?: ReactNode
  readonly aside?: ReactNode
}): ReactNode {
  /*
   * Title on the left, lede on the right, which is how a magazine opens a piece and why this
   * page needed it. A single narrow column with the right third of the measure left empty is
   * what made the first build read as a column of notes rather than something designed.
   */
  return (
    <div className="grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 max-w-[20ch] text-[1.75rem] leading-[1.1] font-bold tracking-tight text-balance sm:text-[2.25rem]">
          {title}
        </h2>
      </div>

      <div className="lg:pt-7">
        {lede ? (
          <div className="text-muted-foreground max-w-[54ch] space-y-3 text-[15px] leading-relaxed">
            {lede}
          </div>
        ) : null}
        {aside}
      </div>
    </div>
  )
}

/** A small label saying which half of the system owns something. */
export function Decider({
  decides,
  children,
}: {
  readonly decides: Decides
  readonly children: ReactNode
}): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        decides === 'code'
          ? 'bg-decides-code/10 text-decides-code'
          : 'bg-decides-model/10 text-decides-model',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          decides === 'code' ? 'bg-decides-code' : 'bg-decides-model',
        )}
      />
      {children}
    </span>
  )
}

/**
 * What kind of claim this is.
 *
 * The page makes three different kinds and a reader has to be able to tell them apart at a
 * glance: something the prototype does, something a production system would do, and a number
 * somebody worked out.
 */

/** The numbered badge that fronts a step, a stage or a panel. */
export function StepBadge({
  n,
  tone = 'muted',
}: {
  readonly n: number
  readonly tone?: 'muted' | 'primary'
}): ReactNode {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums',
        tone === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {n}
    </span>
  )
}

/**
 * Code, coloured.
 *
 * A hand-rolled tokeniser rather than a highlighting library: there are three kinds of block on
 * this page and the alternative was several hundred kilobytes to colour forty lines. It builds
 * React nodes rather than HTML, so nothing here can inject markup.
 */

export function MiniRow({
  label,
  tone = 'neutral',
  ghost,
}: {
  readonly label: string
  readonly tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'loan'
  readonly ghost?: boolean
}): ReactNode {
  const tones: Readonly<Record<string, string>> = {
    neutral: 'bg-muted-foreground/25',
    primary: 'bg-primary/60',
    success: 'bg-success/60',
    warning: 'bg-warning-border',
    loan: 'bg-product-personal-loan/50',
  }

  return (
    <div
      className={cn(
        'bg-card flex items-center gap-2 rounded-lg border px-2.5 py-2 shadow-xs',
        ghost === true && 'opacity-35',
      )}
    >
      <span aria-hidden className={cn('size-4 shrink-0 rounded', tones[tone])} />
      <span className="truncate text-[11.5px] font-medium">{label}</span>
    </div>
  )
}

/** A chat bubble at miniature scale, for the same reason. */
export function MiniBubble({
  children,
  from,
}: {
  readonly children: ReactNode
  readonly from: 'customer' | 'baz'
}): ReactNode {
  return (
    <p
      className={cn(
        'w-fit max-w-[92%] rounded-xl px-2.5 py-1.5 text-[11.5px] leading-snug',
        from === 'customer'
          ? 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
          : 'bg-muted rounded-bl-sm',
      )}
    >
      {children}
    </p>
  )
}

/** Prose, kept to a readable measure. */
export function Prose({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  return (
    <div
      className={cn(
        'text-muted-foreground max-w-[62ch] space-y-3 text-[15px] leading-relaxed',
        '[&_strong]:text-foreground [&_strong]:font-semibold',
        className,
      )}
    >
      {children}
    </div>
  )
}
