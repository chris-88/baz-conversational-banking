import type { OpportunityScene, ShowcaseCue } from './types'

/**
 * The first sixty seconds: why.
 *
 * Provisional times from the brief's choreography. They are retimed against the mastered
 * narration when it arrives, and nothing but these numbers has to change.
 */
export const OPPORTUNITY_CUES: readonly ShowcaseCue<OpportunityScene>[] = [
  {
    id: 'headline',
    chapter: 'opportunity',
    startMs: 0,
    endMs: 9_400,
    scene: 'headline',
    presenter: {
      eyebrow: 'The opportunity',
      title: 'People don’t experience life in banking products.',
      body: 'They get married. They have children. They start planning for a first home. None of it arrives labelled with a product name.',
    },
  },
  {
    id: 'fragments',
    chapter: 'opportunity',
    startMs: 9_400,
    endMs: 19_600,
    scene: 'fragments',
    presenter: {
      eyebrow: 'Today’s experience',
      title: 'Those moments become separate journeys.',
      body: 'A mortgage, an account, protection. Each with its own process, its own questions and its own application, and the same facts typed three times.',
    },
  },
  {
    id: 'question',
    chapter: 'opportunity',
    startMs: 19_600,
    endMs: 29_000,
    scene: 'question',
    presenter: {
      eyebrow: 'A different starting point',
      title: 'What if we started with the person?',
      body: 'One message, in their own words. Everything the bank needs to know is in it, if something is listening for it.',
    },
  },
  {
    id: 'meet',
    chapter: 'opportunity',
    startMs: 29_000,
    endMs: 40_000,
    scene: 'meet',
    presenter: {
      eyebrow: 'Meet Baz',
      title: 'Discover, understand, connect.',
      body: 'Baz works out what a life event involves, asks only for what it doesn’t know, and connects the answers to the products that fit.',
      bullets: [
        'Understand the circumstances',
        'Discover the needs behind them',
        'Connect to the right products',
      ],
    },
  },
  {
    id: 'capability',
    chapter: 'opportunity',
    startMs: 40_000,
    endMs: 47_040,
    scene: 'capability',
    presenter: {
      eyebrow: 'Built on what exists',
      title: 'Capabilities the bank already owns.',
      body: 'The journeys, the forms, the rates and the rules are already there. Baz is the layer that starts with a conversation. Here’s what that looks like.',
    },
  },
]
