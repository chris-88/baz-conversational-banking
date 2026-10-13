import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { formDefinitionSchema } from '../../../domain/forms/definition.ts'
import { activeFields } from '../../../domain/forms/logic.ts'
import { SUPERSAVER_PREFILL, addressPart, namePart } from './prefill.ts'

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
