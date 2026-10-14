import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * The pieces the explainer is built from.
 *
 * One file because they are only meaningful together: every diagram on the page uses the same
 * two colours to say who decides a thing, and a reader who learns the pairing once should never
 * meet a panel that quietly breaks it.
 */

/** Which half of the system makes a decision. The page's whole argument, as a type. */
export type Decides = 'code' | 'model'

export function Eyebrow({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.13em] uppercase">
      {children}
    </p>
  )
}

export function Section({
  eyebrow,
  title,
  lede,
  children,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly lede?: ReactNode
  readonly children?: ReactNode
}): ReactNode {
  return (
    <section className="border-border border-b py-10 last:border-b-0 sm:py-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
      {lede ? <p className="mt-4 max-w-[62ch] text-base text-pretty">{lede}</p> : null}
      {children}
    </section>
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
        'inline-block rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.07em] uppercase',
        decides === 'code'
          ? 'bg-decides-code/12 text-decides-code'
          : 'bg-decides-model/12 text-decides-model',
      )}
    >
      {children}
    </span>
  )
}

/**
 * A bordered block, with its top edge coloured by who decides what is inside it.
 *
 * The colour is on the top border rather than the whole card because a page of fully tinted
 * cards reads as decoration; one edge reads as a classification.
 */
export function Panel({
  decides,
  title,
  children,
  className,
}: {
  readonly decides?: Decides
  readonly title?: string
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  return (
    <div
      className={cn(
        'bg-card rounded-md border p-5',
        decides === 'code' && 'border-t-decides-code border-t-[3px]',
        decides === 'model' && 'border-t-decides-model border-t-[3px]',
        className,
      )}
    >
      {title ? <h3 className="mb-2 text-base font-semibold">{title}</h3> : null}
      {children}
    </div>
  )
}

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
        'text-muted-foreground max-w-[62ch] space-y-3 text-sm leading-relaxed',
        '[&_strong]:text-foreground [&_strong]:font-semibold',
        '[&_em]:text-foreground [&_em]:not-italic [&_em]:font-medium',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The legend, which is also the thesis. Shown once, at the top. */
export function Legend(): ReactNode {
  const items: readonly { readonly decides: Decides; readonly name: string; readonly gloss: string }[] =
    [
      {
        decides: 'code',
        name: 'Deterministic',
        gloss:
          'Ordinary code. Same input, same output, covered by tests. It cannot be talked out of it.',
      },
      {
        decides: 'model',
        name: 'Model judgement',
        gloss: 'Where a language model is genuinely better: phrasing, inference, tone.',
      },
    ]

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-1.5 size-3 shrink-0 rounded-[3px]',
              item.decides === 'code' ? 'bg-decides-code' : 'bg-decides-model',
            )}
          />
          <p className="text-muted-foreground text-sm leading-snug">
            <strong className="text-foreground font-semibold">{item.name}.</strong> {item.gloss}
          </p>
        </div>
      ))}
    </div>
  )
}

/** A row of counted facts. Used once per tab, where the figures are the point. */
export function Figures({
  items,
}: {
  readonly items: readonly { readonly value: string; readonly label: string }[]
}): ReactNode {
  return (
    <div className="bg-border mt-7 grid gap-px overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card p-4">
          <span className="block text-2xl font-bold tracking-tight tabular-nums">{item.value}</span>
          <span className="text-muted-foreground mt-1 block text-xs leading-snug">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * What kind of claim this is.
 *
 * The page makes three different kinds and a reader has to be able to tell them apart without
 * reading carefully: something the prototype actually does, something a production system
 * would do, and a number somebody worked out. Spec §26 asks for exactly this, and it is also
 * the difference between a case study and a sales deck.
 */
export type ClaimKind = 'poc' | 'production' | 'illustrative' | 'synthetic' | 'measured'

const CLAIM: Readonly<Record<ClaimKind, { readonly text: string; readonly tone: string }>> = {
  poc: { text: 'POC', tone: 'bg-primary/10 text-primary' },
  production: { text: 'Production direction', tone: 'bg-muted text-muted-foreground' },
  illustrative: { text: 'Illustrative', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  synthetic: { text: 'Synthetic example', tone: 'bg-muted text-muted-foreground' },
  measured: {
    text: 'Measured',
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
}

export function Claim({ kind }: { readonly kind: ClaimKind }): ReactNode {
  const claim = CLAIM[kind]
  return (
    <span
      className={cn(
        'inline-block rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.07em] uppercase',
        claim.tone,
      )}
    >
      {claim.text}
    </span>
  )
}

/**
 * An editorial reveal that does nothing when motion is not wanted.
 *
 * Reduced motion gets the final state immediately rather than a faster animation: somebody who
 * has asked for no movement has not asked for quicker movement. Nothing on this page is only
 * legible once it has animated, which is the rule that makes that safe.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  readonly children: ReactNode
  readonly delay?: number
  readonly className?: string
}): ReactNode {
  const still = useReducedMotion()

  if (still === true) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** A measured figure, with the measurement that produced it. */
export function SourcedFigures({
  items,
}: {
  readonly items: readonly {
    readonly value: string
    readonly label: string
    readonly basis: string
  }[]
}): ReactNode {
  return (
    <div className="bg-border mt-7 grid gap-px overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card p-4">
          <span className="block text-2xl font-bold tracking-tight tabular-nums">{item.value}</span>
          <span className="text-muted-foreground mt-1 block text-xs leading-snug">
            {item.label}
          </span>
          <span className="text-muted-foreground/70 mt-2 block text-[11px] leading-snug">
            {item.basis}
          </span>
        </div>
      ))}
    </div>
  )
}
