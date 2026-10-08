import { describe, expect, it } from 'vitest'
import { factCatalogue } from './facts.ts'

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
