import { Code } from '@/components/Code'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon, PlayIcon, SparklesIcon, SquareCodeIcon } from 'lucide-react'
import { architecture as copy } from '@/content/how-it-works/copy'
import {
  boundary,
  codeCallouts,
  codeSample,
  stages,
  type Stage,
} from '@/content/how-it-works/architecture'
import { Claim, Decider, Reveal, SectionHead, StepBadge, Surface, Tile } from './parts'
import { Button } from '@/components/ui/button'
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
  // Opens on the first stage: an empty panel the height of a filled one is just a hole.
  const [at, setAt] = useState<number | null>(0)
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
    <section id="architecture" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={play} disabled={playing}>
          <PlayIcon className="size-3.5" />
          {playing ? 'Playing…' : 'Replay this turn'}
        </Button>
        <p className="text-muted-foreground text-[12.5px]">Or tap any stage.</p>
      </div>

      {/* Horizontal on a wide screen, stacked on a narrow one. Never horizontally scrolling. */}
      <ol className="mt-5 grid gap-2 lg:grid-cols-5">
        {stages.map((stage, index) => (
          <li key={stage.id} className="relative">
            {index > 0 && (
              <ArrowRightIcon
                aria-hidden
                className="text-muted-foreground/40 absolute top-1/2 -left-[13px] hidden size-3 -translate-y-1/2 lg:block"
              />
            )}
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

      <Surface
        lift
        className="mt-3 min-h-[9rem] p-5"
        aria-live="polite"
        /* The replay's state in words, so a screen reader gets the content and not the motion. */
        aria-label={active === null ? 'No stage selected' : `${active.name}: ${active.oneLine}`}
      >
        {active === null ? (
          <p className="text-muted-foreground text-[13px]">
            Pick a stage, or replay the turn, to see what happens at each one.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <Tile tone={active.isModel ? 'model' : 'code'} size="sm">
                {active.isModel ? <SparklesIcon /> : <SquareCodeIcon />}
              </Tile>
              <h3 className="text-[15px] font-semibold">{active.name}</h3>
              <Decider decides={active.isModel ? 'model' : 'code'}>
                {active.isModel ? 'Model judgement' : 'Deterministic'}
              </Decider>
            </div>
            <ul className="mt-3 space-y-1.5">
              {active.detail.map((line) => (
                <li key={line} className="text-muted-foreground relative pl-4 text-[13px] leading-relaxed">
                  <span aria-hidden className="bg-border absolute top-[0.6em] left-0 size-1.5 rounded-full" />
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}
      </Surface>

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
        'bg-card focus-visible:ring-ring h-full w-full rounded-xl border p-3.5 text-left shadow-xs transition-all focus-visible:ring-2 focus-visible:outline-none',
        active
          ? 'border-primary/40 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_-12px_rgba(16,24,40,0.25)]'
          : 'hover:border-foreground/15',
        stage.isModel ? 'border-t-decides-model border-t-[3px]' : 'border-t-decides-code border-t-[3px]',
      )}
    >
      <div className="flex items-center gap-2">
        <StepBadge n={index + 1} tone={active ? 'primary' : 'muted'} />
        <motion.span
          className="min-w-0 text-[13.5px] leading-tight font-semibold"
          {...(still || !active ? {} : { initial: { opacity: 0.6 }, animate: { opacity: 1 } })}
        >
          {stage.name}
        </motion.span>
      </div>
      <span className="text-muted-foreground mt-2 block text-[12px] leading-snug">
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
            <Surface accent={index === 0 ? 'model' : 'code'} className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <Tile tone={index === 0 ? 'model' : 'code'} size="sm">
                  {index === 0 ? <SparklesIcon /> : <SquareCodeIcon />}
                </Tile>
                <div>
                  <h3 className="text-[15px] font-semibold">{side.title}</h3>
                  <p className="text-muted-foreground text-[12px]">{side.oneLine}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-3.5">
                {side.items.map((item) => (
                  <div key={item.what} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <dt className="text-[13.5px] font-medium">{item.what}</dt>
                    <dd className="text-muted-foreground mt-1 font-mono text-[11.5px] leading-relaxed">
                      {item.example}
                    </dd>
                  </div>
                ))}
              </dl>
            </Surface>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <blockquote className="bg-brand-deep text-brand-deep-foreground mt-6 rounded-xl px-6 py-5 text-[17px] leading-snug font-semibold text-balance sm:text-xl">
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
        <Surface lift className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <span className="text-muted-foreground font-mono text-[11px]">a turn, reduced</span>
            <Claim kind="poc" />
          </div>
          <Code text={codeSample} language="ts" />
        </Surface>

        <ul className="space-y-2.5">
          {codeCallouts.map((callout) => (
            <li key={callout.line}>
              <Surface className="p-3.5">
                <code className="bg-muted text-code-key rounded-md px-2 py-1 font-mono text-[11.5px]">
                  {callout.line}
                </code>
                <p className="text-muted-foreground mt-2.5 text-[12.5px] leading-relaxed">
                  {callout.note}
                </p>
              </Surface>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
