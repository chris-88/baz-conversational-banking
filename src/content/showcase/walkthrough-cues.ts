import type { ShowcaseCue, WalkthroughScene } from './types'

/**
 * The middle of the showcase: what.
 *
 * Eight windows for the savings story. Times are provisional until the narration is
 * mastered, then they are where the narrator's words land. Each cue carries only what this
 * chapter draws: the step's name on the rail and one line beneath it. What each step claims,
 * and the evidence, is in the feature document, not on the screen. The transcript the phone
 * replays is in `walkthrough.ts`.
 */
export const WALKTHROUGH_CUES: readonly ShowcaseCue<WalkthroughScene>[] = [
  {
    id: 'arrive',
    chapter: 'walkthrough',
    startMs: 0,
    endMs: 18_800,
    scene: 'arrive',
    presenter: { eyebrow: 'Life context', title: 'Start with the person, not a product.' },
  },
  {
    id: 'understand',
    chapter: 'walkthrough',
    startMs: 18_800,
    endMs: 38_700,
    scene: 'understand',
    presenter: { eyebrow: 'Discovery', title: 'One conversation builds understanding.' },
  },
  {
    id: 'link',
    chapter: 'walkthrough',
    startMs: 38_700,
    endMs: 61_000,
    scene: 'link',
    presenter: { eyebrow: 'Open banking', title: 'See the money where it is, through PSD2.' },
  },
  {
    id: 'arrange',
    chapter: 'walkthrough',
    startMs: 61_000,
    endMs: 85_100,
    scene: 'arrange',
    presenter: { eyebrow: 'Money working', title: 'Arithmetic on published rates, not opinion.' },
  },
  {
    id: 'authenticate',
    chapter: 'walkthrough',
    startMs: 85_100,
    endMs: 108_900,
    scene: 'authenticate',
    presenter: { eyebrow: 'Sign in and the form', title: 'What the bank holds does the typing.' },
  },
  {
    id: 'move',
    chapter: 'walkthrough',
    startMs: 108_900,
    endMs: 130_500,
    scene: 'move',
    presenter: { eyebrow: 'The money moves', title: 'Moved here, so the bank can watch it grow.' },
  },
  {
    id: 'later',
    chapter: 'walkthrough',
    startMs: 130_500,
    endMs: 154_500,
    scene: 'later',
    presenter: { eyebrow: 'Months later', title: 'The bank comes back when the deposit is there.' },
  },
  {
    id: 'govern',
    chapter: 'walkthrough',
    startMs: 154_500,
    endMs: 174_400,
    scene: 'govern',
    presenter: { eyebrow: 'Governance', title: 'Governance is part of the design.' },
  },
]
