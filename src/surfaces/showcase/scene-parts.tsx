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
      <div className={cn('relative flex h-full min-h-0 w-full min-w-0 items-center justify-center', className)}>
        {children}
      </div>
    )
  }
  return (
    <div className={cn('relative h-full min-h-0 w-full min-w-0', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={cueId} className="flex h-full w-full min-w-0 items-center justify-center" {...fade}>
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

/**
 * A card standing for one product journey, with the steps it makes a customer walk and,
 * when `fields` is given, the facts its form asks for. `style` moves the whole card, so a
 * drift reads as the journey moving, never as its contents sliding out of the frame.
 */
export function JourneyCard({
  icon,
  title,
  steps,
  fields,
  fieldsOn = 1,
  tone,
  style,
  className,
  ghost,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly steps: readonly string[]
  readonly fields?: readonly string[]
  readonly fieldsOn?: number
  readonly tone?: 'primary' | 'deep' | 'success'
  readonly style?: CSSProperties
  readonly className?: string
  readonly ghost?: boolean
}): ReactNode {
  return (
    <div style={style} className={cn('transition-opacity', ghost === true && 'opacity-40', className)}>
      <Surface lift className="w-[232px] p-4">
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
        {fields !== undefined && (
          <div className="mt-3 space-y-1.5 border-t pt-3" style={{ opacity: 0.25 + 0.75 * fieldsOn }}>
            {fields.map((field) => (
              <div
                key={field}
                className="bg-muted/60 flex h-7 items-center justify-between rounded-md border px-2 text-[11.5px]"
              >
                <span className="text-muted-foreground">{field}</span>
                <span
                  aria-hidden
                  className="bg-foreground/50 h-1.5 rounded-full"
                  style={{ width: `${String(Math.round(28 * fieldsOn))}px` }}
                />
              </div>
            ))}
          </div>
        )}
        <span className="bg-primary text-primary-foreground mt-3.5 block rounded-md px-3 py-1.5 text-center text-[12.5px] font-medium">
          Continue
        </span>
      </Surface>
    </div>
  )
}

/** An arrowhead, pointing right or down, the colour of the line it ends. */
function Head({ direction, style }: { readonly direction: 'right' | 'down'; readonly style?: CSSProperties }): ReactNode {
  return direction === 'right' ? (
    <svg aria-hidden viewBox="0 0 12 14" className="fill-primary h-3.5 w-3 shrink-0" style={style}>
      <path d="M0 0 L12 7 L0 14 Z" />
    </svg>
  ) : (
    <svg aria-hidden viewBox="0 0 14 12" className="fill-primary h-3 w-3.5 shrink-0" style={style}>
      <path d="M0 0 L14 0 L7 12 Z" />
    </svg>
  )
}

/**
 * A solid arrow, left to right, drawn as `draw` rises, with a label above it and a line of
 * detail beneath when there is something to say about what travels along it.
 *
 * In the product's blue, with a real head. The dashed hairlines and chevrons these replaced
 * did not read from the back of a room.
 */
export function Arrow({
  draw = 1,
  label,
  detail,
  className,
}: {
  readonly draw?: number
  readonly label?: string
  readonly detail?: string
  readonly className?: string
}): ReactNode {
  const d = settle(draw)
  const head = settle((draw - 0.8) / 0.2)
  return (
    <div className={cn('flex min-w-0 flex-col items-center justify-center', className)} style={{ opacity: 0.25 + 0.75 * d }}>
      {label !== undefined && (
        <span className="text-primary mb-2 text-center text-[11px] font-semibold tracking-wide uppercase">{label}</span>
      )}
      <div className="flex w-full items-center">
        <span
          aria-hidden
          className="bg-primary h-[3px] flex-1 rounded-full"
          style={{ transform: `scaleX(${String(d)})`, transformOrigin: 'left' }}
        />
        <Head direction="right" style={{ opacity: head, marginLeft: -1 }} />
      </div>
      {detail !== undefined && (
        <span className="text-muted-foreground mt-2 max-w-[22ch] text-center text-[11.5px] leading-snug">{detail}</span>
      )}
    </div>
  )
}

/**
 * One line that becomes many, or many that become one.
 *
 * `spread`: a stem from the top centre down to a bar, and from the bar one straight drop with
 * a head to the centre of each of `columns` equal columns beneath. `gather`: the reverse, a
 * drop from each column to the bar and one stem with a head down to whatever sits under it.
 * Drawn in order as `draw` rises, so the room sees the flow go the way the narrator says.
 */
export function Bus({
  columns,
  direction,
  draw = 1,
  className,
}: {
  readonly columns: number
  readonly direction: 'spread' | 'gather'
  readonly draw?: number
  readonly className?: string
}): ReactNode {
  const stem = settle(direction === 'spread' ? draw / 0.3 : (draw - 0.55) / 0.3)
  const bar = settle((draw - 0.28) / 0.3)
  const branch = (index: number): number =>
    settle(direction === 'spread' ? (draw - 0.5 - index * 0.04) / 0.3 : (draw - index * 0.04) / 0.3)
  const centre = (index: number): string => `${String(((index + 0.5) / columns) * 100)}%`
  const line = 'bg-primary absolute rounded-full'
  return (
    <div className={cn('relative h-16 w-full', className)} aria-hidden>
      {/* the bar, growing out from the middle */}
      <div
        className={cn(line, 'top-1/2 h-[3px] -translate-y-1/2')}
        style={{ left: centre(0), width: `${String(((columns - 1) / columns) * 100)}%`, transform: `translateY(-50%) scaleX(${String(bar)})` }}
      />
      {/* the stem */}
      <div
        className={cn(line, 'left-1/2 w-[3px] -translate-x-1/2', direction === 'spread' ? 'top-0 h-1/2' : 'top-1/2 h-1/2')}
        style={{ transform: `translateX(-50%) scaleY(${String(stem)})`, transformOrigin: direction === 'spread' ? 'top' : 'top' }}
      />
      {direction === 'gather' && (
        <Head direction="down" style={{ position: 'absolute', left: 'calc(50% - 7px)', bottom: -2, opacity: settle((stem - 0.8) / 0.2) }} />
      )}
      {/* the branches */}
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="absolute top-0 h-full" style={{ left: centre(index) }}>
          <div
            className={cn(line, 'w-[3px] -translate-x-1/2', direction === 'spread' ? 'top-1/2 h-1/2' : 'top-0 h-1/2')}
            style={{ transform: `translateX(-50%) scaleY(${String(branch(index))})`, transformOrigin: 'top' }}
          />
          {direction === 'spread' && (
            <Head direction="down" style={{ position: 'absolute', left: -7, bottom: -2, opacity: settle((branch(index) - 0.8) / 0.2) }} />
          )}
        </div>
      ))}
    </div>
  )
}
