import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { formDefinitionSchema } from './definition.ts'
import { buildSubmission } from './submission.ts'

const snapshot = JSON.parse(
  readFileSync('supabase/functions/_shared/tenants/boi/forms/form-1833.json', 'utf8'),
) as { definition: unknown; version: string }
const definition = formDefinitionSchema.parse(snapshot.definition)

const PAGE = 'https://digital.bankofireland.com/personal-banking/supersaver/'
const build = (answers: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  buildSubmission({ definition, answers, pageLocation: PAGE, ...extra })

/**
 * The packet, checked against the one captured from the real journey.
 *
 * The observed SuperSaver submission is 64 ordered entries with repeated keys, dotted
 * sub-inputs, hidden defaults and two runtime values. These assert the shapes that are
 * actually in it, because a builder that produces something merely plausible is worth nothing:
 * the claim being made is that this is what the existing journey would send.
 */
describe('buildSubmission()', () => {
  it('reads the real definition', () => {
    expect(definition.title).toBe('SuperSaver - R2.0.1')
    expect(definition.fields.length).toBe(499)
  })

  it('carries hidden defaults exactly as the captured packet does', () => {
    const keys = new Map(build({}).entries.map((e) => [e.key, e.value]))
    // Observed: input_494 "SuperSaver Application ", input_335 "GWS".
    expect(keys.get('input_494')).toBe('SuperSaver Application ')
    expect(keys.get('input_335')).toBe('GWS')
  })

  it('repeats the key for a compound field, as FormData allows', () => {
    const phone = build({ '1189': ['0871234567', 'IE'] }).entries.filter((e) => e.key === 'input_1189[]')
    expect(phone.map((e) => e.value)).toEqual(['0871234567', 'IE'])
  })

  it('submits a checkbox under its sub-input id', () => {
    // 1182 is the PPS confirmation and only appears once a number has been given, so the
    // number has to be there for the confirmation to be part of the journey at all.
    const consent = build({
      '778': '1234567T',
      '1182': ['I confirm I have checked my PPS number'],
    })
    const entry = consent.entries.find((e) => e.key === 'input_1182.1')
    expect(entry?.value).toBe('I confirm I have checked my PPS number')
    expect(entry?.source).toBe('consent')
  })

  it('leaves out a question that does not apply to this customer', () => {
    // 1147 is shown only when 335 is not "365mobile"; 1210 depends on 335 being it.
    const keys = (answers: Record<string, unknown>) => new Set(build(answers).entries.map((e) => e.key))
    expect(keys({ '335': '365mobile' }).has('input_1147')).toBe(false)
  })

  it('appends the two runtime values last, in the observed order', () => {
    const entries = build({ '218': 'Sole account' }).entries
    const last = entries.slice(-2).map((e) => e.key)
    expect(last).toEqual(['boi_nonce_form_field_1833', 'page_location'])
    expect(entries.at(-1)?.value).toBe(PAGE)
  })

  it('shows an empty nonce rather than inventing one', () => {
    const nonce = build({}).entries.find((e) => e.key === 'boi_nonce_form_field_1833')
    expect(nonce?.value).toBe('')
    expect(nonce?.sensitive).toBe(true)
  })

  it('records the target without ever being able to call it', () => {
    const packet = build({})
    expect(packet.target).toBe('https://digital.bankofireland.com/api/forms/1833')
    expect(packet.method).toBe('POST')
    expect(packet.encoding).toBe('multipart/form-data')
  })

  it('builds from partial answers, so a half-finished application still maps', () => {
    const partial = build({ '1174': 'Tony', '1175': 'Stark' })
    const keys = new Map(partial.entries.map((e) => [e.key, e.value]))
    expect(keys.get('input_1174')).toBe('Tony')
    expect(keys.get('input_1175')).toBe('Stark')
    // Nothing invented for what has not been asked yet.
    expect(keys.has('input_778')).toBe(false)
  })

  it('distinguishes what was reused from what was asked', () => {
    const packet = build({ '1174': 'Tony', '1175': 'Stark' }, { reused: new Set(['1174']) })
    const byKey = new Map(packet.entries.map((e) => [e.key, e.source]))
    expect(byKey.get('input_1174')).toBe('reused')
    expect(byKey.get('input_1175')).toBe('answer')
  })

  it('marks the values an inspector must mask', () => {
    const packet = build({ '778': '1234567T', '1174': 'Tony' })
    const byKey = new Map(packet.entries.map((e) => [e.key, e.sensitive]))
    expect(byKey.get('input_778')).toBe(true)
    expect(byKey.get('input_1174')).toBe(false)
  })

  it('carries the platform’s own downstream mapping through untouched', () => {
    const packet = build({ '1174': 'Tony' })
    const entry = packet.entries.find((e) => e.key === 'input_1174')
    expect(entry?.toscana).toBeTruthy()
  })
})
