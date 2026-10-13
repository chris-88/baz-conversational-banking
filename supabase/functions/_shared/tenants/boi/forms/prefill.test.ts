import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { formDefinitionSchema } from '../../../domain/forms/definition.ts'
import { activeFields } from '../../../domain/forms/logic.ts'
import { SUPERSAVER_PREFILL, addressPart, namePart, resolvePrefill } from './prefill.ts'

const snapshot = JSON.parse(
  readFileSync('supabase/functions/_shared/tenants/boi/forms/form-1833.json', 'utf8'),
) as { definition: unknown }
const definition = formDefinitionSchema.parse(snapshot.definition)

describe('what Baz already knows', () => {
  it('every mapping points at a field that exists in the published definition', () => {
    const byToscana = new Map(
      definition.fields
        .filter((f) => typeof f.toscana === 'string' && f.toscana.length > 0)
        .map((f) => [f.toscana as string, f]),
    )

    const missing = SUPERSAVER_PREFILL.filter((p) => !byToscana.has(p.toscana))
    expect(missing.map((p) => p.toscana)).toEqual([])
  })

  it('answers a real share of what the form would otherwise ask', () => {
    const byToscana = new Map(
      definition.fields
        .filter((f) => typeof f.toscana === 'string')
        .map((f) => [f.toscana as string, f]),
    )
    const prefillable = new Set(
      SUPERSAVER_PREFILL.map((p) => byToscana.get(p.toscana)?.id).filter(Boolean),
    )

    const asked = activeFields(definition.fields, {}).filter(
      (f) => f.isRequired && !['html', 'section', 'page', 'hidden'].includes(f.type),
    )
    const covered = asked.filter((f) => prefillable.has(f.id))

    // Not a vanity number: it is the claim the demo makes out loud.
    expect(covered.length).toBeGreaterThanOrEqual(8)
    expect(asked.length).toBeGreaterThan(covered.length)
  })
})

describe('reshaping a fact into what the form wants', () => {
  it('splits a name, keeping double-barrelled surnames whole', () => {
    expect(namePart('Aoife Ní Bhriain', 'firstName')).toBe('Aoife')
    expect(namePart('Aoife Ní Bhriain', 'surname')).toBe('Ní Bhriain')
    expect(namePart('Prince', 'surname')).toBe('')
  })

  it('pulls the parts of an address people actually say', () => {
    const address = '9 Shanliss Park, Santry, Dublin 9'
    expect(addressPart(address, 'houseNumber')).toBe('9')
    expect(addressPart(address, 'addressLine1')).toBe('Shanliss Park')
    expect(addressPart(address, 'addressLine2')).toBe('Santry')
    expect(addressPart(address, 'county')).toBe('Dublin 9')
  })

  it('returns nothing rather than guessing when a part is not there', () => {
    expect(addressPart('Shanliss Park', 'houseNumber')).toBe('')
    expect(addressPart('', 'county')).toBe('')
  })
})

describe('resolving what is held into form answers', () => {
  it('fills the fields the facts cover and names the ones they do not', () => {
    const held: Partial<Record<string, unknown>> = {
      'identity.fullName': 'Dave Quinn',
      'identity.dateOfBirth': '1988-10-25',
      'identity.address': '9 Shanliss Park, Santry, Dublin 9',
      'identity.ppsn': '1234567Q',
      'goals.monthlySaving': 1200,
    }

    const resolved = resolvePrefill({
      definition,
      prefill: SUPERSAVER_PREFILL,
      held: (key) => held[key],
      reused: () => true,
    })

    const byToscana = new Map(
      definition.fields
        .filter((f) => typeof f.toscana === 'string')
        .map((f) => [f.toscana as string, f.id]),
    )
    const fieldFor = (toscana: string) => byToscana.get(toscana) ?? 'missing'

    expect(resolved.answers[fieldFor('Applicant_1_First_Name')]).toBe('Dave')
    expect(resolved.answers[fieldFor('Applicant_1_Surname')]).toBe('Quinn')
    expect(resolved.answers[fieldFor('Applicant_1_Address_House_Number')]).toBe('9')
    expect(resolved.answers[fieldFor('Applicant_1_Address_County')]).toBe('Dublin 9')
    expect(resolved.answers[fieldFor('Direct_Debit_Amount')]).toBe(1200)

    // Not held, so the customer still gets asked. A blank is not an answer.
    expect(resolved.unresolved).toContain('Applicant_1_Email_Address')
    expect(resolved.unresolved).toContain('Applicant_1_Employer_Name')
    expect(Object.keys(resolved.answers)).not.toContain(fieldFor('Applicant_1_Email_Address'))
  })

  it('counts as reused only what was not collected for this form', () => {
    const held: Partial<Record<string, unknown>> = {
      'identity.fullName': 'Dave Quinn',
      'goals.monthlySaving': 1200,
    }

    const resolved = resolvePrefill({
      definition,
      prefill: SUPERSAVER_PREFILL,
      held: (key) => held[key],
      // The saving amount was stated while applying for this; the name came from before it.
      reused: (key) => key !== 'goals.monthlySaving',
    })

    const byToscana = new Map(
      definition.fields
        .filter((f) => typeof f.toscana === 'string')
        .map((f) => [f.toscana as string, f.id]),
    )
    const amount = byToscana.get('Direct_Debit_Amount') ?? 'missing'
    const firstName = byToscana.get('Applicant_1_First_Name') ?? 'missing'

    expect(resolved.reused).toContain(firstName)
    expect(resolved.reused).not.toContain(amount)
  })

  it('treats an empty or whitespace fact as not held', () => {
    const resolved = resolvePrefill({
      definition,
      prefill: SUPERSAVER_PREFILL,
      held: (key) => (key === 'identity.fullName' ? '   ' : undefined),
      reused: () => true,
    })

    expect(resolved.answers).toEqual({})
    expect(resolved.unresolved).toContain('Applicant_1_First_Name')
  })

  it('drops a part a fact does not contain rather than writing a blank', () => {
    const resolved = resolvePrefill({
      definition,
      prefill: SUPERSAVER_PREFILL,
      // One word, so there is no surname and no house number in sight.
      held: (key) => (key === 'identity.fullName' ? 'Prince' : undefined),
      reused: () => true,
    })

    const byToscana = new Map(
      definition.fields
        .filter((f) => typeof f.toscana === 'string')
        .map((f) => [f.toscana as string, f.id]),
    )

    expect(resolved.answers[byToscana.get('Applicant_1_First_Name') ?? '']).toBe('Prince')
    expect(Object.keys(resolved.answers)).not.toContain(byToscana.get('Applicant_1_Surname'))
    expect(resolved.unresolved).toContain('Applicant_1_Surname')
  })
})
