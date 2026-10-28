import type { ChapterId, ShowcaseCue } from './types'
import { OPPORTUNITY_CUES } from './opportunity'
import { WALKTHROUGH_CUES } from './walkthrough-cues'
import { RISK_CUES } from './risk'

/** Every chapter's cues, by chapter, for anything that only needs the window and the copy. */
export const CUES_BY_CHAPTER: Readonly<Record<ChapterId, readonly ShowcaseCue[]>> = {
  opportunity: OPPORTUNITY_CUES,
  walkthrough: WALKTHROUGH_CUES,
  risk: RISK_CUES,
}

/** `01 / 04`: the three chapters and the close. */
export const STAGE_NUMBER: Readonly<Record<ChapterId | 'explore', number>> = {
  opportunity: 1,
  walkthrough: 2,
  risk: 3,
  explore: 4,
}
export const STAGE_COUNT = 4
