import type { ReactNode } from 'react'
import { Loader2Icon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface } from '@/components/Primitives'
import { usePlaybackActions, usePlaybackState } from './ShowcaseContext'

/**
 * What the viewer sees when the narration cannot continue on its own.
 *
 * Three cases, all of which stop the clock rather than letting the picture drift away from
 * the sound: the browser refused to play, the track failed, or the network is behind. The
 * first two are a button; the third is a quiet indicator, because buffering usually fixes
 * itself.
 */
export function ResumeOverlay(): ReactNode {
  const state = usePlaybackState()
  const actions = usePlaybackActions()

  if (state.status === 'error') {
    return (
      <Backdrop>
        <Surface lift className="max-w-md p-6">
          <p className="text-lg font-bold tracking-tight">The narration stopped.</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {state.error ?? 'The narration could not be played.'} The picture has paused with
            it rather than carrying on without the sound.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={actions.retry} className="gap-2">
              <RotateCcwIcon className="size-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={actions.skipChapter} className="gap-2">
              <SkipForwardIcon className="size-4" />
              Skip this chapter
            </Button>
          </div>
        </Surface>
      </Backdrop>
    )
  }

  if (state.needsResume) {
    return (
      <Backdrop>
        <Surface lift className="max-w-md p-6 text-center">
          <p className="text-lg font-bold tracking-tight">Paused</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            The browser is waiting for a tap before it plays sound.
          </p>
          <Button size="lg" onClick={actions.resume} className="mt-5 gap-2" autoFocus>
            <PlayIcon className="size-4 fill-current" />
            Resume the experience
          </Button>
        </Surface>
      </Backdrop>
    )
  }

  if (state.status === 'buffering') {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
        <p
          role="status"
          className="bg-foreground/85 text-background flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
        >
          <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
          Loading the narration
        </p>
      </div>
    )
  }

  return null
}

function Backdrop({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div
      role="dialog"
      aria-modal="false"
      className="bg-background/60 absolute inset-0 z-20 grid place-items-center p-6 backdrop-blur-sm"
    >
      {children}
    </div>
  )
}
