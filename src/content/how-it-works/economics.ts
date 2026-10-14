/**
 * What a turn costs, from `docs/04-cost-of-running-a-conversational-assistant.md`.
 *
 * Every figure here is measured and carries where it came from, because this page publishes
 * them. The first draft of the design carried four numbers and three were wrong: a cached
 * prefix of 28,087 that appears in no measurement, per-turn costs of €0.19/€0.12/€0.09 against
 * a measured €0.174/€0.031/€0.036, and "56% of the product catalogue", which was a misreading
 * of a sentence about an earlier published total being 56% low.
 *
 * The last one is the instructive failure. A plausible number attached to the wrong noun is
 * almost impossible to catch by reading, and nobody re-checks a figure that already looks
 * specific. So each entry below names its source, and the cost document is the only place
 * these are allowed to be edited.
 */

export type Measurement = {
  readonly value: string
  readonly label: string
  /** Where the number comes from, shown on the page rather than kept in a comment. */
  readonly basis: string
}

export const headline: readonly Measurement[] = [
  {
    value: '€0.94',
    label: 'a 12-turn conversation, before',
    basis: 'Modelled from the same prompt without caching',
  },
  {
    value: '€0.55',
    label: 'after the architecture changed',
    basis: 'Measured from a live conversation',
  },
  {
    value: '28,633',
    label: 'tokens in the cached prefix',
    basis: 'Counted exactly through the token-counting API, 12 October',
  },
  {
    value: '922',
    label: 'tokens written on turn two, not 54,000',
    basis: 'Reported by the API itself on a live three-turn conversation',
  },
]

/**
 * The shape of the saving, which is the point.
 *
 * Turn one writes the whole prefix. Every turn after it writes only the newest message, so the
 * cost falls off a cliff rather than drifting down: €0.174 to €0.031 is a fivefold drop, and a
 * chart that shows a gentle decline is telling the wrong story about the right system.
 */
export type TurnCost = {
  readonly turn: number
  readonly what: string
  readonly cacheWrite: number
  readonly cacheRead: number
  readonly uncachedInput: number
  readonly output: number
  readonly gate: number
  readonly cost: number
}

export const turns: readonly TurnCost[] = [
  {
    turn: 1,
    what: 'Writes the whole prefix, then answers',
    cacheWrite: 26_974,
    cacheRead: 53_948,
    uncachedInput: 919,
    output: 495,
    gate: 1_150,
    cost: 0.174,
  },
  {
    turn: 2,
    what: 'Writes only the new message',
    cacheWrite: 922,
    cacheRead: 54_094,
    uncachedInput: 723,
    output: 569,
    gate: 1_227,
    cost: 0.031,
  },
  {
    turn: 3,
    what: 'Same again, longer answer',
    cacheWrite: 1_064,
    cacheRead: 54_236,
    uncachedInput: 955,
    output: 850,
    gate: 1_228,
    cost: 0.036,
  },
]

/** What the prefix is made of. Shares are from the 26,974-token count in the cost document. */
export const prefix: readonly { readonly section: string; readonly tokens: number }[] = [
  { section: 'Product catalogue', tokens: 15_595 },
  { section: 'Tool definitions', tokens: 4_739 },
  { section: 'Tool guidance', tokens: 1_806 },
  { section: 'Fact reference', tokens: 1_711 },
  { section: 'Voice', tokens: 1_097 },
  { section: 'How applying works', tokens: 598 },
  { section: 'Policy', tokens: 570 },
  { section: 'What we can do', tokens: 522 },
  { section: 'Domain scope', tokens: 158 },
]

/**
 * The simulator's assumptions, stated rather than buried.
 *
 * Marked illustrative on the page. A cost per conversation taken from a 12-turn measurement
 * and multiplied by a number somebody typed is an arithmetic exercise, not a commercial
 * forecast, and the page should not pretend otherwise.
 */
export const simulator = {
  costPerConversation: 0.55,
  basis: 'measured 12-turn conversation',
  defaultCustomers: 50_000,
  defaultConversationsPerCustomer: 2,
  defaultTurns: 12,
} as const
