import { describe, expect, it } from 'vitest'
import { buildQuote } from './engine.ts'
import { boiProducts } from '../../tenants/boi/products.ts'

const variants = (product: keyof typeof boiProducts) => boiProducts[product].variants ?? []

/**
 * The two questions from the brief, asked from opposite ends.
 *
 * "What would €600,000 over 30 years cost" and "I want a €30,000 car at about €400 a month" are
 * the same question, and answering only the first is how a calculator differs from a
 * conversation.
 */
describe('a question about money becomes options', () => {
  it('answers an amount and a term with a monthly figure', () => {
    const quote = buildQuote(variants('mortgage'), { amount: 600_000, months: 360 })

    expect(quote.problem).toBeNull()
    expect(quote.options.length).toBeGreaterThanOrEqual(3)
    expect(quote.basis).toBe('€600,000, over 30 years')

    const cheapest = quote.options[0]
    expect(cheapest?.headline.label).toBe('Monthly repayment')
    expect(cheapest?.headline.value).toMatch(/^€2,5\d\d \/ month$/)
    // The trade-off is the point: the total is what the monthly figure hides.
    expect(cheapest?.figures.map((figure) => figure.label)).toEqual(['Rate', 'Over', 'Total repaid'])
  })

  it('answers an amount and a budget with a term', () => {
    const quote = buildQuote(variants('mortgage'), { amount: 30_000, monthly: 400 })

    expect(quote.problem).toBeNull()
    expect(quote.options[0]?.headline.label).toBe('Paid off in')
    expect(quote.basis).toBe('€30,000, at €400 a month')
  })

  it('lets a product define its own terms as the options', () => {
    // A personal loan is not "pick a term", it is three terms with different rates.
    const quote = buildQuote(variants('personal_loan'), { amount: 30_000 })

    expect(quote.options.map((option) => option.name)).toEqual([
      'Over 3 years',
      'Over 5 years',
      'Over 7 years',
    ])
    // Longer costs less a month and more in total, which is the whole comparison.
    const [three, , seven] = quote.options
    expect(three?.headline.value).not.toBe(seven?.headline.value)
  })

  it('leaves out what the customer cannot have rather than listing it greyed', () => {
    // €5,000 is below the seven-year minimum, so that option is simply not there.
    const quote = buildQuote(variants('personal_loan'), { amount: 5_000 })
    expect(quote.options.map((option) => option.name)).toEqual(['Over 3 years', 'Over 5 years'])
  })

  it('works out what regular saving builds to', () => {
    const quote = buildQuote(variants('savings'), { monthly: 300, months: 24 })

    expect(quote.options[0]?.headline.label).toBe('After 2 years')
    expect(quote.options.every((option) => option.figures.some((f) => f.label === 'Interest earned'))).toBe(true)
  })

  it('works out how long a target takes', () => {
    const quote = buildQuote(variants('savings'), { amount: 10_000, monthly: 500 })
    expect(quote.options[0]?.headline.label).toBe('To reach €10,000')
  })

  it('works out what clearing a card balance takes', () => {
    const quote = buildQuote(variants('credit_card'), { amount: 3_000, monthly: 200 })

    expect(quote.options[0]?.headline.label).toBe('Cleared in')
    expect(quote.options[0]?.figures.some((figure) => figure.label === 'Interest')).toBe(true)
  })

  /**
   * A product with set terms cannot stretch to a budget, and "no options" is not an answer
   * anybody can act on. What those terms actually cost is.
   */
  it('shows the gap rather than refusing, when a fixed term costs more than the budget', () => {
    const quote = buildQuote(variants('personal_loan'), { amount: 30_000, monthly: 20 })

    expect(quote.options.length).toBeGreaterThan(0)
    expect(quote.options[0]?.footnote).toMatch(/more than the €20 you mentioned/i)
  })

  it('says why when a payment would never clear the balance at all', () => {
    const quote = buildQuote(variants('credit_card'), { amount: 3_000, monthly: 5 })

    expect(quote.options).toEqual([])
    expect(quote.problem).toMatch(/would not cover the interest/i)
    expect(quote.problem).toMatch(/€3,000/)
  })

  it('needs two numbers before it can say anything', () => {
    expect(buildQuote(variants('mortgage'), { amount: 600_000 }).options).toEqual([])
  })

  it('has nothing to compare for a product without figures', () => {
    expect(buildQuote(variants('joint_account'), { amount: 100 }).problem).toMatch(/no figures/i)
  })
})
