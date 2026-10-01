import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { recordFacts } from './case-repository.ts'

/** Captures what would have been inserted, so the rules can be tested without a database. */
function stubClient(): { client: SupabaseClient; inserted: Record<string, unknown>[] } {
  const inserted: Record<string, unknown>[] = []
  const client = {
    from: () => ({
      insert: (rows: Record<string, unknown>[]) => {
        inserted.push(...rows)
        return Promise.resolve({ data: null, error: null })
      },
    }),
  } as unknown as SupabaseClient
  return { client, inserted }
}

const participants = { primary: 'p-primary', partner: 'p-partner' }

const write = (facts: Parameters<typeof recordFacts>[1]['facts']) => {
  const { client, inserted } = stubClient()
  return recordFacts(client, { caseId: 'c-1', facts, participants, source: 'customer_stated' }).then(
    (outcome) => ({ outcome, inserted }),
  )
}

describe('the catalogue decides whose fact it is, not the model', () => {
  it('stores a household key against the household even when the model says primary', async () => {
    const { outcome, inserted } = await write([
      { key: 'household.buyingWith', subject: 'primary', value: 'partner' },
    ])

    expect(outcome.accepted).toEqual(['household.buyingWith'])
    expect(inserted[0]?.subject_kind).toBe('household')
    expect(inserted[0]?.participant_id).toBeNull()
  })

  it('defaults a personal key to the primary customer when no subject is given', async () => {
    const { outcome, inserted } = await write([{ key: 'income.annualBasic', value: 92_000 }])

    expect(outcome.accepted).toEqual(['income.annualBasic'])
    expect(inserted[0]?.participant_id).toBe('p-primary')
  })

  it('honours an explicit partner subject', async () => {
    const { inserted } = await write([
      { key: 'income.annualBasic', subject: 'partner', value: 54_000 },
    ])

    expect(inserted[0]?.participant_id).toBe('p-partner')
  })

  it('refuses a partner fact before the partner exists', async () => {
    const { client } = stubClient()
    const outcome = await recordFacts(client, {
      caseId: 'c-1',
      facts: [{ key: 'income.annualBasic', subject: 'partner', value: 54_000 }],
      participants: { primary: 'p-primary', partner: null },
      source: 'customer_stated',
    })

    expect(outcome.accepted).toEqual([])
    expect(outcome.rejected[0]?.reason).toMatch(/no partner/i)
  })
})

describe('Invariant 6 — health data is unreachable from conversation', () => {
  it('refuses a non-extractable key and explains why', async () => {
    const { outcome, inserted } = await write([
      { key: 'protection.health.smoker', value: true },
      { key: 'income.annualBasic', value: 92_000 },
    ])

    expect(outcome.accepted).toEqual(['income.annualBasic'])
    expect(outcome.rejected[0]?.key).toBe('protection.health.smoker')
    expect(outcome.rejected[0]?.reason).toMatch(/form with consent/i)
    expect(inserted).toHaveLength(1)
  })
})

describe('values are validated against the catalogue schema', () => {
  it('refuses a value of the wrong shape', async () => {
    const { outcome } = await write([
      { key: 'income.annualBasic', value: 'about ninety two thousand' },
    ])

    expect(outcome.accepted).toEqual([])
    expect(outcome.rejected).toHaveLength(1)
  })

  it('refuses a negative salary', async () => {
    const { outcome } = await write([{ key: 'income.annualBasic', value: -1 }])
    expect(outcome.accepted).toEqual([])
  })

  it('accepts the good facts in a batch and reports only the bad ones', async () => {
    const { outcome } = await write([
      { key: 'income.annualBasic', value: 92_000 },
      { key: 'household.dependantCount', value: 'one' },
      { key: 'housing.firstTimeBuyer', value: true },
    ])

    expect([...outcome.accepted].sort()).toEqual(['housing.firstTimeBuyer', 'income.annualBasic'])
    expect(outcome.rejected.map((r) => r.key)).toEqual(['household.dependantCount'])
  })

  it('writes nothing at all when every fact is refused', async () => {
    const { inserted } = await write([{ key: 'protection.health.smoker', value: true }])
    expect(inserted).toEqual([])
  })
})
