import {
  CHAPTERS,
  isChapter,
  nextChapter,
  type ChapterId,
  type ChapterManifest,
  type ShowcaseStage,
} from '@/content/showcase/types'

/**
 * The playback machine, as a pure reducer.
 *
 * Nothing here touches an audio element or the DOM. The hook that owns the `<audio>`
 * translates media events into these actions and the reducer decides what they mean, which
 * is what makes the awkward cases testable: a late `ended` from the previous track, a second
 * `pause` after the first, a `canplay` that arrives while nothing is buffering.
 *
 * The rule the whole machine serves: a chapter advances when its narration ends and at no
 * other time. No timer anywhere counts to sixty.
 */

export type PlaybackStatus = 'ready' | 'playing' | 'paused' | 'buffering' | 'error'

export type PlaybackState = {
  readonly stage: ShowcaseStage
  readonly status: PlaybackStatus
  /** Where the narration is within the chapter, from `currentTime`. */
  readonly localTimeMs: number
  /** Real lengths, once the browser has read each file's metadata. */
  readonly knownDurations: Readonly<Partial<Record<ChapterId, number>>>
  readonly muted: boolean
  readonly captionsOn: boolean
  /**
   * The browser refused to play, or the tab was hidden: nothing resumes until somebody
   * asks. Shown as the Resume overlay.
   */
  readonly needsResume: boolean
  readonly error: string | null
  /**
   * The frame after a seek. Scenes render their end state with no entry motion, then animate
   * normally from the next cue on.
   */
  readonly settling: boolean
  /** Bumped on every seek, so a scene subtree can remount straight into the outcome. */
  readonly seekSerial: number
}

export type PlaybackAction =
  | { readonly type: 'start'; readonly at?: { readonly chapter: ChapterId; readonly ms: number } }
  | { readonly type: 'play_started' }
  | { readonly type: 'play_blocked'; readonly reason: string }
  | { readonly type: 'paused'; readonly byUser: boolean }
  | { readonly type: 'waiting' }
  | { readonly type: 'can_play' }
  | { readonly type: 'tick'; readonly ms: number }
  | { readonly type: 'metadata'; readonly chapter: ChapterId; readonly durationMs: number }
  | { readonly type: 'chapter_ended'; readonly chapter: ChapterId }
  | { readonly type: 'seek'; readonly chapter: ChapterId; readonly ms: number }
  | { readonly type: 'seeked' }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'retry' }
  | { readonly type: 'restart' }
  /** Back to the opening screen, with nothing playing. Mute and captions are kept. */
  | { readonly type: 'exit' }
  | { readonly type: 'set_muted'; readonly muted: boolean }
  | { readonly type: 'set_captions'; readonly on: boolean }

export type PlaybackSnapshot = {
  readonly stage: ShowcaseStage
  readonly status: PlaybackStatus
  readonly localTimeMs: number
  readonly chapterDurationMs: number
  readonly globalTimeMs: number
  readonly muted: boolean
}

export type Manifests = Readonly<Record<ChapterId, ChapterManifest>>

export const INITIAL: PlaybackState = {
  stage: 'idle',
  status: 'ready',
  localTimeMs: 0,
  knownDurations: {},
  muted: false,
  captionsOn: true,
  needsResume: false,
  error: null,
  settling: false,
  seekSerial: 0,
}

/** Below this a tick is noise: nothing on screen can move by less than a frame. */
const TICK_MS = 16

export function chapterDurationMs(
  state: Pick<PlaybackState, 'knownDurations'>,
  manifests: Manifests,
  chapter: ChapterId,
): number {
  return state.knownDurations[chapter] ?? manifests[chapter].durationTargetMs
}

export function totalDurationMs(
  state: Pick<PlaybackState, 'knownDurations'>,
  manifests: Manifests,
): number {
  return CHAPTERS.reduce((sum, chapter) => sum + chapterDurationMs(state, manifests, chapter), 0)
}

export function globalTimeMs(state: PlaybackState, manifests: Manifests): number {
  if (state.stage === 'idle') return 0
  if (state.stage === 'explore') return totalDurationMs(state, manifests)
  let before = 0
  for (const chapter of CHAPTERS) {
    if (chapter === state.stage) break
    before += chapterDurationMs(state, manifests, chapter)
  }
  return before + state.localTimeMs
}

export function snapshot(state: PlaybackState, manifests: Manifests): PlaybackSnapshot {
  return {
    stage: state.stage,
    status: state.status,
    localTimeMs: state.localTimeMs,
    chapterDurationMs: isChapter(state.stage)
      ? chapterDurationMs(state, manifests, state.stage)
      : 0,
    globalTimeMs: globalTimeMs(state, manifests),
    muted: state.muted,
  }
}

function clampTime(
  state: PlaybackState,
  manifests: Manifests,
  chapter: ChapterId,
  ms: number,
): number {
  const duration = chapterDurationMs(state, manifests, chapter)
  return Math.min(Math.max(ms, 0), Math.max(duration - 1, 0))
}

export function reduce(
  state: PlaybackState,
  action: PlaybackAction,
  manifests: Manifests,
): PlaybackState {
  switch (action.type) {
    case 'start': {
      if (state.stage !== 'idle') return state
      const chapter = action.at?.chapter ?? 'opportunity'
      const ms = action.at === undefined ? 0 : clampTime(state, manifests, chapter, action.at.ms)
      return {
        ...state,
        stage: chapter,
        status: 'playing',
        localTimeMs: ms,
        needsResume: false,
        error: null,
        settling: action.at !== undefined,
        seekSerial: action.at === undefined ? state.seekSerial : state.seekSerial + 1,
      }
    }

    case 'play_started':
      if (state.status === 'playing' && !state.needsResume) return state
      return { ...state, status: 'playing', needsResume: false, error: null }

    case 'play_blocked':
      return { ...state, status: 'paused', needsResume: true }

    case 'paused': {
      if (state.status !== 'playing' && state.status !== 'buffering') return state
      return { ...state, status: 'paused', needsResume: action.byUser ? state.needsResume : true }
    }

    case 'waiting':
      return state.status === 'playing' ? { ...state, status: 'buffering' } : state

    case 'can_play':
      return state.status === 'buffering' ? { ...state, status: 'playing' } : state

    case 'tick': {
      if (state.status !== 'playing') return state
      if (Math.abs(action.ms - state.localTimeMs) < TICK_MS && !state.settling) return state
      return { ...state, localTimeMs: action.ms, settling: false }
    }

    case 'metadata': {
      if (!Number.isFinite(action.durationMs) || action.durationMs <= 0) return state
      if (state.knownDurations[action.chapter] === action.durationMs) return state
      return {
        ...state,
        knownDurations: { ...state.knownDurations, [action.chapter]: action.durationMs },
      }
    }

    case 'chapter_ended': {
      // A late `ended` from a track that is no longer loaded changes nothing.
      if (action.chapter !== state.stage) return state
      const next = nextChapter(action.chapter)
      if (next === 'explore') {
        return { ...state, stage: 'explore', status: 'ready', localTimeMs: 0, needsResume: false, settling: false }
      }
      return {
        ...state,
        stage: next,
        status: state.status === 'paused' ? 'paused' : 'playing',
        localTimeMs: 0,
        needsResume: false,
        error: null,
        settling: false,
      }
    }

    case 'seek': {
      if (state.stage === 'idle') return state
      return {
        ...state,
        stage: action.chapter,
        status: state.status === 'ready' || state.status === 'error' ? 'playing' : state.status,
        localTimeMs: clampTime(state, manifests, action.chapter, action.ms),
        error: null,
        settling: true,
        seekSerial: state.seekSerial + 1,
      }
    }

    case 'seeked':
      return state.settling ? { ...state, settling: false } : state

    case 'failed':
      return { ...state, status: 'error', error: action.message }

    case 'retry':
      if (!isChapter(state.stage)) return state
      return {
        ...state,
        status: 'playing',
        error: null,
        needsResume: false,
        settling: true,
        seekSerial: state.seekSerial + 1,
      }

    case 'restart':
      if (state.stage === 'idle') return state
      return {
        ...state,
        stage: 'opportunity',
        status: 'playing',
        localTimeMs: 0,
        error: null,
        needsResume: false,
        settling: true,
        seekSerial: state.seekSerial + 1,
      }

    case 'exit':
      if (state.stage === 'idle') return state
      return {
        ...INITIAL,
        knownDurations: state.knownDurations,
        muted: state.muted,
        captionsOn: state.captionsOn,
      }

    case 'set_muted':
      return state.muted === action.muted ? state : { ...state, muted: action.muted }

    case 'set_captions':
      return state.captionsOn === action.on ? state : { ...state, captionsOn: action.on }
  }
}

/** Where a point on the whole timeline falls: which chapter, and how far into it. */
export function locate(
  state: Pick<PlaybackState, 'knownDurations'>,
  manifests: Manifests,
  globalMs: number,
): { readonly chapter: ChapterId; readonly ms: number } {
  let remaining = Math.max(globalMs, 0)
  for (const chapter of CHAPTERS) {
    const duration = chapterDurationMs(state, manifests, chapter)
    if (remaining < duration) return { chapter, ms: remaining }
    remaining -= duration
  }
  const last = CHAPTERS[CHAPTERS.length - 1] ?? 'risk'
  return { chapter: last, ms: Math.max(chapterDurationMs(state, manifests, last) - 1, 0) }
}
