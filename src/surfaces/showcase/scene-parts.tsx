import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { DURATION, EASE, STAGGER, fade } from '@/lib/motion'
import { Surface, Tile } from '@/components/Primitives'
import { cn } from '@/lib/utils'
import { settle } from './ease'

/**
 * The pieces the two choreographed chapters are drawn with.
 *
 * Two rules. Anything that enters does so with the product's own entry motion, staggered.
 * Anything that moves during a cue moves as a function of the cue's progress, applied as an
 * inline transform, so pausing freezes it and seeking lands it. Under `still` nothing enters
 * and progress reads as complete.
 */

/** The visual half of a chapter, cross-faded when the cue changes. */
export function Visual({
  cueId,
  still,
  children,
  className,
}: {
  readonly cueId: string
  readonly still: boolean
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  if (still) {
    return (
      <div className={cn('relative flex h-full min-h-0 w-full items-center justify-center', className)}>
        {children}
      </div>
    )
  }
  return (
    <div className={cn('relative h-full min-h-0 w-full', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={cueId} className="flex h-full w-full items-center justify-center" {...fade}>
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  )
}

/** An entry in a sequence: rises and fades in, `order` steps after the first. */
export function Arrive({
  order = 0,
  still,
  children,
  className,
}: {
  readonly order?: number
  readonly still: boolean
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  if (still) {
    return <div className={className}>{children}</div>
  }
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, delay: order * STAGGER, ease: EASE }}
    >
      {children}
    </m.div>
  )
}

/** A thing in a diagram: a tile and a name, optionally a second line. */
export function Node({
  icon,
  label,
  detail,
  tone = 'primary',
  size = 'md',
  className,
  emphasis,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly detail?: string
  readonly tone?: 'primary' | 'deep' | 'success' | 'warning' | 'code' | 'model'
  readonly size?: 'md' | 'lg'
  readonly className?: string
  /** Ring it, for the thing the narrator is pointing at. */
  readonly emphasis?: boolean
}): ReactNode {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-2xl transition-shadow',
          size === 'lg' ? 'size-20 [&>svg]:size-9' : 'size-14 [&>svg]:size-6',
          tone === 'primary' && 'bg-primary/10 text-primary',
          tone === 'deep' && 'bg-brand-deep/10 text-brand-deep',
          tone === 'success' && 'bg-success/10 text-success',
          tone === 'warning' && 'bg-warning-border/30 text-warning-foreground',
          tone === 'code' && 'bg-decides-code/10 text-decides-code',
          tone === 'model' && 'bg-decides-model/10 text-decides-model',
          emphasis === true && 'ring-primary/40 ring-4 ring-offset-2',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className={cn('mt-3 font-semibold', size === 'lg' ? 'text-lg' : 'text-[15px]')}>{label}</span>
      {detail !== undefined && (
        <span className="text-muted-foreground mt-0.5 max-w-[18ch] text-[12.5px] leading-snug">{detail}</span>
      )}
    </div>
  )
}

/** A small labelled pill, for a need found or a thing said. */
export function Chip({
  children,
  tone = 'muted',
  icon,
  className,
  style,
}: {
  readonly children: ReactNode
  readonly tone?: 'muted' | 'primary' | 'deep'
  readonly icon?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}): ReactNode {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium [&>svg]:size-3.5',
        tone === 'muted' && 'bg-card text-foreground',
        tone === 'primary' && 'border-primary/20 bg-primary/10 text-primary',
        tone === 'deep' && 'border-brand-deep/20 bg-brand-deep/10 text-brand-deep',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** A card standing for one product journey, with the steps it makes a customer walk. */
export function JourneyCard({
  icon,
  title,
  steps,
  tone,
  style,
  className,
  ghost,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly steps: readonly string[]
  readonly tone?: 'primary' | 'deep' | 'success'
  readonly style?: CSSProperties
  readonly className?: string
  readonly ghost?: boolean
}): ReactNode {
  return (
    <Surface
      lift
      className={cn('w-[220px] p-4 transition-opacity', ghost === true && 'opacity-40', className)}
    >
      <div style={style}>
        <div className="flex items-center gap-2.5">
          <Tile tone={tone ?? 'primary'} size="sm">
            {icon}
          </Tile>
          <p className="text-[15px] font-semibold">{title}</p>
        </div>
        <ul className="mt-3 space-y-1.5">
          {steps.map((step) => (
            <li key={step} className="text-muted-foreground flex items-center gap-2 text-[12.5px]">
              <span aria-hidden className="bg-muted-foreground/40 size-1.5 rounded-full" />
              {step}
            </li>
          ))}
        </ul>
        <span className="bg-primary text-primary-foreground mt-3.5 block rounded-md px-3 py-1.5 text-center text-[12.5px] font-medium">
          Continue
        </span>
      </div>
    </Surface>
  )
}

/**
 * A dashed connector between two things in a diagram.
 *
 * Drawn in a full-size SVG over the diagram so it does not fight the layout. Coordinates are
 * fractions of the box, and `draw` is how much of it is drawn, from the cue's progress.
 */
export function Link({
  from,
  to,
  draw = 1,
  tone = 'muted',
  arrow,
}: {
  readonly from: readonly [number, number]
  readonly to: readonly [number, number]
  readonly draw?: number
  readonly tone?: 'muted' | 'primary'
  readonly arrow?: boolean
}): ReactNode {
  const x1 = from[0] * 100
  const y1 = from[1] * 100
  const x2 = x1 + (to[0] * 100 - x1) * settle(draw)
  const y2 = y1 + (to[1] * 100 - y1) * settle(draw)
  const colour = tone === 'primary' ? 'var(--primary)' : 'var(--muted-foreground)'
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colour}
        strokeOpacity={tone === 'primary' ? 0.7 : 0.45}
        strokeWidth={0.5}
        strokeDasharray="1.4 1.2"
        vectorEffect="non-scaling-stroke"
      />
      {arrow === true && draw >= 0.98 && (
        <circle cx={x2} cy={y2} r={0.9} fill={colour} fillOpacity={tone === 'primary' ? 0.9 : 0.6} />
      )}
    </g>
  )
}

/** The layer an SVG of `Link`s sits in. */
export function Wires({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {children}
    </svg>
  )
}
