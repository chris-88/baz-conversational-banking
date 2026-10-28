import { describe, expect, it } from 'vitest'
import { cardSchema } from '@contracts/cards.ts'
import { formSnapshot } from '@tenants/boi/forms/snapshots.ts'
import type { FormField } from '@domain/forms/definition.ts'
import { showcaseConfig } from './config'
import {
  FORM_DECLARATIONS_CARD,
  FORM_UPLOAD_CARD,
  SHOWCASE_OPTIONS_CARD,
  SHOWCASE_REUSE_CARD,
  SHOWCASE_STATUS_CARD,
  UPLOAD_REQUEST_CARD,
  WALKTHROUGH_EVENTS,
} from './walkthrough'

/**
 * The walkthrough is data, and these are the promises the data keeps: every card is one the
 * product could render, every event is in order and inside the chapter, nothing is typed or
 * thought about backwards, and the form's words are the form's.
 */
const DURATION = showcaseConfig.chapters.walkthrough.durationTargetMs

describe('the walkthrough transcript', () => {
  it('every card is a card the product could render', () => {
    for (const event of WALKTHROUGH_EVENTS) {
      if (event.kind !== 'card') continue
      const result = cardSchema.safeParse(event.card)
      expect(result.success, `${event.id}: ${result.error?.message ?? ''}`).toBe(true)
    }
    for (const card of [SHOWCASE_OPTIONS_CARD, SHOWCASE_REUSE_CARD, SHOWCASE_STATUS_CARD, FORM_DECLARATIONS_CARD, FORM_UPLOAD_CARD, UPLOAD_REQUEST_CARD]) {
      expect(cardSchema.safeParse(card).success).toBe(true)
    }
  })

  it('is in time order and inside the chapter', () => {
    let last = -1
    for (const event of WALKTHROUGH_EVENTS) {
      expect(event.atMs, event.id).toBeGreaterThanOrEqual(last)
      expect(event.atMs, event.id).toBeGreaterThanOrEqual(0)
      expect(event.atMs, event.id).toBeLessThan(DURATION)
      last = event.atMs
    }
  })

  it('types forward, thinks forward, settles forward', () => {
    WALKTHROUGH_EVENTS.forEach((event, index) => {
      const previous = WALKTHROUGH_EVENTS[index - 1]
      switch (event.kind) {
        case 'customer':
          expect(event.typeFromMs, event.id).toBeLessThan(event.atMs)
          if (previous !== undefined) expect(event.typeFromMs, event.id).toBeGreaterThanOrEqual(previous.atMs)
          break
        case 'baz':
          expect(event.thinkingFromMs, event.id).toBeLessThan(event.atMs)
          if (previous !== undefined) expect(event.thinkingFromMs, event.id).toBeGreaterThanOrEqual(previous.atMs)
          break
        case 'card':
          if (event.settleAtMs !== undefined) {
            expect(event.settleAtMs, event.id).toBeGreaterThan(event.atMs)
            expect(event.settled, event.id).toBeDefined()
          }
          break
        case 'cutaway':
          expect(event.untilMs, event.id).toBeGreaterThan(event.atMs)
          expect(event.untilMs, event.id).toBeLessThanOrEqual(DURATION)
          break
        case 'cut':
          break
      }
    })
  })

  it('cutaways do not overlap, and nothing arrives on the phone behind one', () => {
    const cutaways = WALKTHROUGH_EVENTS.filter((event) => event.kind === 'cutaway')
    cutaways.forEach((cutaway, index) => {
      const next = cutaways[index + 1]
      if (next !== undefined) expect(next.atMs, cutaway.id).toBeGreaterThanOrEqual(cutaway.untilMs)
    })
    for (const event of WALKTHROUGH_EVENTS) {
      if (event.kind === 'cutaway' || event.kind === 'cut') continue
      const hidden = cutaways.find((cutaway) => cutaway.atMs <= event.atMs && event.atMs < cutaway.untilMs)
      expect(hidden, `${event.id} lands behind ${hidden?.id ?? ''}`).toBeUndefined()
    }
  })

  it('the three applications the chapter starts are the three the status and reuse cards show', () => {
    if (SHOWCASE_STATUS_CARD.type !== 'status' || SHOWCASE_REUSE_CARD.type !== 'reuse') throw new Error('shape')
    expect(SHOWCASE_STATUS_CARD.applications.map((application) => application.product)).toEqual([
      'mortgage',
      'joint_account',
      'personal_loan',
    ])
    expect(SHOWCASE_REUSE_CARD.started).toHaveLength(3)
    for (const item of SHOWCASE_REUSE_CARD.items) {
      expect(item.usedFor.length).toBeGreaterThan(0)
      for (const product of item.usedFor) expect(SHOWCASE_REUSE_CARD.started).toContain(product)
    }
    expect(SHOWCASE_REUSE_CARD.title).toBe(`${String(SHOWCASE_REUSE_CARD.items.length)} things you never had to type`)
  })

  it('recites the loan form’s declarations in the form’s own words', () => {
    const snapshot = formSnapshot('1940')
    if (snapshot === undefined) throw new Error('No snapshot for the loan form')
    if (FORM_DECLARATIONS_CARD.type !== 'form_declarations') throw new Error('shape')
    const fields = new Map<string, FormField>(snapshot.definition.fields.map((field) => [field.id, field]))
    for (const declaration of FORM_DECLARATIONS_CARD.declarations) {
      const field = fields.get(declaration.fieldId)
      expect(field, declaration.fieldId).toBeDefined()
      expect(field?.type, declaration.fieldId).toBe('checkbox')
      expect(field?.label, declaration.fieldId).toBe(declaration.wording)
    }
  })

  it('asks for the document the form’s upload control accepts, within its limits', () => {
    const snapshot = formSnapshot('1940')
    if (snapshot === undefined) throw new Error('No snapshot for the loan form')
    const upload = FORM_UPLOAD_CARD
    if (upload.type !== 'form_upload') throw new Error('shape')
    const field = snapshot.definition.fields.find((candidate) => candidate.id === upload.fieldId)
    expect(field?.type).toBe('fileupload')
    // The limits sit on the control's own configuration, read the way `baz-turn` reads them.
    const raw = field?.platform?.['allowedExtensions']
    const allowed = (typeof raw === 'string' ? raw : '')
      .split(',')
      .map((extension) => extension.trim())
      .filter(Boolean)
    expect([...upload.acceptedExtensions].sort()).toEqual([...allowed].sort())
    expect(upload.maxFileSizeMb).toBe(Number(field?.platform?.['maxFileSize']))
  })
})
