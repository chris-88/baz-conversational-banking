/**
 * How the product changed, and what each change cost to learn.
 *
 * The before and after are not decoration: each pair is a real screen or a real question that
 * stopped existing. A reader who takes nothing else from this page should be able to see that
 * the thing was arrived at rather than designed in one go.
 */

export type Pivot = {
  readonly id: string
  readonly from: string
  readonly to: string
  readonly headline: string
  readonly body: string
  /** What the customer used to meet. */
  readonly before: readonly string[]
  /** What they meet now. */
  readonly after: readonly string[]
  readonly beforeCaption: string
  readonly afterCaption: string
}

export const pivots: readonly Pivot[] = [
  {
    id: 'applications',
    from: 'Applications',
    to: 'Needs',
    headline: 'The customer had to arrive knowing the answer',
    body: 'The first instinct was to help people complete applications. It was useful, and it was too narrow: the customer still had to turn up knowing which application they needed, which is exactly the problem the product was meant to remove.',
    before: ['Mortgage', 'Personal loan', 'Savings', 'Credit card'],
    after: ['What are you trying to do?'],
    beforeCaption: 'What would you like to apply for?',
    afterCaption: 'A copy change on the surface. A product model change underneath.',
  },
  {
    id: 'goals',
    from: 'Needs',
    to: 'Goals',
    headline: 'A need is a moment. A goal has a shape',
    body: 'Needs were better, and still point-in-time. Somebody who says they need a mortgage does not have a mortgage need. They have a home-buying goal, with a deposit, a timeline and several products inside it.',
    before: ['Mortgage', 'Deposit savings', 'Protection'],
    after: ['Buy our first home', 'in about 18 months'],
    beforeCaption: 'Three needs, separately',
    afterCaption: 'One goal, with the products underneath it',
  },
  {
    id: 'conversation',
    from: 'Dashboard',
    to: 'Conversation',
    headline: 'Every element had to justify itself against a sentence',
    body: 'The build started with the furniture of a banking app: product tiles, plan panels, an application list, navigation. One by one, each had to answer why it was better than asking. Most could not.',
    before: ['Products', 'Plans', 'Applications', 'Navigation', 'Cards', 'Conversation'],
    after: ['Conversation'],
    beforeCaption: 'Six surfaces',
    afterCaption: 'What survived',
  },
  {
    id: 'deterministic',
    from: 'AI everywhere',
    to: 'AI where ambiguity is useful',
    headline: 'The model decides how to ask, never what is true',
    body: 'Early versions let the model do more: work out what an application still needed, decide whether something was valid, produce a figure. Every one of those moved into code. What is outstanding is computed, a rate comes from a published table, and a repayment is arithmetic.',
    before: ['Decide what is needed', 'Judge validity', 'Work out the numbers', 'Phrase the answer'],
    after: ['Phrase the answer'],
    beforeCaption: 'What the model was asked to do',
    afterCaption: 'What it is asked to do now',
  },
  {
    id: 'reuse',
    from: 'Build journeys',
    to: 'Reuse the bank’s own',
    headline: 'The journeys already existed, in a format a machine can read',
    body: 'The plan was to write a conversational version of each product journey. Then the existing web journey turned out to fetch its own definition from an API, which meant the questions, the branching, the validation and the submission shape were already written down. The work changed from authoring journeys to reading them.',
    before: ['Write the mortgage flow', 'Write the savings flow', 'Write the loan flow', 'Keep all three in step'],
    after: ['Read the published definition'],
    beforeCaption: 'One flow per product, maintained by us',
    afterCaption: 'One engine, driven by the bank’s own document',
  },
]

/**
 * What was got wrong, with the measurement that corrected it.
 *
 * Four, not six: a page that lists every lesson equally is a notebook. The two that are
 * genuinely engineering trivia live behind a disclosure for the readers who want them.
 */
export type Lesson = {
  readonly id: string
  readonly title: string
  readonly assumption: string
  readonly whatHappened: string
  readonly whatChanged: string
  readonly lesson: string
  /** The number that settled it, where there is one. */
  readonly measurement?: string
}

export const lessons: readonly Lesson[] = [
  {
    id: 'wrong-thing',
    title: 'We optimised the wrong thing',
    assumption: 'The product catalogue is the biggest thing in the prompt, so it is the thing to cut.',
    whatHappened:
      'It is the biggest thing in the prompt: 15,595 tokens of 26,974. Cutting it saved far less than expected, because it is read from cache on every turn after the first and cache reads are cheap.',
    whatChanged:
      'The work moved to what is written rather than what is read, and to how long the cache lives.',
    lesson: 'Instrument before optimising. The largest thing is not the most expensive thing.',
    measurement:
      'Counted exactly through the token-counting API. An earlier version of the same document derived its totals from character counts and published a figure that was 56% low.',
  },
  {
    id: 'cache-conversation',
    title: 'We cached the prompt, not the conversation',
    assumption: 'Caching the system prompt is the win, because the system prompt is the big part.',
    whatHappened:
      'It helped, and it left the conversation itself being re-read at full price on every turn, which grows with every message.',
    whatChanged:
      'The cache breakpoint moved so the conversation caches too. Turn two now writes 922 tokens instead of re-reading 54,000.',
    lesson: 'Architecture should follow how people actually behave, not how the API is laid out.',
    measurement: '€0.174 on turn one against €0.031 on turn two, reported by the API itself.',
  },
  {
    id: 'timeout',
    title: 'A timeout is not a cancellation',
    assumption: 'If we stop waiting for a response, we stop paying for it.',
    whatHappened:
      'The request kept running and kept generating. We had stopped reading, and the meter had not stopped.',
    whatChanged: 'Every call that can time out now carries an abort signal that actually cancels it.',
    lesson: 'Giving up on a result is not the same as stopping the work.',
  },
  {
    id: 'too-much-interface',
    title: 'We built too much interface',
    assumption: 'A conversational product still needs the usual surfaces around it.',
    whatHappened:
      'Product tiles, a plan panel, an application list, navigation. Each one was work, and each one was a place for the conversation and the screen to disagree about what was true.',
    whatChanged:
      'They were removed. What is left renders from the database beside the message that refers to it, so the two cannot drift apart.',
    lesson: 'Every interface element has to justify why it beats a sentence. Most cannot.',
  },
]

/** For readers who want the rest. Real, specific, and genuinely narrower in appeal. */
export const engineeringNotes: readonly { readonly title: string; readonly body: string }[] = [
  {
    title: 'Tool schemas are part of the prompt',
    body: 'The JSON schemas for fifteen tools are 4,739 tokens, 18% of the cached prefix, and nothing in the API bill breaks them out. A tool nobody calls still costs something every turn.',
  },
  {
    title: 'A cache instruction that silently did nothing',
    body: 'A cache breakpoint placed after content that changes every turn caches nothing and reports no error. It looked correct for days. Only the token counts showed it.',
  },
  {
    title: 'An output ceiling is a cost, not a saving',
    body: 'A ceiling of 1,024 tokens truncated dense turns mid-sentence. The customer saw an apology, the bill saw full price for discarded output, and the customer sent the message again.',
  },
  {
    title: 'A refused tool call buys an entire round',
    body: 'A batch limit of twelve facts, met by an opening message carrying fifteen, costs a whole extra round. Every round re-reads the cached prefix, so the bound meant to keep one call small was buying a second call instead.',
  },
]
