import type { RiskScene, ShowcaseCue } from './types'

/**
 * The last sixty seconds: so what.
 *
 * A strategic risk and a design opportunity, not a prophecy. The copy keeps the prototype,
 * the strategy and what production would still need apart, because the brief asks for that
 * and because a room of bankers will notice if it doesn't.
 */
export const RISK_CUES: readonly ShowcaseCue<RiskScene>[] = [
  {
    id: 'compress',
    chapter: 'risk',
    startMs: 0,
    endMs: 5_700,
    scene: 'compress',
    presenter: {
      eyebrow: 'What you’ve just seen',
      title: 'One conversation, several products, nothing asked twice.',
    },
  },
  {
    id: 'assistant',
    chapter: 'risk',
    startMs: 5_700,
    endMs: 19_300,
    scene: 'assistant',
    presenter: {
      eyebrow: 'The shift',
      title: 'Personal AI assistants are becoming the first place people ask.',
    },
  },
  {
    id: 'ownership',
    chapter: 'risk',
    startMs: 19_300,
    endMs: 35_700,
    scene: 'ownership',
    presenter: {
      eyebrow: 'The strategic question',
      title: 'If somebody else owns the conversation, the bank keeps the products.',
    },
  },
  {
    id: 'paths',
    chapter: 'risk',
    startMs: 35_700,
    endMs: 44_500,
    scene: 'paths',
    presenter: {
      eyebrow: 'Two responses',
      title: 'Baz explores both ways to respond.',
    },
  },
  {
    id: 'question',
    chapter: 'risk',
    startMs: 44_500,
    endMs: 50_560,
    scene: 'question',
    presenter: {
      title: 'Who will customers choose to talk to?',
      body: 'The opportunity is real. The question is who holds the relationship.',
    },
  },
]
