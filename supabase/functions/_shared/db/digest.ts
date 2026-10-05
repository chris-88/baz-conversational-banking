import { factCatalogue, type Fact } from '../domain/facts.ts'
import { journeyFor } from '../domain/journeys/index.ts'
import { evaluateJourney, type OutstandingItem, type RequirementContext } from '../domain/requirements.ts'
import { evaluateAdvisories } from '../domain/advisories.ts'
import { stateLabel } from '../domain/state-machine.ts'
import type { CaseDigest, DigestApplication, DigestFact } from '../llm/prompt.ts'
import { participantFor, type LoadedCase } from './loaded-case.ts'

/**
 * Builds the case digest the model sees (§14, Invariant 2).
 *
 * Every status in it comes from controlled data: application state from the state machine,
 * outstanding requirements from the requirement engine, advisories from the deterministic
 * rules. The model is given no opportunity to remember a status, because nothing here is
 * carried over from a previous turn.
 */

/** Values are rendered for reading, never dumped raw. */
function renderValue(fact: Fact): string {
  const { value } = fact

  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') return value.toLocaleString('en-IE')
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function digestFacts(loaded: LoadedCase): readonly DigestFact[] {
  const primary = participantFor(loaded, 'primary')
  const partner = participantFor(loaded, 'partner')

  return loaded.facts
    .filter((fact) => fact.supersededBy === null)
    // Special-category data is never put in front of the model (Invariant 6, §7.5).
    .filter((fact) => factCatalogue[fact.key].sensitivity !== 'special')
    .map((fact) => {
      const who =
        fact.subject === 'household'
          ? ''
          : fact.subject === primary
            ? ''
            : fact.subject === partner
              ? 'Partner’s '
              : ''

      return {
        label: `${who}${factCatalogue[fact.key].label}`,
        value: renderValue(fact),
        source: fact.source,
        verified: fact.verified,
      }
    })
}

function digestApplications(loaded: LoadedCase): readonly DigestApplication[] {
  const primary = participantFor(loaded, 'primary')
  if (primary === null) return []

  return loaded.applications.map((application) => {
    const context: RequirementContext = {
      applicationId: application.id,
      participants: { primary, partner: participantFor(loaded, 'partner') },
      facts: loaded.facts,
      confirmations: loaded.confirmations
        .filter((confirmation) => confirmation.applicationId === application.id)
        .map((confirmation) => confirmation.requirementId),
      documents: loaded.documents
        .filter((document) => document.applicationId === application.id)
        .map((document) => ({
          requirementId: document.requirementId,
          verified: document.verified,
        })),
    }

    const journey = journeyFor(application.product)
    const evaluation = evaluateJourney(journey, context)

    // Only blocking items: an optional extra is not something to chase anyone for. An
    // application can be waiting on the customer AND the partner at the same time, so the two
    // are split by each requirement's own `waitingOn` rather than the application's.
    const blocking = evaluation.outstanding.filter((item) => item.blocking)

    /**
     * Says WHY, not just what. Without the reason the model cannot tell "we have never been
     * told this" from "we have it and the customer confirms it at review", so it reports
     * values the customer has already given as though they were missing.
     */
    const describe = (item: OutstandingItem): string => {
      switch (item.reason) {
        case 'needs_confirmation':
          return `${item.requirement.label} — already known, confirmed on the review card`
        case 'needs_fresh':
          return `${item.requirement.label} — must be given again for this application`
        case 'awaiting_declaration':
          return `${item.requirement.label} — made on the review card`
        case 'awaiting_document':
          return `${item.requirement.label} — a document to upload`
        case 'awaiting_partner':
          return `${item.requirement.label} — waiting on the second applicant`
        case 'missing':
          return `${item.requirement.label} — not yet known, ask for it`
      }
    }

    return {
      id: application.id,
      product: application.product,
      displayName: journey.displayName,
      state: application.state,
      stateLabel: stateLabel(application.state),
      outstanding: blocking.filter((item) => item.waitingOn === 'primary').map(describe),
      outstandingForPartner: blocking.filter((item) => item.waitingOn === 'partner').map(describe),
      waitingOn: evaluation.waitingOn,
    }
  })
}

/** §36 — what changed while they were away, in the customer's language. */
function describeEvent(event: { type: string; payload: Record<string, unknown> }): string | null {
  const name = typeof event.payload.applicationName === 'string' ? event.payload.applicationName : 'An application'

  switch (event.type) {
    case 'application_submitted':
      return `${name} was submitted.`
    case 'application_received':
      return `${name} was received and is being assessed.`
    case 'information_requested':
      return typeof event.payload.detail === 'string'
        ? `${name}: the team asked for ${event.payload.detail}.`
        : `${name}: the team asked for more information.`
    case 'application_approved':
      return `${name} was approved.`
    case 'application_declined':
      return `${name} was not approved.`
    case 'application_completed':
      return `${name} is complete.`
    case 'partner_completed':
      return typeof event.payload.partnerName === 'string'
        ? `${event.payload.partnerName} completed their part.`
        : 'Your partner completed their part.'
    case 'document_received':
      return `${name}: a document was received.`
    default:
      // Unknown event types are omitted rather than guessed at, so the model never narrates
      // something nobody wrote copy for.
      return null
  }
}

export function buildCaseDigest(loaded: LoadedCase): CaseDigest {
  const partnerParticipant = loaded.participants.find((participant) => participant.role === 'partner')
  const applications = digestApplications(loaded)

  const partnerOutstanding = [
    ...new Set(applications.flatMap((application) => application.outstandingForPartner ?? [])),
  ]

  // Invariant 6: the model is told that special-category data exists so it can report status
  // honestly, but never what it says. Without this it reported answered health questions as
  // outstanding, because it genuinely could not see them.
  const sensitiveAreas = [
    ...new Set(
      loaded.facts
        .filter((fact) => fact.supersededBy === null)
        .filter((fact) => factCatalogue[fact.key].sensitivity === 'special')
        .map((fact) => {
          const application = loaded.applications.find(
            (candidate) => candidate.id === fact.capturedFor,
          )
          const where = application ? journeyFor(application.product).displayName : 'the case'
          return `Health information for ${where} — answered and recorded.`
        }),
    ),
  ]

  return {
    customerName: loaded.customerName,
    sensitiveHeld: sensitiveAreas,
    authLevel: loaded.authLevel,
    facts: digestFacts(loaded),
    applications,
    declinedProducts: loaded.productInterests
      .filter((interest) => interest.status === 'declined')
      .map((interest) => interest.product),
    advisories: evaluateAdvisories(loaded.applications).map((advisory) => ({
      title: advisory.title,
      explanation: advisory.explanation,
    })),
    partner:
      partnerParticipant === undefined
        ? null
        : {
            name: partnerParticipant.displayName ?? 'Your partner',
            joined: true,
            outstanding: partnerOutstanding,
          },
    eventsSinceLastSeen: loaded.eventsSinceLastSeen
      .map(describeEvent)
      .filter((line): line is string => line !== null),
  }
}
