import { savedAfter } from '../quotes/maths.ts'

/**
 * How one customer's money should be split across several savings accounts.
 *
 * A catalogue answers "which account", and that is the wrong question. Somebody with a lump sum
 * and a monthly amount does not want an account, they want an arrangement: this much here
 * because it can be locked away, exactly this much there because that is what the bonus costs,
 * the rest somewhere it earns the most. No product page says any of that, and it is the thing a
 * banker across a desk is actually for.
 *
 * Built because a live conversation went the other way. Baz offered a choice between two
 * savings accounts, and the customer replied with the right answer worked out themselves — lock
 * the lump sum in a fixed term, €200 a month into MortgageSaver for the bonus, the rest into
 * SuperSaver. Baz said "that structure works". The bank should not need to be told.
 *
 * Worse, what Baz had proposed one turn earlier was poorer: it offered to take the whole
 * €32,000 lump sum into MortgageSaver, where a balance above the tier earns 0.5%, while the
 * card underneath said so in black and white.
 *
 * §40 — the deterministic system calculates and the model explains. Every figure here is
 * arithmetic on a published rate, and the model's job is to say why the shape is the shape.
 */

export type SavingsTerm = {
  readonly months: number
  readonly annualRate: number
}

/**
 * A bonus that is not interest.
 *
 * Kept separate all the way through, because it is conditional on something that has not
 * happened yet — a mortgage drawn down here, within a window — and a figure added into a
 * headline is a figure somebody counts on.
 */
export type SavingsBonus = {
  readonly amount: number
  /** Whether it depends on the mortgage being taken with this bank. */
  readonly requiresMortgageHere: boolean
  readonly minMonthly: number
  readonly minMonths: number
  readonly minTotal: number
  /** How long the customer has to draw the mortgage down. */
  readonly withinMonths: number
}

/**
 * One savings product, as the engine needs it.
 *
 * The domain declares the shape and a tenant fills it in (Invariant 11): this must be able to
 * arrange Bank of Ireland's accounts without knowing they are Bank of Ireland's.
 */
export type SavingsOption = {
  readonly id: string
  readonly name: string
  /** The rate on money held here. Null where the product is a term ladder instead. */
  readonly annualRate: number | null
  /** A fixed-term ladder. The engine picks the longest term that fits the customer's horizon. */
  readonly terms?: readonly SavingsTerm[]
  readonly takesLumpSum: boolean
  readonly takesMonthly: boolean
  readonly minLumpSum?: number
  readonly maxLumpSum?: number
  readonly minMonthly?: number
  readonly maxMonthly?: number
  /** Where the headline rate only applies up to a balance. */
  readonly tierCap?: number
  readonly aboveTierRate?: number
  readonly bonus?: SavingsBonus
  readonly watch: readonly string[]
}

export type SavingsSituation = {
  /** Money they already hold, looking for a home. */
  readonly lumpSum: number | null
  /** What they can put away each month. */
  readonly monthly: number | null
  readonly firstTimeBuyer: boolean
  /**
   * Whether the mortgage is going to be taken here.
   *
   * Three-valued on purpose. `null` means nobody has asked, and that is not a yes: arranging
   * €200 a month around a bonus that depends on it would be the engine deciding the answer to
   * the question the bonus turns on.
   */
  readonly mortgageWithThisBank: boolean | null
  /** How long until they need the money. Null means nobody knows, so nothing gets locked away. */
  readonly monthsToTarget: number | null
}

export type Allocation = {
  readonly productId: string
  readonly name: string
  readonly amount: number
  readonly cadence: 'once' | 'monthly'
  /** The term chosen from the ladder, where the product has one. */
  readonly termMonths: number | null
  readonly annualRate: number
  /** What this money is doing here, in one line. */
  readonly job: string
  readonly watch: readonly string[]
}

export type Arrangement = {
  readonly allocations: readonly Allocation[]
  /** Interest across the arrangement over twelve months, at the rates as published. */
  readonly firstYearInterest: number
  /** Separate from the interest, always, because it is conditional. */
  readonly bonus: { readonly amount: number; readonly conditions: readonly string[] } | null
  readonly unallocated: { readonly lumpSum: number; readonly monthly: number }
  /** Anything the customer should know about why the shape is the shape. */
  readonly notes: readonly string[]
}

/** Below two accounts it is a recommendation, and `show_comparison` already does those. */
const MINIMUM_ALLOCATIONS = 2

export function arrange(
  situation: SavingsSituation,
  catalogue: readonly SavingsOption[],
): Arrangement | null {
  const allocations: Allocation[] = []
  const notes: string[] = []

  let lumpLeft = Math.max(0, situation.lumpSum ?? 0)
  let monthlyLeft = Math.max(0, situation.monthly ?? 0)

  // ---- The bonus first, because it is worth more than any rate on this page -------------
  const bonusOption = bestBonus(situation, catalogue, monthlyLeft, notes)

  if (bonusOption !== null && bonusOption.bonus !== undefined) {
    const take = bonusOption.bonus.minMonthly

    /*
     * The minimum and not a euro more.
     *
     * The bonus is a flat amount for clearing a threshold: paying in above it earns no more
     * bonus, and the rate up there is worse than the best regular saver's. Every euro over the
     * line is a euro deliberately earning less.
     */
    allocations.push({
      productId: bonusOption.id,
      name: bonusOption.name,
      amount: take,
      cadence: 'monthly',
      termMonths: null,
      annualRate: bonusOption.annualRate ?? 0,
      job:
        `The least that qualifies for the €${bonusOption.bonus.amount.toLocaleString('en-IE')} ` +
        'bonus. Anything above this earns no more bonus and a worse rate, so it goes elsewhere.',
      watch: bonusOption.watch,
    })

    monthlyLeft -= take
  }

  // ---- The rest of the monthly saving, wherever it earns most ---------------------------
  const regular = catalogue
    .filter((option) => option.takesMonthly && option.id !== bonusOption?.id)
    .filter((option) => monthlyLeft >= (option.minMonthly ?? 0))
    .sort((a, b) => (b.annualRate ?? 0) - (a.annualRate ?? 0))[0]

  if (regular !== undefined && monthlyLeft > 0) {
    const take = Math.min(monthlyLeft, regular.maxMonthly ?? monthlyLeft)

    allocations.push({
      productId: regular.id,
      name: regular.name,
      amount: take,
      cadence: 'monthly',
      termMonths: null,
      annualRate: regular.annualRate ?? 0,
      job: 'The rest of what you save each month, where it earns the most.',
      watch: regular.watch,
    })

    monthlyLeft -= take
  }

  // ---- The lump sum, in the best home that it can actually leave in time ----------------
  for (const option of lumpHomes(situation, catalogue)) {
    if (lumpLeft <= 0) break
    if (lumpLeft < (option.minLumpSum ?? 0)) continue

    const term = termFor(option, situation.monthsToTarget)
    const take = Math.min(lumpLeft, option.maxLumpSum ?? lumpLeft)

    allocations.push({
      productId: option.id,
      name: option.name,
      amount: take,
      cadence: 'once',
      termMonths: term?.months ?? null,
      annualRate: term?.annualRate ?? effectiveLumpRate(option, take),
      job:
        term === null
          ? 'Where the money you already have goes, so it is earning while you save.'
          : `Locked away for ${String(term.months)} months, which ends before you need it.`,
      watch: option.watch,
    })

    lumpLeft -= take
  }

  if (allocations.length < MINIMUM_ALLOCATIONS) return null

  return {
    allocations: ordered(allocations),
    firstYearInterest: firstYearInterest(allocations),
    bonus: bonusFrom(bonusOption),
    unallocated: { lumpSum: lumpLeft, monthly: monthlyLeft },
    notes,
  }
}

/**
 * The bonus-bearing account, when the customer can actually get the bonus.
 *
 * Every condition is checked rather than assumed, and a condition nobody has asked about
 * leaves a note instead of a guess. A €2,000 bonus arranged around a mortgage going somewhere
 * else is worse than not arranging it at all.
 */
function bestBonus(
  situation: SavingsSituation,
  catalogue: readonly SavingsOption[],
  monthly: number,
  notes: string[],
): SavingsOption | null {
  const candidates = catalogue.filter((option) => option.bonus !== undefined)
  if (candidates.length === 0) return null

  const reachable = candidates.filter((option) => {
    const bonus = option.bonus
    if (bonus === undefined) return false
    if (monthly < bonus.minMonthly) return false
    if (bonus.requiresMortgageHere && situation.mortgageWithThisBank !== true) return false
    if (!situation.firstTimeBuyer) return false
    return true
  })

  if (reachable.length === 0) {
    const asked = candidates.some(
      (option) => option.bonus?.requiresMortgageHere === true && situation.firstTimeBuyer,
    )
    if (asked && situation.mortgageWithThisBank === null) {
      notes.push(
        'There is a first-time-buyer bonus worth having, but it depends on the mortgage being ' +
          'drawn down here. Nobody has said yet, so nothing has been arranged around it.',
      )
    }
    return null
  }

  return (
    [...reachable].sort((a, b) => (b.bonus?.amount ?? 0) - (a.bonus?.amount ?? 0))[0] ?? null
  )
}

/**
 * Somewhere for money they already hold, best first.
 *
 * A product whose only terms outlive the goal is dropped entirely rather than offered at a
 * shorter rate it does not have. Ranked on what the money would actually earn, which for a
 * tiered account is not the headline.
 */
function lumpHomes(
  situation: SavingsSituation,
  catalogue: readonly SavingsOption[],
): readonly SavingsOption[] {
  const lump = situation.lumpSum ?? 0
  if (lump <= 0) return []

  return catalogue
    .filter((option) => option.takesLumpSum)
    .filter((option) => option.terms === undefined || termFor(option, situation.monthsToTarget) !== null)
    .sort((a, b) => {
      const rate = (option: SavingsOption) =>
        termFor(option, situation.monthsToTarget)?.annualRate ?? effectiveLumpRate(option, lump)
      return rate(b) - rate(a)
    })
}

/**
 * The longest term that ends before they need the money.
 *
 * The reason this engine beats reading a rate table. Case c77e613f needs its deposit in eight
 * months: the 12-month term pays 2.15% and hands the money back four months after the keys,
 * and the 18-month one is worse again. The six-month term at 1.51% is the only one available
 * to them, and a better rate they cannot use is not a better rate.
 */
function termFor(option: SavingsOption, monthsToTarget: number | null): SavingsTerm | null {
  if (option.terms === undefined || option.terms.length === 0) return null

  // No horizon, no locking anything away. Nobody knows when they need it.
  if (monthsToTarget === null) return null

  const fits = option.terms.filter((term) => term.months <= monthsToTarget)
  return [...fits].sort((a, b) => b.months - a.months)[0] ?? null
}

/**
 * What a balance actually earns here, rather than what the headline says.
 *
 * MortgageSaver pays 2% on monthly contributions up to a tier and 0.5% on everything else, so
 * a €32,000 lump sum sitting in it earns the 0.5%. Ranking on the headline is how Baz came to
 * offer exactly that.
 */
function effectiveLumpRate(option: SavingsOption, amount: number): number {
  const headline = option.annualRate ?? 0
  if (option.tierCap === undefined || option.aboveTierRate === undefined) return headline
  if (amount <= option.tierCap) return headline

  const within = option.tierCap * headline
  const above = (amount - option.tierCap) * option.aboveTierRate
  return amount === 0 ? headline : (within + above) / amount
}

/** Twelve months of it, at the rates as published. Never the bonus. */
function firstYearInterest(allocations: readonly Allocation[]): number {
  const total = allocations.reduce((sum, allocation) => {
    const months = Math.min(12, allocation.termMonths ?? 12)

    return (
      sum +
      (allocation.cadence === 'once'
        ? allocation.amount * allocation.annualRate * (months / 12)
        : savedAfter(allocation.amount, allocation.annualRate, months) - allocation.amount * months)
    )
  }, 0)

  return Math.round(total * 100) / 100
}

function bonusFrom(option: SavingsOption | null): Arrangement['bonus'] {
  const bonus = option?.bonus
  if (option === null || bonus === undefined) return null

  return {
    amount: bonus.amount,
    conditions: [
      `At least €${String(bonus.minMonthly)} a month for ${String(bonus.minMonths)} months in a row.`,
      `At least €${bonus.minTotal.toLocaleString('en-IE')} saved before drawdown.`,
      `A mortgage drawn down here within ${String(bonus.withinMonths)} months.`,
    ],
  }
}

/**
 * Lump sum first, then the monthly commitments in the order they were decided.
 *
 * Deliberately not largest first. The €200 that buys the bonus is the smallest number on the
 * card and the only one that needs explaining, and "the rest of your monthly saving" only
 * makes sense once the part that was carved out of it has been said. A sort on amount puts
 * €2,300 above it and turns the interesting half into a footnote.
 *
 * The sort is stable, so allocations keep the order the engine decided them in: bonus, then
 * remainder.
 */
function ordered(allocations: readonly Allocation[]): readonly Allocation[] {
  return [...allocations].sort((a, b) => {
    if (a.cadence === b.cadence) return 0
    return a.cadence === 'once' ? -1 : 1
  })
}
