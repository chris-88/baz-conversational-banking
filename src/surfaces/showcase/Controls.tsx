import { useId, type ReactNode } from 'react'
import {
  CaptionsIcon,
  CaptionsOffIcon,
  FileTextIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CHAPTERS, type ChapterId } from '@/content/showcase/types'
import {
  chapterDurationMs,
  globalTimeMs,
  locate,
  totalDurationMs,
  type Manifests,
} from './playback'
import { usePlaybackActions, usePlaybackState } from './ShowcaseContext'
import { formatClock } from './format'
import { cn } from '@/lib/utils'

/**
 * The control rail along the foot of the viewing composition.
 *
 * Every control is a real button with a name, and the rail itself is a range input, so the
 * person at the back with a keyboard can do everything the person at the front with a mouse
 * can. Fullscreen is only ever entered from here, never on Start.
 */
export function Controls({
  manifests,
  fullscreen,
  onToggleFullscreen,
  onOpenTranscript,
}: {
  readonly manifests: Manifests
  readonly fullscreen: boolean
  readonly onToggleFullscreen: () => void
  readonly onOpenTranscript: () => void
}): ReactNode {
  const state = usePlaybackState()
  const actions = usePlaybackActions()
  const railId = useId()

  const total = totalDurationMs(state, manifests)
  const at = globalTimeMs(state, manifests)
  const playing = state.status === 'playing' || state.status === 'buffering'

  const markers = CHAPTERS.reduce<
    { readonly chapter: ChapterId; readonly start: number; readonly label: string }[]
  >((list, chapter) => {
    const previous = list[list.length - 1]
    const start =
      previous === undefined
        ? 0
        : previous.start + chapterDurationMs(state, manifests, previous.chapter)
    return [...list, { chapter, start, label: manifests[chapter].label }]
  }, [])

  const seekGlobal = (ms: number): void => {
    const target = locate(state, manifests, ms)
    actions.seek(target.chapter, target.ms)
  }

  const chapterIndex = CHAPTERS.indexOf(state.stage as ChapterId)
  const previous = CHAPTERS[chapterIndex - 1]
  const next = CHAPTERS[chapterIndex + 1]

  return (
    <div className="bg-background/90 border-t backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-6">
        <div className="flex items-center gap-1">
          {playing ? (
            <Button variant="outline" size="icon" aria-label="Pause" onClick={actions.pause}>
              <PauseIcon />
            </Button>
          ) : (
            <Button variant="outline" size="icon" aria-label="Resume" onClick={actions.resume}>
              <PlayIcon />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Restart from the beginning" onClick={actions.restart}>
            <RotateCcwIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous chapter"
            disabled={previous === undefined}
            onClick={() => previous !== undefined && actions.seek(previous, 0)}
          >
            <SkipBackIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next chapter"
            disabled={next === undefined && state.stage === 'explore'}
            onClick={actions.skipChapter}
          >
            <SkipForwardIcon />
          </Button>
        </div>

        <div className="order-last flex min-w-0 flex-1 basis-full items-center gap-3 sm:order-none sm:basis-auto">
          <span className="text-muted-foreground w-[4.5ch] shrink-0 text-right font-mono text-xs tabular-nums">
            {formatClock(at)}
          </span>
          <div className="relative min-w-0 flex-1">
            <label htmlFor={railId} className="sr-only">
              Position in the showcase
            </label>
            <input
              id={railId}
              type="range"
              min={0}
              max={Math.max(total - 1, 1)}
              step={250}
              value={Math.min(at, total - 1)}
              onChange={(event) => seekGlobal(Number(event.target.value))}
              aria-valuetext={`${formatClock(at)} of ${formatClock(total)}`}
              className="showcase-rail w-full"
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-0">
              {markers.slice(1).map((marker) => (
                <span
                  key={marker.chapter}
                  className="bg-muted-foreground/50 absolute top-[-9px] h-2 w-px"
                  style={{ left: `${String((marker.start / total) * 100)}%` }}
                />
              ))}
            </div>
          </div>
          <span className="text-muted-foreground w-[4.5ch] shrink-0 font-mono text-xs tabular-nums">
            {formatClock(total)}
          </span>
        </div>

        <nav aria-label="Chapters" className="hidden items-center gap-1 lg:flex">
          {markers.map((marker, index) => (
            <button
              key={marker.chapter}
              type="button"
              onClick={() => actions.seek(marker.chapter, 0)}
              aria-current={state.stage === marker.chapter ? 'step' : undefined}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                state.stage === marker.chapter
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <span className="mr-1 font-mono tabular-nums opacity-70">{String(index + 1)}</span>
              {marker.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={state.muted ? 'Unmute' : 'Mute'}
            aria-pressed={state.muted}
            onClick={() => actions.setMuted(!state.muted)}
          >
            {state.muted ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={state.captionsOn ? 'Hide captions' : 'Show captions'}
            aria-pressed={state.captionsOn}
            onClick={() => actions.setCaptions(!state.captionsOn)}
          >
            {state.captionsOn ? <CaptionsIcon /> : <CaptionsOffIcon />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open the transcript" onClick={onOpenTranscript}>
            <FileTextIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={fullscreen ? 'Leave full screen' : 'Full screen'}
            aria-pressed={fullscreen}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </Button>
        </div>
      </div>
    </div>
  )
}
