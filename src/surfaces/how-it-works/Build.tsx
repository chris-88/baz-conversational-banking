import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon, CheckIcon, GitCommitIcon, SparklesIcon, UserRoundIcon } from 'lucide-react'
import { build as copy, buildingWithAi } from '@/content/how-it-works/copy'
import { pivots, type Pivot } from '@/content/how-it-works/pivots'
import metrics from '@/content/how-it-works/build-metrics.json'
import { Reveal, SectionHead, StepBadge, Surface, Tile } from './parts'
import { PivotMini } from './PivotMini'
import { cn } from '@/lib/utils'

/**
 * How the product got here, which is not how it started.
 *
 * Each pivot shows what it replaced. The before is not a caricature: those were real screens
 * and real questions that somebody built and then deleted, and the page is more convincing for
 * showing the work that was thrown away than it would be for claiming foresight.
 */
export function Build(): ReactNode {
  return (
    <section id="build" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <ol className="mt-9 space-y-3">
        {pivots.map((pivot, index) => (
          <li key={pivot.id}>
            <PivotRow pivot={pivot} index={index} />
          </li>
        ))}
      </ol>

      <BuildingWithAi />
    </section>
  )
}

/**
 * One change, with what it replaced still on screen beside it.
 *
 * This was a toggle, and a toggle was wrong twice over. It made the reader operate a control
 * before the section said anything, and it showed one state at a time when the entire point is
 * the difference between two. Both are here now, the old one dimmed and the new one live, with
 * the move between them drawn rather than described.
 *
 * Nothing has to be clicked, nothing has to animate, and the row reads at a glance with motion
 * switched off, which is the test every interactive thing on this page has to pass.
 */
function PivotRow({ pivot, index }: { readonly pivot: Pivot; readonly index: number }): ReactNode {
  const still = useReducedMotion() === true

  return (
    <Reveal delay={index * 0.03}>
      <Surface className="overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <StepBadge n={index + 1} tone="primary" />
              <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px] tracking-wide">
                {pivot.from}
                <ArrowRightIcon aria-hidden className="size-3" />
                <span className="text-foreground font-semibold">{pivot.to}</span>
              </p>
            </div>
            <h3 className="mt-3 text-[17px] leading-snug font-semibold text-pretty">
              {pivot.headline}
            </h3>
            <p className="text-muted-foreground mt-2.5 max-w-[52ch] text-[13.5px] leading-relaxed">
              {pivot.body}
            </p>
          </div>

          {/* The two states, side by side, with the arrow doing the work a label would. */}
          <div className="bg-muted/40 border-t p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
              <div>
                <Caption>Before</Caption>
                <div className="mt-1.5">
                  <PivotMini mini={pivot.before} faded />
                </div>
              </div>

              <motion.span
                aria-hidden
                className="bg-card text-muted-foreground mt-10 grid size-7 shrink-0 place-items-center rounded-full border shadow-xs"
                {...(still
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.7 },
                      whileInView: { opacity: 1, scale: 1 },
                      viewport: { once: true },
                      transition: { duration: 0.35, delay: 0.25 },
                    })}
              >
                <ArrowRightIcon className="size-3.5" />
              </motion.span>

              <motion.div
                {...(still
                  ? {}
                  : {
                      initial: { opacity: 0, x: 10 },
                      whileInView: { opacity: 1, x: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
                    })}
              >
                <Caption tone="now">After</Caption>
                <div className="mt-1.5">
                  <PivotMini mini={pivot.after} />
                </div>
              </motion.div>
            </div>

            <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3">
              <dd className="text-muted-foreground text-[10.5px] leading-snug">
                {pivot.beforeCaption}
              </dd>
              <span aria-hidden className="w-7" />
              <dd className="text-muted-foreground text-[10.5px] leading-snug">
                {pivot.afterCaption}
              </dd>
            </dl>
          </div>
        </div>
      </Surface>
    </Reveal>
  )
}

function Caption({
  children,
  tone,
}: {
  readonly children: ReactNode
  readonly tone?: 'now'
}): ReactNode {
  return (
    <p
      className={cn(
        'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase',
        tone === 'now' ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}

/**
 * Who did what.
 *
 * The counts come from git, generated by `npm run metrics:build`, because the first version of
 * this page carried numbers that were true when somebody typed them and quietly stopped being
 * true a week later.
 */
function BuildingWithAi(): ReactNode {
  const figures = [
    { value: String(metrics.commits), label: 'commits on main', icon: <GitCommitIcon /> },
    { value: String(metrics.workingDays), label: 'days with a commit' },
    { value: String(pivots.length), label: 'pivots, each deleting work' },
    { value: String(metrics.elapsedDays), label: 'days, first commit to now' },
  ]

  return (
    <div className="mt-14">
      <SectionHead
        eyebrow={buildingWithAi.eyebrow}
        title={buildingWithAi.title}
        lede={buildingWithAi.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-4">
        {figures.map((figure) => (
          <Surface key={figure.label} className="p-4">
            <p className="text-primary text-[1.75rem] leading-none font-bold tracking-tight tabular-nums">
              {figure.value}
            </p>
            <p className="text-muted-foreground mt-2 text-[12px] leading-snug">{figure.label}</p>
          </Surface>
        ))}
      </div>
      <p className="text-muted-foreground mt-2.5 text-[11.5px]">
        Counted out of the repository on {metrics.measuredAt}, not written down by hand.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {([buildingWithAi.human, buildingWithAi.ai] as const).map((side, index) => (
          <Reveal key={side.title} delay={index * 0.05}>
            <Surface accent={index === 0 ? 'code' : 'model'} className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <Tile tone={index === 0 ? 'code' : 'model'} size="sm">
                  {index === 0 ? <UserRoundIcon /> : <SparklesIcon />}
                </Tile>
                <h4 className="text-[15px] font-semibold">{side.title}</h4>
              </div>
              <ul className="mt-4 space-y-2">
                {side.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13.5px]">
                    <CheckIcon
                      aria-hidden
                      className={cn(
                        'mt-[3px] size-3.5 shrink-0',
                        index === 0 ? 'text-decides-code' : 'text-decides-model',
                      )}
                    />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
