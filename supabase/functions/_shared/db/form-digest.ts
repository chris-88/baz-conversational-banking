import type { LoadedCase } from './loaded-case.ts'
import { resolveFormState } from '../domain/forms/state.ts'
import { formForProduct } from '../tenants/boi/forms/mapping.ts'
import { formSnapshot } from '../tenants/boi/forms/snapshots.ts'

/**
 * What the bank's own form still wants, in words Baz can ask.
 *
 * This is the half of the feature a packet cannot show. The engine works out which of 418
 * controls apply to this customer and which are already answered from what Baz holds; the
 * model's job is to ask for what is left, in a sentence rather than a field label, and in an
 * order that sounds like a conversation rather than a form.
 *
 * Deliberately short. A digest listing forty remaining questions would cost real money on every
 * turn and would invite the model to ask them all at once, which is the interrogation this
 * whole product exists to replace. A handful at a time is also how a person would do it.
 */

/** Enough to ask naturally, few enough not to read like a form. */
const MAX_QUESTIONS = 5

/** The choices are listed for the model, up to the point where a list stops being useful. */
const MAX_CHOICES = 8

export type FormQuestion = {
  readonly fieldId: string
  readonly label: string
  /** Empty for anything the customer types or says. */
  readonly choices: readonly string[]
  readonly kind: 'question' | 'consent' | 'document'
}

export type FormDigest = {
  readonly formId: string
  readonly formName: string
  /** Every active required question still unanswered, before the display limit. */
  readonly remaining: number
  readonly questions: readonly FormQuestion[]
  /** How many the form never had to ask, because Baz already held the answer. */
  readonly answered: number
}

function kindOf(type: string): FormQuestion['kind'] {
  if (type === 'checkbox') return 'consent'
  if (type === 'fileupload') return 'document'
  return 'question'
}

/**
 * One digest entry per application that has a form behind it.
 *
 * Driven by the product, so a case with a loan and a savings account gets both, and a product
 * with no published form contributes nothing rather than an empty section.
 */
export function formDigests(loaded: LoadedCase): readonly FormDigest[] {
  const digests: FormDigest[] = []

  for (const application of loaded.applications) {
    const mapping = formForProduct(application.product)
    if (!mapping) continue

    const snapshot = formSnapshot(mapping.formId)
    if (!snapshot) continue

    const stored = loaded.formApplications.find((row) => row.formId === mapping.formId)
    const answers = stored?.answers ?? {}

    const state = resolveFormState(snapshot.definition, answers)

    const questions = state.outstanding.map((field) => ({
      fieldId: field.id,
      label: field.label,
      choices: (field.choices ?? []).slice(0, MAX_CHOICES).map((choice) => choice.value),
      kind: kindOf(field.type),
    }))

    digests.push({
      formId: snapshot.formId,
      formName: snapshot.version,
      remaining: questions.length,
      questions: questions.slice(0, MAX_QUESTIONS),
      answered: Object.keys(answers).length,
    })
  }

  return digests
}

/**
 * The digest section, as prose.
 *
 * Written out here rather than handed to the model as JSON for the same reason the rest of the
 * digest is: the system prompt is read by a language model, and a sentence costs fewer tokens
 * than a nested object saying the same thing.
 *
 * The instruction at the end is the important line. Everything else in this file is what to
 * ask; that is how, and it is what stops a form becoming an interrogation.
 */
export function formDigestSection(digests: readonly FormDigest[]): string {
  if (digests.length === 0) return ''

  const parts: string[] = []

  for (const digest of digests) {
    const lines: string[] = [
      `${digest.formName} (form ${digest.formId}): ${String(digest.answered)} answers already filled in from what you know, ${String(digest.remaining)} still needed.`,
    ]

    for (const question of digest.questions) {
      const choices =
        question.choices.length > 0 ? ` One of: ${question.choices.join(', ')}.` : ''
      const note =
        question.kind === 'consent'
          ? ' This is a declaration: it needs an explicit tap, never an answer in chat.'
          : question.kind === 'document'
            ? ' This is a document to upload.'
            : ''
      lines.push(`- ${question.label}${choices}${note}`)
    }

    parts.push(lines.join('\n'))
  }

  return [
    'THE BANK FORM BEHIND THIS APPLICATION',
    'These are the questions the real application form still needs. Ask for them in',
    'conversation, a couple at a time, in your own words. Never read the list out, never',
    'present them as a form, and never ask for anything already filled in. Where a question',
    'has a fixed set of answers, the customer must end up on one of them.',
    '',
    ...parts,
  ].join('\n')
}
