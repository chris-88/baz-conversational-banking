import type { OpportunityScene, ShowcaseCue } from './types'

/**
 * The first sixty seconds: why.
 *
 * Times are where the narrator's words land in `opportunity.mp3`: each cue starts on the
 * first word of its sentence (word timestamps taken from the track, see the README).
 */
export const OPPORTUNITY_CUES: readonly ShowcaseCue<OpportunityScene>[] = [
  {
    id: 'headline',
    chapter: 'opportunity',
    startMs: 0,
    endMs: 7_700,
    scene: 'headline',
    presenter: {
      eyebrow: 'The opportunity',
      title: 'People don’t experience life in banking products.',
    },
  },
  {
    id: 'fragments',
    chapter: 'opportunity',
    startMs: 7_700,
    endMs: 20_400,
    scene: 'fragments',
    presenter: {
      eyebrow: 'Today’s experience',
      title: 'Those moments become separate journeys.',
    },
  },
  {
    id: 'question',
    chapter: 'opportunity',
    startMs: 20_400,
    endMs: 24_900,
    scene: 'question',
    presenter: {
      eyebrow: 'A different starting point',
      title: 'What if we started with what they’re actually trying to do?',
    },
  },
  {
    id: 'meet',
    chapter: 'opportunity',
    startMs: 24_900,
    endMs: 34_500,
    scene: 'meet',
    presenter: {
      eyebrow: 'Meet Baz',
      title: 'Discover, understand, connect.',
    },
  },
  {
    id: 'capability',
    chapter: 'opportunity',
    startMs: 34_500,
    endMs: 47_040,
    scene: 'capability',
    presenter: {
      eyebrow: 'Built on what exists',
      title: 'Capabilities the bank already owns.',
    },
  },
]
