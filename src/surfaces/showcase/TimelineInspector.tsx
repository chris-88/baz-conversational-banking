import { useEffect, useState, type ReactNode } from 'react'
import type { ShowcaseCue } from '@/content/showcase/types'
import { usePlaybackState } from './ShowcaseContext'
import { formatClock } from './format'

/**
 * For authoring cues: the clock, the stage, the status and the cue that is on.
 *
 * Only in development. The backtick toggles it. Production never ships the component: the
 * import site is behind `import.meta.env.DEV`, so the bundler drops it.
 */
export function TimelineInspector({
  cue,
  captionCount,
}: {
  readonly cue: ShowcaseCue | null
  readonly captionCount: number
}): ReactNode {
  const state = usePlaybackState()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === '`') setOpen((current) => !current)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div className="bg-foreground/90 text-background pointer-events-none fixed right-3 bottom-20 z-50 rounded-md p-3 font-mono text-[11px] leading-relaxed shadow-lg">
      <p>stage {state.stage} · {state.status}{state.needsResume ? ' · needs resume' : ''}</p>
      <p>local {formatClock(state.localTimeMs)}.{String(Math.floor(state.localTimeMs % 1000)).padStart(3, '0')}</p>
      <p>cue {cue?.id ?? '—'} {cue === null ? '' : `${formatClock(cue.startMs)}–${formatClock(cue.endMs)}`}</p>
      <p>captions {String(captionCount)}{captionCount === 0 ? ' (none!)' : ''} · seek #{String(state.seekSerial)}{state.settling ? ' settling' : ''}</p>
      <p>durations {Object.entries(state.knownDurations).map(([k, v]) => `${k} ${formatClock(v)}`).join(', ') || 'targets'}</p>
    </div>
  )
}
