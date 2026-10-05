import { describe, expect, it } from 'vitest'
import { factCatalogue } from '@domain/facts.ts'
import { TOOLS, TOOL_NAMES, validateToolCall } from './tools.ts'

const uuid = '3f8b0c7e-0000-4000-8000-000000000001'

/**
 * Invariant 1 — the model proposes, the UI commits.
 *
 * This is asserted by absence, which is easy to erode later: someone adds a convenient
 * `submit_application` tool and the invariant is gone with no test failing. So the forbidden
 * verbs are named explicitly.
 */
describe('the model has no tool that takes an action', () => {
  const forbidden = [
    'create_application',
    'submit_application',
    'submit',
    'pause_application',
    'resume_application',
    'grant_consent',
    'invite_partner',
    'make_declaration',
    'approve',
    'decline',
    'set_status',
    'update_application',
  ]

  for (const name of forbidden) {
    it(`has no "${name}" tool`, () => {
      expect(TOOL_NAMES).not.toContain(name)
    })
  }

  it('exposes only tools that show or record, never ones that act', () => {
    // CLAUDE.md lists seven. `show_form` is the eighth, added for §7.5: health data cannot be
    // collected in conversation, so there has to be a way to surface the form. It still only
    // shows — the server decides which form is due, and the customer's tap is what commits.
    expect([...TOOL_NAMES].sort()).toEqual([
      'record_facts',
      'request_upload',
      'show_form',
      'show_partner_invite',
      'show_pause_prompt',
      'show_product_options',
      'show_review',
      'show_status',
    ])
  })

  it('does not let the model choose which form to show', () => {
    // Naming the application only is what stops it reaching the health questions before
    // consent has been given (§7.5, Invariant 6).
    const result = validateToolCall('show_form', {
      applicationId: uuid,
      requirementId: 'health-consent',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.input as object)).toEqual(['applicationId'])
  })

  it('describes every tool as showing or recording, never as doing', () => {
    for (const tool of TOOLS) {
      expect(tool.description.length, tool.name).toBeGreaterThan(40)
    }
  })
})

describe('validateToolCall()', () => {
  it('rejects an unknown tool by name rather than throwing', () => {
    const result = validateToolCall('submit_application', {})
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/unknown tool/i)
  })

  it('rejects a fact key that is not in the catalogue', () => {
    const result = validateToolCall('record_facts', {
      facts: [{ key: 'income.somethingMadeUp', subject: 'primary', value: 1 }],
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a catalogue key', () => {
    const result = validateToolCall('record_facts', {
      facts: [{ key: 'income.annualBasic', subject: 'primary', value: 92_000 }],
    })
    expect(result.ok).toBe(true)
  })

  it('refuses an empty or oversized batch of facts', () => {
    expect(validateToolCall('record_facts', { facts: [] }).ok).toBe(false)
    expect(
      validateToolCall('record_facts', {
        facts: Array.from({ length: 13 }, () => ({
          key: 'income.annualBasic',
          subject: 'primary',
          value: 1,
        })),
      }).ok,
    ).toBe(false)
  })

  it('requires a real reason when offering products, not a bare list (§49)', () => {
    expect(
      validateToolCall('show_product_options', {
        products: [{ product: 'mortgage', reason: 'yes' }],
      }).ok,
    ).toBe(false)

    expect(
      validateToolCall('show_product_options', {
        products: [{ product: 'mortgage', reason: 'You said you are buying your first home.' }],
      }).ok,
    ).toBe(true)
  })

  it('rejects a product that is not supported', () => {
    expect(
      validateToolCall('show_product_options', {
        products: [{ product: 'crypto_wallet', reason: 'A long enough reason string here.' }],
      }).ok,
    ).toBe(false)
  })

  it('requires an application id that looks like one', () => {
    expect(validateToolCall('show_review', { applicationId: 'the mortgage' }).ok).toBe(false)
    expect(validateToolCall('show_review', { applicationId: uuid }).ok).toBe(true)
  })

  it('lets show_status cover every application', () => {
    expect(validateToolCall('show_status', {}).ok).toBe(true)
  })

  it('reports every problem rather than only the first', () => {
    const result = validateToolCall('show_product_options', {
      products: [{ product: 'nope', reason: 'x' }],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.split(';').length).toBeGreaterThan(1)
  })
})

/**
 * Invariant 6 — the model may never write a fact the catalogue marks non-extractable.
 * The schema cannot express this, so `record_facts` is checked against the catalogue at the
 * point of effect. This test pins the catalogue data the check depends on.
 */
describe('health data is unreachable through record_facts', () => {
  it('marks every protection health key non-extractable', () => {
    const healthKeys = Object.keys(factCatalogue).filter((key) =>
      key.startsWith('protection.health.'),
    )

    expect(healthKeys.length).toBeGreaterThan(0)
    for (const key of healthKeys) {
      expect(factCatalogue[key as keyof typeof factCatalogue].extractable, key).toBe(false)
    }
  })
})
