import { z } from 'zod'
import { PRESET_NAMES, SLIDER_NAMES } from '../llm/persona.ts'

/**
 * `admin` — the presenter console (§37 to §44).
 *
 * Every action here can break a live demonstration, and the site is on a public URL, so the
 * server checks the caller is a known admin on every single call. Client-side routing is a
 * convenience, never the control.
 */

const sliders = z.object(
  Object.fromEntries(SLIDER_NAMES.map((name) => [name, z.number().min(0).max(1)])) as Record<
    (typeof SLIDER_NAMES)[number],
    z.ZodNumber
  >,
)

export const adminRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('overview') }),
  /** §43 — restores the canonical presenter case. Audience cases are untouched. */
  z.object({ action: z.literal('reset_case') }),
  /** §43 — the gate returns "demo paused" to everything. */
  z.object({ action: z.literal('set_kill_switch'), enabled: z.boolean() }),
  /** §38, §56 — style changes apply to the very next turn. */
  z.object({
    action: z.literal('set_persona'),
    preset: z.enum(PRESET_NAMES).optional(),
    sliders: sliders.optional(),
  }),
  /** §40 — the structured context behind the conversation. */
  z.object({ action: z.literal('inspect_case'), caseId: z.uuid() }),

  /**
   * §41 — the downstream events the bank would raise. Each one is a state-machine transition,
   * never a random timer, so an illegal move is refused rather than faked.
   */
  z.object({
    action: z.literal('simulate_event'),
    applicationId: z.uuid(),
    event: z.enum([
      'received_by_bank',
      'information_requested',
      'information_supplied',
      'assessment_approved',
      'assessment_declined',
      'completed',
    ]),
    detail: z.string().max(120).optional(),
  }),

  /**
   * §35, §42 — a separate, deliberate action. Carries nothing about the application, and the
   * link requires signing in before anything is shown.
   */
  z.object({ action: z.literal('send_notification'), caseId: z.uuid() }),

  /** §44 — clears the room's conversations. Never touches the presenter case. */
  z.object({ action: z.literal('purge_audience') }),

  /** §41 — the bank checks what was sent in, so a document needing verification can pass. */
  z.object({ action: z.literal('verify_documents'), caseId: z.uuid() }),

  /** §41 — time passes and the customer reaches what they were saving for. */
  z.object({ action: z.literal('reach_savings_target'), caseId: z.uuid() }),

  /**
   * One-click demo moves (§41).
   *
   * Named for what the presenter wants to happen — "credit card approved" — rather than for
   * the transition underneath. The server finds the right application and applies the right
   * sequence, so nobody is hunting through a list mid-presentation.
   */
  z.object({
    action: z.literal('demo_action'),
    caseId: z.uuid(),
    move: z.enum([
      'credit_card_approved',
      'joint_account_approved',
      'mortgage_to_assessment',
      'mortgage_requests_document',
      'protection_approved',
    ]),
  }),
])

export const demoActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** False when the state machine would refuse it right now, with the reason. */
  available: z.boolean(),
  note: z.string(),
})

export const adminOverviewSchema = z.object({
  killSwitch: z.boolean(),
  /** The one-click moves, with whether each is possible from where the case currently is. */
  demoActions: z.array(demoActionSchema).default([]),
  presenterCaseId: z.uuid().nullable().default(null),
  persona: z.object({ preset: z.string(), sliders: sliders }),
  cases: z.array(
    z.object({
      id: z.uuid(),
      kind: z.enum(['presenter', 'audience']),
      label: z.string().nullable(),
      applications: z.number().int(),
      messages: z.number().int(),
      updatedAt: z.string(),
    }),
  ),
  metrics: z.object({
    /** §53 — the headline measure. */
    questionsAvoided: z.number().int(),
    factsCaptured: z.number().int(),
    productsOffered: z.number().int(),
    applicationsStarted: z.number().int(),
    requestsBlocked: z.number().int(),
  }),
  /** §39 — enforcement made observable. */
  blocked: z.array(z.object({ category: z.string(), at: z.string() })),
})

export const notificationSchema = z.object({
  /** Fixed copy. It says nothing about what changed (§35). */
  message: z.string(),
  url: z.string(),
})

export const adminCaseSchema = z.object({
  caseId: z.uuid(),
  facts: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
      source: z.string(),
      verified: z.boolean(),
      superseded: z.boolean(),
      sensitive: z.boolean(),
    }),
  ),
  applications: z.array(
    z.object({
      id: z.uuid(),
      product: z.string(),
      displayName: z.string(),
      state: z.string(),
      stateLabel: z.string(),
      outstanding: z.array(z.string()),
      /** Which §41 events the state machine will currently accept. */
      canSimulate: z.array(z.string()),
    }),
  ),
  events: z.array(z.object({ type: z.string(), actor: z.string(), at: z.string() })),
  /**
   * What the needs engine makes of this case, and what the bank has committed to watching
   * for. The presenter can answer "why did Baz offer that" without reading the prompt.
   */
  needs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      state: z.string(),
      confidence: z.number(),
      evidence: z.array(z.string()),
      reason: z.string().nullable(),
    }),
  ),
  planSteps: z.array(z.string()),
  watches: z.array(
    z.object({ describe: z.string(), met: z.boolean(), createdAt: z.string() }),
  ),
})

export type AdminRequest = z.infer<typeof adminRequestSchema>
export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type AdminCase = z.infer<typeof adminCaseSchema>
