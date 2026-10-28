import type { Card } from '@contracts/cards.ts'
import { dataNoticeCard } from '@llm/data-notice.ts'
import { signInPromptCard } from '@llm/sign-in-prompt.ts'
import {
  IDS,
  OPTIONS_CARD,
  PLAN_CARD,
  RATES_CARD,
  REUSE_CARD,
  STATUS_AT_START,
} from '@/content/how-it-works/story'
import { showcaseConfig } from './config'
import type { TranscriptEvent } from './types'

/**
 * What happens on the phone during the three-minute walkthrough.
 *
 * The cards are the explainer's, which are the product's: typed against the contract and
 * checked by the story tests against the engines that produce them. The lines are written for
 * this scenario, married in the spring, a baby, renting and hoping to buy, and kept close to
 * the fixtures the explainer quotes. Nothing here was processed by a model; the chapter says
 * so, and so does the synthetic customer.
 *
 * Times are chapter-local milliseconds. They are provisional until the walkthrough narration
 * is mastered, and retiming is a matter of changing numbers in this file.
 */

/** Ids shaped as the contracts demand, identifying nothing. */
export const SHOWCASE_IDS = {
  formApplication: 'c2a7f6e8-1b3d-4e9a-8f0c-6d7e8f9a0b12',
  uploadRequest: 'd3b8a7f9-2c4e-4f0b-9a1d-7e8f9a0b1c23',
} as const

const name = (product: string): string =>
  OPTIONS_CARD.type === 'product_options'
    ? (OPTIONS_CARD.options.find((option) => option.product === product)?.displayName ?? product)
    : product

/** The three needs the brief names, plus the loan the form chapter needs. */
export const SHOWCASE_OPTIONS_CARD: Card =
  OPTIONS_CARD.type === 'product_options'
    ? {
        ...OPTIONS_CARD,
        options: OPTIONS_CARD.options.filter((option) =>
          ['mortgage', 'joint_account', 'protection', 'personal_loan'].includes(option.product),
        ),
      }
    : OPTIONS_CARD

const STARTED = ['mortgage', 'joint_account', 'personal_loan'] as const
const STARTED_NAMES = STARTED.map(name)

/** The reuse card for the three applications this chapter starts. */
export const SHOWCASE_REUSE_CARD: Card =
  REUSE_CARD.type === 'reuse'
    ? (() => {
        const items = REUSE_CARD.items
          .map((item) => ({
            ...item,
            usedFor: item.usedFor.filter((product) => STARTED_NAMES.includes(product)),
          }))
          .filter((item) => item.usedFor.length > 0)
        return {
          ...REUSE_CARD,
          title: `${String(items.length)} things you never had to type`,
          started: STARTED_NAMES,
          items,
        }
      })()
    : REUSE_CARD

export const SHOWCASE_STATUS_CARD: Card =
  STATUS_AT_START.type === 'status'
    ? {
        ...STATUS_AT_START,
        applications: STATUS_AT_START.applications.filter((application) =>
          (STARTED as readonly string[]).includes(application.product),
        ),
      }
    : STATUS_AT_START

/**
 * The loan form's own declarations, page 48 of `form-1940.json`, in its published wording.
 *
 * Field ids are the definition's. The content test checks each wording against the snapshot,
 * so a form update cannot leave the showcase reciting words the bank no longer uses.
 */
export const FORM_DECLARATIONS_CARD: Card = {
  type: 'form_declarations',
  applicationId: IDS.personalLoan,
  formName: 'Personal loan application',
  declarations: [
    {
      fieldId: '49',
      wording:
        'I understand that the information provided here will be used to assess my application and, where relevant, will be reported to the Central Credit Register. I confirm that all the information given in this application is, to the best of my knowledge, accurate and up to date.',
    },
    {
      fieldId: '62',
      wording:
        'I consent (for the purpose of the Credit Reporting Act 2013) to Bank of Ireland conducting a credit reference check',
    },
    { fieldId: '50', wording: 'I confirm that I have read and understood the above' },
  ],
}

/** The form's first upload control: jpg, png, jpeg or pdf, two megabytes. */
export const FORM_UPLOAD_CARD: Card = {
  type: 'form_upload',
  applicationId: IDS.personalLoan,
  formApplicationId: SHOWCASE_IDS.formApplication,
  fieldId: '151',
  label: 'Your most recent payslip',
  formName: 'Personal loan application',
  acceptedExtensions: ['jpg', 'png', 'jpeg', 'pdf'],
  maxFileSizeMb: 2,
}

/** The mortgage journey's photo ID requirement, as `request_upload` would open it. */
export const UPLOAD_REQUEST_CARD: Card = {
  type: 'upload_request',
  requestId: SHOWCASE_IDS.uploadRequest,
  applicationId: IDS.mortgage,
  label: 'Photo ID',
  documentType: 'photo_id',
  applicationName: name('mortgage'),
}

const PRIVACY_HREF = '#/privacy'

/* Settled labels are the product's, from `cardState.ts settledState()`, which cannot be
   imported here because its module reaches for Supabase. */
export const WALKTHROUGH_EVENTS: readonly TranscriptEvent[] = [
  /* arrive: 0–25 s */
  { kind: 'customer', id: 'c-open', typeFromMs: 1_200, atMs: 3_800, text: showcaseConfig.examplePrompt },
  {
    kind: 'baz',
    id: 'b-open',
    thinkingFromMs: 3_800,
    atMs: 6_000,
    text: 'Congratulations, twice over. That is a lot at once, and most of it connects: a deposit, a mortgage, protection now there is a child, maybe a joint account. Before any of that, how are your finances arranged between you at the moment?',
  },
  { kind: 'card', id: 'k-notice', atMs: 7_200, card: dataNoticeCard(PRIVACY_HREF) },
  {
    kind: 'customer',
    id: 'c-finances',
    typeFromMs: 12_000,
    atMs: 14_800,
    text: 'Still separate, mostly. We have €32,000 put by and can save about €1,200 a month. I’m on 92k and Emma is on about 58.',
  },
  {
    kind: 'baz',
    id: 'b-finances',
    thinkingFromMs: 14_800,
    atMs: 17_000,
    text: 'Then the plan starts from the deposit. Would you want the mortgage with us, and are you hoping to buy by a particular time?',
  },
  {
    kind: 'customer',
    id: 'c-june',
    typeFromMs: 20_000,
    atMs: 22_200,
    text: 'Yes, the mortgage here. We’re hoping to buy by next June.',
  },

  /* understand: 25–50 s */
  {
    kind: 'baz',
    id: 'b-shape',
    thinkingFromMs: 22_200,
    atMs: 26_000,
    text: 'Then here is the shape of it. The deposit comes first, the mortgage and the protection sit behind it, and a joint account makes the saving easier to see.',
  },
  {
    kind: 'card',
    id: 'k-plan',
    atMs: 27_500,
    card: PLAN_CARD,
    settleAtMs: 36_000,
    settled: { label: PLAN_CARD.type === 'plan_proposal' ? PLAN_CARD.title : 'Plan kept', note: 'Saved. You can change or stop it any time.' },
  },
  {
    kind: 'baz',
    id: 'b-kept',
    thinkingFromMs: 36_500,
    atMs: 39_500,
    text: 'Kept. Everything you have told me so far is on file once, with where it came from, and I will not ask for any of it again.',
  },

  /* connect: 50–75 s */
  { kind: 'cut', id: 'x-connect', atMs: 50_000 },
  {
    kind: 'baz',
    id: 'b-options',
    thinkingFromMs: 50_000,
    atMs: 51_200,
    text: 'These are what a first home with a new baby usually involves. Tick the ones you want to start; nothing begins until you do.',
  },
  {
    kind: 'card',
    id: 'k-options',
    atMs: 52_500,
    card: SHOWCASE_OPTIONS_CARD,
    settleAtMs: 60_000,
    settled: {
      label: `Started ${STARTED_NAMES.join(' and ')}`,
      note: 'Protection is in your list for later, and you can pick it up whenever you like.',
    },
  },
  {
    kind: 'customer',
    id: 'c-house',
    typeFromMs: 61_500,
    atMs: 64_000,
    text: 'The house is about €400,000, so we’d borrow around €360,000. It’s a B rating and we’d want 30 years.',
  },
  {
    kind: 'baz',
    id: 'b-rates',
    thinkingFromMs: 64_000,
    atMs: 66_200,
    text: 'Those are the four things the published table is indexed by, so here is what it says for you. Indicative, from the table, not advice.',
  },
  { kind: 'card', id: 'k-rates', atMs: 67_200, card: RATES_CARD },

  /* authenticate: 75–100 s */
  { kind: 'cut', id: 'x-auth', atMs: 75_000 },
  {
    kind: 'customer',
    id: 'c-bank',
    typeFromMs: 75_800,
    atMs: 78_000,
    text: 'I bank with you already. Can you use what you have on me?',
  },
  {
    kind: 'baz',
    id: 'b-signin',
    thinkingFromMs: 78_000,
    atMs: 80_000,
    text: 'I can, once you sign in. Everything we have done so far comes with you, on this phone or any other.',
  },
  {
    kind: 'card',
    id: 'k-signin',
    atMs: 81_000,
    card: signInPromptCard(PRIVACY_HREF),
    settleAtMs: 88_000,
    settled: { label: 'Signed in', note: 'This conversation is saved, and it will be here on another device.' },
  },
  {
    kind: 'baz',
    id: 'b-held',
    thinkingFromMs: 88_500,
    atMs: 90_500,
    text: 'Signed in, so I have what the bank holds: your name, address, PPS number, employer and salary. Here is what that saves you.',
  },
  { kind: 'card', id: 'k-reuse', atMs: 92_000, card: SHOWCASE_REUSE_CARD },

  /* machinery: 100–130 s */
  { kind: 'cut', id: 'x-forms', atMs: 100_000 },
  {
    kind: 'baz',
    id: 'b-form',
    thinkingFromMs: 100_000,
    atMs: 101_500,
    text: 'The personal loan uses the bank’s own published form. I have read it and filled in what I already know. These are its declarations, in its words.',
  },
  {
    kind: 'card',
    id: 'k-declarations',
    atMs: 103_000,
    card: FORM_DECLARATIONS_CARD,
    settleAtMs: 111_000,
    settled: { label: 'Confirmed', note: 'Recorded in the words the form uses.' },
  },
  {
    kind: 'baz',
    id: 'b-payslip',
    thinkingFromMs: 111_500,
    atMs: 113_000,
    text: 'It also asks for a recent payslip. A photo is fine.',
  },
  {
    kind: 'card',
    id: 'k-payslip',
    atMs: 114_000,
    card: FORM_UPLOAD_CARD,
    settleAtMs: 121_000,
    settled: { label: 'Attached', note: 'Held against this application.' },
  },
  {
    kind: 'baz',
    id: 'b-id',
    thinkingFromMs: 121_500,
    atMs: 122_800,
    text: 'The mortgage needs photo ID. Same again, and it will not be asked for twice.',
  },
  {
    kind: 'card',
    id: 'k-id',
    atMs: 123_800,
    card: UPLOAD_REQUEST_CARD,
    settleAtMs: 128_500,
    settled: { label: 'Sent in', note: 'Received, and it will not be asked for again.' },
  },

  /* action: 130–155 s */
  {
    kind: 'baz',
    id: 'b-status',
    thinkingFromMs: 129_500,
    atMs: 131_000,
    text: 'Three applications from one conversation. Here is where each one stands.',
  },
  { kind: 'card', id: 'k-status', atMs: 132_500, card: SHOWCASE_STATUS_CARD },
  { kind: 'cutaway', id: 'w-payload', atMs: 141_000, untilMs: 155_000, view: { kind: 'payload' } },

  /* govern: 155–180 s */
  { kind: 'cutaway', id: 'w-cases', atMs: 155_000, untilMs: 161_000, view: { kind: 'admin', screen: 'cases' } },
  { kind: 'cutaway', id: 'w-case', atMs: 161_000, untilMs: 167_000, view: { kind: 'admin', screen: 'case' } },
  { kind: 'cutaway', id: 'w-guardrails', atMs: 167_000, untilMs: 172_000, view: { kind: 'admin', screen: 'guardrails' } },
  { kind: 'cutaway', id: 'w-persona', atMs: 172_000, untilMs: 176_000, view: { kind: 'admin', screen: 'persona' } },
  { kind: 'cutaway', id: 'w-analytics', atMs: 176_000, untilMs: 180_000, view: { kind: 'admin', screen: 'analytics' } },
]
