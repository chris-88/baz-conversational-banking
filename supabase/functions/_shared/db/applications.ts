import type { Db } from './case-repository.ts'
import { asApplicationId, type ApplicationId } from '../domain/facts.ts'
import { journeyFor } from '../domain/journeys/index.ts'
import type { Journey, Product } from '../domain/journey.ts'
import { evaluateJourney, type JourneyEvaluation, type RequirementContext } from '../domain/requirements.ts'
import { stateLabel, transition, type Application, type TransitionEvent } from '../domain/state-machine.ts'
import type { ApplicationSummary } from '../contracts/case-action.ts'
import { participantFor, type LoadedCase } from './loaded-case.ts'
import { writeEvent } from './case-repository.ts'

/**
 * Applications: created by the customer's choice, and moved only by the state machine.
 *
 * Every state change in the system goes through `transition`, so an illegal move is refused
 * rather than written (Invariant 2, §14). Nothing here trusts a state supplied by a caller.
 */

export function evaluateFor(loaded: LoadedCase, application: Application): JourneyEvaluation {
  const primary = participantFor(loaded, 'primary')
  if (primary === null) {
    return { outstanding: [], satisfied: [], complete: false, waitingOn: null, activeBranches: [] }
  }

  const context: RequirementContext = {
    applicationId: application.id,
    participants: { primary, partner: participantFor(loaded, 'partner') },
    facts: loaded.facts,
    confirmations: loaded.confirmations
      .filter((confirmation) => confirmation.applicationId === application.id)
      .map((confirmation) => confirmation.requirementId),
    documents: loaded.documents
      .filter((document) => document.applicationId === application.id)
      .map((document) => ({ requirementId: document.requirementId, verified: document.verified })),
  }

  return evaluateJourney(journeyFor(application.product), context)
}

export function summarise(
  application: Application,
  journey: Journey,
  evaluation: JourneyEvaluation,
): ApplicationSummary {
  const blocking = evaluation.outstanding.filter((item) => item.blocking)
  const satisfied = evaluation.satisfied.length
  const total = satisfied + blocking.length

  return {
    id: String(application.id),
    product: application.product,
    displayName: journey.displayName,
    state: application.state,
    stateLabel: stateLabel(application.state),
    outstanding: blocking.filter((i) => i.waitingOn === 'primary').map((i) => i.requirement.label),
    outstandingForPartner: blocking
      .filter((i) => i.waitingOn === 'partner')
      .map((i) => i.requirement.label),
    waitingOn: evaluation.waitingOn,
    progress: total === 0 ? 1 : satisfied / total,
  }
}

/**
 * Recomputes every application on the case and records any state change.
 *
 * Called after anything that could satisfy a requirement — a fact, a confirmation, a document.
 * The resulting state is derived, never chosen (Invariant 3).
 */
export async function recomputeApplications(
  client: Db,
  loaded: LoadedCase,
  options: { readonly activeApplicationId?: ApplicationId | undefined } = {},
): Promise<readonly ApplicationSummary[]> {
  const summaries: ApplicationSummary[] = []

  for (const application of loaded.applications) {
    const evaluation = evaluateFor(loaded, application)
    const journey = journeyFor(application.product)

    // A submitted or paused application is not recomputed: the customer is no longer
    // assembling it, and the state machine refuses the event anyway.
    const event: TransitionEvent = {
      type: 'requirements_changed',
      complete: evaluation.complete,
      waitingOn: evaluation.waitingOn,
      activeInConversation: options.activeApplicationId === application.id,
    }

    const result = transition(application, event)

    if (result.ok && result.changed) {
      await client
        .from('applications')
        .update({ state: result.application.state, resume_to: result.application.resumeTo })
        .eq('id', application.id)

      await writeEvent(client, {
        caseId: loaded.caseId,
        type: 'application_state_changed',
        actor: 'system',
        applicationId: String(application.id),
        payload: {
          from: application.state,
          to: result.application.state,
          applicationName: journey.displayName,
        },
      })

      summaries.push(summarise(result.application, journey, evaluation))
      continue
    }

    summaries.push(summarise(application, journey, evaluation))
  }

  return summaries
}

/** Which product of its kind, where the customer picked a specific one. */
export type ProductChoice = {
  readonly product: Product
  readonly catalogueId?: string | undefined
}

/**
 * What makes two choices the same choice.
 *
 * It used to be the kind alone, which quietly merged "SuperSaver for the €500 a month" and
 * "the 31-day notice account for the €20,000" into one savings application: both are
 * `savings`, so the second looked like a repeat of the first. A customer who asks for two
 * savings accounts should end up with two.
 */
const identify = (choice: {
  product: Product
  catalogueId?: string | null | undefined
}): string =>
  `${choice.product}:${choice.catalogueId ?? ''}`

/** §6 Stage 6 — the customer's choice creates several applications at once. */
export async function createApplications(
  client: Db,
  loaded: LoadedCase,
  products: readonly ProductChoice[],
  /**
   * What to call the application, given the catalogue product behind it.
   *
   * Injected rather than looked up here: this file is tenant-free, and the catalogue that knows
   * "savings.supersaver" is called SuperSaver belongs to the tenant (Invariant 11). Omitted,
   * every savings application is called "Savings account", which is where this started.
   */
  nameFor?: (product: Product, catalogueId: string | null) => string,
): Promise<readonly ProductChoice[]> {
  const existing = new Set(loaded.applications.map(identify))

  /*
   * Deduplicated against itself as well as against the case. A card offering two savings
   * accounts with no catalogue id on either is two choices that really are the same one, and
   * starting it twice would be the opposite failure to the one this fixes.
   */
  const wanted: ProductChoice[] = []
  for (const choice of products) {
    const key = identify(choice)
    if (existing.has(key)) continue
    existing.add(key)
    wanted.push(choice)
  }

  if (wanted.length === 0) return []

  const inserted = await client
    .from('applications')
    .insert(
      wanted.map((choice) => ({
        case_id: loaded.caseId,
        product: choice.product,
        catalogue_id: choice.catalogueId ?? null,
        state: 'not_started',
      })),
    )
    .select('id, product, catalogue_id')

  if (inserted.error) throw new Error(inserted.error.message)

  for (const row of (inserted.data ?? []) as {
    id: string
    product: Product
    catalogue_id: string | null
  }[]) {
    await writeEvent(client, {
      caseId: loaded.caseId,
      type: 'application_created',
      actor: 'customer',
      applicationId: row.id,
      payload: {
        product: row.product,
        applicationName:
          nameFor?.(row.product, row.catalogue_id) ?? journeyFor(row.product).displayName,
        ...(row.catalogue_id === null ? {} : { catalogueId: row.catalogue_id }),
      },
    })
  }

  /*
   * Interest stays at the level of the kind. "Yes to savings" is what a tap means, and the
   * unique key here is (case, product) — two savings accounts are one interest in savings.
   */
  /*
   * Checked, because it was not.
   *
   * This upsert spent a week violating a check constraint that had never been widened for
   * savings or current accounts. Nothing read the result, so it failed on every one of them in
   * silence, and the only symptom was §49 quietly not working: a declined product had no
   * interest row to be declined in, so Baz offered it again.
   */
  const interests = await client.from('product_interests').upsert(
    [...new Set(wanted.map((choice) => choice.product))].map((product) => ({
      case_id: loaded.caseId,
      product,
      status: 'accepted',
    })),
    { onConflict: 'case_id,product' },
  )

  if (interests.error) throw new Error(interests.error.message)

  return wanted
}

/**
 * §53 — a requirement satisfied by a fact that was bank-held or captured for a different
 * application is a question the customer never had to answer. Recorded as it happens, so the
 * metric is derived from events rather than recomputed later.
 */
export async function recordReuse(
  client: Db,
  loaded: LoadedCase,
  application: Application,
  evaluation: JourneyEvaluation,
): Promise<number> {
  const reused = evaluation.satisfied.filter((item) => item.reused)

  for (const item of reused) {
    await writeEvent(client, {
      caseId: loaded.caseId,
      type: 'context_reused',
      actor: 'system',
      applicationId: String(application.id),
      payload: {
        requirementId: item.requirement.id,
        label: item.requirement.label,
        applicationName: journeyFor(application.product).displayName,
      },
    })
  }

  return reused.length
}

export function findApplication(
  loaded: LoadedCase,
  applicationId: string,
): Application | undefined {
  return loaded.applications.find(
    (application) => String(application.id) === applicationId,
  )
}

export { asApplicationId }
