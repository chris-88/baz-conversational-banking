import type { Product } from '../journey.ts'
import type { ApplicationState } from '../state-machine.ts'

/**
 * Customer Plans — where the customer is trying to get to, and how far along they are.
 *
 * Banking records transactions. Digital banking added products. Needs added intent. A plan
 * adds trajectory: the thing that makes a mortgage, a joint account, a savings account and a
 * deferred loan one objective rather than five unrelated applications.
 *
 * What is stored and what is computed is the whole design. A plan holds decisions — the goal,
 * the target the customer agreed, when a milestone was actually reached, when the next
 * check-in is due. Everything else is derived from the case on demand: progress, the gap, the
 * projected date, whether it is on track. A stored percentage is a number that can disagree
 * with the balance it came from, and this codebase already has three engines that refuse to
 * do that (Invariant 2, Invariant 3).
 */

export const PLAN_GOALS = [
  'buy_first_home',
  'move_home',
  'emergency_fund',
  'save_for_child',
  'buy_car',
  'renovate',
  'retire',
  'become_debt_free',
  'other',
] as const

export type PlanGoal = (typeof PLAN_GOALS)[number]

/**
 * `draft` is a plan Baz has proposed and the customer has not agreed to. It is deliberately a
 * state rather than an absence: §10 says Baz must not silently create a persistent plan, so
 * the proposal and the acceptance are different events.
 */
export const PLAN_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'abandoned',
  'archived',
] as const

export type PlanStatus = (typeof PLAN_STATUSES)[number]

export const MILESTONE_KINDS = ['numeric', 'date', 'application', 'customer', 'external'] as const
export type MilestoneKind = (typeof MILESTONE_KINDS)[number]

export const MILESTONE_STATES = [
  'not_started',
  'in_progress',
  'achieved',
  'missed',
  'no_longer_relevant',
] as const

export type MilestoneState = (typeof MILESTONE_STATES)[number]

export type Milestone = {
  readonly id: string
  readonly kind: MilestoneKind
  readonly label: string
  readonly sort: number
  readonly targetAmount: number | null
  readonly targetDate: string | null
  readonly targetProduct: Product | null
  readonly targetState: ApplicationState | null
  readonly state: MilestoneState
  readonly achievedAt: string | null
}

export const CHECKIN_STATES = [
  'scheduled',
  'due',
  'completed',
  'skipped',
  'cancelled',
  'rescheduled',
] as const

export type CheckinState = (typeof CHECKIN_STATES)[number]

/**
 * A planned reason to speak again.
 *
 * The agenda is written when the check-in is created, not when it fires. A check-in whose
 * reason is invented at the moment of contact is a marketing trigger wearing a different hat
 * — §20 is explicit that if there is nothing useful to discuss, Baz should say so and leave.
 */
export type Checkin = {
  readonly id: string
  readonly purpose: string
  readonly agenda: readonly string[]
  readonly triggerKind: 'date' | 'event'
  readonly dueAt: string | null
  readonly triggerEvent: string | null
  readonly state: CheckinState
}

export type Plan = {
  readonly id: string
  readonly goal: PlanGoal
  readonly title: string
  readonly status: PlanStatus
  readonly targetAmount: number | null
  readonly targetDate: string | null
  readonly milestones: readonly Milestone[]
  readonly checkins: readonly Checkin[]
  /** Applications started in service of this goal. */
  readonly applications: readonly { readonly product: Product; readonly state: ApplicationState }[]
  readonly lastConfirmedAt: string | null
}

/**
 * Everything derived. Recomputed on every read, never written down.
 */
export type PlanProgress = {
  /** What they hold now against what they agreed to reach. Null when there is no target. */
  readonly current: number | null
  readonly target: number | null
  readonly short: number | null
  /** 0 to 1. Null rather than zero when there is nothing to measure. */
  readonly fraction: number | null
  /**
   * When they will arrive at the rate they gave. Null when the case cannot say — no rate, no
   * target, or already there. Never a guess (§16, §40).
   */
  readonly projectedDate: string | null
  readonly monthsRemaining: number | null
  /** Against the date the customer set, where they set one. */
  readonly onTrack: boolean | null
  readonly nextMilestone: Milestone | null
  readonly nextCheckin: Checkin | null
}

/** What the plan reads from the case. Facts and state, never conversation. */
export type PlanContext = {
  readonly savingsBalance: number | null
  readonly monthlySaving: number | null
  readonly today: string
}
