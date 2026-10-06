import { z } from 'zod'
import { GOAL_IDS } from '../domain/goals/types.ts'
import { FACT_KEYS, type FactKey } from '../domain/facts.ts'
import { PRODUCTS } from '../domain/journey.ts'

/**
 * The tools Baz may call.
 *
 * Invariant 1 — the model proposes, the UI commits. Read the list and note what is absent:
 * there is no tool that creates, submits, pauses or resumes an application, grants consent,
 * invites a partner, or makes a declaration. Every one of those is a `case-action` call made
 * by the customer's own tap. The model can only record what it was told, and ask for a card
 * to be rendered.
 *
 * Every input is validated here before any effect. Invalid input returns a tool error to the
 * model and is never thrown to the user.
 */

const factKeyEnum = z.enum(FACT_KEYS as unknown as [FactKey, ...FactKey[]])
const productEnum = z.enum(PRODUCTS)
const applicationId = z.uuid()

export const recordFactsInput = z.object({
  facts: z
    .array(
      z.object({
        key: factKeyEnum,
        /**
         * Only needed when the fact belongs to the second applicant. The catalogue already
         * knows whether a key is household-level or personal, so the model is not asked to
         * decide — it got that wrong often enough to lose facts.
         */
        subject: z.enum(['primary', 'partner']).optional(),
        value: z.unknown(),
      }),
    )
    .min(1)
    .max(12),
})

export const showProductOptionsInput = z.object({
  products: z
    .array(
      z.object({
        product: productEnum,
        /** Must tie back to something the customer actually said (§49). */
        reason: z.string().min(10).max(200),
      }),
    )
    .min(1)
    .max(5),
})

export const showReviewInput = z.object({ applicationId })
export const showPausePromptInput = z.object({ applicationId })
export const showStatusInput = z.object({
  /** Omit for every application on the case. */
  applicationId: applicationId.optional(),
})

export const requestUploadInput = z.object({
  applicationId,
  /**
   * Which kind of document, when the customer has named one. Leave it out and the server picks
   * the next one the application is waiting for.
   *
   * A closed set rather than a requirement id: ids live in the journey files and never reach
   * the model, so asking for one left it guessing and then explaining to the customer that it
   * could not.
   */
  documentType: z
    .enum(['payslip', 'bank_statement', 'photo_id', 'proof_of_address', 'salary_certificate'])
    .optional(),
})

/**
 * §10 — Baz proposes, the customer accepts. The plan is written as a draft and only becomes
 * theirs when they tap, which is the same rule every other commitment follows (Invariant 1).
 */
export const proposePlanInput = z.object({
  /** A goal-catalogue blueprint id, which decides the plan's milestones and check-ins. */
  goal: z.enum(GOAL_IDS),
  /** In the customer's words: "Buy our first home", not "First-Time Buyer Journey". */
  title: z.string().min(4).max(80),
  /** What they are aiming at. The server checks it against what the case can support. */
  targetAmount: z.number().int().positive().optional(),
  /** YYYY-MM or YYYY-MM-DD, when they named one. */
  targetDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
})

export const showPartnerInviteInput = z.object({
  applicationIds: z.array(applicationId).min(1).max(5),
})

/**
 * Surfaces whatever structured form that application needs next — a consent, or the health
 * questions once consent is given.
 *
 * The model names only the application. The server decides which form is due, so the model
 * cannot invent a form, reorder them, or reach the health questions before consent (§7.5,
 * Invariant 6).
 */
export const showFormInput = z.object({ applicationId })

export const TOOL_INPUTS = {
  record_facts: recordFactsInput,
  show_product_options: showProductOptionsInput,
  show_review: showReviewInput,
  show_pause_prompt: showPausePromptInput,
  propose_plan: proposePlanInput,
  request_upload: requestUploadInput,
  show_partner_invite: showPartnerInviteInput,
  show_status: showStatusInput,
  show_form: showFormInput,
} as const

export type ToolName = keyof typeof TOOL_INPUTS
export const TOOL_NAMES = Object.keys(TOOL_INPUTS) as readonly ToolName[]

export type ToolDefinition = {
  readonly name: ToolName
  readonly description: string
  readonly schema: z.ZodType
}

export const TOOLS: readonly ToolDefinition[] = [
  {
    name: 'record_facts',
    description:
      'Record something the customer just told you, so it is never asked for again. Only for ' +
      'what they actually said — never a guess, an inference, or anything about health.',
    schema: recordFactsInput,
  },
  {
    name: 'show_product_options',
    description:
      'Offer products for the customer to choose from. Give a one-line reason for each, tied ' +
      'to something they told you. The customer chooses in the card; you do not create ' +
      'anything by calling this.',
    schema: showProductOptionsInput,
  },
  {
    name: 'show_review',
    description:
      'Show what is about to be submitted for an application, for the customer to confirm. ' +
      'The content is built from the case, not from you. Nothing is submitted until they tap.',
    schema: showReviewInput,
  },
  {
    name: 'show_pause_prompt',
    description:
      'Offer to hold an application. Use after explaining why, for example when a loan would ' +
      'affect a mortgage. The customer decides in the card.',
    schema: showPausePromptInput,
  },
  {
    name: 'request_upload',
    description:
      'Show the card that lets the customer send in a document. The card is how a document ' +
      'actually arrives — describing it or promising a link does nothing. Pass only the ' +
      'application and, if they named one, the kind of document; the server picks whichever ' +
      'is outstanding. One at a time.',
    schema: requestUploadInput,
  },
  {
    name: 'propose_plan',
    description:
      'Offer to keep this as a plan: a goal that outlives any one application, with ' +
      'milestones and a check-in. Use it when what the customer wants takes months rather ' +
      'than one conversation — saving towards something, or a purchase some way off. The ' +
      'card is how they accept; nothing is kept until they tap it. Do not propose a plan for ' +
      'something they can simply do today.',
    schema: proposePlanInput,
  },
  {
    name: 'show_partner_invite',
    description:
      'Offer to invite the second applicant to the applications they are needed for. The ' +
      'invitation is only sent when the customer taps.',
    schema: showPartnerInviteInput,
  },
  {
    name: 'show_form',
    description:
      'Show the next form this application needs — a consent, or health questions once consent ' +
      'is given. You name the application only; which form is due is decided for you. Use this ' +
      'whenever an application needs something you are not allowed to ask for in conversation.',
    schema: showFormInput,
  },
  {
    name: 'show_status',
    description:
      'Show the status card for one application, or for all of them. The card renders from the ' +
      'case, independently of whatever you write alongside it.',
    schema: showStatusInput,
  },
]

export type ToolValidation =
  | { readonly ok: true; readonly name: ToolName; readonly input: unknown }
  | { readonly ok: false; readonly name: string; readonly error: string }

/**
 * Validates a tool call before anything happens. An unknown name or invalid input becomes a
 * tool error the model can correct, never an exception the customer sees.
 */
export function validateToolCall(name: string, input: unknown): ToolValidation {
  if (!Object.prototype.hasOwnProperty.call(TOOL_INPUTS, name)) {
    return { ok: false, name, error: `Unknown tool "${name}".` }
  }

  const toolName = name as ToolName
  const result = TOOL_INPUTS[toolName].safeParse(input)
  if (!result.success) {
    return {
      ok: false,
      name,
      error: result.error.issues
        .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
        .join('; '),
    }
  }

  return { ok: true, name: toolName, input: result.data }
}
