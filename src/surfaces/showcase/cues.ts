import type { ShowcaseCue } from '@/content/showcase/types'

/**
 * Which cue is on, given where the narration is.
 *
 * The last cue whose start is at or before the time. Because the content tests make every
 * chapter's cues contiguous, that is also the cue containing the time, and it stays the last
 * cue through any silence after the final `endMs`: a scene never goes blank because the
 * narrator paused for breath.
 */
export function activeCue<C extends ShowcaseCue>(cues: readonly C[], timeMs: number): C {
  const first = cues[0]
  if (first === undefined) throw new Error('A chapter needs at least one cue')
  let current = first
  for (const cue of cues) {
    if (cue.startMs <= timeMs) current = cue
    else break
  }
  return current
}

/** How far through a cue, 0 to 1. Pause and seek are exact because this is all a scene reads. */
export function cueProgress(cue: ShowcaseCue, timeMs: number): number {
  const length = cue.endMs - cue.startMs
  if (length <= 0) return 1
  const progress = (timeMs - cue.startMs) / length
  return Math.min(Math.max(progress, 0), 1)
}

/** `03 / 07`, for the presenter panel. One-based. */
export function cueIndex(
  cues: readonly ShowcaseCue[],
  cue: ShowcaseCue,
): { readonly index: number; readonly total: number } {
  const index = cues.findIndex((candidate) => candidate.id === cue.id)
  return { index: index < 0 ? 0 : index + 1, total: cues.length }
}
