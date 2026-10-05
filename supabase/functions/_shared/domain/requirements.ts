import {
  factCatalogue,
  type ApplicationId,
  type Fact,
  type FactKey,
  type FactSubject,
  type ParticipantId,
  type ParticipantRole,
  type ReusePolicy,
} from './facts.ts'
import type {
  Branch,
  FactReader,
  Journey,
  Requirement,
  RequirementSubject,
} from './journey.ts'

/**
 * What does this application still require?
 *
 * This is computed from facts every time, never remembered by the model (Invariant 3, §8).
 * The model decides only how to ask.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type RequirementContext = {
  readonly applicationId: ApplicationId
  /** `partner` is null until a second applicant has actually joined. */
  readonly participants: {
    readonly primary: ParticipantId
    readonly partner: ParticipantId | null
  }
  /** Every fact on the case. Superseded facts are ignored. */
  readonly facts: readonly Fact[]
  /**
   * Requirement ids confirmed for THIS application: reuse confirmations, declarations and
   * customer confirmations. Scoping is per application, so a declaration signed for the
   * mortgage does not satisfy the credit card.
   */
  readonly confirmations: readonly string[]
  readonly documents: readonly { readonly requirementId: string; readonly verified: boolean }[]
}

export type OutstandingReason =
  /** Nothing known at all. */
  | 'missing'
  /** Known from elsewhere; the customer must confirm it is still right. */
  | 'needs_confirmation'
  /** Known from elsewhere, but this journey demands a fresh answer. */
  | 'needs_fresh'
  | 'awaiting_document'
  | 'awaiting_declaration'
  /** Belongs to a partner who has not joined yet. */
  | 'awaiting_partner'

export type OutstandingItem = {
  readonly requirement: Requirement
  readonly reason: OutstandingReason
  /** Who must act. Household requirements are supplied by the primary customer. */
  readonly waitingOn: ParticipantRole
  /** Optional requirements appear here but never hold an application back. */
  readonly blocking: boolean
  /** The value being offered for confirmation, when `reason` is `needs_confirmation`. */
  readonly knownFact: Fact | null
}

export type SatisfiedItem = {
  readonly requirement: Requirement
  readonly fact: Fact | null
  /**
   * True when this was satisfied without asking inside this application — bank-held, or
   * captured for another application or in general conversation. Drives §53.
   */
  readonly reused: boolean
}

export type JourneyEvaluation = {
  readonly outstanding: readonly OutstandingItem[]
  readonly satisfied: readonly SatisfiedItem[]
  /** No blocking requirement remains. */
  readonly complete: boolean
  readonly waitingOn: ParticipantRole | null
  /** Branch ids whose condition currently holds, for the admin inspector. */
  readonly activeBranches: readonly string[]
}

// ---------------------------------------------------------------------------
// Reuse policy
// ---------------------------------------------------------------------------

const STRICTNESS: Record<ReusePolicy, number> = { auto: 0, confirm: 1, fresh: 2, never: 3 }

/**
 * A journey requirement may tighten the catalogue's policy but never loosen it: the stricter
 * of the two wins. Health data marked `never` in the catalogue stays `never` however a
 * journey asks for it (§11, Invariant 6).
 */
export function effectiveReusePolicy(
  catalogueDefault: ReusePolicy,
  override: ReusePolicy | undefined,
): ReusePolicy {
  if (override === undefined) return catalogueDefault
  return STRICTNESS[override] > STRICTNESS[catalogueDefault] ? override : catalogueDefault
}

// ---------------------------------------------------------------------------
// Subject resolution
// ---------------------------------------------------------------------------

/** Who must act for a requirement. Household information comes from the primary customer. */
function actorFor(subject: RequirementSubject): ParticipantRole {
  return subject === 'partner' ? 'partner' : 'primary'
}

/**
 * Turns a journey's role into the subject a fact is actually stored against. Returns null
 * when the role has no participant yet.
 */
function resolveFactSubject(
  subject: RequirementSubject,
  participants: RequirementContext['participants'],
): FactSubject | null {
  switch (subject) {
    case 'household':
      return 'household'
    case 'primary':
      return participants.primary
    case 'partner':
      return participants.partner
  }
}

// ---------------------------------------------------------------------------
// Fact lookup
// ---------------------------------------------------------------------------

type FactMatch = {
  /** Captured inside this application: the customer was asked here. */
  readonly local: Fact | null
  /** Known from bank records, general conversation, or another application. */
  readonly elsewhere: Fact | null
}

function newer(a: Fact | null, b: Fact): Fact {
  if (!a) return b
  return b.capturedAt >= a.capturedAt ? b : a
}

function findFact(
  facts: readonly Fact[],
  key: FactKey,
  subject: FactSubject,
  applicationId: ApplicationId,
): FactMatch {
  let local: Fact | null = null
  let elsewhere: Fact | null = null

  for (const fact of facts) {
    if (fact.key !== key) continue
    if (fact.subject !== subject) continue
    if (fact.supersededBy !== null) continue

    if (fact.capturedFor === applicationId) local = newer(local, fact)
    else elsewhere = newer(elsewhere, fact)
  }

  return { local, elsewhere }
}

// ---------------------------------------------------------------------------
// Branch evaluation
// ---------------------------------------------------------------------------

function createFactReader(context: RequirementContext): FactReader {
  const read = (key: FactKey, subject: RequirementSubject = 'household'): Fact | null => {
    const factSubject = resolveFactSubject(subject, context.participants)
    if (factSubject === null) return null
    const { local, elsewhere } = findFact(context.facts, key, factSubject, context.applicationId)
    return local ?? elsewhere
  }

  return {
    has: (key, subject) => read(key, subject) !== null,
    get: (key, subject) => read(key, subject)?.value,
    number: (key, subject) => {
      const value = read(key, subject)?.value
      return typeof value === 'number' ? value : null
    },
    boolean: (key, subject) => {
      const value = read(key, subject)?.value
      return typeof value === 'boolean' ? value : null
    },
  }
}

function activeBranches(journey: Journey, context: RequirementContext): readonly Branch[] {
  const reader = createFactReader(context)
  const confirmed = (requirementId: string): boolean =>
    context.confirmations.includes(requirementId)
  return journey.branches.filter((branch) => branch.when(reader, confirmed))
}

// ---------------------------------------------------------------------------
// Requirement evaluation
// ---------------------------------------------------------------------------

type Verdict =
  | { readonly status: 'satisfied'; readonly fact: Fact | null; readonly reused: boolean }
  | { readonly status: 'outstanding'; readonly reason: OutstandingReason; readonly knownFact: Fact | null }

const missing = (): Verdict => ({ status: 'outstanding', reason: 'missing', knownFact: null })

function evaluateFactRequirement(
  requirement: Extract<Requirement, { kind: 'fact' }>,
  context: RequirementContext,
  factSubject: FactSubject,
): Verdict {
  const policy = effectiveReusePolicy(
    factCatalogue[requirement.fact].reuse,
    requirement.reuse,
  )
  const { local, elsewhere } = findFact(
    context.facts,
    requirement.fact,
    factSubject,
    context.applicationId,
  )

  // Asked and answered inside this application: satisfied under every policy.
  if (local) return { status: 'satisfied', fact: local, reused: false }

  switch (policy) {
    case 'auto':
      return elsewhere
        ? { status: 'satisfied', fact: elsewhere, reused: true }
        : missing()

    case 'confirm':
      if (!elsewhere) return missing()
      return context.confirmations.includes(requirement.id)
        ? { status: 'satisfied', fact: elsewhere, reused: true }
        : { status: 'outstanding', reason: 'needs_confirmation', knownFact: elsewhere }

    case 'fresh':
    case 'never':
      return elsewhere
        ? { status: 'outstanding', reason: 'needs_fresh', knownFact: null }
        : missing()
  }
}

function evaluateRequirement(requirement: Requirement, context: RequirementContext): Verdict {
  const factSubject = resolveFactSubject(requirement.subject, context.participants)

  // The requirement belongs to a partner who has not joined yet.
  if (factSubject === null) {
    return { status: 'outstanding', reason: 'awaiting_partner', knownFact: null }
  }

  switch (requirement.kind) {
    case 'fact':
      return evaluateFactRequirement(requirement, context, factSubject)

    case 'declaration':
      return context.confirmations.includes(requirement.id)
        ? { status: 'satisfied', fact: null, reused: false }
        : { status: 'outstanding', reason: 'awaiting_declaration', knownFact: null }

    case 'confirmation':
      return context.confirmations.includes(requirement.id)
        ? { status: 'satisfied', fact: null, reused: false }
        : { status: 'outstanding', reason: 'needs_confirmation', knownFact: null }

    case 'document': {
      const document = context.documents.find((d) => d.requirementId === requirement.id)
      const satisfied =
        document !== undefined && (requirement.requiresVerification !== true || document.verified)
      return satisfied
        ? { status: 'satisfied', fact: null, reused: false }
        : { status: 'outstanding', reason: 'awaiting_document', knownFact: null }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Every requirement that currently applies, base plus any active branch. */
export function applicableRequirements(
  journey: Journey,
  context: RequirementContext,
): readonly Requirement[] {
  return [
    ...journey.requirements,
    ...activeBranches(journey, context).flatMap((branch) => branch.requirements),
  ]
}

export function evaluateJourney(journey: Journey, context: RequirementContext): JourneyEvaluation {
  const branches = activeBranches(journey, context)
  const requirements = [
    ...journey.requirements,
    ...branches.flatMap((branch) => branch.requirements),
  ]

  const outstandingItems: OutstandingItem[] = []
  const satisfiedItems: SatisfiedItem[] = []

  for (const requirement of requirements) {
    const verdict = evaluateRequirement(requirement, context)

    if (verdict.status === 'satisfied') {
      satisfiedItems.push({ requirement, fact: verdict.fact, reused: verdict.reused })
      continue
    }

    outstandingItems.push({
      requirement,
      reason: verdict.reason,
      waitingOn: actorFor(requirement.subject),
      blocking: requirement.optional !== true,
      knownFact: verdict.knownFact,
    })
  }

  const blocking = outstandingItems.filter((item) => item.blocking)

  // The customer comes first: only wait on the partner once the customer has nothing to do.
  const waitingOn: ParticipantRole | null = blocking.some((item) => item.waitingOn === 'primary')
    ? 'primary'
    : blocking.some((item) => item.waitingOn === 'partner')
      ? 'partner'
      : null

  return {
    outstanding: outstandingItems,
    satisfied: satisfiedItems,
    complete: blocking.length === 0,
    waitingOn,
    activeBranches: branches.map((branch) => branch.id),
  }
}

/** `outstanding(journey, facts)` — the form referenced by CLAUDE.md and §8. */
export function outstanding(
  journey: Journey,
  context: RequirementContext,
): readonly OutstandingItem[] {
  return evaluateJourney(journey, context).outstanding
}

/**
 * Whether an application has everything except the things the customer confirms at the end.
 *
 * Declarations, consents and reuse confirmations are blocking requirements, so an application
 * can never be `complete` while they are outstanding — which would mean the review card could
 * never be shown, and §48 says the review card is exactly where those are made. This is the
 * state that means "ready to put in front of the customer".
 */
export function readyForReview(evaluation: JourneyEvaluation): boolean {
  return evaluation.outstanding
    .filter((item) => item.blocking)
    .every((item) => isCustomerConfirmation(item))
}

/** The items a review card asks the customer to agree to before anything is submitted. */
export function confirmationsForReview(
  evaluation: JourneyEvaluation,
): readonly OutstandingItem[] {
  return evaluation.outstanding.filter((item) => item.blocking && isCustomerConfirmation(item))
}

function isCustomerConfirmation(item: OutstandingItem): boolean {
  if (item.requirement.kind === 'declaration') return true
  if (item.requirement.kind === 'confirmation') return true
  // A value we already hold, which the customer is asked to confirm is still right (§11).
  return item.reason === 'needs_confirmation'
}
