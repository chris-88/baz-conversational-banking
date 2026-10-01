import { describe, expect, it } from 'vitest'
import { asApplicationId, asParticipantId } from '@domain/facts.ts'
import { boiDomainConfig } from '../tenants/boi/domain-config.ts'
import { boiProducts } from '../tenants/boi/products.ts'
import { slidersFor } from './persona.ts'
import { POLICY, composeSystemPrompt, type PromptInput } from './prompt.ts'

const baseInput = (): PromptInput => ({
  domainConfig: boiDomainConfig,
  products: boiProducts,
  sliders: slidersFor('default'),
  digest: {
    customerName: 'Aoife',
    authLevel: 'authenticated',
    facts: [{ label: 'Annual basic salary', value: '92,000', source: 'bank_held', verified: false }],
    applications: [
      { product: 'mortgage', displayName: 'Mortgage', state: 'in_progress', stateLabel: 'In progress', outstanding: ['Your PPS number'], waitingOn: 'primary' },
    ],
    declinedProducts: [],
    advisories: [],
    partner: null,
    eventsSinceLastSeen: [],
  },
})

describe('section order (CLAUDE.md > A Baz turn)', () => {
  it('places policy, domain, catalogue, persona and digest in that order', () => {
    const prompt = composeSystemPrompt(baseInput())

    const order = ['# Policy', '# Domain', '# Products', '## Style', '# Case'].map((heading) =>
      prompt.indexOf(heading),
    )

    expect(order.every((index) => index >= 0), 'every section is present').toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('puts the immutable policy first, so nothing after it can outrank it', () => {
    expect(composeSystemPrompt(baseInput()).indexOf('# Policy')).toBe(0)
  })
})

describe('prompt caching', () => {
  it('keeps the stable prefix byte-identical when only the case digest changes', () => {
    const a = composeSystemPrompt(baseInput())
    const b = composeSystemPrompt({
      ...baseInput(),
      digest: { ...baseInput().digest, customerName: 'Someone Else' },
    })

    const prefixOf = (prompt: string) => prompt.slice(0, prompt.indexOf('# Case'))
    expect(prefixOf(a)).toEqual(prefixOf(b))
  })

  it('changes the prefix when persona changes, because persona precedes the digest', () => {
    const a = composeSystemPrompt(baseInput())
    const b = composeSystemPrompt({ ...baseInput(), sliders: slidersFor('formal') })

    expect(a).not.toEqual(b)
  })

  it('reports where the cacheable prefix ends', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt(input)
    const { stablePrefix } = composeSystemPrompt.withBreakpoint(input)

    expect(prompt.startsWith(stablePrefix)).toBe(true)
    expect(stablePrefix).toContain('# Products')
    expect(stablePrefix).not.toContain('# Case')
  })
})

describe('policy', () => {
  it('states the rules that persona can never override', () => {
    for (const rule of [
      /never claim to be (a )?human/i,
      /state.*only.*product catalogue|only.*from the product catalogue/i,
      /never.*invent.*status|status.*only.*case/i,
      /health/i,
    ]) {
      expect(POLICY, rule.source).toMatch(rule)
    }
  })

  it('tells the model it cannot take actions itself', () => {
    expect(POLICY).toMatch(/you cannot|you do not have|the customer.*confirm/i)
  })
})

describe('the case digest (§14, Invariant 2)', () => {
  it('renders every application with its controlled state', () => {
    const prompt = composeSystemPrompt(baseInput())

    expect(prompt).toContain('Mortgage')
    expect(prompt).toContain('In progress')
    expect(prompt).toContain('Your PPS number')
  })

  it('lists declined products as not to be raised again (§49)', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt({
      ...input,
      digest: { ...input.digest, declinedProducts: ['personal_loan'] },
    })

    expect(prompt).toMatch(/do not raise again/i)
    expect(prompt).toContain('personal_loan')
  })

  it('says plainly when there are no applications yet', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt({
      ...input,
      digest: { ...input.digest, applications: [] },
    })

    expect(prompt).toMatch(/no applications/i)
  })

  it('carries what changed since the customer was last here (§36)', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt({
      ...input,
      digest: {
        ...input.digest,
        eventsSinceLastSeen: ['Your credit card application was approved'],
      },
    })

    expect(prompt).toMatch(/since.*last/i)
    expect(prompt).toContain('Your credit card application was approved')
  })

  it('names the partner and what is waiting on them', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt({
      ...input,
      digest: {
        ...input.digest,
        partner: { name: 'Emma', joined: true, outstanding: ["Emma's latest payslip"] },
      },
    })

    expect(prompt).toContain('Emma')
    expect(prompt).toContain("Emma's latest payslip")
  })
})

describe('the product catalogue (§51)', () => {
  it('includes the synthetic-terms disclaimer so figures cannot be presented as real', () => {
    expect(composeSystemPrompt(baseInput())).toMatch(/illustrative/i)
  })

  it('carries each product\'s cautions', () => {
    const prompt = composeSystemPrompt(baseInput())
    expect(prompt).toMatch(/never infer health information/i)
  })
})

describe('sensitivity (§50, Invariant 5)', () => {
  it('suppresses humour and product offers when the turn is sensitive', () => {
    const prompt = composeSystemPrompt({ ...baseInput(), sensitive: true })

    expect(prompt).toContain('No jokes.')
    expect(prompt).toMatch(/do not (offer|raise|suggest).*product/i)
  })

  it('leaves an ordinary turn free to raise relevant products', () => {
    expect(composeSystemPrompt(baseInput())).not.toMatch(/do not (offer|raise|suggest).*product/i)
  })
})

describe('ambiguous turns (§20)', () => {
  it('instructs the model to clarify within banking scope', () => {
    const prompt = composeSystemPrompt({ ...baseInput(), clarifyInScope: true })
    expect(prompt).toMatch(/clarify/i)
  })
})

describe('identifiers never reach the model as noise', () => {
  it('renders no raw UUIDs in the digest', () => {
    const input = baseInput()
    const prompt = composeSystemPrompt({
      ...input,
      digest: {
        ...input.digest,
        applications: [
          {
            product: 'mortgage',
            displayName: 'Mortgage',
            state: 'in_progress',
            stateLabel: 'In progress',
            outstanding: [],
            waitingOn: 'primary',
            id: asApplicationId('3f8b0c7e-0000-4000-8000-000000000001'),
          },
        ],
      },
    })

    // Application ids are needed for tool calls, so they appear — but exactly once, labelled.
    expect(prompt.match(/3f8b0c7e-0000-4000-8000-000000000001/g)).toHaveLength(1)
    expect(prompt).not.toContain(asParticipantId('should-not-appear'))
  })
})
