import { describe, expect, it } from 'vitest'
import { formSnapshot } from '@tenants/boi/forms/snapshots.ts'
import { LOAN_PREFILL, fillFromFacts } from '@tenants/boi/forms/prefill.ts'
import { loanAnnualRate } from '@tenants/boi/forms/rates.ts'
import { resolveFormState } from '@domain/forms/state.ts'
import { resolveNdi } from '@domain/forms/ndi.ts'
import { buildSubmission } from '@domain/forms/submission.ts'
import type { FactKey } from '@domain/facts.ts'
import { PAYLOAD, PAYLOAD_FACTS, PAYLOAD_SEED } from './payload'

/**
 * The packet on the showcase is the engine's, not ours.
 *
 * Recomputed here the way the console computes it, from the same facts and the same published
 * definition. If the definition or the engine changes, the pinned excerpt fails and gets
 * re-captured rather than quietly going stale on a room full of people.
 */
describe('the captured loan packet', () => {
  const snapshot = formSnapshot(PAYLOAD.formId)
  if (snapshot === undefined) throw new Error('No snapshot for the loan form')

  const filled = fillFromFacts({
    definition: snapshot.definition,
    prefill: LOAN_PREFILL,
    held: (key: FactKey) => PAYLOAD_FACTS[key]?.value,
    reused: (key: FactKey) => PAYLOAD_FACTS[key]?.bankHeld === true,
    answers: PAYLOAD_SEED,
  })
  const answers = { ...PAYLOAD_SEED, ...filled.answers }
  const state = resolveFormState(snapshot.definition, answers)
  const active = new Set(state.active.map((field) => field.id))
  const rate = loanAnnualRate(Number(state.values['234'] ?? 0))
  const ndi = resolveNdi({
    definition: snapshot.definition,
    values: state.values,
    active,
    annualRate: rate?.rate ?? null,
    eligibilityFixture: 'eligible',
  })
  const packet = buildSubmission({
    definition: snapshot.definition,
    answers,
    reused: new Set(filled.reused),
    pageLocation: snapshot.pageLocation,
    ndi,
  })

  it('is addressed where the genuine journey would send it, and nowhere is it sent', () => {
    expect(packet.target).toBe(PAYLOAD.target)
    expect(packet.method).toBe(PAYLOAD.method)
    expect(packet.encoding).toBe(PAYLOAD.encoding)
    expect(packet.formVersion).toBe(PAYLOAD.formVersion)
  })

  it('has the counts the showcase prints', () => {
    expect(packet.entries).toHaveLength(PAYLOAD.entries)
    expect(Object.keys(answers)).toHaveLength(PAYLOAD.answered)
    expect(filled.reused).toHaveLength(PAYLOAD.reusedFields)
    expect(state.outstanding).toHaveLength(PAYLOAD.outstanding)
  })

  it('every line of the excerpt is in the packet, with the same value and source', () => {
    for (const line of PAYLOAD.excerpt) {
      const entry = packet.entries.find((candidate) => candidate.key === line.key)
      expect(entry, line.key).toBeDefined()
      expect(entry?.value, line.key).toBe(line.value)
      expect(entry?.source, line.key).toBe(line.source)
      expect(entry?.label, line.key).toBe(line.label)
      expect(entry?.toscana, line.key).toBe(line.toscana)
    }
  })

  it('shows the eligibility line as the fixture it is', () => {
    const eligibility = PAYLOAD.excerpt.find((line) => line.fieldId === '239')
    expect(eligibility?.note).toMatch(/fixture/i)
  })
})
