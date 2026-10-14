/**
 * The proof card's conversations, and the system state behind each.
 *
 * Synthetic and labelled as such. The page says "synthetic example" beside them rather than
 * implying a live customer, because a prototype that fakes production traffic to look busy has
 * given up the one thing it had, which is being straight about what it is.
 *
 * The system state is real in shape: these are the categories the gate actually emits and the
 * tools actually offered for that turn. An invented confidence score was in the first draft of
 * the design, and there is no confidence score anywhere in this system: showing one would be
 * inventing a property to look sophisticated, on a page arguing for rigour.
 */

export type Scenario = {
  readonly id: 'home' | 'cash' | 'difficulty'
  readonly label: string
  readonly customer: string
  readonly baz: readonly string[]
  /** What the gate decided, in its own vocabulary. */
  readonly gate: {
    readonly category: string
    readonly sensitive: boolean
    readonly profanity: boolean
  }
  /** Three cells under the reply: what was understood, reused, and still needed. */
  readonly cells: readonly { readonly label: string; readonly value: string }[]
  /** The system view, which is the same turn described by the engine rather than the model. */
  readonly system: readonly { readonly label: string; readonly value: string }[]
  /** Which tools were offered to the model on this turn. Real names from `tools.ts`. */
  readonly toolsOffered: readonly string[]
  readonly note: string
}

export const scenarios: readonly Scenario[] = [
  {
    id: 'home',
    label: 'Buying a first home',
    customer: 'My wife and I want to buy our first home next year.',
    baz: [
      'That is a good thing to start early. Buying together changes what you can borrow and what you need saved, so it is worth getting the shape of it right first.',
      'Roughly what are you earning between you, and how much have you put aside so far?',
    ],
    gate: { category: 'banking', sensitive: false, profanity: false },
    cells: [
      { label: 'Understood', value: 'First-home goal, two applicants' },
      { label: 'Reused', value: '6 facts already held' },
      { label: 'Still needed', value: 'Household income, deposit' },
    ],
    system: [
      { label: 'Gate', value: 'banking' },
      { label: 'Goal matched', value: 'buy_first_home' },
      { label: 'Facts held', value: '6' },
      { label: 'Outstanding, computed', value: '2' },
      { label: 'Products offered', value: 'none yet' },
    ],
    toolsOffered: ['record_facts', 'show_product_options', 'propose_plan', 'show_mortgage_rates'],
    note: 'Nothing is offered on the first turn. What a customer needs is computed from facts, and six facts is not enough to put a product in front of anybody.',
  },
  {
    id: 'cash',
    label: 'A lump sum arrives',
    customer: 'I have come into about €50,000. What should I do with it?',
    baz: [
      'It depends on what it is for and when you might need it. Money you want untouched for a year behaves very differently from money you might need next month.',
      'Is there anything you are already saving towards, or is this money without a job yet?',
    ],
    gate: { category: 'banking', sensitive: false, profanity: false },
    cells: [
      { label: 'Understood', value: 'Lump sum, no stated purpose' },
      { label: 'Reused', value: '4 facts already held' },
      { label: 'Still needed', value: 'Timeframe, existing commitments' },
    ],
    system: [
      { label: 'Gate', value: 'banking' },
      { label: 'Needs engine', value: 'nothing surfaced yet' },
      { label: 'Facts held', value: '4' },
      { label: 'Outstanding, computed', value: '2' },
      { label: 'Products offered', value: 'none yet' },
    ],
    toolsOffered: ['record_facts', 'show_comparison', 'show_quote', 'propose_plan'],
    note: 'A product list here would be a guess. The engine has nothing to go on until it knows when the money is needed.',
  },
  {
    id: 'difficulty',
    label: 'Struggling to keep up',
    customer: 'I am behind on the mortgage and I do not know what to do.',
    baz: [
      'Thank you for telling me. Being behind is more common than people think and there are real options, so let us take it one step at a time.',
      'The important thing is to talk to the team who can actually change the arrangement. I can put you through to them now.',
    ],
    gate: { category: 'banking', sensitive: true, profanity: false },
    cells: [
      { label: 'Understood', value: 'Arrears, financial difficulty' },
      { label: 'Tone', value: 'Humour forced to zero' },
      { label: 'Products', value: 'Suppressed for this turn' },
    ],
    system: [
      { label: 'Gate', value: 'banking · sensitive' },
      { label: 'Persona', value: 'humour, sarcasm, playfulness → 0' },
      { label: 'Product offers', value: 'suppressed' },
      { label: 'Route', value: 'hand off to the arrears team' },
    ],
    toolsOffered: ['record_facts', 'show_status'],
    note: 'The sensitive flag is not a prompt instruction. It zeroes the persona sliders and removes the tools that could offer anybody a product, before the model sees the turn.',
  },
]
