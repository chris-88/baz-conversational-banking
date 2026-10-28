import type { ReactNode } from 'react'
import type { ChapterId } from '@/content/showcase/types'
import { OPPORTUNITY_CUES } from '@/content/showcase/opportunity'
import { WALKTHROUGH_CUES } from '@/content/showcase/walkthrough-cues'
import { RISK_CUES } from '@/content/showcase/risk'
import { activeCue, cueIndex, cueProgress } from './cues'
import { OpportunityScene } from './OpportunityScene'
import { WalkthroughScene } from './WalkthroughScene'
import { RiskScene } from './RiskScene'

/**
 * The chapter that is on, drawn from where the narration is.
 *
 * Each chapter component receives the active cue, its progress and whether to hold still,
 * and nothing else. Everything on screen is a function of those three, which is what makes
 * a seek land on the right picture.
 */
export function ChapterScene({
  chapter,
  localTimeMs,
  still,
  seekSerial,
}: {
  readonly chapter: ChapterId
  readonly localTimeMs: number
  readonly still: boolean
  readonly seekSerial: number
}): ReactNode {
  switch (chapter) {
    case 'opportunity': {
      const cue = activeCue(OPPORTUNITY_CUES, localTimeMs)
      return (
        <OpportunityScene
          key={seekSerial}
          cue={cue}
          progress={cueProgress(cue, localTimeMs)}
          position={cueIndex(OPPORTUNITY_CUES, cue)}
          still={still}
        />
      )
    }
    case 'walkthrough': {
      const cue = activeCue(WALKTHROUGH_CUES, localTimeMs)
      return (
        <WalkthroughScene
          key={seekSerial}
          cue={cue}
          localTimeMs={localTimeMs}
          position={cueIndex(WALKTHROUGH_CUES, cue)}
          still={still}
        />
      )
    }
    case 'risk': {
      const cue = activeCue(RISK_CUES, localTimeMs)
      return (
        <RiskScene
          key={seekSerial}
          cue={cue}
          progress={cueProgress(cue, localTimeMs)}
          position={cueIndex(RISK_CUES, cue)}
          still={still}
        />
      )
    }
  }
}
