/**
 * Events in words a presenter can read out.
 *
 * The console showed raw types — `plan_milestone_reached`, `checkin_due` — which is fine for
 * debugging and useless for demonstrating. One describer, server-side, so the overview feed
 * and the case inspector cannot drift into saying different things about the same event.
 *
 * Distinct from the customer-facing `describeEvent` in digest.ts, which is written for Baz to
 * say to the person it happened to. This is written for the bank watching it happen.
 */

/** The things worth watching happen, as opposed to the bookkeeping around them. */
const SIGNALS = new Set([
  'plan_created',
  'plan_paused',
  'plan_resumed',
  'plan_abandoned',
  'plan_completed',
  'plan_milestone_reached',
  'checkin_due',
  'savings_target_reached',
  'notification_sent',
  'context_reused',
  'goal_identified',
  'product_quoted',
  'application_created',
  'application_submitted',
  'partner_joined',
  'partner_completed',
  'request_blocked',
])

const text = (payload: Record<string, unknown>, key: string): string | null => {
  const value = payload[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

const money = (payload: Record<string, unknown>, key: string): string | null => {
  const value = payload[key]
  return typeof value === 'number' ? `€${value.toLocaleString('en-IE')}` : null
}

export function describeAdminEvent(
  type: string,
  payload: Record<string, unknown> = {},
): { describe: string; signal: boolean } {
  const signal = SIGNALS.has(type)

  const describe = ((): string => {
    switch (type) {
      case 'plan_created':
        return `Plan kept: ${text(payload, 'title') ?? 'a goal'}`
      case 'plan_paused':
        return `Plan paused: ${text(payload, 'title') ?? 'a goal'}`
      case 'plan_resumed':
        return `Plan picked back up: ${text(payload, 'title') ?? 'a goal'}`
      case 'plan_abandoned':
        return `Plan dropped: ${text(payload, 'title') ?? 'a goal'}`
      case 'plan_completed':
        return `Plan finished: ${text(payload, 'title') ?? 'a goal'}`
      case 'plan_milestone_reached':
        return `Milestone reached: ${text(payload, 'label') ?? 'a step on the plan'}`
      case 'checkin_due':
        return `Check-in came due: ${text(payload, 'purpose') ?? 'a planned review'}`
      case 'savings_target_reached':
        return `Savings reached ${money(payload, 'target') ?? 'the target'}`
      case 'savings_balance_set':
        return `Balance moved to ${money(payload, 'amount') ?? 'a new figure'}`
      case 'context_reused':
        return 'A question that did not have to be asked'
      case 'goal_identified':
        return `Worked out a goal: ${text(payload, 'goal')?.replaceAll('_', ' ') ?? 'something they are after'}`
      case 'product_quoted':
        return `Showed figures for ${text(payload, 'product')?.replaceAll('_', ' ') ?? 'a product'}`
      case 'context_captured':
        return `Recorded ${text(payload, 'key') ?? 'something they said'}`
      case 'application_created':
        return `Application started: ${text(payload, 'product') ?? 'a product'}`
      case 'application_submitted':
        return 'Application submitted'
      case 'application_received':
        return 'The bank received an application'
      case 'application_approved':
        return 'An application was approved'
      case 'product_offered':
        return `Offered ${text(payload, 'product') ?? 'a product'}`
      case 'partner_invited':
        return 'Second applicant invited'
      case 'partner_joined':
        return 'Second applicant joined'
      case 'partner_completed':
        return 'Second applicant finished their part'
      case 'document_uploaded':
        return `Document sent in: ${text(payload, 'fileName') ?? 'a file'}`
      case 'documents_verified':
        return 'The bank checked the documents'
      case 'notification_sent':
        return 'Notification sent'
      case 'customer_authenticated':
        return 'Signed in — bank-held details loaded'
      case 'request_blocked':
        return `Blocked: ${text(payload, 'category') ?? 'out of scope'}`
      case 'case_reset':
        return 'Case reset to the seed'
      case 'handoff_created':
        return 'Handed over to the app'
      default:
        // Readable rather than raw, so a new event type is still legible before anyone
        // writes a sentence for it.
        return type.replaceAll('_', ' ')
    }
  })()

  return { describe, signal }
}
