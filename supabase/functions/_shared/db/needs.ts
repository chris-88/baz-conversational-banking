import { createFactReader } from '../domain/requirements.ts'
import { asApplicationId, asParticipantId } from '../domain/facts.ts'
import { evaluateNeeds } from '../domain/needs/engine.ts'
import type { NeedCandidate, NeedContext, RecordedNeedState } from '../domain/needs/types.ts'
import type { LoadedCase } from './loaded-case.ts'

/**
 * The case as the needs engine sees it.
 *
 * Household-scoped, unlike a requirement evaluation, which is always about one application —
 * a need belongs to the customer's situation, not to a journey. The application ids passed to
 * the reader are therefore nominal; nothing here is captured for an application.
 */
export function needsFor(
  loaded: LoadedCase,
  options: { readonly sensitiveDisclosure: boolean },
): readonly NeedCandidate[] {
  const primary = loaded.participants.find((participant) => participant.role === 'primary')
  const partner = loaded.participants.find((participant) => participant.role === 'partner')
  if (!primary) return []

  const facts = createFactReader({
    applicationId: asApplicationId('00000000-0000-4000-8000-000000000000'),
    participants: {
      primary: asParticipantId(String(primary.id)),
      partner: partner ? asParticipantId(String(partner.id)) : null,
    },
    facts: loaded.facts,
    confirmations: [],
    documents: [],
  })

  const context: NeedContext = {
    facts,
    sensitiveDisclosure: options.sensitiveDisclosure,
    applications: loaded.applications.map((application) => ({
      product: application.product,
      state: application.state,
    })),
    decisions: decisionsFrom(loaded),
  }

  return evaluateNeeds(context)
}

/**
 * What has already been settled, derived from product interest.
 *
 * `product_interests` predates the needs engine and records decisions against a product rather
 * than a need. Until a need has its own record, a decision about the product a need leads to
 * is the closest honest proxy — and it is the one the customer actually made, by tapping
 * something (Invariant 1).
 */
function decisionsFrom(loaded: LoadedCase): NeedContext['decisions'] {
  const byProduct = new Map<string, RecordedNeedState>()

  for (const interest of loaded.productInterests) {
    if (interest.status === 'declined') byProduct.set(interest.product, 'declined')
    else if (interest.status === 'accepted') byProduct.set(interest.product, 'accepted')
    else if (interest.status === 'deferred') byProduct.set(interest.product, 'deferred')
  }

  // An application that exists settles the question regardless of what was recorded earlier.
  for (const application of loaded.applications) byProduct.set(application.product, 'accepted')

  return evaluateNeeds({
    facts: { has: () => false, get: () => undefined, number: () => null, boolean: () => null },
    sensitiveDisclosure: false,
    applications: [],
    decisions: [],
  })
    .filter((candidate) => candidate.need.products.some((product) => byProduct.has(product)))
    .map((candidate) => ({
      needId: candidate.need.id,
      state: byProduct.get(
        candidate.need.products.find((product) => byProduct.has(product)) ?? '',
      ) as RecordedNeedState,
    }))
}
