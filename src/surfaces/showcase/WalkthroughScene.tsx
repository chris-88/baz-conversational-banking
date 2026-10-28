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
import { PresenterPanel } from './PresenterPanel'
import { formatClock } from './format'

/**
 * The proof: the product on a phone, beside what the narrator is saying about it.
 *
 * The phone replays a scripted transcript through the product's own components; nothing on
 * it is a picture. Where a screen is not a phone screen, the console and the captured
 * packet, a desktop inset takes the phone's place and the panel on the right stays put.
 */
export function WalkthroughScene({
  cue,
  localTimeMs,
  position,
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly localTimeMs: number
  readonly position: { readonly index: number; readonly total: number }
  readonly still: boolean
}): ReactNode {
  const actions = usePlaybackActions()
  const view = useMemo(() => visibleTranscript(WALKTHROUGH_EVENTS, localTimeMs), [localTimeMs])
  const cutawayKey = view.cutaway === null ? 'phone' : JSON.stringify(view.cutaway)

  const left =
    view.cutaway === null ? (
      <PhoneFrame>
        <ShowcaseTranscript view={view} still={still} />
      </PhoneFrame>
    ) : (
      <AdminCutaway view={view.cutaway} />
    )

  return (
    <div className="mx-auto grid h-full max-w-[1600px] grid-rows-[auto_auto] gap-6 overflow-y-auto px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-rows-1 lg:gap-12 lg:overflow-hidden lg:py-6">
      <div className="flex h-[72vh] min-h-0 items-center justify-center lg:h-full">
        {still ? (
          <div className="flex h-full w-full items-center justify-center">{left}</div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={cutawayKey} className="flex h-full w-full items-center justify-center" {...fade}>
              {left}
            </m.div>
          </AnimatePresence>
        )}
      </div>

      <div className="flex min-h-0 flex-col justify-center gap-8">
        <PresenterPanel
          presenter={cue.presenter}
          cueId={cue.id}
          index={position.index}
          total={position.total}
          still={still}
        />

        <ol className="hidden gap-1 border-t pt-5 lg:grid lg:grid-cols-7" aria-label="Steps in the demonstration">
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
                  <span className={cn('line-clamp-2 min-h-[2.5em] w-full text-[11px] leading-tight font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>
                    <span className="font-mono tabular-nums">{String(index + 1)}</span> {step.presenter?.eyebrow ?? step.id}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                    {formatClock(step.startMs)}–{formatClock(step.endMs)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
