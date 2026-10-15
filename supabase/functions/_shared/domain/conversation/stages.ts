/**
 * Where a conversation has got to, computed rather than sensed.
 *
 * Everything else in this product follows one rule: the engine decides what is true and the
 * model decides how to say it. The conversation itself was the exception. Nothing knew whether
 * a customer had been understood yet, so nothing could say "not products, not yet", and a
 * transcript could run eight questions deep and then produce a product card with no goal, no
 * plan and no moment where anybody was asked what they actually wanted.
 *
 * So the arc is a state machine like any other. The stage is derived from the case, the
 * guidance for each stage is declared in one file, and the tools a turn is offered are the
 * tools that stage allows. A stage is never chosen by the model and never stored: it is read
 * off the case every turn, which means correcting a fact or changing their mind moves the
 * conversation back by itself.
 */

export const STAGES = [
  /** The first reply. React to what happened to them, ask one opening question. */
  'opening',
  /** Work out the shape of the situation. No products, no plan, no solutions. */
  'discovering',
  /** Enough is known to name where they are going. Ask how they want to get there. */
  'direction',
  /** They want a plan. Build it, show it, let them decide. */
  'planning',
  /** Put the options in front of them: categories first, then the ones inside a category. */
  'choosing',
  /** Something is started. Collect what it needs and get it submitted. */
  'applying',
] as const

export type Stage = (typeof STAGES)[number]

/** What the customer has chosen to do about their goal, when they have said. */
export type Approach = 'plan' | 'product'

export type StageContext = {
  /** How many times the customer has spoken. One means this is the first reply. */
  readonly customerTurns: number
  /** Whether the goal engine can name what they came in about. */
  readonly goalNamed: boolean
  /** Facts the primary goal still wants. The fork is premature while this is large. */
  readonly goalGaps: number
  /** `goals.approach`, once they have answered the fork. */
  readonly approach: Approach | null
  /** A plan they have kept, as opposed to one merely proposed. */
  readonly planAccepted: boolean
  /** Applications on the case, in any state. */
  readonly applications: number
}

/**
 * The stage, in order of precedence.
 *
 * Ordered rather than scored, so that reading the list tells you exactly what happens and a
 * test can cover every branch. First match wins.
 */
export function stageFor(context: StageContext): Stage {
  // Something is under way. Everything else is behind them.
  if (context.applications > 0) return 'applying'

  // The very first reply is its own thing: it is the only turn with nothing to go on.
  if (context.customerTurns <= 1) return 'opening'

  // They have either asked for a plan and got one, or said they just want the product.
  if (context.planAccepted || context.approach === 'product') return 'choosing'

  if (context.approach === 'plan') return 'planning'

  /*
   * The fork, once there is something to fork about.
   *
   * `goalGaps` is the brake. Asking "shall we make a plan, or do you just want the account"
   * the moment somebody mentions a house, before anyone knows when, with whom or on what, is
   * the same mistake as offering the product: it skips the part where they are understood.
   */
  if (context.goalNamed && context.goalGaps <= MAX_GAPS_FOR_DIRECTION) return 'direction'

  return 'discovering'
}

/**
 * How much may still be unknown when the fork is put to them.
 *
 * Two, measured against the goal catalogue: a first-home goal wants a timeframe, a deposit, an
 * income and a price, and holding the fork until all four are in produces the interrogation
 * this engine exists to prevent. Two outstanding is enough to describe where somebody is going
 * without knowing everything about how they get there.
 */
const MAX_GAPS_FOR_DIRECTION = 2

/** Whether a stage is allowed to put a product in front of somebody. */
export function mayOfferProducts(stage: Stage): boolean {
  return stage === 'choosing' || stage === 'applying'
}

/** Whether a stage is allowed to propose a plan. */
export function mayProposePlan(stage: Stage): boolean {
  return stage === 'planning' || stage === 'direction'
}
