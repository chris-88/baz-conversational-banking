import type { ReactNode } from 'react'
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
        gloss: 'Where a language model is genuinely better — phrasing, inference, tone.',
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
