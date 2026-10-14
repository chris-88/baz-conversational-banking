/**
 * How the product changed, and what each change cost to learn.
 *
 * The before and after are not decoration: each pair is a real screen or a real question that
 * stopped existing. A reader who takes nothing else from this page should be able to see that
 * the thing was arrived at rather than designed in one go.
 */

/**
 * A miniature of the thing a pivot replaced, or arrived at.
 *
 * Deliberately several kinds rather than one. A list of grey pills can stand for anything,
 * which is why the first version of this section did not read: "Products, Plans, Applications,
 * Navigation" is four words, where a nav bar above four tiles is a screen somebody built and
 * then deleted. Each pivot gets the shape of the thing it is actually about.
 */
export type Mini =
  | { readonly kind: 'tiles'; readonly items: readonly string[] }
  | {
      readonly kind: 'chat'
      readonly lines: readonly { readonly from: 'customer' | 'baz'; readonly text: string }[]
    }
  | {
      readonly kind: 'goal'
      readonly title: string
      readonly meta: string
      readonly items: readonly string[]
    }
  | { readonly kind: 'dashboard'; readonly nav: readonly string[]; readonly tiles: readonly string[] }
  | {
      readonly kind: 'tasks'
      readonly items: readonly { readonly text: string; readonly owner: 'model' | 'code' }[]
    }
  | {
      readonly kind: 'docs'
      readonly items: readonly { readonly title: string; readonly note: string }[]
      readonly source: 'ours' | 'theirs'
    }

export type Pivot = {
  readonly id: string
  readonly from: string
  readonly to: string
  readonly headline: string
  readonly body: string
  readonly before: Mini
  readonly after: Mini
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
    before: { kind: 'tiles', items: ['Mortgage', 'Personal loan', 'Savings', 'Credit card'] },
    after: {
      kind: 'chat',
      lines: [{ from: 'baz', text: 'What are you trying to do?' }],
    },
    beforeCaption: 'A menu of products, and a customer expected to know which one they are',
    afterCaption: 'One question that does not assume they do',
  },
  {
    id: 'goals',
    from: 'Needs',
    to: 'Goals',
    headline: 'A need is a moment. A goal has a shape',
    body: 'Needs were better, and still point-in-time. Somebody who says they need a mortgage does not have a mortgage need. They have a home-buying goal, with a deposit, a timeline and several products inside it.',
    before: { kind: 'tiles', items: ['Mortgage', 'Deposit savings', 'Protection'] },
    after: {
      kind: 'goal',
      title: 'Buy our first home',
      meta: 'in about 18 months',
      items: ['Mortgage', 'Deposit savings', 'Protection'],
    },
    beforeCaption: 'Three needs, each one its own conversation',
    afterCaption: 'One goal, with the products as the means to it',
  },
  {
    id: 'conversation',
    from: 'Dashboard',
    to: 'Conversation',
    headline: 'Every element had to justify itself against a sentence',
    body: 'The build started with the furniture of a banking app: product tiles, a plan panel, an application list, navigation. One by one, each had to answer why it was better than asking. Most could not.',
    before: {
      kind: 'dashboard',
      nav: ['Home', 'Products', 'Plans'],
      tiles: ['Current account', 'Savings', 'Your plan', 'In progress'],
    },
    after: {
      kind: 'chat',
      lines: [
        { from: 'customer', text: 'Can I afford a house next year?' },
        { from: 'baz', text: 'Let us work it out. What are you earning?' },
      ],
    },
    beforeCaption: 'Six surfaces, each a place for the screen and the conversation to disagree',
    afterCaption: 'What survived, with the cards rendered beside the message that refers to them',
  },
  {
    id: 'deterministic',
    from: 'AI everywhere',
    to: 'AI where ambiguity is useful',
    headline: 'The model decides how to ask, never what is true',
    body: 'Early versions let the model do more: work out what an application still needed, decide whether something was valid, produce a figure. Every one of those moved into code. What is outstanding is computed, a rate comes from a published table, and a repayment is arithmetic.',
    before: {
      kind: 'tasks',
      items: [
        { text: 'What is still needed', owner: 'model' },
        { text: 'Whether a value is valid', owner: 'model' },
        { text: 'The repayment figure', owner: 'model' },
        { text: 'How to phrase it', owner: 'model' },
      ],
    },
    after: {
      kind: 'tasks',
      items: [
        { text: 'What is still needed', owner: 'code' },
        { text: 'Whether a value is valid', owner: 'code' },
        { text: 'The repayment figure', owner: 'code' },
        { text: 'How to phrase it', owner: 'model' },
      ],
    },
    beforeCaption: 'Four jobs, all of them a judgement call',
    afterCaption: 'Three became arithmetic. One is still worth a model',
  },
  {
    id: 'reuse',
    from: 'Build journeys',
    to: 'Reuse the bank’s own',
    headline: 'The journeys already existed, in a format a machine can read',
    body: 'The plan was to write a conversational version of each product journey. Then the existing web journey turned out to fetch its own definition from an API, which meant the questions, the branching, the validation and the submission shape were already written down. The work changed from authoring journeys to reading them.',
    before: {
      kind: 'docs',
      source: 'ours',
      items: [
        { title: 'mortgage.flow.ts', note: 'written by us' },
        { title: 'savings.flow.ts', note: 'written by us' },
        { title: 'loan.flow.ts', note: 'written by us' },
      ],
    },
    after: {
      kind: 'docs',
      source: 'theirs',
      items: [{ title: 'GET /api/forms/1940', note: '418 controls, published by the bank' }],
    },
    beforeCaption: 'One flow per product, and three copies of the truth to keep in step',
    afterCaption: 'One engine, reading the document the website already reads',
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
