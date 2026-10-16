import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { cardSchema } from '@contracts/cards.ts'
import { STAGES } from '@domain/conversation/stages.ts'
import { arrange } from '@domain/savings/arrange.ts'
import { formatRate } from '@domain/savings/situation.ts'
import { planDraftFor } from '@domain/goals/plan.ts'
import { boiSavingsOptions } from '@tenants/boi/savings-options.ts'
import { selectRates } from '@tenants/boi/mortgage-rates-select.ts'
import { CONVERSATION } from '@llm/conversation.ts'
import { ARRANGEMENT_INPUT, IDS, RATES_INPUT, REUSED_ROWS, STAGE_NAMES, story } from './story'

/**
 * The story is synthetic. Its shape is not allowed to be.
 *
 * Every card on the page is parsed against the contract the product uses, every figure that
 * came out of an engine is recomputed from that engine, and every quoted line is checked
 * against the fixture it claims to quote. A change to any of them fails here rather than
 * quietly leaving the explainer describing a product that no longer exists.
 */

const opening = JSON.parse(
  readFileSync('supabase/functions/baz-turn/fixtures/opening.json', 'utf8'),
) as { turns: { rounds: { deltas?: string[] }[] }[] }
const reuse = JSON.parse(
  readFileSync('supabase/functions/baz-turn/fixtures/reuse.json', 'utf8'),
) as { turns: { rounds: { deltas?: string[] }[] }[] }

const spoken = (script: typeof opening, turn: number): string =>
  (script.turns[turn]?.rounds ?? [])
    .flatMap((round) => round.deltas ?? [])
    .join('')
    .trim()

describe('the story', () => {
  it('renders only cards the product can', () => {
    for (const beat of story) {
      for (const { card } of beat.cards) {
        const parsed = cardSchema.safeParse(card)
        expect(parsed.success, `${beat.id}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
      }
    }
  })

  it('uses ids shaped as the contracts demand', () => {
    for (const id of Object.values(IDS)) {
      expect(z.uuid().safeParse(id).success, id).toBe(true)
    }
  })

  it('walks the thirteen §6 stages in order, without skipping one', () => {
    const stages = story.map((beat) => beat.stage)
    for (let at = 1; at < stages.length; at += 1) {
      expect(stages[at]).toBeGreaterThanOrEqual(stages[at - 1] ?? 0)
    }
    for (const stage of Object.keys(STAGE_NAMES).map(Number)) {
      expect(stages, `stage ${String(stage)} has no beat`).toContain(stage)
    }
  })

  it("names only engine stages that exist, and never moves the engine backwards", () => {
    let last = -1
    for (const beat of story) {
      if (beat.engineStage === undefined) continue
      const index = STAGES.indexOf(beat.engineStage)
      expect(index, beat.id).toBeGreaterThanOrEqual(0)
      expect(index, `${beat.id} moves back to ${beat.engineStage}`).toBeGreaterThanOrEqual(last)
      expect(CONVERSATION[beat.engineStage].tools.length).toBeGreaterThan(0)
      last = index
    }
  })

  it('quotes the fixtures exactly', () => {
    const quoted = story.flatMap((beat) => beat.lines.filter((line) => line.quoted !== undefined))
    const fixtureLines = quoted.filter((line) => line.quoted?.startsWith('fixture') === true)

    expect(fixtureLines.map((line) => line.text)).toEqual([
      spoken(opening, 0),
      spoken(opening, 1),
      spoken(reuse, 0),
    ])
  })

  it('pins the arrangement the engine produces', () => {
    const arrangement = arrange(ARRANGEMENT_INPUT, boiSavingsOptions)
    expect(arrangement).not.toBeNull()
    if (arrangement === null) return

    const card = story
      .flatMap((beat) => beat.cards)
      .map(({ card }) => card)
      .find((candidate) => candidate.type === 'arrangement')
    expect(card).toBeDefined()
    if (card?.type !== 'arrangement') return

    expect(card.allocations).toEqual(
      arrangement.allocations.map((allocation) => ({
        product: 'savings',
        catalogueId: allocation.productId,
        name: allocation.name,
        amount: allocation.amount,
        cadence: allocation.cadence,
        termMonths: allocation.termMonths,
        rate:
          `${formatRate(allocation.annualRate)} AER` +
          (allocation.termMonths === null ? '' : ` fixed for ${String(allocation.termMonths)} months`),
        job: allocation.job,
        watch: [...allocation.watch],
      })),
    )
    expect(card.firstYearInterest).toBe(arrangement.firstYearInterest)
    expect(card.bonus).toEqual(arrangement.bonus)
    expect(card.notes).toEqual([...arrangement.notes])
  })

  it('pins the rates the published table selects', () => {
    const selection = selectRates(RATES_INPUT)
    const card = story
      .flatMap((beat) => beat.cards)
      .map(({ card }) => card)
      .find((candidate) => candidate.type === 'mortgage_rates')
    expect(card).toBeDefined()
    if (card?.type !== 'mortgage_rates') return

    expect(card.asOf).toBe(selection.asOf)
    expect(card.options).toEqual(
      selection.options.map((option) => ({
        id: option.id,
        label: option.label,
        familyLabel: option.familyLabel,
        ratePct: option.ratePct,
        aprcPct: option.aprcPct,
        cashbackEur: option.cashbackEur,
        cashbackNote: option.cashbackNote,
        monthlyEur: option.monthlyEur,
        note: option.note,
      })),
    )
    expect(card.basis.buyerType).toBe(RATES_INPUT.customerType.replaceAll('_', ' '))
  })

  it('pins the plan the engine drafts', () => {
    const draft = planDraftFor({
      goal: 'buy_first_home',
      targetAmount: 40_000,
      targetDate: '2027-06-01',
      today: '2026-10-16',
    })
    expect(draft).not.toBeNull()
    if (draft === null) return

    const card = story
      .flatMap((beat) => beat.cards)
      .map(({ card }) => card)
      .find((candidate) => candidate.type === 'plan_proposal')
    expect(card).toBeDefined()
    if (card?.type !== 'plan_proposal') return

    expect(card.title).toBe(draft.title)
    expect(card.milestones.map((milestone) => milestone.label)).toEqual(
      draft.milestones.map((milestone) => milestone.label),
    )
    const first = draft.checkins[0]
    expect(card.checkin?.purpose).toBe(first?.purpose)
    expect(card.checkin?.when).toBe(first?.dueAt)
    expect(card.checkin?.agenda).toEqual(first?.agenda)
    // The server's arithmetic: what is left, over what is saved a month, rounded up.
    expect(card.monthsRemaining).toBe(Math.ceil((40_000 - 32_000) / 1_200))
  })

  it('counts reuse the way the metric does: one row per requirement per application', () => {
    const card = story
      .flatMap((beat) => beat.cards)
      .map(({ card }) => card)
      .find((candidate) => candidate.type === 'reuse')
    expect(card).toBeDefined()
    if (card?.type !== 'reuse') return

    expect(card.items.reduce((sum, item) => sum + item.usedFor.length, 0)).toBe(REUSED_ROWS)
    expect(card.title).toMatch(new RegExp(`^${String(card.items.length)} things`))
  })

  it('keeps every status row honest about what is outstanding', () => {
    for (const beat of story) {
      for (const { card } of beat.cards) {
        if (card.type !== 'status') continue
        for (const application of card.applications) {
          expect(application.outstandingCount, `${beat.id}: ${application.displayName}`).toBe(
            application.steps.filter((step) => !step.done).length,
          )
        }
      }
    }
  })
})
