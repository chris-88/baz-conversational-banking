import { describe, expect, it } from 'vitest'
import type { ShowcaseCue } from '@/content/showcase/types'
import { activeCue, cueIndex, cueProgress } from './cues'

const cues: readonly ShowcaseCue[] = [
  { id: 'a', chapter: 'opportunity', startMs: 0, endMs: 10_000, scene: 'a' },
  { id: 'b', chapter: 'opportunity', startMs: 10_000, endMs: 25_000, scene: 'b' },
  { id: 'c', chapter: 'opportunity', startMs: 25_000, endMs: 60_000, scene: 'c' },
]

describe('active cue', () => {
  it('is the cue containing the time', () => {
    expect(activeCue(cues, 0).id).toBe('a')
    expect(activeCue(cues, 9_999).id).toBe('a')
    expect(activeCue(cues, 12_000).id).toBe('b')
  })

  it('a boundary belongs to the later cue', () => {
    expect(activeCue(cues, 10_000).id).toBe('b')
    expect(activeCue(cues, 25_000).id).toBe('c')
  })

  it('holds the last cue through trailing silence and the first before time zero', () => {
    expect(activeCue(cues, 75_000).id).toBe('c')
    expect(activeCue(cues, -1).id).toBe('a')
  })

  it('refuses an empty chapter', () => {
    expect(() => activeCue([], 0)).toThrow()
  })
})

describe('cue progress', () => {
  it('runs 0 to 1 and clamps either side', () => {
    const b = cues[1]
    if (b === undefined) throw new Error('fixture')
    expect(cueProgress(b, 10_000)).toBe(0)
    expect(cueProgress(b, 17_500)).toBe(0.5)
    expect(cueProgress(b, 25_000)).toBe(1)
    expect(cueProgress(b, 30_000)).toBe(1)
    expect(cueProgress(b, 0)).toBe(0)
  })

  it('a zero-length cue is complete', () => {
    expect(cueProgress({ id: 'z', chapter: 'risk', startMs: 5, endMs: 5, scene: 'z' }, 5)).toBe(1)
  })
})

describe('cue index', () => {
  it('is one-based with the total', () => {
    const c = cues[2]
    if (c === undefined) throw new Error('fixture')
    expect(cueIndex(cues, c)).toEqual({ index: 3, total: 3 })
  })
})
