import { describe, expect, it } from 'vitest'
import { CASE_KINDS, CASE_STATUSES, caseStatus, type CaseStatusInput } from './case.ts'

const input = (over: Partial<CaseStatusInput> = {}): CaseStatusInput => ({
  everBlocked: false,
  applications: [],
  checkinDue: false,
  customerMessages: 3,
  ...over,
})

/**
 * §5 — what the case list sorts and filters by.
 *
 * Derived on every read, like every other state in this system, so a case cannot sit in the
 * wrong bucket because something forgot to update it.
 */
describe('what a case needs from whoever is watching', () => {
  it('leads with blocked, whatever else is true', () => {
    // A case that was blocked and has an application waiting is reported as blocked: that is the
    // thing somebody should actually look at.
    expect(
      caseStatus(input({ everBlocked: true, applications: [{ state: 'info_required' }] })),
    ).toBe('blocked')
  })

  it('flags an application that cannot move without someone', () => {
    expect(caseStatus(input({ applications: [{ state: 'info_required' }] }))).toBe('needs_review')
    expect(caseStatus(input({ applications: [{ state: 'waiting_partner' }] }))).toBe('needs_review')
  })

  it('flags a check-in the bank promised and has not kept', () => {
    expect(caseStatus(input({ checkinDue: true }))).toBe('needs_review')
  })

  it('is complete only when every application is finished', () => {
    expect(caseStatus(input({ applications: [{ state: 'completed' }] }))).toBe('completed')
    expect(
      caseStatus(input({ applications: [{ state: 'completed' }, { state: 'declined' }] })),
    ).toBe('completed')
    // One still running means the case is not done, however many others are.
    expect(
      caseStatus(input({ applications: [{ state: 'completed' }, { state: 'in_progress' }] })),
    ).toBe('in_progress')
  })

  it('does not call an empty case "in progress"', () => {
    // Every visitor gets a case the moment they arrive, so most of them are empty. Counting
    // those as conversations would make the busiest tab the least useful one.
    expect(caseStatus(input({ customerMessages: 0 }))).toBe('new')
    expect(caseStatus(input({ customerMessages: 1 }))).toBe('in_progress')
  })

  it('knows its own values', () => {
    expect(CASE_STATUSES).toContain('needs_review')
    expect(CASE_KINDS).toContain('customer')
  })
})
