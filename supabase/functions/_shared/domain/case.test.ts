import { describe, expect, it } from 'vitest'
import { CASE_KINDS, isPurgeable } from './case.ts'

/**
 * §47 — clearing out test conversations.
 *
 * The rule lives in the domain because the console counts what the button will delete and the
 * server decides what to delete. Two copies would be two chances to remove something the screen
 * said was safe.
 */
describe('what a purge spares', () => {
  const anonymous = { id: 'a', kind: 'customer', named: false }

  it('clears an unnamed test conversation', () => {
    expect(isPurgeable(anonymous, null)).toBe(true)
  })

  it('never clears the case on screen', () => {
    expect(isPurgeable(anonymous, 'a')).toBe(false)
  })

  it('never clears a case being driven from the stage', () => {
    expect(isPurgeable({ id: 'b', kind: 'presenter', named: false }, null)).toBe(false)
  })

  /**
   * The one that matters. The seeded canonical customer is the only case anybody names, and the
   * migration that made every visitor an ordinary `customer` took away the `presenter` kind that
   * used to protect it — so a purge would have quietly taken the one case worth keeping.
   */
  it('never clears a case somebody named', () => {
    expect(isPurgeable({ id: 'c', kind: 'customer', named: true }, null)).toBe(false)
  })

  /**
   * The console is sent a display label that falls back to "Unnamed · 1a2b3c4d", so reading a
   * name off that found one on every case and spared all of them. Whether a case was named is
   * supplied by whoever knows, not inferred from what is on screen.
   */
  it('turns on the flag, not on whatever the screen is showing', () => {
    expect(isPurgeable({ id: 'd', kind: 'customer', named: false }, null)).toBe(true)
  })

  it('knows the kinds the database accepts', () => {
    expect(CASE_KINDS).toContain('customer')
  })
})
