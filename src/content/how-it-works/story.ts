import type { Card } from '@contracts/cards.ts'
import type { Stage } from '@domain/conversation/stages.ts'
import { evaluateAdvisories } from '@domain/advisories.ts'
import { stateLabel, type ApplicationState } from '@domain/state-machine.ts'
import type { Product } from '@domain/journey.ts'
import { PROVENANCE, formatFactValue } from '@domain/reuse.ts'
import { asApplicationId, type FactKey, type FactSource } from '@domain/facts.ts'
import { dataNoticeCard } from '@llm/data-notice.ts'
import { signInPromptCard } from '@llm/sign-in-prompt.ts'
import type { Settled } from '@/baz/cardState'

/**
 * The §67 acceptance story, as a script.
 *
 * Thirteen stages from §6, told through the cards the product actually renders. The words are
 * synthetic and say so: a customer called Aoife, a spouse called Emma, both from the canonical
 * seed, and a conversation written to the spec rather than recorded from a person. Where a line
 * is lifted from a fixture transcribed off a live case, the beat says which one.
 *
 * What is not synthetic is the shape. Every card is a payload the real component renders, and
 * `story.test.ts` parses each one against the card schema so a drifted field fails the build.
 * The arrangement and the mortgage rates are pinned here as the engines produced them and
 * recomputed in the test from the same engines, so the figures on the page are what the code
 * says and not what somebody remembered. The pause advisory is the engine's own wording, read
 * at module load. Labels, state names and provenance phrases come from the domain, so the page
 * cannot call a state something the product does not.
 *
 * Tools offered are not stored on a beat. The chapter reads them from `CONVERSATION`, which is
 * the same object that decides what a live turn is handed.
 */

export type Channel = 'web' | 'app' | 'partner' | 'lockscreen' | 'console'
export type Actor = 'aoife' | 'baz' | 'emma'
export type SpecStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export type Line = {
  readonly actor: Actor
  readonly text: string
  /** Present only when the wording is lifted from a fixture; shown as a label. */
  readonly quoted?: string
}

export type BeatCard = {
  readonly card: Card
  /** What became of it, in the product's own wording, where the story has moved on. */
  readonly settled?: Settled
}

export type Beat = {
  readonly id: string
  /** The §6 stage this beat belongs to. */
  readonly stage: SpecStage
  /** The engine's stage for the turn, when the beat is a Baz turn. */
  readonly engineStage?: Stage
  readonly channel: Channel
  readonly title: string
  readonly lines: readonly Line[]
  readonly cards: readonly BeatCard[]
  /** Something the partner meets instead of a card: their task list, as rows. */
  readonly tasks?: readonly { readonly label: string; readonly on: string }[]
  /** The presenter's actions in the console, each a state-machine transition. */
  readonly console?: readonly string[]
  /** What arrives on the lock screen, as the admin function sends it. */
  readonly notification?: { readonly title: string; readonly body: string; readonly link: string }
  /** What the system did on this beat, as the engine would record it. */
  readonly system: {
    readonly facts?: readonly string[]
    /** `context_reused` rows written on this beat. */
    readonly reused?: number
    readonly transitions?: readonly string[]
    readonly events?: readonly string[]
    readonly note?: string
  }
  readonly claim: 'synthetic' | 'poc'
  /** Spec section and, where one exists, the fixture or source file. */
  readonly source: string
}

/** The thirteen §6 headings, as the spec names them. */
export const STAGE_NAMES: Readonly<Record<SpecStage, string>> = {
  1: 'Public website',
  2: 'Customer need discovery',
  3: 'Broader needs discovery',
  4: 'Authentication',
  5: 'Existing customer enrichment',
  6: 'Product selection',
  7: 'Concurrent application progression',
  8: 'Customer confirmation and pause',
  9: 'Partner participation',
  10: 'Customer leaves',
  11: 'Application state change',
  12: 'Notification',
  13: 'Return and continuation',
}

/** How each channel is introduced when the story moves to it. */
export const CHANNEL_NAMES: Readonly<Record<Channel, string>> = {
  web: 'Public web, in a browser tab',
  app: 'The installed app, same case',
  partner: "Emma's phone, from the invite link",
  console: 'The presenter console',
  lockscreen: "Aoife's lock screen",
}

/**
 * Synthetic ids, shaped as the schemas demand.
 *
 * The card contracts validate application and plan ids as UUIDs, so these carry the version
 * nibble and variant a real one would. They identify nothing.
 */
export const IDS = {
  mortgage: '6a1f0c2e-5b7d-4e3a-8c9f-0d1e2f3a4b5c',
  jointAccount: '7b2a1d3f-6c8e-4f4b-9d0a-1e2f3a4b5c6d',
  creditCard: '8c3b2e4a-7d9f-4a5c-8e1b-2f3a4b5c6d7e',
  personalLoan: '9d4c3f5b-8e0a-4b6d-9f2c-3a4b5c6d7e8f',
  protection: 'a0e5d4c6-9f1b-4c7e-8a3d-4b5c6d7e8f90',
  plan: 'b1f6e5d7-0a2c-4d8f-9b4e-5c6d7e8f9a01',
} as const

/** The fixture the quoted lines come from, named once. */
const OPENING_FIXTURE = 'fixture opening.json, case c77e613f, 2026-10-15'
const REUSE_FIXTURE = 'fixture reuse.json, case c77e613f, 2026-10-15'

/** Where the notice lives in this app. The server passes the same route under its base URL. */
const PRIVACY_HREF = '#/privacy'

/** The names the journeys give their products, which is what the cards print. */
const NAME: Readonly<Record<Product, string>> = {
  mortgage: 'Mortgage',
  joint_account: 'Joint current account',
  credit_card: 'Credit card',
  personal_loan: 'Personal loan',
  protection: 'Life assurance and family protection',
  current_account: 'Current account',
  savings: 'Savings account',
}

/* ---------------------------------------------------------------------------------------- */
/* The facts the story holds, with their values as the cards print them.                     */
/* ---------------------------------------------------------------------------------------- */

type Held = {
  readonly key: FactKey
  readonly value: unknown
  readonly source: FactSource
}

/** Bank-held values are the canonical seed's; stated ones are what Aoife says in the story. */
const HELD: Readonly<Record<string, Held>> = {
  fullName: { key: 'identity.fullName', value: 'Aoife Ní Bhriain', source: 'bank_held' },
  dob: { key: 'identity.dateOfBirth', value: '1992-04-17', source: 'bank_held' },
  address: { key: 'identity.address', value: '14 Seapoint Terrace, Dublin 8, D08 XY12', source: 'bank_held' },
  yearsAtAddress: { key: 'identity.yearsAtAddress', value: 3, source: 'bank_held' },
  email: { key: 'identity.email', value: 'aoife.demo@example.invalid', source: 'bank_held' },
  mobile: { key: 'identity.mobile', value: '+353871000417', source: 'bank_held' },
  ppsn: { key: 'identity.ppsn', value: '9000417T', source: 'bank_held' },
  maritalStatus: { key: 'identity.maritalStatus', value: 'married', source: 'customer_stated' },
  employmentStatus: { key: 'employment.status', value: 'employed_full_time', source: 'bank_held' },
  employer: { key: 'employment.employerName', value: 'Ardán Software Limited', source: 'bank_held' },
  income: { key: 'income.annualBasic', value: 92_000, source: 'bank_held' },
  dependants: { key: 'household.dependantCount', value: 1, source: 'customer_stated' },
  buyingWith: { key: 'household.buyingWith', value: 'partner', source: 'customer_stated' },
  firstTimeBuyer: { key: 'housing.firstTimeBuyer', value: true, source: 'customer_stated' },
  tenure: { key: 'housing.currentTenure', value: 'renting', source: 'customer_stated' },
  savings: { key: 'assets.savingsBalance', value: 32_000, source: 'customer_stated' },
  loanRepayments: { key: 'liabilities.monthlyLoanRepayments', value: 0, source: 'bank_held' },
  cardBalance: { key: 'liabilities.creditCardBalance', value: 0, source: 'bank_held' },
}

const held = (name: keyof typeof HELD): Held => {
  const fact = HELD[name]
  if (fact === undefined) throw new Error(`No held fact named ${name}`)
  return fact
}

/* ---------------------------------------------------------------------------------------- */
/* Requirement lists, in journey order, for the status cards.                                */
/* ---------------------------------------------------------------------------------------- */

type Step = { readonly id: string; readonly label: string; readonly partner?: true }

/** `journeys/mortgage.ts`, with the second-applicant branch that `buyingWith = partner` opens. */
const MORTGAGE_STEPS: readonly Step[] = [
  { id: 'name', label: 'Your full name' },
  { id: 'dob', label: 'Your date of birth' },
  { id: 'address', label: 'Your home address' },
  { id: 'marital-status', label: 'Your marital status' },
  { id: 'ppsn', label: 'Your PPS number' },
  { id: 'buying-with', label: 'Buying alone or with someone' },
  { id: 'dependants', label: 'Number of dependants' },
  { id: 'employment-status', label: 'Your employment status' },
  { id: 'employer', label: 'Your employer' },
  { id: 'income-basic', label: 'Your annual basic salary' },
  { id: 'current-tenure', label: 'Your current housing' },
  { id: 'rent', label: 'Monthly rent' },
  { id: 'savings', label: 'Your savings' },
  { id: 'deposit', label: 'Deposit available' },
  { id: 'loan-repayments', label: 'Monthly loan repayments' },
  { id: 'card-balance', label: 'Credit card balance' },
  { id: 'purchase-price', label: 'Property price' },
  { id: 'property-county', label: 'Where you are buying' },
  { id: 'first-time-buyer', label: 'First-time buyer' },
  { id: 'doc-payslip', label: 'Your most recent payslip' },
  { id: 'doc-id', label: 'Photo ID' },
  { id: 'mortgage-declaration', label: 'Mortgage application declaration' },
  { id: 'partner-name', label: "Your partner's full name", partner: true },
  { id: 'partner-dob', label: "Your partner's date of birth", partner: true },
  { id: 'partner-ppsn', label: "Your partner's PPS number", partner: true },
  { id: 'partner-employment-status', label: "Your partner's employment status", partner: true },
  { id: 'partner-income-basic', label: "Your partner's annual basic salary", partner: true },
  { id: 'partner-mortgage-declaration', label: 'Mortgage application declaration', partner: true },
]

/** `journeys/joint-account.ts`. */
const JOINT_STEPS: readonly Step[] = [
  { id: 'name', label: 'Your full name' },
  { id: 'dob', label: 'Your date of birth' },
  { id: 'address', label: 'Your home address' },
  { id: 'ppsn', label: 'Your PPS number' },
  { id: 'email', label: 'Your email address' },
  { id: 'mobile', label: 'Your mobile number' },
  { id: 'employment-status', label: 'Your employment status' },
  { id: 'partner-name', label: "Your partner's full name", partner: true },
  { id: 'partner-dob', label: "Your partner's date of birth", partner: true },
  { id: 'partner-address', label: "Your partner's home address", partner: true },
  { id: 'partner-ppsn', label: "Your partner's PPS number", partner: true },
  { id: 'partner-email', label: "Your partner's email address", partner: true },
  { id: 'partner-employment-status', label: "Your partner's employment status", partner: true },
  { id: 'partner-doc-id', label: "Your partner's photo ID", partner: true },
  { id: 'terms', label: 'Joint account terms and conditions' },
  { id: 'partner-terms', label: 'Joint account terms and conditions', partner: true },
]

/** `journeys/credit-card.ts`. */
const CREDIT_CARD_STEPS: readonly Step[] = [
  { id: 'name', label: 'Your full name' },
  { id: 'dob', label: 'Your date of birth' },
  { id: 'address', label: 'Your home address' },
  { id: 'years-at-address', label: 'Years at that address' },
  { id: 'ppsn', label: 'Your PPS number' },
  { id: 'employment-status', label: 'Your employment status' },
  { id: 'employer', label: 'Your employer' },
  { id: 'income-basic', label: 'Your annual basic salary' },
  { id: 'dependants', label: 'Number of dependants' },
  { id: 'loan-repayments', label: 'Monthly loan repayments' },
  { id: 'credit-declaration', label: 'Credit application declaration' },
]

/** `journeys/personal-loan.ts`. */
const LOAN_STEPS: readonly Step[] = [
  { id: 'name', label: 'Your full name' },
  { id: 'dob', label: 'Your date of birth' },
  { id: 'address', label: 'Your home address' },
  { id: 'ppsn', label: 'Your PPS number' },
  { id: 'employment-status', label: 'Your employment status' },
  { id: 'employer', label: 'Your employer' },
  { id: 'income-basic', label: 'Your annual basic salary' },
  { id: 'loan-repayments', label: 'Monthly loan repayments' },
  { id: 'card-balance', label: 'Credit card balance' },
  { id: 'other-outgoings', label: 'Other monthly outgoings' },
  { id: 'amount', label: 'How much you want to borrow' },
  { id: 'purpose', label: 'What the loan is for' },
  { id: 'doc-bank-statement', label: 'Three months of bank statements' },
  { id: 'loan-declaration', label: 'Loan application declaration' },
]

/** What the bank held or Aoife had said by the time the four applications started. */
const MORTGAGE_DONE_AT_START = [
  'name', 'dob', 'address', 'marital-status', 'ppsn', 'buying-with', 'dependants',
  'employment-status', 'employer', 'current-tenure', 'savings', 'loan-repayments',
  'card-balance', 'first-time-buyer',
]
const JOINT_DONE_AT_START = ['name', 'dob', 'address', 'ppsn', 'email', 'mobile', 'employment-status']
const CREDIT_CARD_DONE_AT_START = [
  'name', 'dob', 'address', 'years-at-address', 'ppsn', 'employment-status', 'employer',
  'dependants', 'loan-repayments',
]
const LOAN_DONE_AT_START = [
  'name', 'dob', 'address', 'ppsn', 'employment-status', 'employer', 'loan-repayments',
  'card-balance',
]

type StatusApplication = Extract<Card, { type: 'status' }>['applications'][number]

/**
 * One status row, with the steps marked as the requirement engine would mark them.
 *
 * `outstandingCount` is derived from the steps rather than typed beside them, so the number on
 * the row and the list under it cannot disagree.
 */
function statusRow(
  id: string,
  product: Product,
  state: ApplicationState,
  all: readonly Step[],
  done: readonly string[],
  options: { readonly partnerDone?: boolean; readonly waitingOn?: 'primary' | 'partner' | null } = {},
): StatusApplication {
  const steps = all.map((step) => {
    const isDone = done.includes(step.id) || (step.partner === true && options.partnerDone === true)
    return {
      label: step.label,
      done: isDone,
      waitingOnPartner: !isDone && step.partner === true,
    }
  })

  return {
    id,
    product,
    displayName: NAME[product],
    state,
    stateLabel: stateLabel(state),
    outstandingCount: steps.filter((step) => !step.done).length,
    waitingOn: options.waitingOn ?? null,
    steps,
  }
}

/* ---------------------------------------------------------------------------------------- */
/* The cards, built once.                                                                    */
/* ---------------------------------------------------------------------------------------- */

/**
 * The plan the engine drafts for `buy_first_home` with a €40,000 target by June 2027.
 *
 * Milestone labels and the first check-in are `planDraftFor`'s output, pinned here and
 * recomputed in the test. Months remaining is the server's own arithmetic: what is left to
 * save, divided by what is saved each month, rounded up.
 */
const PLAN_CARD: Card = {
  type: 'plan_proposal',
  planId: IDS.plan,
  title: 'Buy our first home',
  targetAmount: 40_000,
  currentAmount: 32_000,
  projectedDate: null,
  monthsRemaining: 7,
  milestones: [
    'Affordability understood',
    'Deposit target defined',
    'Deposit target reached — €40,000',
    'Mortgage readiness complete',
    'Mortgage submitted',
    'Mortgage approved',
    'Property selected',
    'Mortgage protection in place',
    'Home insurance in place',
    'Home purchase completed',
  ].map((label) => ({ label, achieved: false })),
  checkin: {
    purpose: 'Review deposit progress',
    when: '2026-11-16',
    agenda: ['See where the deposit is', 'Check nothing has changed with income or outgoings'],
  },
  confirmLabel: 'Keep this plan',
}

/**
 * `arrange()` over the published savings options, for €32,000 held, €1,200 a month, a
 * first-time buyer taking the mortgage here, eight months to the target (June 2027 from
 * October 2026, as `monthsUntil` counts it). Pinned as produced on 2026-10-16; the test
 * recomputes it from the same engine.
 */
export const ARRANGEMENT_INPUT = {
  lumpSum: 32_000,
  monthly: 1_200,
  firstTimeBuyer: true,
  mortgageWithThisBank: true,
  monthsToTarget: 8,
} as const

const ARRANGEMENT_CARD: Card = {
  type: 'arrangement',
  title: 'How your money would be arranged',
  allocations: [
    {
      product: 'savings',
      catalogueId: 'savings.advantage_fixed',
      name: 'Advantage Fixed Term Deposit Account',
      amount: 32_000,
      cadence: 'once',
      termMonths: 6,
      rate: '1.51% AER fixed for 6 months',
      job: 'Locked away for 6 months, which ends before you need it.',
      watch: [
        'Cannot close early',
        'Only up to 25% access',
        'Single lodgement',
        'Defaults to variable call account at maturity if no instruction',
      ],
    },
    {
      product: 'savings',
      catalogueId: 'savings.mortgagesaver',
      name: 'MortgageSaver Account',
      amount: 200,
      cadence: 'monthly',
      termMonths: null,
      rate: '2% AER',
      job: 'The least that qualifies for the €2,000 bonus. Anything above this earns no more bonus and a worse rate, so it goes elsewhere.',
      watch: ['Bonus conditional on BOI mortgage and savings conditions', 'Rates/bonus terms can change'],
    },
    {
      product: 'savings',
      catalogueId: 'savings.supersaver',
      name: 'SuperSaver Account',
      amount: 1_000,
      cadence: 'monthly',
      termMonths: null,
      rate: '3% AER',
      job: 'The rest of what you save each month, where it earns the most.',
      watch: ['No lump sums', 'Rate changes after 12 months'],
    },
  ],
  firstYearInterest: 430.11,
  bonus: {
    amount: 2_000,
    conditions: [
      'At least €200 a month for 6 months in a row.',
      'At least €5,000 saved before drawdown.',
      'A mortgage drawn down here within 30 months.',
    ],
  },
  notes: [],
}

/** Reasons are the canonical seed's, which is where the live case's interests come from. */
const OPTIONS_CARD: Card = {
  type: 'product_options',
  options: [
    {
      product: 'mortgage',
      displayName: NAME.mortgage,
      oneLine: 'A loan secured on the home you are buying.',
      reason: 'What the customer came for.',
      previouslyDeclined: false,
    },
    {
      product: 'joint_account',
      displayName: NAME.joint_account,
      oneLine: 'A day-to-day account in two names.',
      reason: 'Recently married and still managing money separately.',
      previouslyDeclined: false,
    },
    {
      product: 'protection',
      displayName: NAME.protection,
      oneLine: 'A payment to the people who depend on you, if you die during the cover term.',
      reason: 'A new child and a first mortgage between them.',
      previouslyDeclined: false,
    },
    {
      product: 'credit_card',
      displayName: NAME.credit_card,
      oneLine: 'A card with a borrowing limit, repaid monthly.',
      reason: 'Moving costs, and the customer has no card with us.',
      previouslyDeclined: false,
    },
    {
      product: 'personal_loan',
      displayName: NAME.personal_loan,
      oneLine: 'A fixed amount borrowed over a fixed term.',
      reason: 'Expecting significant costs on moving in.',
      previouslyDeclined: false,
    },
  ],
}

/**
 * One row per fact, however many applications it served, as `describeReused` groups them.
 *
 * Values are printed through `formatFactValue` and provenance through `PROVENANCE`, so a PPS
 * number is masked here exactly as the product masks it.
 */
const reused = (name: keyof typeof HELD, usedFor: readonly Product[]) => {
  const fact = held(name)
  return {
    key: fact.key,
    label: '',
    value: formatFactValue(fact.key, fact.value),
    source: fact.source,
    provenance: PROVENANCE[fact.source],
    usedFor: usedFor.map((product) => NAME[product]),
  }
}

const LABELS: Readonly<Record<string, string>> = {
  'identity.fullName': 'Full name',
  'identity.dateOfBirth': 'Date of birth',
  'identity.address': 'Home address',
  'identity.maritalStatus': 'Marital status',
  'identity.ppsn': 'PPS number',
  'household.buyingWith': 'Buying alone or with someone',
  'household.dependantCount': 'Number of dependants',
  'employment.status': 'Employment status',
  'employment.employerName': 'Employer',
  'housing.currentTenure': 'Current housing',
  'assets.savingsBalance': 'Savings balance',
  'liabilities.monthlyLoanRepayments': 'Monthly loan repayments',
  'liabilities.creditCardBalance': 'Credit card balance',
  'housing.firstTimeBuyer': 'First-time buyer',
  'identity.yearsAtAddress': 'Years at address',
  'identity.email': 'Email address',
  'identity.mobile': 'Mobile number',
}

const REUSE_ITEMS = [
  reused('fullName', ['mortgage', 'joint_account', 'credit_card', 'personal_loan']),
  reused('dob', ['mortgage', 'joint_account', 'credit_card', 'personal_loan']),
  reused('address', ['mortgage', 'joint_account', 'credit_card', 'personal_loan']),
  reused('maritalStatus', ['mortgage']),
  reused('ppsn', ['mortgage', 'joint_account', 'credit_card', 'personal_loan']),
  reused('buyingWith', ['mortgage']),
  reused('dependants', ['mortgage', 'credit_card']),
  reused('employmentStatus', ['mortgage', 'joint_account', 'credit_card', 'personal_loan']),
  reused('employer', ['mortgage', 'credit_card', 'personal_loan']),
  reused('tenure', ['mortgage']),
  reused('savings', ['mortgage']),
  reused('loanRepayments', ['mortgage', 'credit_card', 'personal_loan']),
  reused('cardBalance', ['mortgage', 'personal_loan']),
  reused('firstTimeBuyer', ['mortgage']),
  reused('yearsAtAddress', ['credit_card']),
  reused('email', ['joint_account']),
  reused('mobile', ['joint_account']),
].map((item) => ({ ...item, label: LABELS[item.key] ?? item.key }))

/** One `context_reused` event per requirement per application: the §53 count. */
export const REUSED_ROWS = REUSE_ITEMS.reduce((sum, item) => sum + item.usedFor.length, 0)

const REUSE_CARD: Card = {
  type: 'reuse',
  title: `${String(REUSE_ITEMS.length)} things you never had to type`,
  started: [NAME.mortgage, NAME.joint_account, NAME.credit_card, NAME.personal_loan],
  items: REUSE_ITEMS,
}

const STATUS_AT_START: Card = {
  type: 'status',
  applications: [
    statusRow(IDS.mortgage, 'mortgage', 'in_progress', MORTGAGE_STEPS, MORTGAGE_DONE_AT_START),
    statusRow(IDS.jointAccount, 'joint_account', 'in_progress', JOINT_STEPS, JOINT_DONE_AT_START),
    statusRow(IDS.creditCard, 'credit_card', 'in_progress', CREDIT_CARD_STEPS, CREDIT_CARD_DONE_AT_START),
    statusRow(IDS.personalLoan, 'personal_loan', 'in_progress', LOAN_STEPS, LOAN_DONE_AT_START),
  ],
}

/**
 * `selectRates` for a first-time buyer, BER B, €360,000 over 30 years. Pinned as produced on
 * 2026-10-16 from the table dated as the card says; the test recomputes it.
 */
export const RATES_INPUT = {
  customerType: 'first_time_buyer',
  ber: 'B',
  amountEur: 360_000,
  termYears: 30,
} as const

const RATES_CARD: Card = {
  type: 'mortgage_rates',
  title: 'Your mortgage rate options',
  basis: { buyerType: 'first time buyer', ber: 'B', amountEur: 360_000, termYears: 30 },
  asOf: '2025-11-26',
  options: [
    {
      id: 'hvm.4y.b',
      label: '4 years fixed',
      familyLabel: 'High Value Mortgage',
      ratePct: 3.15,
      aprcPct: 3.8,
      cashbackEur: null,
      cashbackNote: null,
      monthlyEur: 1547,
      note: null,
    },
    {
      id: 'new.standard.2y.b',
      label: '2 years fixed',
      familyLabel: 'Fixed, with Cashback Plus',
      ratePct: 3.85,
      aprcPct: 4.2,
      cashbackEur: 7200,
      cashbackNote: '2% after drawdown + 1% after 5 years subject to conditions',
      monthlyEur: 1688,
      note: null,
    },
    {
      id: 'new.standard.10y.b',
      label: '10 years fixed',
      familyLabel: 'Fixed, with Cashback Plus',
      ratePct: 4.25,
      aprcPct: 4.4,
      cashbackEur: 7200,
      cashbackNote: '2% after drawdown + 1% after 5 years subject to conditions',
      monthlyEur: 1771,
      note: null,
    },
    {
      id: 'variable.owner_occupier.first_time_buyer',
      label: 'Variable',
      familyLabel: 'Variable',
      ratePct: 4.15,
      aprcPct: 4.3,
      cashbackEur: null,
      cashbackNote: null,
      monthlyEur: 1750,
      note: 'Variable rate may rise or fall.',
    },
  ],
}

const REVIEW_CARD: Card = {
  type: 'review',
  applicationId: IDS.creditCard,
  displayName: NAME.credit_card,
  summary: (
    [
      ['Your full name', 'fullName'],
      ['Your date of birth', 'dob'],
      ['Your home address', 'address'],
      ['Years at that address', 'yearsAtAddress'],
      ['Your PPS number', 'ppsn'],
      ['Your employment status', 'employmentStatus'],
      ['Your employer', 'employer'],
      ['Your annual basic salary', 'income'],
      ['Number of dependants', 'dependants'],
      ['Monthly loan repayments', 'loanRepayments'],
    ] as const
  ).map(([label, name]) => ({ label, value: formatFactValue(held(name).key, held(name).value) })),
  confirmations: [
    {
      requirementId: 'income-basic',
      label: 'Your annual basic salary',
      kind: 'reuse',
      knownValue: formatFactValue(held('income').key, held('income').value),
    },
    {
      requirementId: 'credit-declaration',
      label: 'Credit application declaration',
      kind: 'declaration',
      knownValue: null,
    },
  ],
  confirmLabel: 'Submit credit card',
}

/** The advisory the engine raises for a loan still open beside an active mortgage. */
const ADVISORY = evaluateAdvisories([
  { id: asApplicationId(IDS.mortgage), product: 'mortgage', state: 'in_progress', resumeTo: null },
  { id: asApplicationId(IDS.personalLoan), product: 'personal_loan', state: 'in_progress', resumeTo: null },
]).find((advisory) => advisory.appliesTo === asApplicationId(IDS.personalLoan))

if (ADVISORY === undefined) {
  throw new Error('The loan-versus-mortgage advisory did not fire for the story case')
}

const PAUSE_CARD: Card = {
  type: 'pause_prompt',
  applicationId: IDS.personalLoan,
  displayName: NAME.personal_loan,
  advisoryTitle: ADVISORY.title,
  advisoryExplanation: ADVISORY.explanation,
}

const INVITE_CARD: Card = {
  type: 'partner_invite',
  applicationIds: [IDS.mortgage, IDS.jointAccount],
  applicationNames: [NAME.mortgage, NAME.joint_account],
  // Null until somebody joins: a participant row does not exist before then.
  partnerName: null,
}

const STATUS_AFTER_PARTNER: Card = {
  type: 'status',
  applications: [
    statusRow(IDS.mortgage, 'mortgage', 'in_progress', MORTGAGE_STEPS, MORTGAGE_DONE_AT_START, {
      partnerDone: true,
    }),
    statusRow(IDS.jointAccount, 'joint_account', 'waiting_customer', JOINT_STEPS, JOINT_DONE_AT_START, {
      partnerDone: true,
      waitingOn: 'primary',
    }),
    statusRow(IDS.creditCard, 'credit_card', 'submitted', CREDIT_CARD_STEPS, [
      ...CREDIT_CARD_DONE_AT_START,
      'income-basic',
      'credit-declaration',
    ]),
    statusRow(IDS.personalLoan, 'personal_loan', 'paused', LOAN_STEPS, LOAN_DONE_AT_START),
  ],
}

const STATUS_ON_RETURN: Card = {
  type: 'status',
  applications: [
    statusRow(IDS.mortgage, 'mortgage', 'waiting_customer', MORTGAGE_STEPS, MORTGAGE_DONE_AT_START, {
      partnerDone: true,
      waitingOn: 'primary',
    }),
    statusRow(IDS.jointAccount, 'joint_account', 'waiting_customer', JOINT_STEPS, JOINT_DONE_AT_START, {
      partnerDone: true,
      waitingOn: 'primary',
    }),
    statusRow(IDS.creditCard, 'credit_card', 'approved', CREDIT_CARD_STEPS, [
      ...CREDIT_CARD_DONE_AT_START,
      'income-basic',
      'credit-declaration',
    ]),
    statusRow(IDS.personalLoan, 'personal_loan', 'paused', LOAN_STEPS, LOAN_DONE_AT_START),
  ],
}

/** The console's fixed copy, from `supabase/functions/admin/index.ts`. */
export const NOTIFICATION = {
  title: 'Baz',
  body: 'Baz has an update about something you’re working on with us. Open Baz to pick it up.',
  link: '/#/baz?n=<single-use code>',
} as const

/* ---------------------------------------------------------------------------------------- */
/* The beats.                                                                                */
/* ---------------------------------------------------------------------------------------- */

export const story: readonly Beat[] = [
  {
    id: 'arrival',
    stage: 1,
    channel: 'web',
    title: 'One question, and nothing to press',
    lines: [{ actor: 'baz', text: 'What are you trying to do?', quoted: 'the opening screen, ZeroState.tsx' }],
    cards: [],
    system: {
      events: ['case_created'],
      note: 'An anonymous session and an empty case. There is no greeting and no product menu: the screen asks one question and waits. Baz says it is an AI assistant the first time it writes anything down.',
    },
    claim: 'poc',
    source: '§6 Stage 1, §31',
  },
  {
    id: 'first-home',
    stage: 2,
    engineStage: 'opening',
    channel: 'web',
    title: 'The life event, not the product',
    lines: [
      { actor: 'aoife', text: 'My wife and I want to buy our first home next year.' },
      {
        actor: 'baz',
        text: "First home with your wife, that's a good one to be planning. Over the next year it's a deposit, a mortgage, protection and a few costs nobody warns you about. Do you want help putting a plan together for all of it, or is there one specific thing you want to sort today?",
        quoted: OPENING_FIXTURE,
      },
    ],
    cards: [{ card: dataNoticeCard(PRIVACY_HREF) }],
    system: {
      facts: [
        'goals.primaryObjective = Buy first home with wife next year',
        'household.buyingWith = partner',
        'housing.firstTimeBuyer = true',
      ],
      events: ['context_captured', 'data_notice_shown', 'turn_tools'],
      note: 'Gate: banking, not sensitive. The notice appears the moment Baz first writes something down, built by the server rather than the model.',
    },
    claim: 'synthetic',
    source: '§6 Stage 2; opening.json turn 1',
  },
  {
    id: 'fork',
    stage: 2,
    engineStage: 'direction',
    channel: 'web',
    title: 'The fork, answered',
    lines: [
      { actor: 'aoife', text: "Yeah I'd like to get a plan together." },
      {
        actor: 'baz',
        text: "Good, we'll build it properly. How much have you two saved so far, and roughly how much could you put away each month from here?",
        quoted: OPENING_FIXTURE,
      },
    ],
    cards: [],
    system: {
      facts: ['goals.approach = plan'],
      events: ['context_captured', 'turn_tools'],
      note: 'Only two tools exist on this turn. A product card cannot appear here because the stage does not offer the tool that draws one.',
    },
    claim: 'synthetic',
    source: '§6 Stage 2; opening.json turn 2',
  },
  {
    id: 'discovery',
    stage: 3,
    engineStage: 'discovering',
    channel: 'web',
    title: 'Married in May, a baby in June',
    lines: [
      {
        actor: 'aoife',
        text: "We got married in May and had a baby in June, so it is all happening at once. We have €32,000 put by and we can save about €1,200 a month. I am on 92k and Emma is on about 58.",
      },
      {
        actor: 'baz',
        text: 'Congratulations, twice over. Two things shape the plan from here: would you want the mortgage with us, and do you and Emma bank together at the moment?',
      },
    ],
    cards: [],
    system: {
      facts: [
        'identity.maritalStatus = married',
        'lifeEvent.recentlyMarried = true',
        'lifeEvent.newChild = true',
        'household.dependantCount = 1',
        'assets.savingsBalance = 32000',
        'goals.monthlySaving = 1200',
        'income.annualBasic = 92000 (primary)',
        'income.partnerAnnualStated = 58000 (household)',
      ],
      events: ['context_captured', 'goal_identified'],
      note: "Emma's salary is recorded as something Aoife said about the household. It never satisfies a requirement about Emma: the subject on a fact decides whose question it answers.",
    },
    claim: 'synthetic',
    source: '§6 Stages 2 and 3, §9',
  },
  {
    id: 'plan',
    stage: 3,
    engineStage: 'planning',
    channel: 'web',
    title: 'A plan, kept with a tap',
    lines: [
      {
        actor: 'aoife',
        text: 'Yes, the mortgage here, and we should probably bank together. We are hoping to buy by next June.',
      },
      {
        actor: 'baz',
        text: 'Then here is the shape of it. The deposit comes first, the mortgage and the protection sit behind it, and a joint account makes the saving easier to see.',
      },
    ],
    cards: [
      { card: PLAN_CARD, settled: { label: PLAN_CARD.title, note: 'Saved. You can change or stop it any time.' } },
    ],
    system: {
      facts: [
        'mortgage.withThisBank = true',
        'household.financesManagedJointly = false',
        'goals.targetDate = 2027-06-01',
        'goals.savingsTarget = 40000',
      ],
      events: ['context_captured', 'plan_proposal'],
      note: 'The milestones and the check-in are the plan engine’s, drafted for this goal. Nothing is kept until the tap: the card is a proposal and the tap is the commitment.',
    },
    claim: 'synthetic',
    source: '§6 Stage 3, §10; planDraftFor(buy_first_home)',
  },
  {
    id: 'sign-in',
    stage: 4,
    engineStage: 'arranging',
    channel: 'web',
    title: 'From a browser tab to the phone',
    lines: [
      {
        actor: 'aoife',
        text: 'I was here before, actually. I bank with you already, so can you use what you have on me?',
      },
      {
        actor: 'baz',
        text: 'I can, once you sign in. Everything we have done so far comes with you, on this phone or any other.',
      },
    ],
    cards: [
      {
        card: signInPromptCard(PRIVACY_HREF),
        settled: { label: 'Signed in', note: 'This conversation is saved, and it will be here on another device.' },
      },
    ],
    system: {
      events: ['sign_in_offered'],
      note: 'The server, not the model, decides when to offer a sign-in: when something exists that is worth keeping, or when the customer says they have been here before. It is a simulated sign-in that accepts anything and says so. The new session attaches to the same participant and the case is linked to the synthetic bank record.',
    },
    claim: 'synthetic',
    source: '§6 Stage 4, §28, §29; soundsLikeReturning()',
  },
  {
    id: 'enrichment',
    stage: 5,
    engineStage: 'arranging',
    channel: 'app',
    title: 'What the bank already knew',
    lines: [
      {
        actor: 'baz',
        text: 'Signed in, so I have what the bank holds: your name, address, PPS number, employer and salary. One thing to check: it still has you down as single.',
      },
      { actor: 'aoife', text: 'Married since May, as I said.' },
      { actor: 'baz', text: 'Then your word wins over the old record, and both stay on file.' },
    ],
    cards: [],
    system: {
      facts: [
        '14 bank-held facts loaded: name, date of birth, address, PPS number, employer, income and more',
        'identity.maritalStatus: bank-held "single" superseded by stated "married"',
      ],
      events: ['context_captured'],
      note: 'Bank-held facts are not asked for again unless a journey says confirm or fresh. Income is held but unverified, so the mortgage will still ask Aoife to confirm it. The provenance of every fact stays on record and shows in the console.',
    },
    claim: 'synthetic',
    source: '§6 Stage 5, §10, §11',
  },
  {
    id: 'arrangement',
    stage: 6,
    engineStage: 'arranging',
    channel: 'app',
    title: 'The money, arranged before the menu',
    lines: [
      {
        actor: 'baz',
        text: 'Before the accounts, the split. The lump sum goes where it earns most and still comes back in time, €200 a month is exactly what the bonus costs, and the rest goes where the rate is best.',
      },
    ],
    cards: [{ card: ARRANGEMENT_CARD }],
    system: {
      events: ['turn_tools'],
      note: 'The split is the savings engine\u2019s arithmetic on published rates, worked out by the server from the facts held; the model passes nothing. One tap would start every account on it. Aoife leaves it on screen and asks for the rest first.',
    },
    claim: 'synthetic',
    source: '§6 Stage 6, §40; arrange() over the published savings options',
  },
  {
    id: 'selection',
    stage: 6,
    engineStage: 'choosing',
    channel: 'app',
    title: 'The customer chooses',
    lines: [
      { actor: 'aoife', text: 'Show me the rest first.' },
      {
        actor: 'baz',
        text: 'These are what a first home with a new baby usually involves. Tick the ones you want to start; nothing begins until you do.',
      },
    ],
    cards: [
      {
        card: OPTIONS_CARD,
        settled: {
          label: `Started ${[NAME.mortgage, NAME.joint_account, NAME.credit_card, NAME.personal_loan].join(' and ')}`,
          note: 'They are all in your list, and you can pick any of them up whenever you like.',
        },
      },
    ],
    system: {
      events: ['product_offered ×5', 'application_created ×4'],
      note: 'Four applications, started by one tap through case-action. Protection is left on the card for later rather than declined, so Baz may raise it again. Each reason is tied to something Aoife said.',
    },
    claim: 'synthetic',
    source: '§6 Stage 6, §49',
  },
  {
    id: 'reuse',
    stage: 7,
    engineStage: 'applying',
    channel: 'app',
    title: 'Collected once, used four times',
    lines: [
      {
        actor: 'baz',
        text: 'Both are started, and the first thing either needs is a few personal details. I already have your email from signing in, so that is one thing I will not ask for.',
        quoted: REUSE_FIXTURE,
      },
    ],
    cards: [{ card: REUSE_CARD }, { card: STATUS_AT_START }],
    system: {
      reused: REUSED_ROWS,
      events: [`context_reused ×${String(REUSED_ROWS)}`],
      note: 'One event per requirement per application, written when the applications started. The card groups them by fact, so income reused by three applications is one thing Aoife did not have to say. The status beside it renders from the database, whatever Baz wrote.',
    },
    claim: 'synthetic',
    source: '§6 Stage 7, §53; reuse.json',
  },
  {
    id: 'rates',
    stage: 7,
    engineStage: 'applying',
    channel: 'app',
    title: 'A published table, not a guess',
    lines: [
      {
        actor: 'aoife',
        text: 'The house is about €400,000, so we would be borrowing around €360,000. It is a B rating, and we would want it over 30 years.',
      },
      {
        actor: 'baz',
        text: 'Those are the four things the published table is indexed by, so here is what it says for you.',
      },
    ],
    cards: [{ card: RATES_CARD }],
    system: {
      facts: [
        'housing.purchasePrice = 400000',
        'mortgage.amountSought = 360000',
        'mortgage.termYears = 30',
        'mortgage.customerType = first_time_buyer',
      ],
      events: ['turn_tools'],
      note: 'The tool refuses until all four criteria are known, so Baz has to ask rather than quote a range. The server chooses which rows this customer may see and computes every repayment.',
    },
    claim: 'synthetic',
    source: '§6 Stage 7, §51; selectRates() over the published rate table',
  },
  {
    id: 'review',
    stage: 8,
    engineStage: 'applying',
    channel: 'app',
    title: 'Nothing is submitted silently',
    lines: [
      {
        actor: 'baz',
        text: 'The credit card has everything it needs, all of it from what the bank already held. Check it over; the tap is what sends it.',
      },
    ],
    cards: [{ card: REVIEW_CARD, settled: { label: 'Submitted', note: 'Nothing else is needed from you for now.' } }],
    system: {
      transitions: ['Credit card: in_progress → ready → submitted'],
      events: ['requirements_changed', 'submission_confirmed', 'application_submitted'],
      note: 'The review is built from the case, not from model text. Income was bank-held but unverified, so the journey asks Aoife to confirm it rather than assume it. Submit stays disabled until every confirmation is ticked.',
    },
    claim: 'synthetic',
    source: '§6 Stage 8, §48',
  },
  {
    id: 'pause',
    stage: 8,
    engineStage: 'applying',
    channel: 'app',
    title: 'The loan is deliberately held',
    lines: [{ actor: 'baz', text: 'Before the loan goes any further, one thing you should know.' }],
    cards: [{ card: PAUSE_CARD, settled: { label: 'On hold', note: 'Nothing happens on it until you say so.' } }],
    system: {
      transitions: ['Personal loan: in_progress → paused (resumes to in_progress)'],
      events: ['application_state_changed'],
      note: 'The advisory is a deterministic rule: a loan still open beside an active mortgage. Baz may explain it and may not invent it. The customer decides in the card.',
    },
    claim: 'synthetic',
    source: '§6 Stage 8; evaluateAdvisories()',
  },
  {
    id: 'invite',
    stage: 9,
    engineStage: 'applying',
    channel: 'app',
    title: 'Emma is needed on two of these',
    lines: [
      {
        actor: 'baz',
        text: 'The mortgage and the joint account both need Emma. Send her this link and she can do her part from her own phone, whenever suits.',
      },
    ],
    cards: [{ card: INVITE_CARD }],
    system: {
      events: ['partner_invited'],
      note: 'The link carries a 128-bit token stored hashed. It does not expire and is not used up, because a second applicant opens it when they get to it; inviting again voids the earlier links for anyone who has not joined.',
    },
    claim: 'synthetic',
    source: '§6 Stage 9, §33, Invariant 8',
  },
  {
    id: 'partner',
    stage: 9,
    channel: 'partner',
    title: 'One answer, two applications',
    lines: [],
    cards: [{ card: STATUS_AFTER_PARTNER }],
    tasks: [
      { label: 'Your full name', on: 'Mortgage, Joint current account' },
      { label: 'Your date of birth', on: 'Mortgage, Joint current account' },
      { label: 'Your PPS number', on: 'Mortgage, Joint current account' },
      { label: 'Your employment status', on: 'Mortgage, Joint current account' },
      { label: 'Your annual basic salary', on: 'Mortgage' },
      { label: 'Your photo ID', on: 'Joint current account' },
      { label: 'Mortgage application declaration', on: 'Mortgage' },
      { label: 'Joint account terms and conditions', on: 'Joint current account' },
    ],
    system: {
      facts: ['income.annualBasic = 58000 (partner)', 'employment.status = employed_full_time (partner)'],
      events: ['partner_joined', 'partner_completed'],
      note: "Emma sees her own tasks and the names and states of the applications she is party to. Never Aoife's conversation, never Aoife's facts. One answer about her income satisfies a requirement in both applications, and Aoife's screen updates over Realtime.",
    },
    claim: 'synthetic',
    source: '§6 Stage 9, §33, Invariant 7',
  },
  {
    id: 'leaves',
    stage: 10,
    engineStage: 'applying',
    channel: 'app',
    title: 'Aoife leaves',
    lines: [
      { actor: 'aoife', text: 'That is enough for today.' },
      {
        actor: 'baz',
        text: 'Everything is saved where it is. If something moves while you are away, I can let you know.',
      },
    ],
    cards: [],
    system: {
      events: ['push_subscribed'],
      note: 'Nothing is lost when the app closes: the case, the facts and the open cards persist. "Tell me when this moves" is offered under the status card, where it is a sensible question, and registers this phone for Web Push.',
    },
    claim: 'synthetic',
    source: '§6 Stage 10, §35',
  },
  {
    id: 'bank-moves',
    stage: 11,
    channel: 'console',
    title: 'The bank moves',
    lines: [],
    cards: [],
    console: ['Credit card: received by bank', 'Credit card: assessment approved'],
    system: {
      transitions: ['Credit card: submitted → under_review → approved'],
      events: ['application_state_changed ×2', 'application_approved'],
      note: 'The console offers only the transitions the state machine will accept, and every press is one of them. No random timers, and no model anywhere near a state change.',
    },
    claim: 'poc',
    source: '§6 Stages 10 and 11, §41, §54',
  },
  {
    id: 'notification',
    stage: 12,
    channel: 'lockscreen',
    title: 'A notification that says nothing',
    lines: [],
    cards: [],
    notification: NOTIFICATION,
    system: {
      events: ['notification_sent'],
      note: 'Sending is a separate, explicit act from the event. The copy carries nothing about the application, because a lock screen is read by whoever is holding the phone. The link carries a single-use token with a short life.',
    },
    claim: 'poc',
    source: '§6 Stage 12, §35; the admin function’s fixed copy',
  },
  {
    id: 'return',
    stage: 13,
    engineStage: 'applying',
    channel: 'app',
    title: 'Baz knows exactly what changed',
    lines: [
      {
        actor: 'baz',
        text: 'Welcome back, Aoife. Since you were last here:\n- Credit card was approved.\n- Emma finished her part of the mortgage and the joint account.\nThe joint account only needs your tap on the terms now, and the mortgage is waiting on your payslip and photo ID.',
      },
    ],
    cards: [{ card: STATUS_ON_RETURN }],
    system: {
      events: ['turn_tools'],
      note: 'The turn runs with a return trigger and the digest carries every event since last_seen_at, each already described in a fixed sentence. Baz phrases the summary; the status card beside it renders from the database.',
    },
    claim: 'synthetic',
    source: '§6 Stage 13, §36; describeEvent()',
  },
]
