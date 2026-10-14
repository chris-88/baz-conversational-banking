/**
 * The five stages of a turn, and what each one is actually responsible for.
 *
 * The replay exists to make one point: the model is a narrow part of this. It decides how to
 * ask and how to explain, and everything that has to be correct happens somewhere else.
 */

export type Stage = {
  readonly id: 'customer' | 'gate' | 'model' | 'engine' | 'bank'
  readonly name: string
  readonly oneLine: string
  /** What happens here on the worked turn. */
  readonly detail: readonly string[]
  /** Whether this stage is the model, which the diagram distinguishes visually. */
  readonly isModel: boolean
}

export const stages: readonly Stage[] = [
  {
    id: 'customer',
    name: 'Customer',
    oneLine: 'A sentence, in their own words',
    detail: ['“I need €20,000 for a car.”'],
    isModel: false,
  },
  {
    id: 'gate',
    name: 'The gate',
    oneLine: 'Decides whether this is in scope at all',
    detail: [
      'A small classifier runs before anything else, on every turn.',
      'Out of scope gets a short fixed answer and never reaches the model.',
      'category: banking · sensitive: false',
    ],
    isModel: false,
  },
  {
    id: 'model',
    name: 'The model',
    oneLine: 'Works out what was meant and how to answer',
    detail: [
      'Reads the case digest: what is known, what is outstanding, what has been declined.',
      'Records the two facts in that sentence through a validated tool.',
      'Chooses what to say next. It does not decide what is required.',
    ],
    isModel: true,
  },
  {
    id: 'engine',
    name: 'The engine',
    oneLine: 'Decides what is true, required and valid',
    detail: [
      'Resolves which of 418 published controls apply to this customer.',
      'Calculates what the definition says to calculate: the total is {:179}+{:218}+…',
      'Computes the repayment. Refuses to compute an eligibility verdict.',
      'Builds the submission packet, in the order a browser would send it.',
    ],
    isModel: false,
  },
  {
    id: 'bank',
    name: 'The bank’s own journey',
    oneLine: 'The definition, and where a real submission would go',
    detail: [
      'GET /api/forms/1940 — the published journey definition.',
      'POST /api/forms/1940 — recorded as the intended destination.',
      'In this prototype nothing is ever sent there.',
    ],
    isModel: false,
  },
]

/**
 * Where the line sits between the two kinds of work.
 *
 * Stated as a pair of lists because the argument is a boundary, and a boundary is easier to
 * believe when you can see both sides of it at once.
 */
export const boundary = {
  ai: {
    title: 'The model',
    oneLine: 'Used where ambiguity is the point',
    items: [
      { what: 'Understand what somebody meant', example: '“about 92k” after a question about salary' },
      { what: 'Decide how to ask', example: 'Two questions in a sentence, not a form' },
      { what: 'Explain a result', example: 'Why a loan alongside a mortgage is worth pausing' },
      { what: 'Choose which card to show', example: 'The review card, when an application is ready' },
    ],
  },
  deterministic: {
    title: 'The code',
    oneLine: 'Used where certainty is required',
    items: [
      { what: 'Decide what is still needed', example: 'outstanding(journey, facts), recomputed every turn' },
      { what: 'Validate a value', example: 'A choice has to be one the published form offers' },
      { what: 'Do the arithmetic', example: 'Repayments, totals, questions avoided' },
      { what: 'Enforce the rules', example: 'The state machine is the only path to a state change' },
    ],
  },
  quote: 'Use the model where ambiguity is valuable. Use software where certainty is required.',
} as const

/**
 * The one code sample on the page.
 *
 * Chosen because it shows the shape of the architecture in nine lines: classify first, load
 * controlled context, then hand the model a bounded set of tools. Not real source, but a
 * faithful reduction of `baz-turn`.
 */
export const codeSample = `const decision = await gate(message, previousTurn)

if (decision.category !== 'banking' && decision.category !== 'ambiguous') {
  return refusal(decision)          // the model never sees it
}

const context = await loadCase(caseId)   // facts, applications, what is outstanding

return baz.respond({
  message,
  digest: buildDigest(context),     // controlled data, not free text
  tools: toolsFor(context),         // it can only do what it is handed
})`

export const codeCallouts: readonly { readonly line: string; readonly note: string }[] = [
  { line: 'gate', note: 'Enforcement, not instruction. Out of scope stops here.' },
  { line: 'buildDigest', note: 'Everything the model knows comes from the database.' },
  { line: 'toolsFor', note: 'No tool creates, submits or consents to anything.' },
]

/**
 * What runs where, for the channels diagram.
 *
 * The honest version of the claim: the definition is genuinely shared, and Baz genuinely reads
 * it. Whether a production conversational channel would submit through the same endpoint is a
 * direction, not something this prototype has done, and the page says so.
 */
export const channels = {
  source: 'Digital Forms',
  sourceDetail: 'Machine-readable journeys: questions, branching, validation, submission shape',
  renderers: [
    { name: 'Web', detail: 'The existing online journey', status: 'In production' },
    { name: 'Mobile', detail: 'The banking app', status: 'In production' },
    { name: 'Baz', detail: 'A conversational renderer of the same definition', status: 'POC' },
  ],
  caption: 'Different experiences. One underlying source of journey truth.',
} as const
