import { describe, expect, it } from 'vitest'
import { mayOfferProducts, mayProposePlan, stageFor, STAGES, type StageContext } from './stages.ts'

const base: StageContext = {
  customerTurns: 3,
  goalNamed: false,
  goalGaps: 5,
  approach: null,
  planAccepted: false,
  applications: 0,
}

const at = (over: Partial<StageContext>) => stageFor({ ...base, ...over })

describe('where a conversation has got to', () => {
  it('opens on the first thing anybody says', () => {
    expect(at({ customerTurns: 1 })).toBe('opening')
  })

  it('discovers until it could name the goal', () => {
    expect(at({ customerTurns: 2, goalNamed: false })).toBe('discovering')
    expect(at({ goalNamed: true, goalGaps: 4 })).toBe('discovering')
  })

  /**
   * The brake. Asking "a plan, or just the account?" the moment somebody mentions a house,
   * before anybody knows when, with whom or on what, skips the part where they are understood,
   * which is the same failure as offering the product.
   */
  it('waits for the goal to be nearly filled in before asking the fork', () => {
    expect(at({ goalNamed: true, goalGaps: 3 })).toBe('discovering')
    expect(at({ goalNamed: true, goalGaps: 2 })).toBe('direction')
    expect(at({ goalNamed: true, goalGaps: 0 })).toBe('direction')
  })

  it('plans when they asked for a plan', () => {
    expect(at({ goalNamed: true, goalGaps: 1, approach: 'plan' })).toBe('planning')
  })

  it('goes straight to choosing when they say they just want the product', () => {
    // Somebody who knows what they want is taken at their word, without a plan in the way.
    expect(at({ goalNamed: true, goalGaps: 1, approach: 'product' })).toBe('choosing')
  })

  it('chooses once a plan is theirs', () => {
    expect(at({ approach: 'plan', planAccepted: true })).toBe('choosing')
  })

  it('applies once anything is started, whatever came before it', () => {
    expect(at({ applications: 1 })).toBe('applying')
    expect(at({ customerTurns: 1, applications: 1 })).toBe('applying')
    expect(at({ approach: 'plan', applications: 2 })).toBe('applying')
  })

  /**
   * The stage is read off the case every turn and never stored, so a customer who corrects
   * something moves the conversation back by itself rather than carrying on from a position
   * the case no longer supports.
   */
  it('moves back when the case no longer supports where it was', () => {
    expect(at({ goalNamed: true, goalGaps: 1, approach: 'plan' })).toBe('planning')
    expect(at({ goalNamed: true, goalGaps: 1, approach: null })).toBe('direction')
    expect(at({ goalNamed: false, goalGaps: 5, approach: null })).toBe('discovering')
  })
})

describe('what a stage permits', () => {
  it('offers no product before the customer has chosen a direction', () => {
    expect(mayOfferProducts('opening')).toBe(false)
    expect(mayOfferProducts('discovering')).toBe(false)
    expect(mayOfferProducts('direction')).toBe(false)
    expect(mayOfferProducts('planning')).toBe(false)
    expect(mayOfferProducts('choosing')).toBe(true)
    expect(mayOfferProducts('applying')).toBe(true)
  })

  it('proposes a plan only where one is being asked for or built', () => {
    expect(mayProposePlan('discovering')).toBe(false)
    expect(mayProposePlan('direction')).toBe(true)
    expect(mayProposePlan('planning')).toBe(true)
  })

  it('covers every stage, so adding one fails here rather than in a conversation', () => {
    for (const stage of STAGES) {
      expect(typeof mayOfferProducts(stage)).toBe('boolean')
    }
    expect(STAGES).toHaveLength(6)
  })
})
