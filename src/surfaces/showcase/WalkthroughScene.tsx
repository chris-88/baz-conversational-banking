import { useMemo, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { ShowcaseCue, WalkthroughScene as Scene } from '@/content/showcase/types'
import { WALKTHROUGH_CUES } from '@/content/showcase/walkthrough-cues'
import { WALKTHROUGH_EVENTS } from '@/content/showcase/walkthrough'
import { fade } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { usePlaybackActions } from './ShowcaseContext'
import { visibleTranscript } from './transcript'
import { PhoneFrame } from './PhoneFrame'
import { ShowcaseTranscript } from './ShowcaseTranscript'
import { AdminCutaway } from './AdminCutaway'
import { LockScreen } from './LockScreen'
import { useNarrow } from './useNarrow'

/**
 * The proof: the product on a phone, and nothing competing with it.
 *
 * The phone replays a scripted transcript through the product's own components; nothing on
 * it is a picture. Where a screen is not a phone screen, the console and the captured
 * packet, a desktop inset takes the phone's place; the push landing is the phone's own lock
 * screen. The steps run along the top, and
 * one line names the step. The voice does the rest: a panel of prose beside the phone asked
 * the room to read and watch at once, and it read.
 */
export function WalkthroughScene({
  cue,
  localTimeMs,
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly localTimeMs: number
  readonly still: boolean
}): ReactNode {
  const actions = usePlaybackActions()
  const narrow = useNarrow()
  const view = useMemo(() => visibleTranscript(WALKTHROUGH_EVENTS, localTimeMs), [localTimeMs])
  const cutawayKey = view.cutaway === null ? 'phone' : JSON.stringify(view.cutaway)

  /* On a phone the product's screen fills the stage edge to edge: a drawn phone inside a real one would shrink it to a strip. */
  const stage =
    view.cutaway !== null && view.cutaway.kind === 'notification' ? (
      narrow ? (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-sm">
          <LockScreen />
        </div>
      ) : (
        <PhoneFrame bare>
          <LockScreen />
        </PhoneFrame>
      )
    ) : view.cutaway !== null ? (
      <AdminCutaway view={view.cutaway} />
    ) : narrow ? (
      <div className="bg-background flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-sm">
        <ShowcaseTranscript view={view} still={still} />
      </div>
    ) : (
      <PhoneFrame>
        <ShowcaseTranscript view={view} still={still} />
      </PhoneFrame>
    )

  const title = (
    <h2 className="text-center text-lg font-semibold tracking-tight text-balance sm:text-xl lg:text-2xl">
      {cue.presenter?.title}
    </h2>
  )

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-3 overflow-hidden px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:gap-5 lg:py-5">
      <ol
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${String(WALKTHROUGH_CUES.length)}, minmax(0, 1fr))`,
        }}
        aria-label="Steps in the demonstration"
      >
        {WALKTHROUGH_CUES.map((step, index) => {
          const current = step.id === cue.id
          const done = step.endMs <= localTimeMs
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => actions.seek('walkthrough', step.startMs)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'group flex w-full flex-col items-start gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors',
                  'hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'h-1 w-full rounded-full',
                    current ? 'bg-primary' : done ? 'bg-primary/40' : 'bg-muted-foreground/20',
                  )}
                />
                <span
                  className={cn(
                    'w-full truncate text-[11px] leading-tight font-medium sm:text-[12px] lg:text-[13px]',
                    current ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span className="font-mono tabular-nums">{String(index + 1)}</span>
                  <span className="hidden sm:inline"> {step.presenter?.eyebrow ?? step.id}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {still ? (
        title
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={cue.id} {...fade}>
            {title}
          </m.div>
        </AnimatePresence>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {still ? (
          <div className="flex h-full w-full items-center justify-center">{stage}</div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={cutawayKey}
              className="flex h-full w-full items-center justify-center"
              {...fade}
            >
              {stage}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
