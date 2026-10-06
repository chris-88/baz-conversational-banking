/**
 * What a case is.
 *
 * `presenter` / `audience` came from a scripted demonstration: one rehearsed case driven from
 * the stage, throwaway ones for everybody else. A live demonstration where the room invents
 * the situation has no rehearsed case to join, so an ordinary case is just a `customer` one.
 * `presenter` survives for a case being driven on screen, and `audience` so old rows still
 * load (migration 20261006090000).
 *
 * Defined here, once, because this union is written down in four places — a Zod row schema, a
 * loaded-case type, an admin response contract and the admin handler — and the moment the
 * database moved on its own, every case in the system failed to parse.
 */
export const CASE_KINDS = ['customer', 'presenter', 'audience'] as const

export type CaseKind = (typeof CASE_KINDS)[number]

/**
 * What a case needs from whoever is watching (§5 of the console redesign).
 *
 * Ordered by how much it wants attention, which is also the order the rules are applied in: a
 * case that was blocked *and* has an application waiting is reported as blocked, because that is
 * the thing somebody should look at.
 */
export const CASE_STATUSES = ['blocked', 'needs_review', 'in_progress', 'completed', 'new'] as const

export type CaseStatus = (typeof CASE_STATUSES)[number]

export const CASE_STATUS_LABELS: Readonly<Record<CaseStatus, string>> = {
  blocked: 'Blocked',
  needs_review: 'Needs review',
  in_progress: 'In progress',
  completed: 'Completed',
  new: 'New',
}

/** Everything the rules look at. Counts and states, never conversation. */
export type CaseStatusInput = {
  /** A `request_blocked` event has been written against this case. */
  readonly everBlocked: boolean
  readonly applications: readonly { readonly state: string }[]
  /** A check-in has come due and not been dealt with. */
  readonly checkinDue: boolean
  readonly customerMessages: number
}

/**
 * Derived, never stored — the same rule as every other state in this system.
 *
 * `new` is not in the redesign's tab list and exists anyway: a case with no messages is not "in
 * progress", and on a prototype where every visitor gets one the moment they arrive, most cases
 * are empty. Lumping them in with real conversations would make the busiest tab the least useful.
 */
export function caseStatus(input: CaseStatusInput): CaseStatus {
  if (input.everBlocked) return 'blocked'

  const waiting = input.applications.some((application) =>
    ['info_required', 'waiting_partner'].includes(application.state),
  )
  if (waiting || input.checkinDue) return 'needs_review'

  const settled = (state: string) => state === 'completed' || state === 'declined'
  if (input.applications.length > 0 && input.applications.every((a) => settled(a.state))) {
    return 'completed'
  }

  return input.customerMessages > 0 ? 'in_progress' : 'new'
}
