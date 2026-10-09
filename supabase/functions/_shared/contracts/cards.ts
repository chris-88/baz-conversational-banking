import { z } from 'zod'
import { PRODUCTS } from '../domain/journey.ts'
import { APPLICATION_STATES } from '../domain/state-machine.ts'

/**
 * Cards are what the model asks for and the server renders.
 *
 * Every card's content is built from the database by the server — the model supplies only an
 * identifier and, where it is genuinely the model's job, the wording of a reason. That is what
 * stops a status card from agreeing with model text that is wrong (Invariant 2, §59).
 */

const applicationId = z.uuid()

export const productOptionCardSchema = z.object({
  type: z.literal('product_options'),
  options: z
    .array(
      z.object({
        product: z.enum(PRODUCTS),
        displayName: z.string(),
        oneLine: z.string(),
        /** The model's words, tied to what the customer said (§49). */
        reason: z.string(),
        /** Already offered and declined — shown as such rather than offered again. */
        previouslyDeclined: z.boolean(),
      }),
    )
    .min(1),
})

/**
 * Several named products side by side, to pick one to hear more about (§51).
 *
 * Distinct from `product_options`, which offers the handful of things Baz can actually start
 * and whose tap begins an application. This offers what the catalogue holds within a family —
 * nine savings accounts, six credit cards — so somebody can see them together and choose what
 * to ask about. Nothing is started by tapping one.
 *
 * Distinct from `quote` too, which compares computed figures for the same product. This
 * compares different products, and every word of it is read from the catalogue rather than
 * written by the model: the model chooses which to show and says why, and the facts beside each
 * one come from the knowledge base (Invariant 2).
 */
export const comparisonCardSchema = z.object({
  type: z.literal('comparison'),
  /** What is being compared, e.g. "Savings accounts". */
  title: z.string(),
  options: z
    .array(
      z.object({
        /** The catalogue id, so the follow-up turn knows exactly which one was picked. */
        id: z.string(),
        name: z.string(),
        /** The job it does, from the catalogue. */
        oneLine: z.string(),
        /** A few features, from the catalogue. Short enough to scan three of these at once. */
        highlights: z.array(z.string()).max(4),
        /**
         * The headline figure, read from the catalogue. Null where the catalogue holds none.
         *
         * For a deposit account this is the whole question. Three savings accounts without
         * their rates look interchangeable when one of them pays a full point more.
         */
        rate: z.string().nullable(),
        /** The catch beside the rate — what it drops to, what the tier is. */
        rateNote: z.string().nullable(),
        /** The model's words: why this one is in front of this customer (§49). */
        reason: z.string(),
        /** Where it ends, when that is not self-serve — advice, underwriting, a credit check. */
        endsIn: z.string().nullable(),
      }),
    )
    .min(2)
    .max(4),
})

/**
 * Three or more ways to do the same thing, with the trade-off visible (§51).
 *
 * Every figure is computed by the quote engine from the catalogue, never by the model. The card
 * is a conversation device rather than a product picker: choosing one asks Baz to explain it and
 * to keep asking how the customer intends to use and repay it.
 */
export const quoteCardSchema = z.object({
  type: z.literal('quote'),
  product: z.enum(PRODUCTS),
  displayName: z.string(),
  /** What the figures were computed from, so the card states its own assumptions. */
  basis: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        highlight: z.string().nullable(),
        headline: z.object({ label: z.string(), value: z.string() }),
        figures: z.array(z.object({ label: z.string(), value: z.string() })),
        footnote: z.string().nullable(),
      }),
    )
    .min(1),
})

export const statusCardSchema = z.object({
  type: z.literal('status'),
  applications: z.array(
    z.object({
      id: applicationId,
      product: z.enum(PRODUCTS),
      displayName: z.string(),
      state: z.enum(APPLICATION_STATES),
      /** From the state machine, never from model text. */
      stateLabel: z.string(),
      outstandingCount: z.number().int().nonnegative(),
      waitingOn: z.enum(['primary', 'partner']).nullable(),
      /**
       * The journey's requirements in order, each with whether it is met. Built from the
       * requirement engine, so the card can show what is actually left rather than a count.
       */
      steps: z.array(
        z.object({
          label: z.string(),
          done: z.boolean(),
          waitingOnPartner: z.boolean(),
        }),
      ),
    }),
  ),
})

export const reviewCardSchema = z.object({
  type: z.literal('review'),
  applicationId,
  displayName: z.string(),
  /** Built from the case, not written by the model. */
  summary: z.array(z.object({ label: z.string(), value: z.string() })),
  /**
   * What the customer must agree to before this can be submitted: declarations, consents, and
   * values we already hold that they are asked to confirm are still right (§11, §48).
   */
  confirmations: z.array(
    z.object({
      requirementId: z.string(),
      label: z.string(),
      kind: z.enum(['declaration', 'confirmation', 'reuse']),
      /** For a reuse confirmation, the value being offered. */
      knownValue: z.string().nullable(),
    }),
  ),
  /** The tap that calls case-action. Until then nothing is submitted (§48). */
  confirmLabel: z.string(),
})

export const pausePromptCardSchema = z.object({
  type: z.literal('pause_prompt'),
  applicationId,
  displayName: z.string(),
  advisoryTitle: z.string(),
  advisoryExplanation: z.string(),
})

export const partnerInviteCardSchema = z.object({
  type: z.literal('partner_invite'),
  applicationIds: z.array(applicationId).min(1),
  applicationNames: z.array(z.string()).min(1),
  partnerName: z.string().nullable(),
})

export const uploadRequestCardSchema = z.object({
  type: z.literal('upload_request'),
  requestId: z.uuid(),
  applicationId,
  /** The journey's own words for this document, never the model's. */
  label: z.string(),
  documentType: z.enum([
    'payslip',
    'bank_statement',
    'photo_id',
    'proof_of_address',
    'salary_certificate',
  ]),
  /** Which application it is for, so a card in a long transcript still makes sense. */
  applicationName: z.string(),
})

/**
 * §7.5, Invariant 6 — the gate in front of anything sensitive.
 *
 * Health information is never inferred from adjacent financial data and never collected in
 * conversation. The customer is told exactly what will be asked and why, and nothing is asked
 * until they agree.
 */
export const consentCardSchema = z.object({
  type: z.literal('consent'),
  applicationId,
  requirementId: z.string(),
  title: z.string(),
  explanation: z.string(),
  /** Plain descriptions of what the questions cover, before any are asked. */
  covers: z.array(z.string()),
  confirmLabel: z.string(),
})

/**
 * The structured form itself — the ONLY route by which special-category data enters the case.
 * `record_facts` refuses every key here, so the model cannot write one however it is asked.
 */
export const healthFormCardSchema = z.object({
  type: z.literal('health_form'),
  applicationId,
  title: z.string(),
  fields: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      kind: z.enum(['boolean', 'number', 'text_list']),
      unit: z.string().nullable(),
    }),
  ),
})

/**
 * §10 — the plan Baz is offering to keep, before the customer has agreed to it.
 *
 * Every figure is computed by the plan engine from the case, never by the model: a projected
 * date a customer acts on has to be one the bank can stand over (§40).
 */
export const planProposalCardSchema = z.object({
  type: z.literal('plan_proposal'),
  planId: z.uuid(),
  title: z.string(),
  /** What they are building towards, and where they are now. */
  targetAmount: z.number().nullable(),
  currentAmount: z.number().nullable(),
  projectedDate: z.string().nullable(),
  monthsRemaining: z.number().int().nullable(),
  milestones: z.array(z.object({ label: z.string(), achieved: z.boolean() })),
  checkin: z
    .object({ purpose: z.string(), when: z.string(), agenda: z.array(z.string()) })
    .nullable(),
  confirmLabel: z.string(),
})

/**
 * Published mortgage rates, for a specific customer and property.
 *
 * Every figure on it was selected by `selectRates` from the rate table, including which rows a
 * customer is entitled to see at all — the model supplies the four answers the table is indexed
 * by and nothing else (Invariant 3). `basis` is on the card so the assumptions are visible:
 * a rate is meaningless without the buyer type, the BER and the amount it was priced for.
 */
export const mortgageRatesCardSchema = z.object({
  type: z.literal('mortgage_rates'),
  title: z.string(),
  basis: z.object({
    buyerType: z.string(),
    ber: z.string(),
    amountEur: z.number().nullable(),
    termYears: z.number().nullable(),
  }),
  /** The date the bank's own table claims, not the date it was read. */
  asOf: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        /** "4 years fixed", "Variable". */
        label: z.string(),
        familyLabel: z.string(),
        ratePct: z.number(),
        aprcPct: z.number().nullable(),
        /** 2% of drawdown in euro, where the rate carries cashback and the amount is known. */
        cashbackEur: z.number().nullable(),
        cashbackNote: z.string().nullable(),
        monthlyEur: z.number().nullable(),
        note: z.string().nullable(),
      }),
    )
    .min(1)
    .max(4),
})

export const cardSchema = z.discriminatedUnion('type', [
  quoteCardSchema,
  planProposalCardSchema,
  consentCardSchema,
  healthFormCardSchema,
  productOptionCardSchema,
  comparisonCardSchema,
  statusCardSchema,
  reviewCardSchema,
  pausePromptCardSchema,
  partnerInviteCardSchema,
  uploadRequestCardSchema,
  mortgageRatesCardSchema,
])

export type Card = z.infer<typeof cardSchema>
export type CardType = Card['type']

export const CARD_TYPES = [
  'quote',
  'comparison',
  'plan_proposal',
  'product_options',
  'status',
  'review',
  'pause_prompt',
  'partner_invite',
  'upload_request',
  'consent',
  'health_form',
  'mortgage_rates',
] as const satisfies readonly CardType[]
