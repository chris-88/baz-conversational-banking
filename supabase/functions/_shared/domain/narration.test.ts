import { describe, expect, it } from 'vitest'
import { NARRATABLE_EVENTS, describeEvent, isNarratable } from './narration.ts'

describe('saying what happened', () => {
  it('names the application and what the bank did', () => {
    expect(describeEvent({ type: 'application_approved', payload: { applicationName: 'Mortgage' } })).toBe(
      'Mortgage was approved.',
    )
    expect(describeEvent({ type: 'information_requested', payload: { applicationName: 'Mortgage', detail: 'a payslip' } })).toBe(
      'Mortgage: the team asked for a payslip.',
    )
  })

  it('names the partner when it knows them', () => {
    expect(describeEvent({ type: 'partner_completed', payload: { partnerName: 'Emma' } })).toBe(
      'Emma completed their part.',
    )
    expect(describeEvent({ type: 'partner_completed', payload: {} })).toBe('Your partner completed their part.')
  })

  /** Nobody wrote copy for it, so nobody reads a raw event name. */
  it('says nothing for an event it has no words for', () => {
    expect(describeEvent({ type: 'turn_tools', payload: {} })).toBeNull()
  })

  /** Every narratable event has a sentence, so the pill can never be blank. */
  it('has words for every narratable event', () => {
    for (const type of NARRATABLE_EVENTS) {
      expect(describeEvent({ type, payload: {} }), type).not.toBeNull()
      expect(isNarratable(type)).toBe(true)
    }
    expect(isNarratable('context_reused')).toBe(false)
  })
})
