import { createContext, useContext } from 'react'
import { INITIAL, type PlaybackState } from './playback'
import type { PlaybackActions } from './usePlayback'

/**
 * Two contexts, not one.
 *
 * The state changes sixty times a second while a chapter plays. The actions never change.
 * A control that only needs to call `pause()` should not re-render on every tick, and
 * splitting them is the whole of what it takes.
 */
export const PlaybackStateContext = createContext<PlaybackState>(INITIAL)

const noop = (): void => undefined

export const PlaybackActionsContext = createContext<PlaybackActions>({
  start: noop,
  pause: noop,
  resume: noop,
  restart: noop,
  exit: noop,
  seek: noop,
  skipChapter: noop,
  retry: noop,
  setMuted: noop,
  setCaptions: noop,
})

export function usePlaybackState(): PlaybackState {
  return useContext(PlaybackStateContext)
}

export function usePlaybackActions(): PlaybackActions {
  return useContext(PlaybackActionsContext)
}
