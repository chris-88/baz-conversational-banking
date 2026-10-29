import type { OpportunityScene, ShowcaseCue } from './types'

/**
 * The first sixty seconds: why.
 *
 * Times are where the narrator's words land in `opportunity.mp3` (the 2026-10-29 read, 48.0 s):
 * each cue starts on the first word of its sentence (word timestamps taken from the track, see
 * the README).
 */
export const OPPORTUNITY_CUES: readonly ShowcaseCue<OpportunityScene>[] = [
  {
    id: 'headline',
    chapter: 'opportunity',
    startMs: 0,
    endMs: 7_800,
    scene: 'headline',
    presenter: {
      eyebrow: 'The opportunity',
      title: 'People don’t experience life in banking products.',
    },
  },
  {
    id: 'fragments',
    chapter: 'opportunity',
    startMs: 7_800,
    endMs: 21_840,
    scene: 'fragments',
    presenter: {
      eyebrow: 'Today’s experience',
      title: 'Those moments become separate journeys.',
    },
  },
  {
    id: 'question',
    chapter: 'opportunity',
    startMs: 21_840,
    endMs: 25_800,
    scene: 'question',
    presenter: {
      eyebrow: 'A different starting point',
      title: 'What if instead, we started with a simple conversation?',
    },
  },
  {
    id: 'meet',
    chapter: 'opportunity',
    startMs: 25_800,
    endMs: 36_920,
    scene: 'meet',
    presenter: {
      eyebrow: 'Meet Baz',
      title: 'Discover, understand, connect.',
    },
  },
  {
    id: 'capability',
    chapter: 'opportunity',
    startMs: 36_920,
    endMs: 48_000,
    scene: 'capability',
    presenter: {
      eyebrow: 'Built on what exists',
      title: 'Capabilities the bank already owns.',
    },
  },
]
