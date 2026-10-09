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

  /**
   * §48 — the only route out of `ready`, and only from the review card.
   *
   * The confirmations the customer ticked travel with it, so an application cannot end up
   * half-confirmed if the tap fails partway: either everything is agreed and it submits, or
   * nothing changes.
   */
  z.object({
    action: z.literal('submit_application'),
    applicationId,
    confirmations: z.array(z.string().min(1).max(80)).max(40).default([]),
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

  /**
   * §6 Stage 9 — invites the second applicant.
   *
   * Creates the partner participant and a single-use link. Nothing is sent anywhere: the
   * customer shares the link themselves, which keeps the prototype free of real delivery.
   */
  /**
   * §10, §37 — the customer takes the plan on, or changes their mind about it later. Keeping
   * and abandoning are the same kind of decision and go through the same door.
   */
  z.object({
    action: z.literal('decide_plan'),
    caseId: z.uuid(),
    planId: z.uuid(),
    decision: z.enum(['keep', 'not_now', 'pause', 'resume', 'abandon']),
  }),

  z.object({
    action: z.literal('invite_partner'),
    caseId,
    name: z.string().min(1).max(80),
  }),

  /**
   * §42 — this browser would like to be told when something moves.
   *
   * The values come from the browser's own Push API subscription and are only useful for
   * sending to it: the endpoint is the push service's URL for this browser, and the two keys
   * are what let a payload be encrypted so only it can open them. Stored, never read back to
   * a client.
   */
  z.object({
    action: z.literal('subscribe_push'),
    caseId,
    endpoint: z.url().max(2000),
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),

  /** §7.5 — explicit consent, recorded, before any sensitive question is asked. */
  z.object({
    action: z.literal('grant_consent'),
    applicationId,
    requirementId: z.string().min(1).max(80),
  }),

  /**
   * The structured health form (§7.5, Invariant 6).
   *
   * This is the only path by which special-category data enters the case, and the server
   * refuses it unless the matching consent is already recorded.
   */
  z.object({
    action: z.literal('submit_health_form'),
    applicationId,
    values: z
      .array(z.object({ key: z.string().min(1), value: z.unknown() }))
      .min(1)
      .max(20),
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
  /** Present only after an invite: the link for the customer to share (§29, §58). */
  inviteUrl: z.string().optional(),
  /** What changed, in the customer's language, for the confirmation line. */
  summary: z.string(),
})

export type ApplicationSummary = z.infer<typeof applicationSummarySchema>
export type CaseActionResponse = z.infer<typeof caseActionResponseSchema>
