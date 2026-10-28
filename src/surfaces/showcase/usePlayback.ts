import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { isChapter, nextChapter, type ChapterId } from '@/content/showcase/types'
import {
  INITIAL,
  reduce,
  type Manifests,
  type PlaybackAction,
  type PlaybackState,
} from './playback'

/**
 * The one place the showcase touches an audio element.
 *
 * One element, never rendered, carries each chapter's narration in turn. Media events become
 * reducer actions; the reducer decides what they mean. The element's `currentTime`, sampled
 * every frame while playing, is the only clock: no timer counts to sixty, and a chapter ends
 * when its track does.
 *
 * `play()` is only ever called from somewhere a browser will allow it: the Start click, a
 * Resume click, or the `ended` handler of a track that was itself started by a click. When a
 * browser refuses anyway, which Safari does across a source change, the refusal becomes a
 * Resume button rather than a silent stall.
 */

export type PlaybackActions = {
  readonly start: (at?: { readonly chapter: ChapterId; readonly ms: number }) => void
  readonly pause: () => void
  readonly resume: () => void
  readonly restart: () => void
  /** Back to the opening screen. The next Start begins from the first chapter again. */
  readonly exit: () => void
  readonly seek: (chapter: ChapterId, ms: number) => void
  readonly skipChapter: () => void
  readonly retry: () => void
  readonly setMuted: (muted: boolean) => void
  readonly setCaptions: (on: boolean) => void
}

export type AudioFactory = () => HTMLAudioElement

function describe(error: unknown): string {
  // Not `instanceof Error`: a DOMException raised inside jsdom is not the test runner's Error.
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name: unknown = error.name
    if (typeof name === 'string') return name
  }
  return 'unknown'
}

function mediaErrorMessage(audio: HTMLAudioElement): string {
  const code = audio.error?.code ?? 0
  switch (code) {
    case 1:
      return 'The narration was interrupted while loading.'
    case 2:
      return 'The narration could not be fetched. Check the connection and try again.'
    case 3:
      return 'The narration file could not be decoded.'
    case 4:
      return 'The narration file was not found or is not a supported format.'
    default:
      return 'The narration could not be played.'
  }
}

export function usePlayback(
  manifests: Manifests,
  options: { readonly createAudio?: AudioFactory } = {},
): { readonly state: PlaybackState; readonly actions: PlaybackActions } {
  const [state, dispatch] = useReducer(
    (current: PlaybackState, action: PlaybackAction) => reduce(current, action, manifests),
    INITIAL,
  )

  const stateRef = useRef<PlaybackState>(INITIAL)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const factoryRef = useRef<AudioFactory>(options.createAudio ?? (() => new Audio()))
  useEffect(() => {
    if (options.createAudio !== undefined) factoryRef.current = options.createAudio
  }, [options.createAudio])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  /** Which chapter's track the element holds. Stamped onto events so a stale one is ignored. */
  const loadedRef = useRef<ChapterId | null>(null)
  /** Where to land once the track's metadata is known. */
  const pendingSeekRef = useRef<number | null>(null)
  /** The next chapter's track, fetched ahead so the swap on `ended` comes from cache. */
  const warmRef = useRef<HTMLAudioElement | null>(null)

  const safePlay = useCallback(() => {
    const audio = audioRef.current
    if (audio === null) return
    const result: unknown = audio.play()
    if (result instanceof Promise) {
      result.catch((error: unknown) => {
        // A load() that interrupts a pending play() rejects with AbortError. That is this
        // hook changing track, not the browser refusing to play.
        if (describe(error) === 'AbortError') return
        dispatch({ type: 'play_blocked', reason: describe(error) })
      })
    }
  }, [])

  const load = useCallback(
    (chapter: ChapterId, atMs: number, play: boolean) => {
      const audio = audioRef.current
      if (audio === null) return
      loadedRef.current = chapter
      pendingSeekRef.current = atMs
      audio.src = manifests[chapter].src
      audio.load()
      if (play) safePlay()
    },
    [manifests, safePlay],
  )

  const advanceFrom = useCallback(
    (chapter: ChapterId) => {
      dispatch({ type: 'chapter_ended', chapter })
      const next = nextChapter(chapter)
      if (next === 'explore') {
        loadedRef.current = null
        return
      }
      load(next, 0, stateRef.current.status !== 'paused')
    },
    [load],
  )

  /* The element and its listeners live exactly as long as the page. */
  useEffect(() => {
    const audio = factoryRef.current()
    audio.preload = 'auto'
    audioRef.current = audio

    const onPlaying = (): void => dispatch({ type: 'play_started' })
    const onPause = (): void => {
      // `pause` fires just before `ended`; that one is the chapter finishing, not a pause.
      if (audio.ended) return
      dispatch({ type: 'paused', byUser: false })
    }
    const onWaiting = (): void => dispatch({ type: 'waiting' })
    const onCanPlay = (): void => dispatch({ type: 'can_play' })
    const onSeeked = (): void => dispatch({ type: 'seeked' })
    const onError = (): void => dispatch({ type: 'failed', message: mediaErrorMessage(audio) })
    const onLoadedMetadata = (): void => {
      const chapter = loadedRef.current
      if (chapter !== null) {
        dispatch({ type: 'metadata', chapter, durationMs: audio.duration * 1000 })
      }
      const pending = pendingSeekRef.current
      if (pending !== null) {
        pendingSeekRef.current = null
        audio.currentTime = pending / 1000
      }
    }
    const onEnded = (): void => {
      const chapter = loadedRef.current
      if (chapter !== null) advanceFrom(chapter)
    }

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('stalled', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('error', onError)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('stalled', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('seeked', onSeeked)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audioRef.current = null
      loadedRef.current = null
      warmRef.current = null
    }
  }, [advanceFrom])

  /* The clock: `currentTime`, once a frame, only while playing. */
  const playing = state.status === 'playing'
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = (): void => {
      const audio = audioRef.current
      if (audio !== null) dispatch({ type: 'tick', ms: audio.currentTime * 1000 })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  /* A hidden tab pauses. It does not resume by itself when the tab comes back. */
  useEffect(() => {
    const onVisibility = (): void => {
      if (!document.hidden) return
      const audio = audioRef.current
      const current = stateRef.current
      if (audio === null) return
      if (current.status !== 'playing' && current.status !== 'buffering') return
      audio.pause()
      dispatch({ type: 'paused', byUser: false })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  /* Fetch the next chapter's track while this one plays, so the swap is instant. */
  useEffect(() => {
    if (!isChapter(state.stage)) return
    const next = nextChapter(state.stage)
    if (next === 'explore') {
      warmRef.current = null
      return
    }
    const warm = factoryRef.current()
    warm.preload = 'auto'
    warm.src = manifests[next].src
    warm.load()
    warmRef.current = warm
  }, [state.stage, manifests])

  useEffect(() => {
    const audio = audioRef.current
    if (audio !== null) audio.muted = state.muted
  }, [state.muted])

  const actions = useMemo<PlaybackActions>(
    () => ({
      start: (at) => {
        if (stateRef.current.stage !== 'idle') return
        dispatch(at === undefined ? { type: 'start' } : { type: 'start', at })
        load(at?.chapter ?? 'opportunity', at?.ms ?? 0, true)
      },
      pause: () => {
        dispatch({ type: 'paused', byUser: true })
        audioRef.current?.pause()
      },
      resume: () => {
        safePlay()
      },
      restart: () => {
        if (stateRef.current.stage === 'idle') return
        dispatch({ type: 'restart' })
        load('opportunity', 0, true)
      },
      exit: () => {
        if (stateRef.current.stage === 'idle') return
        audioRef.current?.pause()
        loadedRef.current = null
        pendingSeekRef.current = null
        dispatch({ type: 'exit' })
      },
      seek: (chapter, ms) => {
        const current = stateRef.current
        if (current.stage === 'idle') return
        dispatch({ type: 'seek', chapter, ms })
        const audio = audioRef.current
        if (audio !== null && loadedRef.current === chapter) {
          audio.currentTime = Math.max(ms, 0) / 1000
          if (current.status === 'ready' || current.status === 'error') safePlay()
          return
        }
        load(chapter, ms, current.status !== 'paused')
      },
      skipChapter: () => {
        const chapter =
          loadedRef.current ?? (isChapter(stateRef.current.stage) ? stateRef.current.stage : null)
        if (chapter !== null) advanceFrom(chapter)
      },
      retry: () => {
        const current = stateRef.current
        if (!isChapter(current.stage)) return
        dispatch({ type: 'retry' })
        load(current.stage, current.localTimeMs, true)
      },
      setMuted: (muted) => dispatch({ type: 'set_muted', muted }),
      setCaptions: (on) => dispatch({ type: 'set_captions', on }),
    }),
    [advanceFrom, load, safePlay],
  )

  return { state, actions }
}
