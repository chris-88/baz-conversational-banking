import { z } from 'zod'

/**
 * The fact catalogue. Every reusable piece of customer context is defined here exactly once:
 * its value schema, whether it belongs to a person or the household, how it may be reused,
 * how sensitive it is, and whether the model is allowed to extract it from conversation.
 *
 * §9 (shared customer context), §10 (provenance), §11 (reuse rules).
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/** Branded so a participant id can never be confused with an application or fact id. */
export type ParticipantId = string & { readonly brand: unique symbol }
export type ApplicationId = string & { readonly brand: unique symbol }
export type FactId = string & { readonly brand: unique symbol }
export type CaseId = string & { readonly brand: unique symbol }

export const asParticipantId = (value: string): ParticipantId => value as ParticipantId
export const asApplicationId = (value: string): ApplicationId => value as ApplicationId
export const asFactId = (value: string): FactId => value as FactId
export const asCaseId = (value: string): CaseId => value as CaseId

/**
 * Journeys are written in terms of roles; facts are stored against participants. The
 * requirement engine resolves one to the other, which is what stops the primary's income
 * satisfying the partner's income requirement.
 */
export type ParticipantRole = 'primary' | 'partner'

/** What a fact is about. `'household'` facts are shared by everyone on the case. */
export type FactSubject = ParticipantId | 'household'

// ---------------------------------------------------------------------------
// Provenance and reuse
// ---------------------------------------------------------------------------

/** §10 — where a value came from. `verified` is tracked separately from `source`. */
export const FACT_SOURCES = [
  'customer_stated',
  'partner_stated',
  'bank_held',
  'document_extracted',
  'document_verified',
  'system_derived',
] as const
export type FactSource = (typeof FACT_SOURCES)[number]

/**
 * §11 — how a known value may be used again.
 *
 * - `auto`    reuse silently
 * - `confirm` reuse, but show it and ask the customer to confirm it is still right
 * - `fresh`   always ask again for this application
 * - `never`   not reusable at all
 */
export const REUSE_POLICIES = ['auto', 'confirm', 'fresh', 'never'] as const
export type ReusePolicy = (typeof REUSE_POLICIES)[number]

/** `special` data is collected only through an explicit consented form (§7.5, Invariant 6). */
export type Sensitivity = 'standard' | 'special'

export type FactDefinition = {
  /** Validates any value written against this key. */
  readonly schema: z.ZodType
  /** Whether the value belongs to one person or the household. */
  readonly subject: 'person' | 'household'
  /** Default reuse policy. A journey requirement may tighten it, never loosen it. */
  readonly reuse: ReusePolicy
  readonly sensitivity: Sensitivity
  /**
   * May the model write this from conversation? `false` means the only route in is an
   * explicit structured form — `record_facts` rejects it outright (Invariant 6).
   */
  readonly extractable: boolean
  /** Short human label, for the admin case inspector and the reuse metric. */
  readonly label: string
}

// ---------------------------------------------------------------------------
// Value schemas used by more than one key
// ---------------------------------------------------------------------------

const euro = z.number().int().nonnegative()
const positiveEuro = z.number().int().positive()
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

const employmentStatus = z.enum([
  'employed_full_time',
  'employed_part_time',
  'self_employed',
  'contract',
  'retired',
  'not_working',
])

const maritalStatus = z.enum(['single', 'married', 'civil_partnership', 'separated', 'divorced', 'widowed'])

const tenure = z.enum(['renting', 'living_with_family', 'owner_occupier', 'other'])

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

export const factCatalogue = {
  // ---- Identity (§9) ----
  'identity.fullName': {
    schema: z.string().min(2).max(120),
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Full name',
  },
  'identity.dateOfBirth': {
    schema: isoDate,
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Date of birth',
  },
  'identity.address': {
    schema: z.string().min(6).max(300),
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Home address',
  },
  'identity.yearsAtAddress': {
    schema: z.number().int().nonnegative().max(100),
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Years at address',
  },
  'identity.email': {
    schema: z.email(),
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Email address',
  },
  'identity.mobile': {
    schema: z.string().min(7).max(20),
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Mobile number',
  },
  'identity.maritalStatus': {
    schema: maritalStatus,
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Marital status',
  },
  'identity.nationality': {
    schema: z.string().min(2).max(60),
    subject: 'person',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Nationality',
  },
  // Never reusable across journeys without a fresh ask: a national identifier is
  // re-keyed per application in the recorded journeys.
  //
  // Takeable in conversation (2026-10-05). It was not, which produced a dead end: the case
  // listed it as outstanding, nothing told Baz it could not be recorded, so Baz asked, the
  // customer answered, record_facts refused it and Baz had to retract. Ordinary banking data
  // is collected in the conversation and covered by the DPA; special-category health data is
  // not, and stays `extractable: false` below (§7.5, Invariant 6).
  'identity.ppsn': {
    schema: z.string().regex(/^\d{7}[A-Za-z]{1,2}$/, 'expected a PPS number'),
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'PPS number',
  },

  // ---- Household (§9) ----
  'household.buyingWith': {
    schema: z.enum(['alone', 'partner', 'other']),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Buying alone or with someone',
  },
  'household.dependantCount': {
    schema: z.number().int().nonnegative().max(20),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Number of dependants',
  },
  'household.financesManagedJointly': {
    schema: z.boolean(),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Household finances managed jointly',
  },

  // ---- Employment (§9) ----
  'employment.status': {
    schema: employmentStatus,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Employment status',
  },
  'employment.employerName': {
    schema: z.string().min(2).max(160),
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Employer',
  },
  'employment.occupation': {
    schema: z.string().min(2).max(120),
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Occupation',
  },
  'employment.startDate': {
    schema: isoDate,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Employment start date',
  },

  // ---- Income (§9) ----
  'income.annualBasic': {
    schema: positiveEuro,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Annual basic salary',
  },
  'income.annualVariable': {
    schema: euro,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Annual bonus or commission',
  },
  'income.otherAnnual': {
    schema: euro,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Other annual income',
  },

  // ---- Expenditure (§9) ----
  'expenditure.monthlyRent': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Monthly rent',
  },
  'expenditure.monthlyChildcare': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Monthly childcare',
  },
  'expenditure.monthlyOther': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Other monthly outgoings',
  },

  // ---- Assets (§9) ----
  'assets.savingsBalance': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Savings',
  },
  'assets.depositAmount': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Deposit available',
  },
  'assets.giftedDeposit': {
    schema: euro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Gifted portion of deposit',
  },

  // ---- Liabilities (§9) ----
  'liabilities.monthlyLoanRepayments': {
    schema: euro,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Monthly loan repayments',
  },
  'liabilities.creditCardBalance': {
    schema: euro,
    subject: 'person',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Credit card balance',
  },

  // ---- Housing and the purchase (§9) ----
  'housing.currentTenure': {
    schema: tenure,
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Current housing',
  },
  'housing.purchasePrice': {
    schema: positiveEuro,
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Property price',
  },
  'housing.propertyCounty': {
    schema: z.string().min(2).max(60),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Property county',
  },
  'housing.firstTimeBuyer': {
    schema: z.boolean(),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'First-time buyer',
  },

  // ---- Goals and life events (§9) ----
  'goals.primaryObjective': {
    schema: z.string().min(3).max(300),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'What the customer is trying to do',
  },
  'lifeEvent.recentlyMarried': {
    schema: z.boolean(),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'Recently married',
  },
  'lifeEvent.newChild': {
    schema: z.boolean(),
    subject: 'household',
    reuse: 'auto',
    sensitivity: 'standard',
    extractable: true,
    label: 'New child',
  },

  // ---- Borrowing intent ----
  'borrowing.requestedAmount': {
    schema: positiveEuro,
    subject: 'household',
    reuse: 'fresh',
    sensitivity: 'standard',
    extractable: true,
    label: 'Amount the customer wants to borrow',
  },
  'borrowing.purpose': {
    schema: z.string().min(3).max(200),
    subject: 'household',
    reuse: 'fresh',
    sensitivity: 'standard',
    extractable: true,
    label: 'Purpose of borrowing',
  },

  // ---- Protection (§7.5) ----
  // Cover shape is ordinary information. Health is not: it is `special`, not extractable,
  // and reachable only through the consented structured form (Invariant 6).
  'protection.coverAmount': {
    schema: positiveEuro,
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Cover amount',
  },
  'protection.coverTermYears': {
    schema: z.number().int().positive().max(60),
    subject: 'household',
    reuse: 'confirm',
    sensitivity: 'standard',
    extractable: true,
    label: 'Cover term',
  },
  'protection.health.smoker': {
    schema: z.boolean(),
    subject: 'person',
    reuse: 'never',
    sensitivity: 'special',
    extractable: false,
    label: 'Smoker',
  },
  'protection.health.heightCm': {
    schema: z.number().int().positive().max(260),
    subject: 'person',
    reuse: 'never',
    sensitivity: 'special',
    extractable: false,
    label: 'Height',
  },
  'protection.health.weightKg': {
    schema: z.number().int().positive().max(400),
    subject: 'person',
    reuse: 'never',
    sensitivity: 'special',
    extractable: false,
    label: 'Weight',
  },
  'protection.health.conditions': {
    schema: z.array(z.string().min(2).max(120)).max(20),
    subject: 'person',
    reuse: 'never',
    sensitivity: 'special',
    extractable: false,
    label: 'Medical conditions',
  },
} as const satisfies Record<string, FactDefinition>

export type FactCatalogue = typeof factCatalogue
export type FactKey = keyof FactCatalogue

/** The validated value type for a given key, inferred from its schema. */
export type FactValue<K extends FactKey> = z.infer<FactCatalogue[K]['schema']>

export const FACT_KEYS = Object.keys(factCatalogue) as readonly FactKey[]

// ---------------------------------------------------------------------------
// The stored fact
// ---------------------------------------------------------------------------

export type Fact = {
  readonly id: FactId
  readonly key: FactKey
  readonly subject: FactSubject
  readonly value: unknown
  readonly source: FactSource
  readonly verified: boolean
  /**
   * Which application this was captured for, or `null` for context gathered in general
   * conversation. Drives the questions-avoided metric (§53).
   */
  readonly capturedFor: ApplicationId | null
  /** Non-null once a newer fact replaces this one. Superseded facts never satisfy anything. */
  readonly supersededBy: FactId | null
  readonly capturedAt: string
}

// ---------------------------------------------------------------------------
// Catalogue access
// ---------------------------------------------------------------------------

export function isFactKey(value: string): value is FactKey {
  return Object.prototype.hasOwnProperty.call(factCatalogue, value)
}

export function factDefinition<K extends FactKey>(key: K): FactCatalogue[K] {
  return factCatalogue[key]
}

export type FactValueResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly issues: readonly string[] }

/**
 * Validates a value against its catalogue schema. Every write goes through this, so an
 * invalid value can never reach the database.
 */
export function parseFactValue(key: FactKey, value: unknown): FactValueResult {
  const result = factCatalogue[key].schema.safeParse(value)
  if (result.success) return { ok: true, value: result.data }
  return {
    ok: false,
    issues: result.error.issues.map((issue) =>
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
    ),
  }
}

/** Invariant 6: the model may never write a fact the catalogue marks non-extractable. */
export function isModelExtractable(key: FactKey): boolean {
  return factCatalogue[key].extractable
}

export function isSpecialCategory(key: FactKey): boolean {
  return factCatalogue[key].sensitivity === 'special'
}
