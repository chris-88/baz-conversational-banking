import type { FactKey } from '../../../domain/facts.ts'
import type { FormDefinition } from '../../../domain/forms/definition.ts'

/**
 * What Baz already knows, expressed in the form platform's own vocabulary.
 *
 * Keyed on `toscana` rather than on field id. The ids are internal to one revision of one
 * form; the toscana names are the bank's own semantic mapping, they read the same in every
 * form that collects the same thing, and they survive a revision that renumbers fields. A
 * SuperSaver first name and a current-account first name are both `Applicant_1_First_Name`,
 * so this table serves whatever journey comes next without being rewritten.
 *
 * The point of the exercise is that a customer is never asked for something Baz is already
 * holding. The form has 79 required fields active before anything is answered; the measure of
 * success is how few of them reach the customer as a question.
 */

export type Prefill = {
  /** The bank's own name for the destination. Resolved to a field id against the definition. */
  readonly toscana: string
  /** Which fact answers it. */
  readonly fact: FactKey
  /**
   * How the fact's value becomes the form's value, where they are not the same shape.
   *
   * A full name is one fact and two fields; an address is one fact and four. Written here
   * rather than in the conversation, because the shape a form wants is the form's problem.
   */
  readonly take?: 'firstName' | 'surname' | 'addressLine1' | 'addressLine2' | 'county' | 'houseNumber'
}

/**
 * Deliberately conservative.
 *
 * Several near-matches are left out because a near-match on a bank form is worse than a
 * question. `identity.nationality` is not country of birth and is not country of citizenship,
 * however close they look in a field list, and a prefilled wrong answer on a real application
 * is exactly the failure this whole architecture exists to avoid. If Baz does not hold the
 * thing itself, it asks.
 */
export const SUPERSAVER_PREFILL: readonly Prefill[] = [
  { toscana: 'Applicant_1_First_Name', fact: 'identity.fullName', take: 'firstName' },
  { toscana: 'Applicant_1_Surname', fact: 'identity.fullName', take: 'surname' },
  { toscana: 'Applicant_1_Date_Of_Birth', fact: 'identity.dateOfBirth' },
  { toscana: 'Applicant_1_Email_Address', fact: 'identity.email' },
  { toscana: 'Applicant_1_Mobile_Phone_No', fact: 'identity.mobile' },
  { toscana: 'Applicant_1_Pps_Number', fact: 'identity.ppsn' },
  { toscana: 'Applicant_1_Address_House_Number', fact: 'identity.address', take: 'houseNumber' },
  { toscana: 'Applicant_1_Address_Line_1', fact: 'identity.address', take: 'addressLine1' },
  { toscana: 'Applicant_1_Address_Line_2', fact: 'identity.address', take: 'addressLine2' },
  { toscana: 'Applicant_1_Address_County', fact: 'identity.address', take: 'county' },
  { toscana: 'Applicant_1_Employment_Status', fact: 'employment.status' },
  { toscana: 'Applicant_1_Employer_Name', fact: 'employment.employerName' },
  { toscana: 'Applicant_1_Occupation', fact: 'employment.occupation' },
  { toscana: 'Direct_Debit_Amount', fact: 'goals.monthlySaving' },
]

/** Split a single stated name into the two fields the form wants. */
export function namePart(fullName: string, part: 'firstName' | 'surname'): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (part === 'firstName') return words[0] ?? ''
  // Everything after the first word, so double-barrelled surnames survive.
  return words.slice(1).join(' ')
}

/**
 * Pull one part out of a stated address.
 *
 * Addresses arrive as one line of free text because that is how people say them. This is a
 * best effort at the shape a form wants, and anything it cannot find is left for Baz to ask
 * rather than guessed at.
 */
export function addressPart(
  address: string,
  part: 'houseNumber' | 'addressLine1' | 'addressLine2' | 'county',
): string {
  const parts = address.split(',').map((piece) => piece.trim()).filter(Boolean)
  if (parts.length === 0) return ''

  if (part === 'county') {
    const last = parts.at(-1) ?? ''
    // "Co. Dublin" and "Dublin 9" are both the county, said differently.
    return /^(co\.?\s+)?[A-Za-z ]+\s*\d*$/.test(last) ? last.replace(/^co\.?\s+/i, '') : ''
  }

  const first = parts[0] ?? ''
  if (part === 'houseNumber') {
    const match = /^(\d+[A-Za-z]?)\b/.exec(first)
    return match?.[1] ?? ''
  }
  if (part === 'addressLine1') {
    return first.replace(/^\d+[A-Za-z]?\s*/, '')
  }
  return parts.length > 2 ? (parts[1] ?? '') : ''
}

export type Resolved = {
  /** Keyed by the definition's own field ids, which is what a packet is built from. */
  readonly answers: Readonly<Record<string, unknown>>
  /** Field ids whose value came from something Baz already held. */
  readonly reused: readonly string[]
  /**
   * Mappings that found nothing, by their toscana name.
   *
   * Kept rather than discarded because this is the list of questions the customer still has to
   * be asked, and the console shows it: the claim is about how few questions are left, which
   * means being able to see which ones they are.
   */
  readonly unresolved: readonly string[]
}

/**
 * Turns what Baz holds into answers against one form definition.
 *
 * `held` is the case's facts. `reused` decides whether a value counts towards the questions
 * avoided: a fact stated while applying for this very form was asked for, so it does not,
 * while one carried over from an earlier application or from the bank's own record does.
 *
 * Nothing is guessed. A fact that is absent, blank, or whose requested part is not in it (a
 * one-word name has no surname) leaves the field unanswered and the customer asked.
 */
export function resolvePrefill(args: {
  readonly definition: FormDefinition
  readonly prefill: readonly Prefill[]
  readonly held: (key: FactKey) => unknown
  readonly reused: (key: FactKey) => boolean
}): Resolved {
  const byToscana = new Map(
    args.definition.fields
      .filter((field) => typeof field.toscana === 'string' && field.toscana.length > 0)
      .map((field) => [field.toscana as string, field.id]),
  )

  const answers: Record<string, unknown> = {}
  const reused: string[] = []
  const unresolved: string[] = []

  for (const mapping of args.prefill) {
    const fieldId = byToscana.get(mapping.toscana)
    // A mapping that names a field this revision does not have. `prefill.test.ts` keeps the
    // table honest against the published definition, so this is belt and braces.
    if (fieldId === undefined) {
      unresolved.push(mapping.toscana)
      continue
    }

    const value = valueFor(args.held(mapping.fact), mapping.take)
    if (value === undefined) {
      unresolved.push(mapping.toscana)
      continue
    }

    answers[fieldId] = value
    if (args.reused(mapping.fact)) reused.push(fieldId)
  }

  return { answers, reused, unresolved }
}

/** `undefined` for anything that is not an answer, which is the only way a field stays unasked. */
function valueFor(fact: unknown, take: Prefill['take']): unknown {
  if (fact === null || fact === undefined) return undefined

  if (take === undefined) {
    if (typeof fact === 'string') return fact.trim() === '' ? undefined : fact.trim()
    if (typeof fact === 'number' || typeof fact === 'boolean') return fact
    return undefined
  }

  // Every reshaping below is a string operation on something a person said.
  if (typeof fact !== 'string' || fact.trim() === '') return undefined

  const part =
    take === 'firstName' || take === 'surname'
      ? namePart(fact, take)
      : addressPart(fact, take)

  return part.trim() === '' ? undefined : part
}
