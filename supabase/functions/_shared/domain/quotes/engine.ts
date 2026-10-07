import type { ProductVariant } from '../../tenants/boi/products.ts'
import {
  monthsFor,
  monthsToSave,
  repaymentFor,
  savedAfter,
  totalPaid,
} from './maths.ts'

/**
 * A question about money, turned into options worth comparing.
 *
 * The customer supplies any two of amount, term and monthly; the engine works out the third for
 * every variant of the product. That is the whole point — "what would €600,000 over 30 years
 * cost" and "I want a €30,000 car at about €400 a month" are the same question asked from
 * different ends, and answering only the first is how a calculator differs from a conversation.
 */

export type QuoteRequest = {
  /** What is borrowed, saved towards, or owed. */
  readonly amount?: number | undefined
  readonly months?: number | undefined
  /** What they can pay, or put away, each month. */
  readonly monthly?: number | undefined
}

export type QuoteFigure = {
  readonly label: string
  readonly value: string
}

export type QuoteOption = {
  readonly id: string
  readonly name: string
  readonly highlight: string | null
  /** The number the decision turns on, rendered. */
  readonly headline: QuoteFigure
  readonly figures: readonly QuoteFigure[]
  readonly footnote: string | null
}

export type Quote = {
  /** What was computed from, in one line, so the card can state its own assumptions. */
  readonly basis: string
  readonly options: readonly QuoteOption[]
  /** Why nothing could be computed, when nothing could. */
  readonly problem: string | null
}

const euro = (amount: number): string =>
  `€${Math.round(amount).toLocaleString('en-IE')}`

const years = (months: number): string => {
  const whole = Math.floor(months / 12)
  const rest = months % 12

  if (whole === 0) return `${String(months)} months`
  if (rest === 0) return `${String(whole)} ${whole === 1 ? 'year' : 'years'}`
  return `${String(whole)}y ${String(rest)}m`
}

const percent = (rate: number): string => `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}%`

/**
 * Three or more ways to do the same thing, with the trade-off visible.
 *
 * Variants the request cannot satisfy — an amount below a minimum, a term longer than allowed —
 * are left out rather than shown as unavailable. A list of things you cannot have is not a
 * comparison.
 */
export function buildQuote(
  variants: readonly ProductVariant[],
  request: QuoteRequest,
): Quote {
  const usable = variants.filter((variant) => fits(variant, request))

  if (usable.length === 0) {
    return {
      basis: '',
      options: [],
      problem:
        variants.length === 0
          ? 'That product has no figures to compare.'
          : 'Nothing on offer matches those numbers.',
    }
  }

  const options = usable
    .map((variant) => optionFor(variant, request))
    .filter((option): option is QuoteOption => option !== null)

  if (options.length === 0) {
    return { basis: '', options: [], problem: shortfall(usable, request) }
  }

  return { basis: basisOf(usable[0]?.shape ?? 'borrowing', request), options, problem: null }
}

function fits(variant: ProductVariant, request: QuoteRequest): boolean {
  const { amount, months } = request

  if (amount !== undefined) {
    if (variant.minAmount !== undefined && amount < variant.minAmount) return false
    if (variant.maxAmount !== undefined && amount > variant.maxAmount) return false
  }

  if (months !== undefined) {
    if (variant.minMonths !== undefined && months < variant.minMonths) return false
    if (variant.maxMonths !== undefined && months > variant.maxMonths) return false
  }

  return true
}

function optionFor(variant: ProductVariant, request: QuoteRequest): QuoteOption | null {
  const base = {
    id: variant.id,
    name: variant.name,
    highlight: variant.highlight ?? null,
    footnote: variant.note ?? null,
  }

  if (variant.shape === 'saving') return savingOption(variant, request, base)
  if (variant.shape === 'revolving') return revolvingOption(variant, request, base)
  return borrowingOption(variant, request, base)
}

type OptionBase = Pick<QuoteOption, 'id' | 'name' | 'highlight' | 'footnote'>

/** Borrowing: whichever of amount, term and monthly is missing is the answer. */
function borrowingOption(
  variant: ProductVariant,
  request: QuoteRequest,
  base: OptionBase,
): QuoteOption | null {
  const { amount, monthly } = request

  // A variant with a fixed term defines its own, which is how "over 3 years" is an option
  // rather than a question.
  const months = variant.minMonths === variant.maxMonths ? variant.minMonths : request.months

  if (amount !== undefined && months !== undefined) {
    const payment = repaymentFor(amount, variant.annualRate, months)

    /**
     * Said plainly when the term costs more than they have.
     *
     * A product with set terms cannot stretch to a budget, and the useful answer is not "no
     * options" — it is what those terms actually cost, so the customer can see the gap and
     * decide whether to borrow less or pay more.
     */
    const overBudget = monthly !== undefined && payment > monthly

    return {
      ...base,
      headline: { label: 'Monthly repayment', value: `${euro(payment)} / month` },
      figures: [
        { label: 'Rate', value: `${percent(variant.annualRate)}${variant.fixedYears === undefined ? '' : ' fixed'}` },
        { label: 'Over', value: years(months) },
        { label: 'Total repaid', value: euro(totalPaid(payment, months)) },
      ],
      footnote: overBudget
        ? `${euro(payment - monthly)} a month more than the ${euro(monthly)} you mentioned.`
        : base.footnote,
    }
  }

  if (amount !== undefined && monthly !== undefined) {
    const over = monthsFor(amount, variant.annualRate, monthly)
    if (over === null) return null

    return {
      ...base,
      headline: { label: 'Paid off in', value: years(over) },
      figures: [
        { label: 'Monthly', value: `${euro(monthly)} / month` },
        { label: 'Rate', value: percent(variant.annualRate) },
        { label: 'Total repaid', value: euro(totalPaid(monthly, over)) },
      ],
    }
  }

  return null
}

/** Saving: what it builds to, or how long the target takes. */
function savingOption(
  variant: ProductVariant,
  request: QuoteRequest,
  base: OptionBase,
): QuoteOption | null {
  const { amount, monthly, months } = request
  if (monthly === undefined) return null

  if (months !== undefined) {
    const saved = savedAfter(monthly, variant.annualRate, months)
    return {
      ...base,
      headline: { label: `After ${years(months)}`, value: euro(saved) },
      figures: [
        { label: 'Putting away', value: `${euro(monthly)} / month` },
        { label: 'Rate', value: percent(variant.annualRate) },
        { label: 'Interest earned', value: euro(saved - monthly * months) },
      ],
    }
  }

  if (amount !== undefined) {
    const taken = monthsToSave(amount, monthly, variant.annualRate)
    if (taken === null) return null

    return {
      ...base,
      headline: { label: `To reach ${euro(amount)}`, value: years(taken) },
      figures: [
        { label: 'Putting away', value: `${euro(monthly)} / month` },
        { label: 'Rate', value: percent(variant.annualRate) },
      ],
    }
  }

  return null
}

/** A balance and what it takes to clear it. */
function revolvingOption(
  variant: ProductVariant,
  request: QuoteRequest,
  base: OptionBase,
): QuoteOption | null {
  const { amount, monthly } = request
  if (amount === undefined || monthly === undefined) return null

  const over = monthsFor(amount, variant.annualRate, monthly)
  if (over === null) return null

  return {
    ...base,
    headline: { label: 'Cleared in', value: years(over) },
    figures: [
      { label: 'Paying', value: `${euro(monthly)} / month` },
      { label: 'Rate', value: percent(variant.annualRate) },
      { label: 'Interest', value: euro(totalPaid(monthly, over) - amount) },
    ],
  }
}

/** What the figures were computed from, so the card states its own assumptions. */
function basisOf(shape: ProductVariant['shape'], request: QuoteRequest): string {
  const parts: string[] = []

  if (request.amount !== undefined) {
    parts.push(shape === 'saving' ? `a target of ${euro(request.amount)}` : euro(request.amount))
  }
  if (request.months !== undefined) parts.push(`over ${years(request.months)}`)
  if (request.monthly !== undefined) parts.push(`at ${euro(request.monthly)} a month`)

  return parts.join(', ')
}

/** Said plainly, because "no options" is not an answer somebody can act on. */
function shortfall(variants: readonly ProductVariant[], request: QuoteRequest): string {
  if (request.monthly === undefined) return 'Not enough to work from yet.'

  const cheapest = Math.min(...variants.map((variant) => variant.annualRate))
  const amount = request.amount ?? 0
  const interest = (amount * cheapest) / 12

  return (
    `${euro(request.monthly)} a month would not cover the interest on ${euro(amount)}, which is ` +
    `about ${euro(interest)} in the first month alone.`
  )
}
