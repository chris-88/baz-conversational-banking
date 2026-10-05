import { z } from 'zod'
import { PRODUCTS } from '../domain/journey.ts'
import { APPLICATION_STATES } from '../domain/state-machine.ts'

/**
 * `case-action` — everything the customer commits by tapping (Invariant 1, §27, §48).
 *
 * The model has no tool that reaches any of these. Each one validates session access, the
 * application's state, the information it requires, and the business rules, before anything
 * changes.
 */

const caseId = z.uuid()
const applicationId = z.uuid()

export const caseActionRequestSchema = z.discriminatedUnion('action', [
  /** §6 Stage 6 — the customer chooses, and several applications start at once. */
  z.object({
    action: z.literal('select_products'),
    caseId,
    products: z.array(z.enum(PRODUCTS)).min(1).max(5),
  }),

  /** §49 — declining must stick, so it is recorded rather than merely not chosen. */
  z.object({
    action: z.literal('decline_product'),
    caseId,
    product: z.enum(PRODUCTS),
  }),

  /** Confirming a reused value, a declaration, or a consent, for one application (§11). */
  z.object({
    action: z.literal('confirm_requirement'),
    applicationId,
    requirementId: z.string().min(1).max(80),
  }),

  /** §48 — the only route out of `ready`, and only from the review card. */
  z.object({
    action: z.literal('submit_application'),
    applicationId,
  }),

  /** §6 Stage 8 — the customer decides to hold an application. */
  z.object({
    action: z.literal('pause_application'),
    applicationId,
  }),

  z.object({
    action: z.literal('resume_application'),
    applicationId,
  }),
])

export type CaseActionRequest = z.infer<typeof caseActionRequestSchema>
export type CaseActionName = CaseActionRequest['action']

export const applicationSummarySchema = z.object({
  id: applicationId,
  product: z.enum(PRODUCTS),
  displayName: z.string(),
  state: z.enum(APPLICATION_STATES),
  stateLabel: z.string(),
  outstanding: z.array(z.string()),
  outstandingForPartner: z.array(z.string()),
  waitingOn: z.enum(['primary', 'partner']).nullable(),
  /** 0 to 1. Satisfied blocking requirements over total blocking requirements. */
  progress: z.number().min(0).max(1),
})

export const caseActionResponseSchema = z.object({
  applications: z.array(applicationSummarySchema),
  /** What changed, in the customer's language, for the confirmation line. */
  summary: z.string(),
})

export type ApplicationSummary = z.infer<typeof applicationSummarySchema>
export type CaseActionResponse = z.infer<typeof caseActionResponseSchema>
