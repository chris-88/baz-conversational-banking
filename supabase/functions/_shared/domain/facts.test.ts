import { describe, expect, it } from 'vitest'
import { factCatalogue } from './facts.ts'
import { ALL_JOURNEYS } from './journeys/index.ts'

describe('where the salary is paid', () => {
  it('is a person-level fact, because two applicants can bank differently', () => {
    expect(factCatalogue['banking.salaryPaidTo'].subject).toBe('person')
  })

  it('can be taken from the conversation — it is an ordinary banking question', () => {
    expect(factCatalogue['banking.salaryPaidTo'].extractable).toBe(true)
    expect(factCatalogue['banking.salaryPaidTo'].sensitivity).toBe('standard')
  })

  it('names no bank, because the domain does not know whose it is running in', () => {
    const values = factCatalogue['banking.salaryPaidTo'].schema
    for (const value of ['this_bank', 'another_bank', 'not_working']) {
      expect(values.safeParse(value).success, value).toBe(true)
    }
    expect(values.safeParse('boi').success).toBe(false)
  })
})

describe("what the customer says about their partner's income", () => {
  /**
   * "I earn 150k and she earns 100k", said before the second applicant has joined. There is
   * no partner to write `income.annualBasic` against, so the figure used to be kept nowhere
   * while the plan called affordability understood on one salary.
   */
  it('belongs to the household, because the partner may not exist yet', () => {
    expect(factCatalogue['income.partnerAnnualStated'].subject).toBe('household')
  })

  it('can be taken from the conversation, and is ordinary banking data', () => {
    expect(factCatalogue['income.partnerAnnualStated'].extractable).toBe(true)
    expect(factCatalogue['income.partnerAnnualStated'].sensitivity).toBe('standard')
  })

  it('is hearsay, so it is never reused', () => {
    expect(factCatalogue['income.partnerAnnualStated'].reuse).toBe('never')
  })

  it('says on its face whose word it rests on', () => {
    expect(factCatalogue['income.partnerAnnualStated'].label).toMatch(/as the customer described/i)
  })

  it('takes a positive whole number of euro', () => {
    const { schema } = factCatalogue['income.partnerAnnualStated']
    expect(schema.safeParse(100_000).success).toBe(true)
    expect(schema.safeParse(0).success).toBe(false)
    expect(schema.safeParse('100k').success).toBe(false)
  })

  it('satisfies no journey: the partner states their own income when they join', () => {
    const everyRequirement = ALL_JOURNEYS.flatMap((journey) => [
      ...journey.requirements,
      ...journey.branches.flatMap((branch) => branch.requirements),
    ])
    const hearsay = everyRequirement.filter(
      (requirement) =>
        requirement.kind === 'fact' && requirement.fact === 'income.partnerAnnualStated',
    )
    expect(hearsay).toEqual([])
  })
})
