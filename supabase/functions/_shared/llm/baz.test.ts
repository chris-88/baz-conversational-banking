import { describe, expect, it } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { boiDomainConfig } from '../tenants/boi/domain-config.ts'
import { knowledgeBaseSection } from '../tenants/boi/kb-prompt.ts'
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
  productCatalogue: knowledgeBaseSection(),
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

/**
 * Caching is invisible until the bill arrives, so it is asserted on the request rather than
 * inferred from behaviour. Every one of these is a line item.
 */
describe('prompt caching', () => {
  const paramsOf = async (history: BazTurnOptions['history']) => {
    const seen: Record<string, unknown>[] = []
    const base = options([{ text: 'Right.' }])
    const client = {
      messages: {
        stream: (params: Record<string, unknown>) => {
          seen.push(params)
          return (base.client as unknown as { messages: { stream: () => unknown } }).messages.stream()
        },
      },
    } as unknown as Anthropic

    for await (const _ of runBazTurn({ ...base, client, history })) { /* drain */ }
    return seen[0] ?? {}
  }

  it('caches the stable prefix for an hour, and nothing after it', async () => {
    const params = await paramsOf([{ role: 'user', content: 'hello' }])
    const system = params.system as { text: string; cache_control?: { ttl?: string } }[]

    expect(system).toHaveLength(2)
    // An hour because the prefix is shared by every case: one write covers a whole session.
    expect(system[0]?.cache_control).toEqual({ type: 'ephemeral', ttl: '1h' })
    expect(system[1]?.cache_control).toBeUndefined()
    expect(system[0]?.text).toContain('# Products')
  })

  it('caches the conversation so far, at the last message', async () => {
    const params = await paramsOf([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'third' },
    ])
    const messages = params.messages as { content: unknown }[]

    // Everything before the marker is read at a tenth of the price; only the newest message
    // is written. Without it the whole window was re-read at full price, every round.
    expect(messages[0]?.content).toBe('first')
    expect(messages[1]?.content).toBe('second')
    expect(messages[2]?.content).toEqual([
      { type: 'text', text: 'third', cache_control: { type: 'ephemeral' } },
    ])
  })

  it('leaves a history of one alone rather than breaking on nothing', async () => {
    const params = await paramsOf([{ role: 'user', content: 'only' }])
    const messages = params.messages as { content: unknown }[]

    expect(messages).toHaveLength(1)
    expect(messages[0]?.content).toEqual([
      { type: 'text', text: 'only', cache_control: { type: 'ephemeral' } },
    ])
  })
})

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
