import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

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

/** Which half of the system makes a decision. The page's whole argument, as a type. */
export type Decides = 'code' | 'model'

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

/**
 * A white card on the page's tinted surface.
 *
 * The elevation is the point: it is what makes a panel read as a specimen rather than as more
 * copy. `lift` is for the two or three things a reader should land on first.
 */
export function Surface({
  children,
  className,
  lift,
  accent,
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly lift?: boolean
  readonly accent?: Decides
}): ReactNode {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border',
        lift === true
          ? 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.22)]'
          : 'shadow-xs',
        accent === 'code' && 'border-t-decides-code border-t-[3px]',
        accent === 'model' && 'border-t-decides-model border-t-[3px]',
        className,
      )}
    >
      {children}
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
export type ClaimKind = 'poc' | 'production' | 'illustrative' | 'synthetic' | 'measured'

const CLAIM: Readonly<Record<ClaimKind, { readonly text: string; readonly tone: string }>> = {
  poc: { text: 'POC', tone: 'bg-primary/10 text-primary' },
  production: { text: 'Production direction', tone: 'bg-muted text-muted-foreground' },
  illustrative: { text: 'Illustrative', tone: 'bg-warning-border/30 text-warning-foreground' },
  synthetic: { text: 'Synthetic example', tone: 'bg-muted text-muted-foreground' },
  measured: { text: 'Measured', tone: 'bg-success/10 text-success' },
}

export function Claim({ kind }: { readonly kind: ClaimKind }): ReactNode {
  const claim = CLAIM[kind]
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase',
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
 * asked for no movement has not asked for quicker movement.
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
  const still = useReducedMotion() === true

  /*
   * `min-w-0` because this is nearly always a grid or flex child, and a grid child defaults to
   * a minimum of its content. One `truncate` line inside a card, which is `white-space: nowrap`,
   * then sets the column's minimum to the full length of the string it was supposed to be
   * truncating, and the page gains a horizontal scrollbar on a phone.
   */
  if (still) return <div className={cn('min-w-0', className)}>{children}</div>

  return (
    <motion.div
      className={cn('min-w-0', className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

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

/** The tinted tile that fronts anything worth noticing. Tones are tokens, never invented. */
export function Tile({
  children,
  tone = 'primary',
  size = 'md',
}: {
  readonly children: ReactNode
  readonly tone?: 'primary' | 'success' | 'deep' | 'warning' | 'code' | 'model' | 'savings' | 'loan'
  readonly size?: 'sm' | 'md'
}): ReactNode {
  const tones: Readonly<Record<string, string>> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    deep: 'bg-brand-deep/10 text-brand-deep',
    warning: 'bg-warning-border/30 text-warning-foreground',
    code: 'bg-decides-code/10 text-decides-code',
    model: 'bg-decides-model/10 text-decides-model',
    savings: 'bg-product-savings/10 text-product-savings',
    loan: 'bg-product-personal-loan/10 text-product-personal-loan',
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg',
        size === 'sm' ? 'size-7 [&>svg]:size-3.5' : 'size-9 [&>svg]:size-4',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

/**
 * A measured figure, sized so it is read before the sentence beside it.
 *
 * The basis sits on the card rather than in a footnote, because a number whose provenance is
 * somewhere else is a number nobody checks.
 */
export function Stat({
  value,
  label,
  basis,
  icon,
  tone = 'primary',
}: {
  readonly value: string
  readonly label: string
  readonly basis?: string
  readonly icon?: ReactNode
  readonly tone?: 'primary' | 'success' | 'deep' | 'warning'
}): ReactNode {
  return (
    <Surface className="h-full p-5">
      {icon ? (
        <div className="mb-3">
          <Tile tone={tone}>{icon}</Tile>
        </div>
      ) : null}
      <p
        className={cn(
          'text-[1.75rem] leading-none font-bold tracking-tight tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'primary' && 'text-primary',
          tone === 'deep' && 'text-brand-deep',
          tone === 'warning' && 'text-warning-foreground',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[13px] leading-snug font-medium">{label}</p>
      {basis === undefined ? null : (
        <p className="text-muted-foreground mt-1.5 text-[11.5px] leading-snug">{basis}</p>
      )}
    </Surface>
  )
}

/**
 * Code, coloured.
 *
 * A hand-rolled tokeniser rather than a highlighting library: there are three kinds of block on
 * this page and the alternative was several hundred kilobytes to colour forty lines. It builds
 * React nodes rather than HTML, so nothing here can inject markup.
 */
export function Code({
  text,
  language,
  className,
}: {
  readonly text: string
  readonly language: 'json' | 'wire' | 'ts'
  readonly className?: string
}): ReactNode {
  return (
    <pre
      className={cn('overflow-x-auto font-mono text-[12px] leading-[1.7] whitespace-pre', className)}
    >
      <code>
        {text.split('\n').map((line, index) => (
          <span key={`${String(index)}-${line}`} className="block">
            {colour(line, language)}
          </span>
        ))}
      </code>
    </pre>
  )
}

/** One line, split into coloured spans. Deliberately small: it only handles these blocks. */
function colour(line: string, language: 'json' | 'wire' | 'ts'): ReactNode {
  if (language === 'wire') {
    const match = /^(\s*)([\w[\].]+)(\s*=\s*)(.*)$/.exec(line)
    if (!match) return line
    return (
      <>
        {match[1]}
        <span className="text-code-key">{match[2]}</span>
        <span className="text-muted-foreground">{match[3]}</span>
        <span className="text-code-string">{match[4]}</span>
      </>
    )
  }

  if (language === 'ts') {
    if (line.trim().startsWith('//')) return <span className="text-code-comment">{line}</span>
    return line
      .split(/(\b(?:const|return|await|if|import|from)\b)/g)
      .map((part, index) =>
        /^(const|return|await|if|import|from)$/.test(part) ? (
          <span key={`${String(index)}-${part}`} className="text-code-keyword">
            {part}
          </span>
        ) : (
          <span key={`${String(index)}-${part}`}>{part}</span>
        ),
      )
  }

  return line
    .split(
      /("(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g,
    )
    .map((part, index) => {
      const key = `${String(index)}-${part}`
      if (/^"(?:[^"\\]|\\.)*"\s*:$/.test(part)) {
        return (
          <span key={key} className="text-code-key">
            {part}
          </span>
        )
      }
      if (/^"(?:[^"\\]|\\.)*"$/.test(part)) {
        return (
          <span key={key} className="text-code-string">
            {part}
          </span>
        )
      }
      if (/^(\d|true|false|null)/.test(part)) {
        return (
          <span key={key} className="text-code-number">
            {part}
          </span>
        )
      }
      return <span key={key}>{part}</span>
    })
}

/**
 * A miniature of a real interface, for the before and after of a pivot.
 *
 * Text lists did not work. "Products, Plans, Applications, Navigation" reads as four words,
 * where four stacked tiles read as the screen somebody deleted, and the deleting is the point
 * of that whole section.
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
