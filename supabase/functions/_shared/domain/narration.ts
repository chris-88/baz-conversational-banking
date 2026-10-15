/**
 * What happened, in words (§36).
 *
 * The events worth telling a customer about, and one sentence for each. Pure and dependency-
 * free on purpose: the server's digest uses it to brief the model on what changed since they
 * were last here, and the customer's screen uses the very same sentence for the pill that
 * says the bank has moved. One phrasing, so the pill and what Baz then says cannot disagree.
 */

export const NARRATABLE_EVENTS = [
  'application_received',
  'information_requested',
  'document_received',
  'application_approved',
  'application_declined',
  'application_completed',
  'partner_completed',
  'savings_target_reached',
  'plan_milestone_reached',
  'checkin_due',
] as const

export type NarratableEvent = (typeof NARRATABLE_EVENTS)[number]

export function isNarratable(type: string): type is NarratableEvent {
  return (NARRATABLE_EVENTS as readonly string[]).includes(type)
}

/**
 * One sentence for an event, or null for a type nobody wrote copy for.
 *
 * Unknown types are omitted rather than guessed at, so the model never narrates something
 * nobody wrote, and the pill never shows a raw event name.
 */
export function describeEvent(event: {
  readonly type: string
  readonly payload: Record<string, unknown>
}): string | null {
  const name =
    typeof event.payload['applicationName'] === 'string'
      ? event.payload['applicationName']
      : 'An application'

  switch (event.type) {
    case 'application_submitted':
      return `${name} was submitted.`
    case 'application_received':
      return `${name} was received and is being assessed.`
    case 'information_requested':
      return typeof event.payload['detail'] === 'string'
        ? `${name}: the team asked for ${event.payload['detail']}.`
        : `${name}: the team asked for more information.`
    case 'application_approved':
      return `${name} was approved.`
    case 'application_declined':
      return `${name} was not approved.`
    case 'application_completed':
      return `${name} is complete.`
    case 'plan_milestone_reached':
      return typeof event.payload['label'] === 'string'
        ? `You reached a step on your plan: ${event.payload['label']}.`
        : 'You reached a step on your plan.'
    case 'checkin_due':
      return typeof event.payload['purpose'] === 'string'
        ? `It is time for the ${event.payload['purpose'].toLowerCase()} you asked me to come back for.`
        : 'It is time for the review you asked me to come back for.'
    case 'savings_target_reached':
      return typeof event.payload['target'] === 'number'
        ? `Your savings reached €${event.payload['target'].toLocaleString('en-IE')}, the amount you were building towards.`
        : 'Your savings reached the amount you were building towards.'
    case 'partner_completed':
      return typeof event.payload['partnerName'] === 'string'
        ? `${event.payload['partnerName']} completed their part.`
        : 'Your partner completed their part.'
    case 'document_received':
      return `${name}: a document was received.`
    default:
      return null
  }
}
