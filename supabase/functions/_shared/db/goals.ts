import { caseFactReader } from './fact-reader.ts'
import { contentionIn, evaluateGoals, heldForLater, worthRaising } from '../domain/goals/engine.ts'
import type { GoalCandidate, GoalContext } from '../domain/goals/types.ts'
import { isGoalId } from '../domain/goals/types.ts'
import { factCatalogue } from '../domain/facts.ts'
import type { LoadedCase } from './loaded-case.ts'
import type { LoadedPlan } from './plans.ts'

/**
 * The case, as the Goal Engine reads it.
 *
 * Null when there is no primary participant, which means there is nobody to have a goal yet.
 */
export function goalContextFor(
  loaded: LoadedCase,
  plans: readonly LoadedPlan[],
  options: { readonly sensitiveDisclosure: boolean },
): GoalContext | null {
  const facts = caseFactReader(loaded)
  if (facts === null) return null

  return {
    facts,
    applications: loaded.applications.map((application) => ({
      product: application.product,
      state: application.state,
    })),
    sensitiveDisclosure: options.sensitiveDisclosure,
    plans: plans.flatMap(({ plan, progress }) =>
      // A plan whose goal predates the catalogue is skipped rather than coerced: better to read
      // one plan as unknown than to attribute somebody's savings to the wrong objective.
      isGoalId(plan.goal)
        ? [
            {
              goal: plan.goal,
              status: plan.status,
              targetAmount: plan.targetAmount,
              short: progress.short,
            },
          ]
        : [],
    ),
    today: new Date().toISOString().slice(0, 10),
  }
}

/**
 * What the digest tells the model about where the customer is trying to get to.
 *
 * Deliberately short. Eight goals can be identified from one sentence (§21) and reciting them is
 * how a concierge turns back into a product menu — so the digest carries the one they came in
 * about, a couple worth mentioning, what is being held for later, and anything in contention.
 */
export function describeGoals(context: GoalContext | null): {
  readonly candidates: readonly GoalCandidate[]
  readonly lines: readonly string[]
} {
  if (context === null) return { candidates: [], lines: [] }

  const candidates = evaluateGoals(context)
  const lines: string[] = []

  const raise = worthRaising(candidates)
  const primary = raise.find((candidate) => candidate.tier === 'primary') ?? null

  if (primary !== null) {
    lines.push(`What they came in about: ${primary.goal.name.toLowerCase()}.`)

    // The catalogue's label where it has one, the key otherwise — a key is at least readable,
    // and a question Baz asks is phrased by Baz, not copied from here.
    const outstanding: string[] = primary.missing.map((key) => factCatalogue[key]?.label ?? key)

    if (outstanding.length > 0) {
      lines.push(`Still unknown for it: ${outstanding.slice(0, 4).join(', ')}.`)
    }
  }

  const alongside = raise.filter((candidate) => candidate.tier !== 'primary')
  if (alongside.length > 0) {
    lines.push(
      `Also likely, from what they have said: ${alongside
        .map((candidate) => `${candidate.goal.name.toLowerCase()} (${candidate.evidence[0]?.describe ?? 'their situation'})`)
        .join('; ')}. Do not list these back — raise at most one, and only if it helps them.`,
    )
  }

  for (const held of heldForLater(candidates).slice(0, 3)) {
    lines.push(
      `Held for later: ${held.goal.name.toLowerCase()} — ${held.reason}. Worth raising again when ${held.revisitWhen}.`,
    )
  }

  for (const contention of contentionIn(context)) {
    lines.push(`Conflict: ${contention.describe} Ask which it is for; do not decide for them.`)
  }

  return { candidates, lines }
}
