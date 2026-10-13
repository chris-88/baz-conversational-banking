import type { FactKey } from '../../../domain/facts.ts'

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
