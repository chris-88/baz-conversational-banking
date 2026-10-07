import { describe, expect, it } from 'vitest'
import { composeSystemPrompt } from './prompt.ts'
import { boiDomainConfig } from '../tenants/boi/domain-config.ts'
import { boiProducts } from '../tenants/boi/products.ts'
import type { CaseDigest } from './prompt.ts'

const SLIDERS = {
  length: 0.5,
  humour: 0.3,
  sarcasm: 0.1,
  formality: 0.5,
  playfulness: 0.3,
  poetic: 0,
}

const digest = (extra: Partial<CaseDigest> = {}): CaseDigest => ({
  customerName: 'Aoife',
  sensitiveHeld: [],
  needs: { surface: [], ask: null, hold: [] },
  plan: null,
  authLevel: 'anonymous',
  facts: [],
  applications: [],
  declinedProducts: [],
  advisories: [],
  partner: null,
  eventsSinceLastSeen: [],
  ...extra,
})

const compose = (extra: Partial<CaseDigest> = {}): string =>
  composeSystemPrompt({
    domainConfig: boiDomainConfig,
    products: boiProducts,
    sliders: SLIDERS,
    digest: digest(extra),
    sensitive: false,
    clarifyInScope: false,
  })

/**
 * That what the digest holds actually reaches the model.
 *
 * `goals` and `suitability` were computed every turn and silently dropped between the digest
 * builder and here, which no test caught because each half worked. This is the other end of the
 * same guard as `digest.test.ts`: there, everything handed in comes back out; here, everything
 * in the digest ends up in the prompt.
 */
describe('the digest reaches the prompt', () => {
  it('carries where the customer is trying to get to', () => {
    expect(compose({ goals: ['What they came in about: buying a first home.'] })).toContain(
      'buying a first home',
    )
  })

  it('carries whether something else would suit them better', () => {
    expect(compose({ suitability: ['Personal loan: cheaper over that term.'] })).toContain(
      'cheaper over that term',
    )
  })

  it('carries what applying would involve, under a heading that says not to recite it', () => {
    const prompt = compose({
      prospect: ['Mortgage — what applying would involve:', '  3 things already known: A, B, C.'],
    })

    expect(prompt).toContain('What applying would actually involve')
    expect(prompt).toContain('3 things already known')
    expect(prompt).toContain('rather than reciting it')
  })

  it('leaves a section out entirely when there is nothing to say', () => {
    const empty = compose()

    expect(empty).not.toContain('What applying would actually involve')
    expect(empty).not.toContain('Something else may suit them better')
  })
})

/**
 * The rates in the prompt are the rates on the card.
 *
 * `illustrativeTerms` used to carry its own, and they had drifted: the mortgage advertised
 * "3.85% for 3 years" in prose while the quote card offered 3.1%, 3.3%, 3.4% and 3.9%.
 */
describe('product rates', () => {
  const prompt = compose()

  it('states every variant the quote card can show', () => {
    for (const variant of boiProducts.mortgage.variants ?? []) {
      expect(prompt, variant.name).toContain(variant.name)
    }
  })

  it('states them as the figures they actually are', () => {
    expect(prompt).toContain('4-year fixed: 3.1% fixed for 4 years')
  })

  it('no longer carries the rate that contradicted them', () => {
    expect(prompt).not.toContain('3.85%')
  })
})
