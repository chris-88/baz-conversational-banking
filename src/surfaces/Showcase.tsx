import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useStill } from '@/lib/motion'
import { MANIFESTS, showcaseConfig } from '@/content/showcase/config'
import { CUES_BY_CHAPTER, STAGE_COUNT, STAGE_NUMBER } from '@/content/showcase/chapters'
import type { ChapterId } from '@/content/showcase/types'
import { usePlayback, type AudioFactory } from './showcase/usePlayback'
import {
  PlaybackActionsContext,
  PlaybackStateContext,
  usePlaybackActions,
  usePlaybackState,
} from './showcase/ShowcaseContext'
import { globalTimeMs, totalDurationMs } from './showcase/playback'
import { activeCue } from './showcase/cues'
import { formatClock, parseAt } from './showcase/format'
import { IdleScene } from './showcase/IdleScene'
import { ExploreScene } from './showcase/ExploreScene'
import { ShowcaseHeader } from './showcase/ShowcaseHeader'
import { ChapterScene } from './showcase/ChapterScene'
import { Captions } from './showcase/Captions'
import { countCaptions } from './showcase/vtt'
import { Controls } from './showcase/Controls'
import { ResumeOverlay } from './showcase/ResumeOverlay'
import { TranscriptDrawer } from './showcase/TranscriptDrawer'
import { TimelineInspector } from './showcase/TimelineInspector'

/**
 * The narrated showcase.
 *
 * Five UI states: a static opening, three narrated chapters, a static close. Audio owns the
 * timing; the page owns the pictures. Only the Start click moves the page out of its opening
 * state, and only a track ending moves it between chapters.
 *
 * The playback machine is in `showcase/playback.ts` and the element that plays the sound in
 * `showcase/usePlayback.ts`. This file composes the states and the chrome around them.
 */
export function Showcase({
  createAudio,
}: {
  /** Test seam: jsdom has no media pipeline. */
  readonly createAudio?: AudioFactory
}): ReactNode {
  useDocumentTitle(showcaseConfig.title)

  const { state, actions } = usePlayback(
    MANIFESTS,
    createAudio === undefined ? {} : { createAudio },
  )
  const [searchParams] = useSearchParams()

  const start = useCallback(() => {
    // A rehearsal deep link, only in development and only on the click.
    const at = import.meta.env.DEV ? parseAt(searchParams.get('at')) : undefined
    actions.start(at)
  }, [actions, searchParams])

  return (
    <PlaybackStateContext.Provider value={state}>
      <PlaybackActionsContext.Provider value={actions}>
        {state.stage === 'idle' ? (
          <IdleScene onStart={start} />
        ) : state.stage === 'explore' ? (
          <ExploreScene onRestart={actions.restart} />
        ) : (
          <Playing chapter={state.stage} />
        )}
      </PlaybackActionsContext.Provider>
    </PlaybackStateContext.Provider>
  )
}

/** The viewing composition: compact header, the chapter, captions, the control rail. */
function Playing({ chapter }: { readonly chapter: ChapterId }): ReactNode {
  const state = usePlaybackState()
  const actions = usePlaybackActions()
  const still = useStill()
  const container = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  const manifest = MANIFESTS[chapter]
  const cue = activeCue(CUES_BY_CHAPTER[chapter], state.localTimeMs)
  const captions = useMemo(() => countCaptions(manifest.captions), [manifest.captions])

  useEffect(() => {
    if (import.meta.env.DEV && captions === 0) {
      console.warn(`showcase: no captions for the ${chapter} chapter`)
    }
  }, [captions, chapter])

  useEffect(() => {
    const onChange = (): void => setFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    const element = container.current
    if (element === null) return
    void element.requestFullscreen().catch(() => undefined)
  }, [])

  /* The keyboard the room will use: a presenter clicker sends arrows and space. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
        if (target.closest('[role="dialog"]') !== null && event.key !== 'Escape') return
      }
      switch (event.key) {
        case ' ':
        case 'k':
          event.preventDefault()
          if (state.status === 'playing' || state.status === 'buffering') actions.pause()
          else actions.resume()
          break
        case 'ArrowLeft':
          event.preventDefault()
          actions.seek(chapter, Math.max(state.localTimeMs - 5_000, 0))
          break
        case 'ArrowRight':
          event.preventDefault()
          actions.seek(chapter, state.localTimeMs + 5_000)
          break
        case '1':
          actions.seek('opportunity', 0)
          break
        case '2':
          actions.seek('walkthrough', 0)
          break
        case '3':
          actions.seek('risk', 0)
          break
        case 'm':
          actions.setMuted(!state.muted)
          break
        case 'c':
          actions.setCaptions(!state.captionsOn)
          break
        case 'f':
          toggleFullscreen()
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [actions, chapter, state.captionsOn, state.localTimeMs, state.muted, state.status, toggleFullscreen])

  const total = totalDurationMs(state, MANIFESTS)
  const at = globalTimeMs(state, MANIFESTS)

  return (
    <div ref={container} className="bg-muted/40 flex h-dvh flex-col">
      <ShowcaseHeader playing onExit={actions.exit}>
        <div className="flex w-full max-w-3xl items-center gap-4">
          <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
            {String(STAGE_NUMBER[chapter]).padStart(2, '0')} / {String(STAGE_COUNT).padStart(2, '0')}
          </span>
          <span className="shrink-0 text-sm font-medium">{manifest.label}</span>
          <div
            role="progressbar"
            aria-label="Progress through the showcase"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={at}
            className="bg-muted relative h-1 min-w-0 flex-1 overflow-hidden rounded-full"
          >
            <div
              className="bg-primary absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${String(Math.min((at / total) * 100, 100))}%` }}
            />
          </div>
          <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
            {formatClock(at)} / {formatClock(total)}
          </span>
        </div>
      </ShowcaseHeader>

      <main className="relative min-h-0 flex-1">
        <ChapterScene
          chapter={chapter}
          localTimeMs={state.localTimeMs}
          still={still || state.settling}
          seekSerial={state.seekSerial}
        />
        <ResumeOverlay />
      </main>

      <Captions manifest={manifest} localTimeMs={state.localTimeMs} on={state.captionsOn} />

      <Controls
        manifests={MANIFESTS}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenTranscript={() => setTranscriptOpen(true)}
      />

      <TranscriptDrawer manifests={MANIFESTS} open={transcriptOpen} onOpenChange={setTranscriptOpen} />

      {import.meta.env.DEV && <TimelineInspector cue={cue} captionCount={captions} />}
    </div>
  )
}
