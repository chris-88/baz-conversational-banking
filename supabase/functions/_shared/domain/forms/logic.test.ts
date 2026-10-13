import { describe, expect, it } from 'vitest'
import { isActive, type Answers } from './logic.ts'
import type { FormField } from './definition.ts'

const field = (overrides: Partial<FormField>): FormField =>
  ({
    id: '1',
    type: 'text',
    label: '',
    isRequired: false,
    description: '',
    ...overrides,
  })

/**
 * Which questions apply to this customer.
 *
 * Deterministic, and deliberately not the model's job. The real SuperSaver definition carries
 * 540 rules across 246 fields; a model asked to decide which apply would be wrong occasionally
 * and unaccountably, and §17.1 of the feature note is explicit that a required field which is
 * not active must not block the journey.
 */
describe('isActive()', () => {
  it('shows a field with no logic at all', () => {
    expect(isActive(field({}), {})).toBe(true)
  })

  it('shows when a `show` rule matches and hides when it does not', () => {
    const f = field({
      conditionalLogic: { actionType: 'show', logicType: 'all', rules: [{ fieldId: '335', operator: 'is', value: '365mobile' }] },
    })
    expect(isActive(f, { '335': '365mobile' })).toBe(true)
    expect(isActive(f, { '335': 'branch' })).toBe(false)
    // Unanswered is not a match, which is what keeps a journey from opening every branch.
    expect(isActive(f, {})).toBe(false)
  })

  it('hides when a `hide` rule matches', () => {
    const f = field({
      conditionalLogic: { actionType: 'hide', logicType: 'all', rules: [{ fieldId: '1159', operator: 'is', value: '1' }] },
    })
    expect(isActive(f, { '1159': '1' })).toBe(false)
    expect(isActive(f, { '1159': '0' })).toBe(true)
  })

  it('treats `all` as every rule and `any` as at least one', () => {
    const rules = [
      { fieldId: 'a', operator: 'is' as const, value: 'x' },
      { fieldId: 'b', operator: 'is' as const, value: 'y' },
    ]
    const all = field({ conditionalLogic: { actionType: 'show', logicType: 'all', rules } })
    const any = field({ conditionalLogic: { actionType: 'show', logicType: 'any', rules } })

    expect(isActive(all, { a: 'x', b: 'y' })).toBe(true)
    expect(isActive(all, { a: 'x' })).toBe(false)
    expect(isActive(any, { a: 'x' })).toBe(true)
    expect(isActive(any, {})).toBe(false)
  })

  it('handles `isnot`, including against an unanswered field', () => {
    const f = field({
      conditionalLogic: { actionType: 'show', logicType: 'all', rules: [{ fieldId: '778', operator: 'isnot', value: '' }] },
    })
    // This is the real PPS-confirmation rule: show once something has been entered.
    expect(isActive(f, { '778': '1234567T' })).toBe(true)
    expect(isActive(f, { '778': '' })).toBe(false)
    expect(isActive(f, {})).toBe(false)
  })

  it('compares as strings, because the definition mixes numbers and strings', () => {
    const f = field({
      conditionalLogic: { actionType: 'show', logicType: 'all', rules: [{ fieldId: 'n', operator: 'is', value: 1 }] },
    })
    expect(isActive(f, { n: '1' })).toBe(true)
    expect(isActive(f, { n: 1 })).toBe(true)
  })

  it('does not follow a chain: a rule reads the answer, not the referenced field’s own logic', () => {
    /*
     * The platform evaluates against submitted values. A field whose controller is itself
     * hidden simply has no answer, which the rules above already treat as "no match" — so the
     * branch closes without this needing to recurse.
     */
    const f = field({
      conditionalLogic: { actionType: 'show', logicType: 'all', rules: [{ fieldId: 'hidden', operator: 'is', value: 'yes' }] },
    })
    expect(isActive(f, {})).toBe(false)
  })
})

describe('answers that are arrays', () => {
  it('matches when any selected value matches, for multi-select and checkbox groups', () => {
    const f = field({
      conditionalLogic: { actionType: 'show', logicType: 'all', rules: [{ fieldId: 'c', operator: 'is', value: 'b' }] },
    })
    const answers: Answers = { c: ['a', 'b'] }
    expect(isActive(f, answers)).toBe(true)
    expect(isActive(f, { c: ['a'] })).toBe(false)
  })
})
