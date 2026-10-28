import opportunityMp3 from '@/assets/showcase/opportunity.mp3'
import walkthroughMp3 from '@/assets/showcase/walkthrough.mp3'
import riskMp3 from '@/assets/showcase/risk.mp3'
import opportunityVtt from './captions/opportunity.vtt?raw'
import walkthroughVtt from './captions/walkthrough.vtt?raw'
import riskVtt from './captions/risk.vtt?raw'
import type { ChapterId, ChapterManifest } from './types'

/**
 * Every destination and every asset the showcase depends on, in one place.
 *
 * The tracks are imported as modules rather than read from `public/`, so Vite hashes them
 * and prefixes the base path, and the service worker's precache glob (js, css, html, svg,
 * png, woff2) never picks them up: a visitor who opens Baz on conference wifi does not
 * download three minutes of narration they will never hear.
 *
 * `liveDemoUrl` is the string the printed QR code encodes. `qr.test.ts` checks the two agree,
 * so the explore screen cannot point somewhere the code on the slide does not.
 */
export const showcaseConfig = {
  title: 'The Baz showcase',
  chapters: {
    opportunity: {
      id: 'opportunity',
      label: 'Opportunity',
      src: opportunityMp3,
      durationTargetMs: 47_040,
      captions: opportunityVtt,
    },
    walkthrough: {
      id: 'walkthrough',
      label: 'Product',
      src: walkthroughMp3,
      durationTargetMs: 129_200,
      captions: walkthroughVtt,
    },
    risk: {
      id: 'risk',
      label: 'Change',
      src: riskMp3,
      durationTargetMs: 50_560,
      captions: riskVtt,
    },
  } satisfies Readonly<Record<ChapterId, ChapterManifest>>,
  liveDemoUrl: 'https://baz.chrisquinn.ie/#/baz',
  /** Shown under the QR code, for anybody who would rather type it. */
  liveDemoShort: 'baz.chrisquinn.ie/#/baz',
  /** Relative, because the article is a route of this site. */
  articleHref: '#/article',
  examplePrompt:
    'We’ve recently married, had our first baby, and are hoping to buy our first home.',
  /** How long a scene change takes. Short enough never to add up. */
  cutoverMs: 350,
} as const

export type ShowcaseConfig = typeof showcaseConfig
export const MANIFESTS: Readonly<Record<ChapterId, ChapterManifest>> = showcaseConfig.chapters
