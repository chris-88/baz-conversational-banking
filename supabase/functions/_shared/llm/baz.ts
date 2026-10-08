import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { Card } from '../contracts/cards.ts'
import type { StreamEvent } from '../contracts/stream.ts'
import type { ModelUsage } from '../domain/cost.ts'
import { composeSystemPrompt, type PromptInput } from './prompt.ts'
import { TOOLS, validateToolCall, type ToolName } from './tools.ts'

/**
 * One Baz turn: stream text, run whatever tools the model asks for, stream the resulting
 * cards, and stop.
 *
 * The tool round limit is deliberate. Every tool here either records something or asks for a
 * card; none of them takes an action, so there is no legitimate reason for the model to loop,
 * and a bound means a confused turn ends rather than spending.
 */

const MAX_TOOL_ROUNDS = 3

/**
 * Low on purpose (§47). "Count to 10,000" cannot succeed even if it somehow reaches the model,
 * and a single banking answer never needs more than this.
 */
export const BAZ_MAX_TOKENS = 1_024

/** Executes a validated tool call. Returns what the model is told, and any card to render. */
export type ToolExecutor = (
  name: ToolName,
  input: unknown,
) => Promise<{ readonly result: string; readonly card?: Card }>

export type BazTurnOptions = {
  readonly client: Anthropic
  readonly model: string
  readonly prompt: PromptInput
  /** Oldest first. The customer's new message is already the last entry. */
  readonly history: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[]
  readonly executeTool: ToolExecutor
  /**
   * Which tools to expose this turn. Tools whose cards are not built yet are left out
   * entirely rather than offered and failed — the model cannot misuse what it cannot see.
   */
  readonly enabledTools?: readonly ToolName[]
  readonly maxTokens?: number
  /**
   * Called once per model round with what that round consumed.
   *
   * A callback rather than a stream event: the customer's browser has no use for this, and the
   * only thing that reads it is the console, which reads it back out of the database.
   */
  readonly onUsage?: (usage: ModelUsage) => void
}

function toolDefinitions(enabled?: readonly ToolName[]): Anthropic.Tool[] {
  const selected = enabled === undefined ? TOOLS : TOOLS.filter((tool) => enabled.includes(tool.name))
  return selected.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: z.toJSONSchema(tool.schema, { io: 'input' }) as Anthropic.Tool.InputSchema,
  }))
}

/**
 * The system prompt is split at the cache breakpoint: everything through the product catalogue
 * is identical turn to turn, so it is cached; persona and the case digest follow it uncached.
 *
 * An hour rather than the default five minutes. The write costs 2x input instead of 1.25x, so
 * it is only worth it if it saves a second write — and it saves far more than one. The prefix
 * does not depend on the case, which means every customer, every audience session and every
 * run-through share one entry, and a presenter who talks for six minutes between questions no
 * longer pays 17,000 tokens to resume. One write an hour, for everybody.
 */
function systemBlocks(prompt: PromptInput): Anthropic.TextBlockParam[] {
  const { stablePrefix, caseSuffix } = composeSystemPrompt.withBreakpoint(prompt)

  return [
    { type: 'text', text: stablePrefix, cache_control: { type: 'ephemeral', ttl: '1h' } },
    { type: 'text', text: caseSuffix },
  ]
}

/**
 * A second breakpoint, at the end of the conversation so far.
 *
 * The system prompt was the only thing cached, so the message history — the largest block
 * after the catalogue, and the one thing that genuinely grows — was re-read at full price on
 * every round of every turn. A card turn is two rounds, so it was paid for twice.
 *
 * Marking the last message extends the cache by exactly what is new: the turns before it are
 * read at a tenth of the price, and only the newest message is written. Five minutes, not an
 * hour: this entry is specific to one case and is superseded by the next turn anyway, so
 * paying 2x to keep it for an hour would be buying something nobody collects. The longer TTL
 * has to come first in the prompt, and it does — the system block is above.
 */
function withHistoryBreakpoint(
  messages: readonly Anthropic.MessageParam[],
): Anthropic.MessageParam[] {
  const copy = messages.map((message) => ({ ...message }))
  const last = copy[copy.length - 1]
  if (!last || typeof last.content !== 'string') return copy

  copy[copy.length - 1] = {
    ...last,
    content: [{ type: 'text', text: last.content, cache_control: { type: 'ephemeral' } }],
  }
  return copy
}

/**
 * Runs the turn, yielding stream events as they happen.
 *
 * Cards are held back until the text is finished. The model typically calls its tool in the
 * first round and explains itself in the second, so emitting cards as they happen would put
 * the options on screen before the sentence introducing them. Baz explains, then offers.
 *
 * `done` and `error` are not emitted here — the caller owns those, because only it knows the
 * persisted message id and the gate category.
 */
export async function* runBazTurn(options: BazTurnOptions): AsyncGenerator<StreamEvent> {
  const messages: Anthropic.MessageParam[] = withHistoryBreakpoint(
    options.history.map((turn) => ({ role: turn.role, content: turn.content })),
  )

  const system = systemBlocks(options.prompt)
  const tools = toolDefinitions(options.enabledTools)
  const cards: Card[] = []

  /**
   * The model usually speaks, calls a tool, then speaks again about what came back. Each round
   * is its own stream, so without a separator the last sentence of one round and the first of
   * the next arrive joined: "They're here now.Mortgage first is usually the sensible order."
   * They are separate thoughts either side of a tool call, so they get a paragraph break.
   */
  let spoken = false

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let spokenThisRound = false

    const stream = options.client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens ?? BAZ_MAX_TOKENS,
      system,
      messages,
      tools,
    })

    // Read deltas straight off the stream, so the customer sees the answer forming rather
    // than waiting for the whole turn to finish.
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        if (spokenThisRound) {
          yield { type: 'text_delta', text: chunk.delta.text }
          continue
        }

        // Nothing said yet this round. Whitespace before the first word is dropped rather
        // than opening the message with a blank line, and a round that only ever emits
        // whitespace does not count as the model having spoken.
        const opening = chunk.delta.text.replace(/^\s+/, '')
        if (opening === '') continue

        if (spoken) yield { type: 'text_delta', text: '\n\n' }
        spokenThisRound = true
        spoken = true
        yield { type: 'text_delta', text: opening }
      }
    }

    const message = await stream.finalMessage()

    /*
     * Charged per round, not per turn. The cached prefix is re-read every time the model is
     * called back with a tool result, which is what makes the number of rounds the thing that
     * actually drives cost rather than the size of the prompt.
     */
    options.onUsage?.({
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
      cacheRead: message.usage.cache_read_input_tokens ?? 0,
      cacheWrite: message.usage.cache_creation_input_tokens ?? 0,
    })

    const toolUses = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
      yield* cards.map((card): StreamEvent => ({ type: 'card', card }))
      yield* nothingSaid(spoken, cards)
      return
    }

    messages.push({ role: 'assistant', content: message.content })

    const results: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUses) {
      const validation = validateToolCall(toolUse.name, toolUse.input)

      if (!validation.ok) {
        // An invalid call is a tool error the model can correct, never an error the customer
        // sees (CLAUDE.md > Baz model tools).
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          is_error: true,
          content: validation.error,
        })
        continue
      }

      try {
        const outcome = await options.executeTool(validation.name, validation.input)
        results.push({ type: 'tool_result', tool_use_id: toolUse.id, content: outcome.result })
        if (outcome.card) cards.push(outcome.card)
      } catch (error) {
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          is_error: true,
          content: error instanceof Error ? error.message : 'That did not work.',
        })
      }
    }

    messages.push({ role: 'user', content: results })
  }

  // The round limit was reached with tools still pending; show what was produced anyway.
  yield* cards.map((card): StreamEvent => ({ type: 'card', card }))
  yield* nothingSaid(spoken, cards)
}

/**
 * A turn that produced no words and no card has failed, whatever the model thought it was doing.
 *
 * Seen once in testing: every round spent calling a tool that the server refused, and the
 * customer got an empty bubble. Silence is the one reply that cannot be recovered from — there
 * is nothing to read and nothing to tap — so it is replaced with something that at least invites
 * them to try again.
 */
function* nothingSaid(spoken: boolean, cards: readonly unknown[]): Generator<StreamEvent> {
  if (spoken || cards.length > 0) return

  yield {
    type: 'text_delta',
    text: 'Sorry — I lost my thread there. Could you say that again?',
  }
}
