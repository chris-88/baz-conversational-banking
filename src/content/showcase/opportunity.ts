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
      body: 'They get married. They have children. They start planning for a first home. None of it arrives labelled with a product name.',
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
      body: 'A mortgage, an account, protection. The customer has one life, and we ask them to navigate three processes, typing the same facts into each.',
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
      body: 'One message, in their own words. Everything the bank needs to know is in it, if something is listening for it.',
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
      body: 'A conversational banking proof of concept. It begins with the customer’s circumstances, asks relevant questions, and connects their needs to banking services.',
      bullets: [
        'Begins with the circumstances',
        'Asks only what it doesn’t know',
        'Connects needs to services',
      ],
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
      body: 'The journeys, the forms, the rates and the rules are already there. Baz uses them rather than rebuilding everything underneath. One conversation, a more connected experience.',
    },
  },
]
