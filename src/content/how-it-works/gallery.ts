import type { Card } from '@contracts/cards.ts'
import type { ClaimKind } from '@/components/Primitives'
import { ARRANGEMENT_CARD, PLAN_CARD, RATES_CARD, REVIEW_CARD } from './story'

/**
 * Six of the nineteen cards, rendered through the real components for the capabilities chapter.
 *
 * Four are the story's own. The two that are not, the comparison and the quote, are built here
 * from the same catalogue helpers the server uses: the comparison's names, rates and features
 * are read out of the knowledge base through `rateOf`, and the quote's figures come out of
 * `buildQuote` over the loan's variants. Both are pinned as produced on 2026-10-16 and
 * recomputed in `capabilities.test.ts` from the same helpers, so the page never carries the
 * knowledge base itself.
 *
 * The quote is labelled illustrative because the product file says its variants are invented;
 * the arithmetic is real and the rates are not.
 */

export type GalleryEntry = {
  readonly id: Card['type']
  readonly label: string
  /** What the card is for, and who decides what is on it. */
  readonly oneLine: string
  readonly claim: ClaimKind
  readonly source: string
  readonly card: Card
}

/** `rateOf` and `surfaceableProducts` over the knowledge base, for three savings products. */
export const COMPARISON_IDS = ['savings.supersaver', 'savings.mortgagesaver', 'savings.advantage_fixed'] as const

export const COMPARISON_CARD: Card = {
  type: 'comparison',
  title: 'Savings accounts',
  options: [
    {
      id: 'savings.supersaver',
      name: 'SuperSaver Account',
      oneLine: 'Build a regular monthly savings habit with a fixed introductory rate.',
      highlights: ['€5–€2,500 monthly by direct debit', 'Fixed rate for first 12 months', 'No lump sums', 'Sole or joint'],
      rate: '3% AER fixed for 12 months',
      rateNote: 'Then the standard Regular Saver variable rate; public comparison showed 2% at 2026-04-16',
      reason: 'You said €1,200 a month, and most of that wants the best regular rate.',
      endsIn: null,
    },
    {
      id: 'savings.mortgagesaver',
      name: 'MortgageSaver Account',
      oneLine: 'Help first-time buyers build a deposit and potentially qualify for mortgage-linked bonus interest.',
      highlights: ['€200–€2,500 monthly DD', 'Sole/joint', 'Variable rate on regular contributions', 'Lump-sum option'],
      rate: '2% AER variable on monthly savings',
      rateNote: '0.5% on anything above €15,000',
      reason: 'A first-time buyer taking the mortgage here can earn the €2,000 bonus.',
      endsIn: null,
    },
    {
      id: 'savings.advantage_fixed',
      name: 'Advantage Fixed Term Deposit Account',
      oneLine: 'Lock most of a lump sum for 6, 12 or 18 months with fixed interest and limited access.',
      highlights: ['6/12/18 month terms', 'Fixed interest', 'Min €5,000', 'Single lodgement'],
      rate: 'up to 2.24% AER fixed',
      rateNote: '18m: 2.24%, 12m: 2.15%, 6m: 1.51%',
      reason: 'The €32,000 you already hold is not needed until June.',
      endsIn: null,
    },
  ],
}

/** `buildQuote` over the personal loan's variants, for €20,000 over five years. */
export const QUOTE_REQUEST = { amount: 20_000, months: 60 } as const

export const QUOTE_CARD: Card = {
  type: 'quote',
  product: 'personal_loan',
  displayName: 'Personal loan',
  basis: '€20,000, over 5 years',
  options: [
    {
      id: 'loan_3y',
      name: 'Over 3 years',
      highlight: 'Least interest',
      headline: { label: 'Monthly repayment', value: '€626 / month' },
      figures: [
        { label: 'Rate', value: '7.9%' },
        { label: 'Over', value: '3 years' },
        { label: 'Total repaid', value: '€22,529' },
      ],
      footnote: null,
    },
    {
      id: 'loan_5y',
      name: 'Over 5 years',
      highlight: 'Lowest monthly',
      headline: { label: 'Monthly repayment', value: '€410 / month' },
      figures: [
        { label: 'Rate', value: '8.5%' },
        { label: 'Over', value: '5 years' },
        { label: 'Total repaid', value: '€24,620' },
      ],
      footnote: null,
    },
    {
      id: 'loan_7y',
      name: 'Over 7 years',
      highlight: null,
      headline: { label: 'Monthly repayment', value: '€326 / month' },
      figures: [
        { label: 'Rate', value: '9.4%' },
        { label: 'Over', value: '7 years' },
        { label: 'Total repaid', value: '€27,372' },
      ],
      footnote: 'Only for larger amounts, and the longer term costs more overall.',
    },
  ],
}

export const gallery: readonly GalleryEntry[] = [
  {
    id: 'mortgage_rates',
    label: 'Mortgage rates',
    oneLine:
      'The published rate table, indexed by buyer type, BER, amount and term. The server picks the rows this customer may see and computes every repayment; the model supplies the four answers and nothing else.',
    claim: 'poc',
    source: 'selectRates() over the published table, dated as the card says',
    card: RATES_CARD,
  },
  {
    id: 'comparison',
    label: 'Comparison',
    oneLine:
      'Two to four catalogue products side by side. Every word but the reason is read from the knowledge base. Tapping one asks Baz to explain it; nothing is started.',
    claim: 'poc',
    source: 'rateOf() and the knowledge base, 2026-10-16',
    card: COMPARISON_CARD,
  },
  {
    id: 'quote',
    label: 'Quote',
    oneLine:
      'What something costs, pays or takes. Any two of amount, term and monthly is enough and the engine works out the third for every variant. The model never does the arithmetic.',
    claim: 'illustrative',
    source: 'buildQuote() over the loan variants in products.ts, which are invented figures',
    card: QUOTE_CARD,
  },
  {
    id: 'arrangement',
    label: 'Arrangement',
    oneLine:
      'How the money they hold and the money they save each month should be split across accounts: the bonus first and only what qualifies, the lump sum locked away for as long as the horizon allows, the rest where it earns most. One tap starts every account.',
    claim: 'poc',
    source: 'arrange() over the published savings options, 2026-10-16',
    card: ARRANGEMENT_CARD,
  },
  {
    id: 'plan_proposal',
    label: 'Plan',
    oneLine:
      'A goal that outlives any one application, with its milestones and when Baz will come back to it. Every figure is the plan engine’s. Nothing is kept until the tap.',
    claim: 'poc',
    source: 'planDraftFor(buy_first_home)',
    card: PLAN_CARD,
  },
  {
    id: 'review',
    label: 'Review',
    oneLine:
      'What is about to be submitted, built from the case rather than from model text, with every declaration and every confirmation of a held value ticked by hand. Submit stays disabled until they are.',
    claim: 'poc',
    source: 'journeys/credit-card.ts and the facts held',
    card: REVIEW_CARD,
  },
]
