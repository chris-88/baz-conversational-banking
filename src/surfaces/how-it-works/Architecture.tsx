import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { PlayIcon } from 'lucide-react'
import { architecture as copy } from '@/content/how-it-works/copy'
import {
  boundary,
  codeCallouts,
  codeSample,
  stages,
  type Stage,
} from '@/content/how-it-works/architecture'
import { Decider, Eyebrow, Prose, Reveal } from './parts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** How long each stage holds during a replay. Five stages, about three and a half seconds. */
const STEP_MS = 700

/**
 * One turn, stage by stage.
 *
 * The replay exists to make a single point visible: four of the five stages are ordinary code,
 * and the one that is not is the only one allowed to be approximately right.
 *
 * It can be played, and it can be scrubbed by tapping a stage, because an animation somebody
 * cannot control is a video. Under reduced motion the pulse does not run and tapping still
 * works, which leaves the whole section usable with no movement at all.
 */
export function Architecture(): ReactNode {
  const [at, setAt] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const still = useReducedMotion() === true

  const active = at === null ? null : (stages[at] ?? null)

  const play = useCallback(() => {
    clearTimeout(timer.current)
    setPlaying(true)
    setAt(0)

    const step = (index: number): void => {
      if (index >= stages.length - 1) {
        setPlaying(false)
        return
      }
      timer.current = setTimeout(() => {
        setAt(index + 1)
        step(index + 1)
      }, STEP_MS)
    }

    step(0)
  }, [])

  useEffect(() => () => {
    clearTimeout(timer.current)
  }, [])

  return (
    <section id="architecture" className="scroll-mt-20 border-b py-10 sm:py-14">
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {copy.title}
      </h2>
      <Prose className="mt-4">
        {copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Prose>

      <div className="mt-7 flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={play} disabled={playing}>
          <PlayIcon className="size-3.5" />
          {playing ? 'Playing…' : 'Replay this turn'}
        </Button>
        <p className="text-muted-foreground text-xs">Or tap any stage.</p>
      </div>

      {/* Horizontal on a wide screen, stacked on a narrow one. Never horizontally scrolling. */}
      <ol className="mt-4 grid gap-2 lg:grid-cols-5">
        {stages.map((stage, index) => (
          <li key={stage.id}>
            <StageButton
              stage={stage}
              index={index}
              active={at === index}
              still={still}
              onSelect={() => {
                clearTimeout(timer.current)
                setPlaying(false)
                setAt(index)
              }}
            />
          </li>
        ))}
      </ol>

      <Card
        className="mt-3 min-h-[8.5rem] p-4"
        aria-live="polite"
        /* The replay's state in words, so a screen reader gets the content and not the motion. */
        aria-label={active === null ? 'No stage selected' : `${active.name}: ${active.oneLine}`}
      >
        {active === null ? (
          <p className="text-muted-foreground text-sm">
            Pick a stage, or replay the turn, to see what happens at each one.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{active.name}</h3>
              <Decider decides={active.isModel ? 'model' : 'code'}>
                {active.isModel ? 'Model judgement' : 'Deterministic'}
              </Decider>
            </div>
            <ul className="mt-2 space-y-1.5">
              {active.detail.map((line) => (
                <li key={line} className="text-muted-foreground text-sm leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Boundary />
      <CodeReveal />
    </section>
  )
}

function StageButton({
  stage,
  index,
  active,
  still,
  onSelect,
}: {
  readonly stage: Stage
  readonly index: number
  readonly active: boolean
  readonly still: boolean
  readonly onSelect: () => void
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'step' : undefined}
      className={cn(
        'focus-visible:ring-ring h-full w-full rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
        active ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50',
        stage.isModel ? 'border-t-decides-model border-t-[3px]' : 'border-t-decides-code border-t-[3px]',
      )}
    >
      <span className="text-muted-foreground font-mono text-[10.5px] tracking-[0.1em]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <motion.span
        className="mt-0.5 block text-sm font-semibold"
        {...(still || !active ? {} : { initial: { opacity: 0.6 }, animate: { opacity: 1 } })}
      >
        {stage.name}
      </motion.span>
      <span className="text-muted-foreground mt-1 block text-xs leading-snug">
        {stage.oneLine}
      </span>
    </button>
  )
}

/** Two columns, because the argument is a boundary and a boundary needs both sides visible. */
function Boundary(): ReactNode {
  return (
    <div className="mt-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {([boundary.ai, boundary.deterministic] as const).map((side, index) => (
          <Reveal key={side.title} delay={index * 0.05}>
            <Card
              className={cn(
                'h-full gap-0 p-5',
                index === 0
                  ? 'border-t-decides-model border-t-[3px]'
                  : 'border-t-decides-code border-t-[3px]',
              )}
            >
              <h3 className="text-base font-semibold">{side.title}</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{side.oneLine}</p>
              <dl className="mt-4 space-y-3">
                {side.items.map((item) => (
                  <div key={item.what}>
                    <dt className="text-sm font-medium">{item.what}</dt>
                    <dd className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {item.example}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <blockquote className="border-primary/40 mt-6 border-l-2 pl-4 text-base leading-relaxed font-medium text-pretty sm:text-lg">
          {boundary.quote}
        </blockquote>
      </Reveal>
    </div>
  )
}

/**
 * One code block, chosen for shape rather than syntax.
 *
 * Nine lines that carry the whole architecture: classify before anything else, build the
 * context from controlled data, hand over a bounded set of tools.
 */
function CodeReveal(): ReactNode {
  return (
    <Reveal className="mt-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="bg-foreground/95 min-w-0 overflow-hidden rounded-md">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
            <span className="text-background/60 font-mono text-[11px]">a turn, reduced</span>
          </div>
          <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
            <code className="text-background/90">{codeSample}</code>
          </pre>
        </div>

        <ul className="space-y-3">
          {codeCallouts.map((callout) => (
            <li key={callout.line} className="rounded-md border p-3">
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {callout.line}
              </code>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{callout.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
