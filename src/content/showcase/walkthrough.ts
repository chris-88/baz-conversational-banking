import { CONSENT_SCOPE, LINKABLE_BANKS, type Card } from '@contracts/cards.ts'
import { dataNoticeCard } from '@llm/data-notice.ts'
import { signInPromptCard } from '@llm/sign-in-prompt.ts'
import type { FactReader } from '@domain/journey.ts'
import { stateLabel, type ApplicationState } from '@domain/state-machine.ts'
import { CONSENT_DAYS, maskIban, synthesiseAccounts } from '@domain/open-banking/synthesise.ts'
import { summariseAccounts } from '@domain/open-banking/summarise.ts'
import {
  ARRANGEMENT_CARD,
  OPTIONS_CARD,
  PLAN_CARD,
  REUSE_CARD,
  STATUS_AT_START,
} from '@/content/how-it-works/story'
import { showcaseConfig } from './config'
import type { TranscriptEvent } from './types'

/**
 * What happens on the phone during the walkthrough.
 *
 * The savings story: the deposit is at another bank, Baz reads it through open banking,
 * puts it to work across three accounts from the savings engine's arithmetic, moves it
 * across, and comes back months later when the balance reaches the target to start the
 * mortgage the customer came in for. The cards are the product's, typed against the
 * contract and checked by the tests beside this file; the open banking figures are the
 * engine's own output over this customer's facts. Nothing here was processed by a model
 * and the chapter says so.
 *
 * Times are chapter-local milliseconds, provisional until the narration is mastered, and
 * retiming is a matter of changing numbers in this file.
 */

/** Ids shaped as the contracts demand, identifying nothing. */
export const SHOWCASE_IDS = {
  advantage: 'c2a7f6e8-1b3d-4e9a-8f0c-6d7e8f9a0b12',
  mortgageSaver: 'd3b8a7f9-2c4e-4f0b-9a1d-7e8f9a0b1c23',
  superSaver: 'e4c9b8a0-3d5f-4a1c-8b2e-8f9a0b1c2d34',
  aibCurrent: 'f5d0c9b1-4e6a-4b2d-9c3f-9a0b1c2d3e45',
  aibSavings: 'a6e1d0c2-5f7b-4c3e-8d4a-0b1c2d3e4f56',
} as const

/** The customer's facts by the time the AIB accounts are linked, for the synthesis engine. */
const FACTS: Readonly<Record<string, unknown>> = {
  'income.annualBasic': 92_000,
  'employment.employerName': 'Ardán Software Limited',
  'expenditure.monthlyRent': 1_800,
  'goals.monthlySaving': 1_200,
  'assets.savingsBalance': 32_000,
}

const reader: FactReader = {
  has: (key) => key in FACTS,
  get: (key) => FACTS[key],
  number: (key) => (typeof FACTS[key] === 'number' ? FACTS[key] : null),
  boolean: (key) => (typeof FACTS[key] === 'boolean' ? FACTS[key] : null),
}

/** The statement's last day. Fixed, so the same picture plays on every rehearsal. */
const LINKED_ON = '2026-10-29'

const generated = synthesiseAccounts({
  bank: 'aib',
  bankName: 'AIB',
  facts: reader,
  today: LINKED_ON,
  seed: 'showcase',
})
const summary = summariseAccounts(generated.accounts, generated.transactions, LINKED_ON)

const accountId = (ref: 'current' | 'savings'): string =>
  ref === 'current' ? SHOWCASE_IDS.aibCurrent : SHOWCASE_IDS.aibSavings

/** The consent, as the product draws it: every bank it can link, the full scope, ninety days. */
export const CONNECT_CARD: Card = {
  type: 'connect_accounts',
  why: 'So I can see the deposit where it is, rather than ask you for statements.',
  banks: [...LINKABLE_BANKS],
  scope: [...CONSENT_SCOPE],
  consentDays: CONSENT_DAYS,
}

/** What Nexus returned, summarised by the server: the engine's output over the facts above. */
export const OVERVIEW_CARD: Card = {
  type: 'accounts_overview',
  asOf: `${LINKED_ON}T09:00:00Z`,
  accounts: generated.accounts.map((account) => ({
    id: accountId(account.ref),
    bank: 'AIB',
    displayName: account.displayName,
    accountType: account.accountType,
    ibanMasked: maskIban(account.iban),
    balance: account.balance,
  })),
  month: summary.month,
  salary: summary.salary,
  regular: [...summary.regular],
  savingsHeld: summary.savingsHeld,
}

const ACCOUNT_NAMES =
  ARRANGEMENT_CARD.type === 'arrangement'
    ? ARRANGEMENT_CARD.allocations.map((allocation) => allocation.name)
    : []
const ADVANTAGE = ACCOUNT_NAMES[0] ?? 'Advantage Fixed Term Deposit Account'

/**
 * The arrangement, cut to the phone's screen: each account keeps its amount, rate and job,
 * which are the engine's, and loses its "watch" lines and the bonus's conditions, which are
 * there for the customer to read in their own time and are not for a room.
 */
export const SHOWCASE_ARRANGEMENT_CARD: Card =
  ARRANGEMENT_CARD.type === 'arrangement'
    ? {
        ...ARRANGEMENT_CARD,
        allocations: ARRANGEMENT_CARD.allocations.map((allocation) => ({
          ...allocation,
          watch: [],
        })),
        bonus:
          ARRANGEMENT_CARD.bonus === null
            ? null
            : {
                ...ARRANGEMENT_CARD.bonus,
                conditions: [ARRANGEMENT_CARD.bonus.conditions[0] ?? 'Conditions apply.'],
              },
      }
    : ARRANGEMENT_CARD

/** What the arrangement settles to the moment it is tapped: the product's own wording. */
export const ARRANGEMENT_SETTLED = {
  label: `Started ${ACCOUNT_NAMES.join(', ')}`,
  note: 'All of them are in your list, each doing its own job.',
} as const

/**
 * What the savings accounts never had to ask for: the four identity facts the bank held,
 * and the two goal facts the conversation captured, each used by all three accounts. The
 * savings journey is short by design, so six is the honest count.
 */
export const SHOWCASE_REUSE_CARD: Card = (() => {
  if (REUSE_CARD.type !== 'reuse') return REUSE_CARD
  const byKey = new Map(REUSE_CARD.items.map((item) => [item.key, item]))
  const said = REUSE_CARD.items.find((item) => item.source === 'customer_stated')
  const held = ['identity.fullName', 'identity.dateOfBirth', 'identity.address', 'identity.ppsn']
    .map((key) => byKey.get(key))
    .filter((item) => item !== undefined)
    .map((item) => ({ ...item, usedFor: [...ACCOUNT_NAMES] }))
  const goals = [
    { key: 'goals.savingsTarget', label: 'What you are saving towards', value: '€40,000' },
    { key: 'goals.monthlySaving', label: 'How much you can put away each month', value: '€1,200' },
  ].map((item) => ({
    ...item,
    source: 'customer_stated',
    provenance: said?.provenance ?? 'you told me earlier',
    usedFor: [...ACCOUNT_NAMES],
  }))
  const items = [...held, ...goals]
  return {
    type: 'reuse',
    title: `${String(items.length)} things you never had to type`,
    started: [...ACCOUNT_NAMES],
    items,
  }
})()

/** The SuperSaver form's own declarations, page 42 of `form-1833.json`, in its published wording. */
export const FORM_DECLARATIONS_CARD: Card = {
  type: 'form_declarations',
  applicationId: SHOWCASE_IDS.superSaver,
  formName: 'SuperSaver application',
  declarations: [
    {
      fieldId: '1078',
      wording: 'I confirm that I have read and understood the Deposit Guarantee Scheme.',
    },
    {
      fieldId: '1079',
      wording:
        "By tapping 'Submit', you are asking the Bank to open a SuperSaver account for you and you agree that the terms and conditions will bind you and the Bank.",
    },
  ],
}

/** The savings journey's requirements, as the status card lists them. */
const SAVINGS_STEPS = [
  'Your full name',
  'Your date of birth',
  'Your home address',
  'Your PPS number',
  'What you are saving towards',
  'How much you can put away each month',
  'Savings account declaration',
] as const

type StatusApplication = Extract<Card, { type: 'status' }>['applications'][number]

function savingsRow(
  id: string,
  displayName: string,
  state: ApplicationState,
  declared: boolean,
): StatusApplication {
  const steps = SAVINGS_STEPS.map((label) => ({
    label,
    done: label !== 'Savings account declaration' || declared,
    waitingOnPartner: false,
  }))
  return {
    id,
    product: 'savings',
    displayName,
    state,
    stateLabel: stateLabel(state),
    outstandingCount: steps.filter((step) => !step.done).length,
    waitingOn: null,
    steps,
  }
}

const SAVINGS_IDS = [
  SHOWCASE_IDS.advantage,
  SHOWCASE_IDS.mortgageSaver,
  SHOWCASE_IDS.superSaver,
] as const

const savingsRows = (state: ApplicationState, declared: boolean): StatusApplication[] =>
  SAVINGS_IDS.map((id, index) =>
    savingsRow(id, ACCOUNT_NAMES[index] ?? 'Savings account', state, declared),
  )

/** The three accounts the moment they start: everything known, the declaration still to make. */
export const STATUS_STARTED_CARD: Card = {
  type: 'status',
  applications: savingsRows('in_progress', false),
}

/** After the bank moved: the fixed term open with the money in it, the other two with the bank. */
export const STATUS_OPENED_CARD: Card = {
  type: 'status',
  applications: [
    savingsRow(SHOWCASE_IDS.advantage, ADVANTAGE, 'completed', true),
    ...savingsRows('submitted', true).slice(1),
  ],
}

/** How many outstanding steps an application shows: the card lists what is left, and three say enough. */
const STEPS_SHOWN = 3

/** Months later: the mortgage started on what is already known, beside the three accounts. */
export const STATUS_MORTGAGE_CARD: Card = (() => {
  const mortgage =
    STATUS_AT_START.type === 'status'
      ? STATUS_AT_START.applications.find((application) => application.product === 'mortgage')
      : undefined
  if (mortgage === undefined) return STATUS_OPENED_CARD
  const done = mortgage.steps.filter((step) => step.done)
  const left = mortgage.steps.filter((step) => !step.done).slice(0, STEPS_SHOWN)
  return {
    type: 'status',
    applications: [
      { ...mortgage, steps: [...done, ...left], outstandingCount: left.length },
      savingsRow(SHOWCASE_IDS.advantage, ADVANTAGE, 'completed', true),
    ],
  }
})()

/**
 * The deposit, moved: from the linked AIB savings account into the current account she
 * already holds here, which is what the product offers an existing customer
 * (`existing_account_here`). The fixed-term account has no number until it opens, so the
 * money comes to the bank first; the voice says exactly that.
 */
export const TRANSFER_CARD: Card = {
  type: 'transfer',
  fromAccountId: SHOWCASE_IDS.aibSavings,
  fromLabel: `AIB ${generated.accounts.find((account) => account.ref === 'savings')?.displayName ?? 'Savings Account'}`,
  toApplicationId: null,
  toLabel: 'Your Bank of Ireland current account',
  amount: 32_000,
  cadence: 'once',
  why: 'It is the deposit. Once it is here I can watch it grow.',
}

/** The mortgage alone, offered when the deposit is there. */
export const MORTGAGE_OPTION_CARD: Card =
  OPTIONS_CARD.type === 'product_options'
    ? {
        ...OPTIONS_CARD,
        options: OPTIONS_CARD.options.filter((option) => option.product === 'mortgage'),
      }
    : OPTIONS_CARD

/** Four of the plan's ten milestones, the ones that name an outcome rather than a stage. */
export const SHOWCASE_PLAN_CARD: Card =
  PLAN_CARD.type === 'plan_proposal'
    ? {
        ...PLAN_CARD,
        milestones: PLAN_CARD.milestones.filter((milestone) =>
          [
            'Deposit target reached',
            'Mortgage approved',
            'Mortgage protection in place',
            'Home purchase completed',
          ].some((label) => milestone.label.startsWith(label)),
        ),
      }
    : PLAN_CARD

const PRIVACY_HREF = '#/privacy'

/* Settled labels are the product's, from `cardState.ts settledState()` and `settledTransfer()`,
   which cannot be imported here because that module reaches for Supabase. */
export const WALKTHROUGH_EVENTS: readonly TranscriptEvent[] = [
  /* arrive: 0–22 s */
  {
    kind: 'customer',
    id: 'c-open',
    typeFromMs: 900,
    atMs: 2_700,
    text: showcaseConfig.examplePrompt,
  },
  {
    kind: 'baz',
    id: 'b-open',
    thinkingFromMs: 2_700,
    atMs: 4_300,
    text: 'Congratulations, twice over. That is a lot at once, and most of it connects: a deposit, a mortgage, protection now there is a child, maybe a joint account. Before any of that, how are your finances arranged between you at the moment?',
  },
  { kind: 'card', id: 'k-notice', atMs: 5_100, card: dataNoticeCard(PRIVACY_HREF) },
  {
    kind: 'customer',
    id: 'c-finances',
    typeFromMs: 8_500,
    atMs: 10_300,
    text: 'Still separate, mostly. We have €32,000 put by in a savings account with AIB, and we can save about €1,200 a month. I’m on 92k and Emma is on about 58.',
  },
  {
    kind: 'baz',
    id: 'b-finances',
    thinkingFromMs: 10_300,
    atMs: 11_600,
    text: 'Then the plan starts from the deposit. Are you hoping to buy by a particular time, and would you want the mortgage with us?',
  },
  {
    kind: 'customer',
    id: 'c-june',
    typeFromMs: 13_200,
    atMs: 14_400,
    text: 'By next June, and yes, the mortgage here.',
  },

  /* understand: 22–47 s */
  {
    kind: 'baz',
    id: 'b-shape',
    thinkingFromMs: 14_400,
    atMs: 20_900,
    text: 'Then here is the shape of it. The deposit comes first, the mortgage and the protection sit behind it, and a joint account makes the saving easier to see.',
  },
  {
    kind: 'card',
    id: 'k-plan',
    atMs: 22_500,
    card: SHOWCASE_PLAN_CARD,
    settleAtMs: 30_500,
    settled: {
      label: PLAN_CARD.type === 'plan_proposal' ? PLAN_CARD.title : 'Plan kept',
      note: 'Saved. You can change or stop it any time.',
    },
  },
  {
    kind: 'baz',
    id: 'b-kept',
    thinkingFromMs: 30_800,
    atMs: 32_000,
    text: 'Kept. Everything you have told me is on file once, with where it came from, and I will not ask for any of it again.',
  },

  /* link: 47–77 s */
  { kind: 'cut', id: 'x-link', atMs: 38_700 },
  {
    kind: 'baz',
    id: 'b-link',
    thinkingFromMs: 38_700,
    atMs: 40_300,
    text: 'The €32,000 is with AIB, so let me see it rather than ask you for statements. You choose the bank and what I can see, and it runs for ninety days.',
  },
  {
    kind: 'card',
    id: 'k-connect',
    atMs: 41_900,
    card: CONNECT_CARD,
    settleAtMs: 52_000,
    settled: {
      label: 'Linked AIB',
      note: `Shared through Nexus for ${String(CONSENT_DAYS)} days. Stop it any time from the menu.`,
    },
  },
  {
    kind: 'baz',
    id: 'b-seen',
    thinkingFromMs: 52_300,
    atMs: 53_300,
    text: 'Thanks. Here is what I can see: your salary landing, the rent going out, and the €32,000 in savings.',
  },
  { kind: 'card', id: 'k-overview', atMs: 54_000, card: OVERVIEW_CARD },

  /* arrange: 77–105 s */
  { kind: 'cut', id: 'x-arrange', atMs: 61_000 },
  {
    kind: 'baz',
    id: 'b-arrange',
    thinkingFromMs: 61_000,
    atMs: 62_500,
    text: 'Before any accounts, the split. The lump sum goes where it earns most and still comes back before June. €200 a month is exactly what the MortgageSaver bonus costs. The rest goes where the rate is best.',
  },
  {
    kind: 'card',
    id: 'k-arrangement',
    atMs: 64_500,
    card: SHOWCASE_ARRANGEMENT_CARD,
    settleAtMs: 80_300,
    settled: ARRANGEMENT_SETTLED,
  },
  {
    kind: 'baz',
    id: 'b-started',
    thinkingFromMs: 80_700,
    atMs: 82_300,
    text: 'Three accounts started. To open them I need you signed in, so what the bank already holds can do the typing.',
  },

  /* authenticate: 105–135 s */
  { kind: 'cut', id: 'x-auth', atMs: 85_100 },
  {
    kind: 'card',
    id: 'k-signin',
    atMs: 86_400,
    card: signInPromptCard(PRIVACY_HREF),
    settleAtMs: 91_000,
    settled: {
      label: 'Signed in',
      note: 'This conversation is saved, and it will be here on another device.',
    },
  },
  {
    kind: 'baz',
    id: 'b-held',
    thinkingFromMs: 91_200,
    atMs: 91_800,
    text: 'Signed in, so I have your name, date of birth, address and PPS number from the bank, and the target and the monthly amount from you. Here is what that saved.',
  },
  { kind: 'card', id: 'k-reuse', atMs: 93_000, card: SHOWCASE_REUSE_CARD },
  { kind: 'cut', id: 'x-form', atMs: 96_400 },
  {
    kind: 'baz',
    id: 'b-form',
    thinkingFromMs: 96_400,
    atMs: 97_800,
    text: 'SuperSaver uses the bank’s own published form. I have read it and filled in what I know. These are its declarations, in its words.',
  },
  {
    kind: 'card',
    id: 'k-declarations',
    atMs: 100_000,
    card: FORM_DECLARATIONS_CARD,
    settleAtMs: 107_000,
    settled: { label: 'Confirmed', note: 'Recorded in the words the form uses.' },
  },

  /* move: 135–168 s */
  { kind: 'cut', id: 'x-move', atMs: 108_900 },
  {
    kind: 'baz',
    id: 'b-move',
    thinkingFromMs: 108_900,
    atMs: 109_800,
    text: 'The €32,000 is still in AIB. I can move it to your current account here now, through the same access. Once it is here I can watch the balance without needing the AIB access again, and when it reaches €40,000 I will come back to you about the mortgage.',
  },
  {
    kind: 'card',
    id: 'k-transfer',
    atMs: 111_400,
    card: TRANSFER_CARD,
    /* Live for the whole of "authorises a transfer and the money moves ... here", so the room reads the PSD2 strip. */
    settleAtMs: 115_600,
    settled: {
      label: '€32,000 on its way to Your Bank of Ireland current account',
      note: 'Instructed through Nexus under PSD2. Baz will say when it lands.',
    },
  },
  {
    kind: 'cutaway',
    id: 'w-act',
    atMs: 123_600,
    untilMs: 127_600,
    view: { kind: 'admin', screen: 'act' },
  },
  {
    kind: 'baz',
    id: 'b-opened',
    thinkingFromMs: 127_600,
    atMs: 128_300,
    text: `Welcome back. Two things happened while you were away. Your ${ADVANTAGE} is open, and €32,000 from AIB arrived in your current account here.`,
  },
  { kind: 'card', id: 'k-status-opened', atMs: 129_500, card: STATUS_OPENED_CARD },

  /* later: 168–200 s */
  { kind: 'cut', id: 'x-later', atMs: 130_500 },
  {
    kind: 'cutaway',
    id: 'w-goals',
    atMs: 130_900,
    untilMs: 138_900,
    view: { kind: 'admin', screen: 'goals' },
  },
  {
    kind: 'cutaway',
    id: 'w-notification',
    atMs: 138_900,
    untilMs: 143_300,
    view: { kind: 'notification' },
  },
  {
    kind: 'baz',
    id: 'b-back',
    thinkingFromMs: 143_300,
    atMs: 144_000,
    text: 'Welcome back. Your savings reached €40,000, the amount you were building towards. That is the deposit, so it is time for the conversation you came in for. Shall we start the mortgage?',
  },
  {
    kind: 'card',
    id: 'k-mortgage',
    atMs: 147_000,
    card: MORTGAGE_OPTION_CARD,
    settleAtMs: 150_500,
    settled: { label: 'Started Mortgage', note: 'Everything you have told me is already in it.' },
  },
  { kind: 'card', id: 'k-status-mortgage', atMs: 152_000, card: STATUS_MORTGAGE_CARD },

  /* govern: 200–225 s */
  {
    kind: 'cutaway',
    id: 'w-cases',
    atMs: 154_600,
    untilMs: 159_200,
    view: { kind: 'admin', screen: 'cases' },
  },
  {
    kind: 'cutaway',
    id: 'w-case',
    atMs: 159_200,
    untilMs: 162_600,
    view: { kind: 'admin', screen: 'case' },
  },
  {
    kind: 'cutaway',
    id: 'w-guardrails',
    atMs: 162_600,
    untilMs: 165_500,
    view: { kind: 'admin', screen: 'guardrails' },
  },
  {
    kind: 'cutaway',
    id: 'w-persona',
    atMs: 165_500,
    untilMs: 168_300,
    view: { kind: 'admin', screen: 'persona' },
  },
  {
    kind: 'cutaway',
    id: 'w-analytics',
    atMs: 168_300,
    untilMs: 174_400,
    view: { kind: 'admin', screen: 'analytics' },
  },
]
