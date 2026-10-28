import type { ShowcaseCue, WalkthroughScene } from './types'

/**
 * The middle three minutes: what.
 *
 * Seven windows, from the brief's cue map, with its two corrections applied: sign-in here is
 * an email code, not Google, and the console has no Settings screen. Times are where the
 * narrator's words land. Each cue carries only what this chapter draws: the step's name on
 * the rail and one line beneath it. What each step claims, and the evidence, is in the
 * feature document, not on the screen. The transcript the phone replays is in `walkthrough.ts`.
 */
export const WALKTHROUGH_CUES: readonly ShowcaseCue<WalkthroughScene>[] = [
  {
    id: 'arrive',
    chapter: 'walkthrough',
    startMs: 0,
    endMs: 18_600,
    scene: 'arrive',
    presenter: {
      eyebrow: 'Life context',
      title: 'Start with the person, not a product.',
    },
  },
  {
    id: 'understand',
    chapter: 'walkthrough',
    startMs: 18_600,
    endMs: 37_400,
    scene: 'understand',
    presenter: {
      eyebrow: 'Discovery',
      title: 'One conversation builds understanding.',
    },
  },
  {
    id: 'connect',
    chapter: 'walkthrough',
    startMs: 37_400,
    endMs: 54_800,
    scene: 'connect',
    presenter: {
      eyebrow: 'Recommendations',
      title: 'Multiple needs, connected.',
    },
  },
  {
    id: 'authenticate',
    chapter: 'walkthrough',
    startMs: 54_800,
    endMs: 74_500,
    scene: 'authenticate',
    presenter: {
      eyebrow: 'Authentication',
      title: 'Authenticate when it matters.',
    },
  },
  {
    id: 'machinery',
    chapter: 'walkthrough',
    startMs: 74_500,
    endMs: 95_300,
    scene: 'machinery',
    presenter: {
      eyebrow: 'Existing forms',
      title: 'Use the machinery we already have.',
    },
  },
  {
    id: 'action',
    chapter: 'walkthrough',
    startMs: 95_300,
    endMs: 112_300,
    scene: 'action',
    presenter: {
      eyebrow: 'Orchestration',
      title: 'From conversation towards action.',
    },
  },
  {
    id: 'govern',
    chapter: 'walkthrough',
    startMs: 112_300,
    endMs: 129_200,
    scene: 'govern',
    presenter: {
      eyebrow: 'Governance',
      title: 'Governance is part of the design.',
    },
  },
]
