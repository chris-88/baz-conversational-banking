import type { SupabaseClient } from '@supabase/supabase-js'
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
  client: SupabaseClient,
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

/** §6 Stage 6 — the customer's choice creates several applications at once. */
export async function createApplications(
  client: SupabaseClient,
  loaded: LoadedCase,
  products: readonly Product[],
): Promise<readonly Product[]> {
  const existing = new Set(loaded.applications.map((application) => application.product))
  const wanted = products.filter((product) => !existing.has(product))
  if (wanted.length === 0) return []

  const inserted = await client
    .from('applications')
    .insert(wanted.map((product) => ({ case_id: loaded.caseId, product, state: 'not_started' })))
    .select('id, product')

  if (inserted.error) throw new Error(inserted.error.message)

  for (const row of (inserted.data ?? []) as { id: string; product: Product }[]) {
    await writeEvent(client, {
      caseId: loaded.caseId,
      type: 'application_created',
      actor: 'customer',
      applicationId: row.id,
      payload: { product: row.product, applicationName: journeyFor(row.product).displayName },
    })
  }

  await client.from('product_interests').upsert(
    wanted.map((product) => ({ case_id: loaded.caseId, product, status: 'accepted' })),
    { onConflict: 'case_id,product' },
  )

  return wanted
}

/**
 * §53 — a requirement satisfied by a fact that was bank-held or captured for a different
 * application is a question the customer never had to answer. Recorded as it happens, so the
 * metric is derived from events rather than recomputed later.
 */
export async function recordReuse(
  client: SupabaseClient,
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
