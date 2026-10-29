import { describe, expect, it } from 'vitest'
import { cardSchema } from '@contracts/cards.ts'
import { formSnapshot } from '@tenants/boi/forms/snapshots.ts'
import type { FormField } from '@domain/forms/definition.ts'
import { declarationWording } from '@domain/forms/wording.ts'
import { ARRANGEMENT_CARD, PLAN_CARD, STATUS_AT_START } from '@/content/how-it-works/story'
import { showcaseConfig } from './config'
import {
  CONNECT_CARD,
  FORM_DECLARATIONS_CARD,
  SHOWCASE_ARRANGEMENT_CARD,
  MORTGAGE_OPTION_CARD,
  OVERVIEW_CARD,
  SHOWCASE_PLAN_CARD,
  SHOWCASE_REUSE_CARD,
  STATUS_MORTGAGE_CARD,
  STATUS_OPENED_CARD,
  STATUS_STARTED_CARD,
  TRANSFER_CARD,
  WALKTHROUGH_EVENTS,
} from './walkthrough'

/**
 * The walkthrough is data, and these are the promises the data keeps: every card is one the
 * product could render, every event is in order and inside the chapter, nothing is typed or
 * thought backwards, nothing lands behind a cutaway, the figures the room reads are the
 * engines' own, and the form's words are the form's.
 */
const DURATION = showcaseConfig.chapters.walkthrough.durationTargetMs

describe('the walkthrough transcript', () => {
  it('every card is a card the product could render', () => {
    for (const event of WALKTHROUGH_EVENTS) {
      if (event.kind !== 'card') continue
      const result = cardSchema.safeParse(event.card)
      expect(result.success, `${event.id}: ${result.error?.message ?? ''}`).toBe(true)
    }
    for (const card of [
      SHOWCASE_PLAN_CARD,
      SHOWCASE_ARRANGEMENT_CARD,
      CONNECT_CARD,
      OVERVIEW_CARD,
      SHOWCASE_REUSE_CARD,
      FORM_DECLARATIONS_CARD,
      TRANSFER_CARD,
      STATUS_STARTED_CARD,
      STATUS_OPENED_CARD,
      STATUS_MORTGAGE_CARD,
      MORTGAGE_OPTION_CARD,
    ]) {
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

  it('nothing on the phone lands while a cutaway covers it', () => {
    const cutaways = WALKTHROUGH_EVENTS.flatMap((event) => (event.kind === 'cutaway' ? [event] : []))
    for (const event of WALKTHROUGH_EVENTS) {
      if (event.kind === 'cutaway' || event.kind === 'cut') continue
      const hidden = cutaways.find((cutaway) => cutaway.atMs <= event.atMs && event.atMs < cutaway.untilMs)
      expect(hidden, `${event.id} lands behind ${hidden?.id ?? ''}`).toBeUndefined()
    }
  })

  it('the open banking picture is the engine’s own output over this customer’s facts', () => {
    if (OVERVIEW_CARD.type !== 'accounts_overview' || TRANSFER_CARD.type !== 'transfer') throw new Error('shape')
    const savings = OVERVIEW_CARD.accounts.find((account) => account.accountType === 'savings')
    expect(savings?.balance).toBe(32_000)
    expect(OVERVIEW_CARD.savingsHeld).toBe(32_000)
    expect(OVERVIEW_CARD.salary?.employer).toBe('Ardán Software Limited')
    expect(OVERVIEW_CARD.regular.some((item) => item.amount === 1_800)).toBe(true)
    for (const account of OVERVIEW_CARD.accounts) expect(account.ibanMasked).toMatch(/4$|\d{4}$/)
    // The transfer leaves the account the overview showed, for what it held, into the account she holds here.
    expect(TRANSFER_CARD.fromAccountId).toBe(savings?.id)
    expect(TRANSFER_CARD.amount).toBe(savings?.balance)
    expect(TRANSFER_CARD.toApplicationId).toBeNull()
  })

  it('the three accounts the arrangement starts are the three the status and reuse cards show', () => {
    if (STATUS_STARTED_CARD.type !== 'status' || SHOWCASE_REUSE_CARD.type !== 'reuse') throw new Error('shape')
    expect(STATUS_STARTED_CARD.applications.map((application) => application.product)).toEqual(['savings', 'savings', 'savings'])
    expect(SHOWCASE_REUSE_CARD.started).toHaveLength(3)
    expect(STATUS_STARTED_CARD.applications.map((application) => application.displayName)).toEqual(SHOWCASE_REUSE_CARD.started)
    for (const item of SHOWCASE_REUSE_CARD.items) {
      expect(item.usedFor).toEqual(SHOWCASE_REUSE_CARD.started)
    }
    expect(SHOWCASE_REUSE_CARD.items).toHaveLength(6)
    expect(SHOWCASE_REUSE_CARD.title).toBe('6 things you never had to type')
  })

  it('cuts the long cards to the phone’s screen without inventing anything', () => {
    if (SHOWCASE_PLAN_CARD.type !== 'plan_proposal' || PLAN_CARD.type !== 'plan_proposal') throw new Error('shape')
    expect(SHOWCASE_PLAN_CARD.milestones).toHaveLength(4)
    for (const milestone of SHOWCASE_PLAN_CARD.milestones) expect(PLAN_CARD.milestones).toContainEqual(milestone)

    if (SHOWCASE_ARRANGEMENT_CARD.type !== 'arrangement' || ARRANGEMENT_CARD.type !== 'arrangement') throw new Error('shape')
    expect(SHOWCASE_ARRANGEMENT_CARD.firstYearInterest).toBe(ARRANGEMENT_CARD.firstYearInterest)
    expect(SHOWCASE_ARRANGEMENT_CARD.bonus?.amount).toBe(ARRANGEMENT_CARD.bonus?.amount)
    const originals = ARRANGEMENT_CARD.allocations
    SHOWCASE_ARRANGEMENT_CARD.allocations.forEach((allocation, index) => {
      const original = originals[index]
      expect({ ...allocation, watch: original?.watch }).toEqual(original)
    })

    if (STATUS_MORTGAGE_CARD.type !== 'status' || STATUS_AT_START.type !== 'status') throw new Error('shape')
    const mortgage = STATUS_MORTGAGE_CARD.applications.find((application) => application.product === 'mortgage')
    const original = STATUS_AT_START.applications.find((application) => application.product === 'mortgage')
    if (mortgage === undefined || original === undefined) throw new Error('no mortgage')
    const left = mortgage.steps.filter((step) => !step.done)
    expect(left.length).toBeLessThanOrEqual(3)
    expect(mortgage.outstandingCount).toBe(left.length)
    for (const step of mortgage.steps) expect(original.steps).toContainEqual(step)
  })

  it('recites the SuperSaver form’s declarations in the form’s own words', () => {
    const snapshot = formSnapshot('1833')
    if (snapshot === undefined) throw new Error('No snapshot for the SuperSaver form')
    if (FORM_DECLARATIONS_CARD.type !== 'form_declarations') throw new Error('shape')
    const fields = new Map<string, FormField>(snapshot.definition.fields.map((field) => [field.id, field]))
    for (const declaration of FORM_DECLARATIONS_CARD.declarations) {
      const field = fields.get(declaration.fieldId)
      expect(field, declaration.fieldId).toBeDefined()
      expect(field?.type, declaration.fieldId).toBe('checkbox')
      if (field === undefined) throw new Error(declaration.fieldId)
      expect(declarationWording(field), declaration.fieldId).toBe(declaration.wording)
    }
  })

  it('offers the mortgage, and only the mortgage, when the deposit is there', () => {
    if (MORTGAGE_OPTION_CARD.type !== 'product_options') throw new Error('shape')
    expect(MORTGAGE_OPTION_CARD.options.map((option) => option.product)).toEqual(['mortgage'])
  })
})
