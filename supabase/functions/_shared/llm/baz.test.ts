import { describe, expect, it } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { boiDomainConfig } from '../tenants/boi/domain-config.ts'
import { boiProducts } from '../tenants/boi/products.ts'
import { runBazTurn, type BazTurnOptions } from './baz.ts'
import { slidersFor } from './persona.ts'
import type { PromptInput } from './prompt.ts'

/**
 * A scripted stand-in for the SDK's streaming client: each entry is one round's reply, as the
 * text it streams plus whatever tool it asks for.
 */
type Round = { readonly text: string; readonly tool?: string; readonly input?: unknown }

function clientReturning(rounds: readonly Round[]): Anthropic {
  let round = -1

  return {
    messages: {
      stream: () => {
        round += 1
        const current = rounds[round] ?? { text: '' }

        const content: Anthropic.ContentBlock[] = [
          { type: 'text', text: current.text, citations: null },
          ...(current.tool
            ? [
                {
                  type: 'tool_use',
                  id: `t${String(round)}`,
                  name: current.tool,
                  // Tool input is validated before anything runs, so a card only appears when a
                  // round supplies input the schema accepts.
                  input: current.input ?? {},
                } as Anthropic.ContentBlock,
              ]
            : []),
        ]

        const deltas = [
          { type: 'content_block_delta', delta: { type: 'text_delta', text: current.text } },
        ]

        return {
          [Symbol.asyncIterator]: () => {
            let index = 0
            return {
              next: () =>
                Promise.resolve(
                  index < deltas.length
                    ? { value: deltas[index++], done: false }
                    : { value: undefined, done: true },
                ),
            }
          },
          finalMessage: () =>
            Promise.resolve({
              content,
              stop_reason: current.tool ? 'tool_use' : 'end_turn',
            }),
        }
      },
    },
  } as unknown as Anthropic
}

const prompt: PromptInput = {
  domainConfig: boiDomainConfig,
  products: boiProducts,
  sliders: slidersFor('default'),
  digest: {
    customerName: 'Aoife',
    authLevel: 'authenticated',
    facts: [],
    applications: [],
    declinedProducts: [],
    advisories: [],
    partner: null,
    eventsSinceLastSeen: [],
  },
}

function options(rounds: readonly Round[], withCard = false): BazTurnOptions {
  return {
    client: clientReturning(rounds),
    model: 'test-model',
    prompt,
    history: [{ role: 'user', content: 'I want to buy my first home' }],
    executeTool: () =>
      Promise.resolve(
        withCard
          ? { result: 'Status shown.', card: { type: 'status', applications: [] } as never }
          : { result: 'Options shown.' },
      ),
    enabledTools: ['show_product_options'],
  }
}

async function textOf(rounds: readonly Round[], withCard = false): Promise<string> {
  let text = ''
  for await (const event of runBazTurn(options(rounds, withCard))) {
    if (event.type === 'text_delta') text += event.text
  }
  return text
}

describe('runBazTurn', () => {
  it('breaks between what the model said before a tool ran and what it said after', async () => {
    const text = await textOf([
      { text: 'Let me pull those up.', tool: 'show_product_options' },
      { text: 'Mortgage first is usually the sensible order.' },
    ])

    // Without the break these arrive as "...pull those up.Mortgage first...".
    expect(text).toBe('Let me pull those up.\n\nMortgage first is usually the sensible order.')
  })

  it('does not open with a break when the model says nothing before the tool', async () => {
    const text = await textOf([
      { text: '', tool: 'show_product_options' },
      { text: 'Here are the two worth looking at.' },
    ])

    expect(text).toBe('Here are the two worth looking at.')
  })

  it('leaves a single round untouched', async () => {
    expect(await textOf([{ text: 'A mortgage is the place to start.' }])).toBe(
      'A mortgage is the place to start.',
    )
  })

  /**
   * Seen once in testing: every round spent calling a tool the server refused, and the customer
   * got an empty bubble. Silence is the one reply that cannot be recovered from — nothing to
   * read and nothing to tap.
   */
  it('says something when every round went on tools and none on words', async () => {
    const text = await textOf([
      { text: '', tool: 'show_product_options' },
      { text: '', tool: 'show_product_options' },
      { text: '', tool: 'show_product_options' },
    ])

    expect(text).toMatch(/say that again/i)
  })

  it('stays quiet when a card carries the turn', async () => {
    // A card on its own is terse, not broken, so nothing is added to it.
    const text = await textOf(
      [
        {
          text: '',
          tool: 'show_product_options',
          input: { products: [{ product: 'mortgage', reason: 'They said they are buying.' }] },
        },
        { text: '' },
      ],
      true,
    )

    expect(text).toBe('')
  })
})
