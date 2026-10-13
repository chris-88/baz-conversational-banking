import type { ConditionalLogic, FormField } from './definition.ts'

/**
 * Which questions apply to this customer, decided in code.
 *
 * The SuperSaver definition carries 540 rules across 246 of its 499 fields. A model asked to
 * work out which apply would be wrong occasionally and unaccountably, and the consequence is
 * not cosmetic: a required field that is not active must not block the journey, and a field
 * that is active must not be skipped. Same division as everywhere else in Baz, the engine
 * decides what is needed and the model decides how to ask.
 *
 * The whole operator surface is `is` and `isnot`, with `all` or `any`, acting to `show` or
 * `hide`. That is not a simplification: it is every operator the published definition uses.
 */

/** What the customer has answered so far, keyed by field id. */
export type Answers = Readonly<Record<string, unknown>>

/**
 * Compared as strings throughout.
 *
 * The definition is inconsistent about it — `value: 1` in one rule and `"1"` in the next — and
 * the platform itself compares submitted form values, which arrive as text.
 */
function one(value: unknown): string {
  // Only the scalars a form answer can actually be. Anything else is not an answer, and
  // stringifying it would quietly produce "[object Object]" and compare that.
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function asStrings(value: unknown): readonly string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return (value as readonly unknown[]).map(one)
  return [one(value)]
}

function ruleMatches(answer: unknown, operator: 'is' | 'isnot', expected: unknown): boolean {
  const actual = asStrings(answer)
  const target = one(expected)

  if (operator === 'is') {
    // An unanswered field matches `is ""`, which is how the platform treats a blank.
    return actual.length === 0 ? target === '' : actual.includes(target)
  }

  /*
   * An unanswered field never satisfies `isnot`.
   *
   * Conservative on purpose: it keeps a branch closed until the customer has actually said
   * something. The real rule this matters for is the PPS confirmation, which appears once a
   * number has been entered and must not appear before.
   */
  if (actual.length === 0) return false
  return !actual.includes(target)
}

function rulesPass(logic: ConditionalLogic, answers: Answers): boolean {
  if (logic.rules.length === 0) return true
  const results = logic.rules.map((rule) =>
    ruleMatches(answers[rule.fieldId], rule.operator, rule.value),
  )
  return logic.logicType === 'all' ? results.every(Boolean) : results.some(Boolean)
}

/**
 * Whether this field is part of the journey, given what has been answered.
 *
 * A field with no logic is always active. Otherwise `show` means it appears when its rules
 * pass, and `hide` means it disappears when they do.
 */
export function isActive(field: FormField, answers: Answers): boolean {
  const logic = field.conditionalLogic
  if (!logic) return true

  const passes = rulesPass(logic, answers)
  return logic.actionType === 'show' ? passes : !passes
}

/** Every field that currently applies, in definition order. */
export function activeFields(
  fields: readonly FormField[],
  answers: Answers,
): readonly FormField[] {
  return fields.filter((field) => isActive(field, answers))
}
