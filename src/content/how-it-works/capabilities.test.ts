import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CARD_TYPES, cardSchema } from '@contracts/cards.ts'
import { STAGES } from '@domain/conversation/stages.ts'
import { buildQuote } from '@domain/quotes/engine.ts'
import { CONVERSATION } from '@llm/conversation.ts'
import { PRESET_NAMES } from '@llm/persona.ts'
import { TONE_BUCKETS, refusalFor } from '@llm/refusals.ts'
import { boiKnowledgeBase } from '@tenants/boi/knowledge-base.ts'
import { rateOf } from '@tenants/boi/rates.ts'
import { surfaceableProducts } from '@tenants/boi/kb-prompt.ts'
import { productInfo } from '@tenants/boi/products.ts'
import { PUBLISHED_RATES } from '@tenants/boi/mortgage-rates-select.ts'
import { MEASURED, capabilities } from './capabilities'
import { COMPARISON_CARD, COMPARISON_IDS, QUOTE_CARD, QUOTE_REQUEST, gallery } from './gallery'
import { guardrailCases } from './guardrails'

const ADR_DIR = 'vault/docs/decisions'

/**
 * The capabilities chapter says what is built. This checks it against what is.
 */

describe('the gallery', () => {
  it('renders only cards the product can', () => {
    for (const entry of gallery) {
      const parsed = cardSchema.safeParse(entry.card)
      expect(parsed.success, `${entry.id}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
      expect(entry.card.type).toBe(entry.id)
    }
  })

  it('pins the comparison the knowledge base produces', () => {
    const products = surfaceableProducts(boiKnowledgeBase.products)
    if (COMPARISON_CARD.type !== 'comparison') throw new Error('not a comparison')

    expect(COMPARISON_CARD.options.map((option) => option.id)).toEqual([...COMPARISON_IDS])

    for (const option of COMPARISON_CARD.options) {
      const product = products.find((candidate) => candidate.id === option.id)
      expect(product, option.id).toBeDefined()
      if (product === undefined) continue
      const rate = rateOf(product)

      expect(option.name).toBe(product.name)
      expect(option.oneLine).toBe(product.customer_job)
      expect(option.rate).toBe(rate?.headline ?? null)
      expect(option.rateNote).toBe(rate?.note ?? null)
      expect(option.highlights).toEqual(product.features.slice(0, 4))
      expect(option.endsIn).toBe(
        product.advice_model === 'information_or_self_serve'
          ? null
          : product.advice_model.replaceAll('_', ' '),
      )
    }
  })

  it('pins the quote the engine produces', () => {
    const quote = buildQuote(productInfo('personal_loan').variants ?? [], QUOTE_REQUEST)
    if (QUOTE_CARD.type !== 'quote') throw new Error('not a quote')

    expect(QUOTE_CARD.basis).toBe(quote.basis)
    expect(QUOTE_CARD.displayName).toBe(productInfo('personal_loan').name)
    expect(QUOTE_CARD.options).toEqual(
      quote.options.map((option) => ({
        id: option.id,
        name: option.name,
        highlight: option.highlight,
        headline: option.headline,
        figures: [...option.figures],
        footnote: option.footnote,
      })),
    )
  })
})

describe('the measured counts', () => {
  it('match the code where the code can be counted', () => {
    expect(MEASURED.cards).toBe(CARD_TYPES.length)

    const tools = new Set(STAGES.flatMap((stage) => CONVERSATION[stage].tools))
    expect(MEASURED.tools).toBe(tools.size)

    expect(MEASURED.mortgageRates).toBe(PUBLISHED_RATES.rates.length)

    // The decision records moved out of the public tree with the rest of the docs on
    // 2026-10-20 (`vault/` is gitignored), so this check can only run where the vault is
    // present. In CI the count is taken on trust; locally it is still verified.
    if (existsSync(ADR_DIR)) {
      const adrs = readdirSync(ADR_DIR).filter((name) => /^ADR-\d{4}/.test(name))
      expect(MEASURED.adrs).toBe(adrs.length)
    }

    const cases = readFileSync('evals/guardrails/cases.jsonl', 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0)
    expect(MEASURED.guardrailCases).toBe(cases.length)
  })

  it('names the nine console sections as the console does', () => {
    const console_ = readFileSync('src/admin/AdminConsole.tsx', 'utf8')
    const tile = capabilities.find((capability) => capability.title.startsWith('A console with'))
    expect(tile).toBeDefined()
    expect(tile?.title).toBe('A console with nine sections')
    for (const label of [
      'Cases',
      'Goals & needs',
      'Products & rates',
      'Analytics',
      'Digital forms',
      'Guardrails',
      'Persona',
      'Feedback',
      'Collaborators',
    ]) {
      expect(console_).toContain(`label: '${label}'`)
      expect(tile?.body).toContain(label)
    }
  })

  it('labels every unbuilt thing as a direction', () => {
    const directions = capabilities.filter((capability) => capability.claim === 'production')
    expect(directions.map((capability) => capability.title)).toEqual([
      'Baz for the partner',
      'A plan the customer can browse',
    ])
    for (const direction of directions) {
      expect(direction.body).toMatch(/not built|is a direction/)
    }
  })
})

describe('the guardrail extract', () => {
  const set = new Map(
    readFileSync('evals/guardrails/cases.jsonl', 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { id: string; input: string; expect: string; previousAssistantTurn?: string })
      .map((entry) => [entry.id, entry] as const),
  )

  it('copies the eval set exactly', () => {
    for (const extract of guardrailCases) {
      const original = set.get(extract.id)
      expect(original, extract.id).toBeDefined()
      expect(extract.input).toBe(original?.input)
      expect(extract.expect).toBe(original?.expect)
      expect(extract.previousAssistantTurn).toBe(original?.previousAssistantTurn)
    }
  })

  it('has a refusal in every tone for every blocked case, and lets banking through', () => {
    for (const extract of guardrailCases) {
      if (extract.expect === 'allow') {
        expect(extract.category).toBe('banking')
        continue
      }
      expect(extract.category).not.toBe('banking')
      for (const bucket of TONE_BUCKETS) {
        const refusal = refusalFor(extract.category, bucket)
        expect(refusal.length).toBeGreaterThan(0)
        // §26: a refusal never contains the answer or acknowledges what was asked.
        expect(refusal.toLowerCase()).not.toContain('mona lisa')
      }
    }
  })
})

describe('the persona proof', () => {
  it('offers exactly the presets the composer knows', () => {
    expect([...PRESET_NAMES]).toEqual(['default', 'concise', 'friendly', 'formal', 'dry_humour', 'poetic'])
  })
})
