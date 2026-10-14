import { describe, expect, it } from 'vitest'
import { recordFormAnswers } from './record-form-answers.ts'
import type { Db } from './case-repository.ts'

/**
 * Stands in for the database, so the rules can be tested without one.
 *
 * Only the four reads and one write this function makes, returning what the real tables would
 * for a savings application against the live SuperSaver definition.
 */
function stubClient(
  product: string,
  answers: Record<string, unknown> = {},
): { client: Db; written: Record<string, unknown>[] } {
  const written: Record<string, unknown>[] = []

  const from = (table: string) => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => {
        if (table === 'applications') {
          return await Promise.resolve({ data: { id: 'app-1', product }, error: null })
        }
        if (table === 'form_applications') {
          return await Promise.resolve({ data: { id: 'fa-1', answers }, error: null })
        }
        return await Promise.resolve({ data: null, error: null })
      },
      upsert: async (rows: Record<string, unknown>[]) => {
        written.push(...rows)
        return await Promise.resolve({ error: null })
      },
    }
    return chain
  }

  return { client: { from } as unknown as Db, written }
}

const run = async (
  product: string,
  answers: readonly { fieldId: string; value: string | number | boolean }[],
  existing: Record<string, unknown> = {},
) => {
  const { client, written } = stubClient(product, existing)
  const outcome = await recordFormAnswers(client, {
    caseId: 'case-1',
    applicationId: 'app-1',
    participantId: 'participant-1',
    answers,
  })
  return { outcome, written }
}

describe('answers the form will accept', () => {
  it('records a plain question', async () => {
    // 1174 is SuperSaver's first-name field, a plain text question on the first page.
    const { outcome, written } = await run('savings', [{ fieldId: '1174', value: 'Dave' }])

    expect(outcome.accepted).toEqual(['1174'])
    expect(written).toHaveLength(1)
    expect(written[0]).toMatchObject({ field_id: '1174', value: 'Dave', source: 'customer' })
  })

  it('refuses a field the form does not have', async () => {
    const { outcome, written } = await run('savings', [{ fieldId: '999999', value: 'x' }])

    expect(outcome.accepted).toEqual([])
    expect(outcome.rejected[0]?.reason).toMatch(/no such field/)
    expect(written).toHaveLength(0)
  })

  it('refuses a product with no form behind it', async () => {
    const { outcome } = await run('mortgage', [{ fieldId: '1174', value: 'Dave' }])

    expect(outcome.accepted).toEqual([])
    expect(outcome.rejected[0]?.reason).toMatch(/no bank form/)
  })
})

/**
 * The refusals that are invariants rather than validation.
 *
 * A model that could record a declaration could manufacture consent, and one that could record
 * an upload could put a document in a packet that nobody sent. Neither is a matter of being
 * careful with the prompt: the server will not do it.
 */
describe('what a conversation can never record', () => {
  it('refuses a declaration, however clearly the customer agreed', async () => {
    const loan = await run('personal_loan', [{ fieldId: '48', value: 'Yes' }])

    expect(loan.outcome.accepted).toEqual([])
    expect(loan.outcome.rejected[0]?.reason).toMatch(/needs an explicit tap/)
    expect(loan.written).toHaveLength(0)
  })

  it('refuses a document', async () => {
    const loan = await run('personal_loan', [{ fieldId: '151', value: 'passport.pdf' }])

    expect(loan.outcome.accepted).toEqual([])
    expect(loan.outcome.rejected[0]?.reason).toMatch(/needs an upload/)
  })

  it('refuses a value the form does not offer', async () => {
    // 171 is living arrangements: parents, tenant or home, and nothing else.
    const loan = await run(
      'personal_loan',
      [{ fieldId: '171', value: 'a houseboat' }],
      { 363: 'No', 207: 'New loan', 500: 'Car purchase', 179: 20000, 70: 'monthly' },
    )

    expect(loan.outcome.accepted).toEqual([])
    expect(loan.outcome.rejected[0]?.reason).toMatch(/must be one of/)
  })

  it('writes the form’s own spelling of a choice, not the customer’s', async () => {
    const loan = await run(
      'personal_loan',
      [{ fieldId: '171', value: 'TENANT' }],
      { 363: 'No', 207: 'New loan', 500: 'Car purchase', 179: 20000, 70: 'monthly' },
    )

    expect(loan.outcome.accepted).toEqual(['171'])
    expect(loan.written[0]).toMatchObject({ field_id: '171', value: 'tenant' })
  })

  it('refuses a question that is not on this customer’s branch', async () => {
    // The student college question, with nothing answered: the student page is closed.
    const loan = await run('personal_loan', [{ fieldId: '372', value: 'Trinity' }])

    expect(loan.outcome.accepted).toEqual([])
    expect(loan.outcome.rejected[0]?.reason).toMatch(/does not apply/)
  })

  it('refuses something the form calculates for itself', async () => {
    const loan = await run(
      'personal_loan',
      [{ fieldId: '255', value: 50000 }],
      { 363: 'No', 207: 'New loan', 500: 'Car purchase', 179: 20000 },
    )

    expect(loan.outcome.accepted).toEqual([])
    expect(loan.outcome.rejected[0]?.reason).toMatch(/works that one out/)
  })
})
