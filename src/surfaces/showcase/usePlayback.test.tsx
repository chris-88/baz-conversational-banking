import { StrictMode, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Manifests } from './playback'
import { usePlayback } from './usePlayback'

/**
 * jsdom has no media pipeline: `play()` and `load()` are "not implemented" and log to the
 * console. The hook takes the element from a factory for exactly this reason, so the test
 * hands it one that records calls and lets the test raise the events a browser would.
 */
class FakeAudio extends EventTarget {
  src = ''
  currentTime = 0
  duration = Number.NaN
  muted = false
  ended = false
  paused = true
  preload = ''
  error: MediaError | null = null
  playCalls = 0
  loadCalls = 0
  playMode: 'resolve' | 'reject' | 'abort' = 'resolve'

  play(): Promise<void> {
    this.playCalls += 1
    if (this.playMode === 'reject') {
      return Promise.reject(new DOMException('blocked', 'NotAllowedError'))
    }
    if (this.playMode === 'abort') {
      return Promise.reject(new DOMException('interrupted', 'AbortError'))
    }
    this.paused = false
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }

  load(): void {
    this.loadCalls += 1
    this.ended = false
  }

  fire(type: string): void {
    this.dispatchEvent(new Event(type))
  }

  /** What a browser does when a track reaches its end. */
  finish(): void {
    this.ended = true
    this.paused = true
    this.fire('pause')
    this.fire('ended')
  }
}

const manifests: Manifests = {
  opportunity: { id: 'opportunity', label: 'a', src: 'a.mp3', durationTargetMs: 60_000, captions: '' },
  walkthrough: { id: 'walkthrough', label: 'b', src: 'b.mp3', durationTargetMs: 180_000, captions: '' },
  risk: { id: 'risk', label: 'c', src: 'c.mp3', durationTargetMs: 60_000, captions: '' },
}

/** The first element the factory hands out is the player; later ones are warm-ups. */
function harness(): {
  main: FakeAudio
  created: FakeAudio[]
  createAudio: () => HTMLAudioElement
} {
  const created: FakeAudio[] = []
  const main = new FakeAudio()
  const createAudio = (): HTMLAudioElement => {
    const next = created.length === 0 ? main : new FakeAudio()
    created.push(next)
    return next as unknown as HTMLAudioElement
  }
  return { main, created, createAudio }
}

const frames: FrameRequestCallback[] = []

beforeEach(() => {
  frames.length = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', (): void => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function pump(): void {
  const pending = frames.splice(0)
  for (const frame of pending) frame(0)
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

const strict = ({ children }: { readonly children: ReactNode }): ReactNode => (
  <StrictMode>{children}</StrictMode>
)

describe('usePlayback', () => {
  it('a single start loads the first chapter and plays it once, even under StrictMode', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }), { wrapper: strict })

    act(() => result.current.actions.start())

    expect(main.src).toBe('a.mp3')
    expect(main.loadCalls).toBe(1)
    expect(main.playCalls).toBe(1)
    expect(result.current.state.stage).toBe('opportunity')
    expect(result.current.state.status).toBe('playing')

    // A second start is nothing.
    act(() => result.current.actions.start())
    expect(main.playCalls).toBe(1)
  })

  it('the clock is the element, sampled per frame', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())

    main.currentTime = 12.5
    act(() => pump())
    expect(result.current.state.localTimeMs).toBe(12_500)
  })

  it('the track ending swaps the source and plays the next chapter once', async () => {
    const { main, created, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }), { wrapper: strict })
    act(() => result.current.actions.start())

    // The next chapter was fetched ahead.
    expect(created.some((audio) => audio !== main && audio.src === 'b.mp3')).toBe(true)

    act(() => main.finish())
    await flush()

    expect(result.current.state.stage).toBe('walkthrough')
    expect(result.current.state.status).toBe('playing')
    expect(main.src).toBe('b.mp3')
    expect(main.loadCalls).toBe(2)
    expect(main.playCalls).toBe(2)

    act(() => main.finish())
    act(() => main.finish())
    await flush()
    expect(result.current.state.stage).toBe('explore')
    expect(main.playCalls).toBe(3)
  })

  it('a refused play shows a resume prompt and plays again only when asked', async () => {
    const { main, createAudio } = harness()
    main.playMode = 'reject'
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))

    act(() => result.current.actions.start())
    await flush()

    expect(result.current.state.needsResume).toBe(true)
    expect(result.current.state.status).toBe('paused')
    expect(main.playCalls).toBe(1)

    main.playMode = 'resolve'
    act(() => result.current.actions.resume())
    act(() => main.fire('playing'))
    expect(main.playCalls).toBe(2)
    expect(result.current.state.needsResume).toBe(false)
    expect(result.current.state.status).toBe('playing')
  })

  it('an interrupted play is not a refusal', async () => {
    const { main, createAudio } = harness()
    main.playMode = 'abort'
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())
    await flush()
    expect(result.current.state.needsResume).toBe(false)
  })

  it('buffering holds the clock and canplay releases it', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())

    act(() => main.fire('waiting'))
    expect(result.current.state.status).toBe('buffering')
    act(() => main.fire('canplay'))
    expect(result.current.state.status).toBe('playing')
  })

  it('a media error is retried from where it was', async () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())
    main.currentTime = 20
    act(() => pump())

    act(() => main.fire('error'))
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).not.toBeNull()

    act(() => result.current.actions.retry())
    expect(main.loadCalls).toBe(2)
    expect(main.playCalls).toBe(2)
    // The seek is applied once the reloaded track's metadata is known.
    main.duration = 60
    act(() => main.fire('loadedmetadata'))
    expect(main.currentTime).toBe(20)
    expect(result.current.state.knownDurations.opportunity).toBe(60_000)
    await flush()
  })

  it('a hidden tab pauses and waits to be resumed', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })

    expect(main.paused).toBe(true)
    expect(result.current.state.status).toBe('paused')
    expect(result.current.state.needsResume).toBe(true)
  })

  it('a user pause is a pause, not a prompt', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())

    act(() => {
      result.current.actions.pause()
      main.fire('pause')
    })
    expect(result.current.state.status).toBe('paused')
    expect(result.current.state.needsResume).toBe(false)
  })

  it('seeking within the loaded chapter moves the element; across chapters it reloads', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())

    act(() => result.current.actions.seek('opportunity', 30_000))
    expect(main.currentTime).toBe(30)
    expect(main.loadCalls).toBe(1)
    expect(result.current.state.settling).toBe(true)
    act(() => main.fire('seeked'))
    expect(result.current.state.settling).toBe(false)

    act(() => result.current.actions.seek('risk', 5_000))
    expect(main.src).toBe('c.mp3')
    expect(main.loadCalls).toBe(2)
    expect(result.current.state.stage).toBe('risk')
    main.duration = 60
    act(() => main.fire('loadedmetadata'))
    expect(main.currentTime).toBe(5)
  })

  it('skipping a chapter is the same as it ending', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())
    act(() => result.current.actions.skipChapter())
    expect(result.current.state.stage).toBe('walkthrough')
    expect(main.src).toBe('b.mp3')
  })

  it('exit stops the sound and a later start plays the first chapter from the top', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.start())
    act(() => main.finish())
    expect(result.current.state.stage).toBe('walkthrough')

    act(() => result.current.actions.exit())
    expect(main.paused).toBe(true)
    expect(result.current.state.stage).toBe('idle')

    act(() => result.current.actions.start())
    expect(main.src).toBe('a.mp3')
    expect(main.playCalls).toBe(3)
    expect(result.current.state.stage).toBe('opportunity')
  })

  it('mute reaches the element', () => {
    const { main, createAudio } = harness()
    const { result } = renderHook(() => usePlayback(manifests, { createAudio }))
    act(() => result.current.actions.setMuted(true))
    expect(main.muted).toBe(true)
  })
})
