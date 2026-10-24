import { z } from 'zod'

/**
 * The Model Context Protocol, as much of it as Baz needs (§32, §45).
 *
 * Stateless Streamable HTTP: one JSON-RPC request per POST, one JSON-RPC response, no server
 * push. `initialize`, `ping`, `tools/list` and `tools/call` are the whole surface an agent uses
 * to add Baz as a tool, and all four are a few dozen lines, so they are written here with the
 * same Zod the rest of the functions use rather than pulled in as a dependency the runtime
 * would then have to be adapted to. Everything that is Baz, rather than protocol, lives in the
 * function and in the four tools it exposes.
 */

export const PROTOCOL_VERSION = '2025-06-18'

const requestId = z.union([z.string(), z.number()])

export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: requestId.optional(),
  method: z.string().min(1),
  params: z.unknown().optional(),
})
export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>

export type JsonRpcResponse =
  | { readonly jsonrpc: '2.0'; readonly id: string | number; readonly result: unknown }
  | {
      readonly jsonrpc: '2.0'
      readonly id: string | number | null
      readonly error: { readonly code: number; readonly message: string; readonly data?: unknown }
    }

/** JSON-RPC's reserved codes, the three this server uses. */
export const RPC = { parse: -32700, invalidRequest: -32600, methodNotFound: -32601, invalidParams: -32602, internal: -32603 } as const

/**
 * The agent's handle on a conversation: an opaque string the server minted at `baz_start`,
 * passed back on every later call. Length-bounded so a stray paragraph is refused before any
 * work is done on it.
 */
const handle = z.string().min(16).max(2000)

export const bazStartInput = z.object({
  /** Where the agent's user came from, for the console's funnel. */
  source: z.string().trim().max(40).optional(),
})
export const bazSayInput = z.object({ handle, message: z.string().trim().min(1).max(2000) })
export const bazStatusInput = z.object({ handle })

/**
 * The taps an agent may make on its user's behalf, each mirroring a card. Deliberately a
 * subset of `case-action`: nothing here invites a partner, grants a health consent or uploads
 * a document, because those need the person.
 */
export const bazActInput = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('select_products'),
    handle,
    products: z
      .array(z.object({ product: z.string().min(1).max(40), catalogueId: z.string().min(1).max(80).optional() }))
      .min(1)
      .max(6),
  }),
  z.object({ action: z.literal('decide_plan'), handle, planId: z.uuid(), decision: z.enum(['keep', 'not_now', 'pause', 'resume', 'abandon']) }),
  z.object({
    action: z.literal('submit_application'),
    handle,
    applicationId: z.uuid(),
    confirmations: z.array(z.string().min(1).max(80)).max(40).default([]),
  }),
  z.object({ action: z.literal('pause_application'), handle, applicationId: z.uuid() }),
  z.object({ action: z.literal('resume_application'), handle, applicationId: z.uuid() }),
  z.object({ action: z.literal('decline_product'), handle, product: z.string().min(1).max(40) }),
  z.object({
    action: z.literal('link_accounts'),
    handle,
    bank: z.string().min(1).max(40),
    scope: z.array(z.enum(['balances', 'transactions', 'payments'])).min(1).default(['balances', 'transactions', 'payments']),
  }),
  z.object({
    action: z.literal('initiate_transfer'),
    handle,
    fromAccountId: z.uuid(),
    toApplicationId: z.uuid().nullable(),
    amount: z.number().positive(),
    cadence: z.enum(['once', 'monthly']).default('once'),
  }),
])

export const TOOL_INPUTS = {
  baz_start: bazStartInput,
  baz_say: bazSayInput,
  baz_act: bazActInput,
  baz_status: bazStatusInput,
} as const
export type McpToolName = keyof typeof TOOL_INPUTS

/**
 * A tool input as the JSON Schema MCP wants: an object at the top. Zod renders a discriminated
 * union as a bare `oneOf`, which is the same set of shapes without the word a client checks for,
 * so the word is added; the `$schema` marker is dropped because the protocol fixes the dialect.
 */
function inputSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _dialect, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>
  return 'type' in rest ? rest : { type: 'object', ...rest }
}

/** What `tools/list` returns: the name, what it is for, and the input as JSON Schema. */
export const TOOLS = [
  {
    name: 'baz_start',
    description:
      'Start a conversation with Baz, a conversational banking assistant for Bank of Ireland ' +
      '(a prototype; everything is synthetic and nothing opens a real account). Returns a ' +
      'handle to pass to the other tools, and the opening question Baz asks.',
    inputSchema: inputSchemaFor(bazStartInput),
  },
  {
    name: 'baz_say',
    description:
      "Say something to Baz as the customer, in the customer's own words, and get Baz's reply. " +
      'The reply comes with any cards Baz put on screen as data (product options, a plan, a ' +
      'review, a status) and the actions each card offers. A card is a decision for your user: ' +
      'put it to them before you call baz_act.',
    inputSchema: inputSchemaFor(bazSayInput),
  },
  {
    name: 'baz_act',
    description:
      'Tap a card on behalf of your user, once they have decided: start the products on an ' +
      'options card, keep or pause a plan, submit a review, link accounts, move money. Baz ' +
      'replies to what was done. Never call this without the user having chosen.',
    inputSchema: inputSchemaFor(bazActInput),
  },
  {
    name: 'baz_status',
    description: 'Where everything stands: the applications on the case, their state, and what each still needs.',
    inputSchema: inputSchemaFor(bazStatusInput),
  },
] as const

export const SERVER_INSTRUCTIONS = [
  'Baz is a conversational banking prototype for Bank of Ireland. It discovers what the customer',
  'is trying to do, proposes a plan, offers products as cards, collects what each application',
  'needs once, and keeps everything across sessions. Everything is synthetic: no real account is',
  'opened and no real money moves. Relay what your user says in their own words with baz_say,',
  'read back what Baz said, and when a card arrives put the choice to your user before baz_act.',
  'Keep the handle; it is the conversation.',
].join(' ')

export type ToolCallResult = {
  readonly content: readonly { readonly type: 'text'; readonly text: string }[]
  readonly structuredContent?: unknown
  readonly isError?: boolean
}

/** A text content block with the same thing as data beside it, which is how MCP likes results. */
export function toolResult(text: string, structured: unknown): ToolCallResult {
  return { content: [{ type: 'text', text }], structuredContent: structured }
}

export function toolError(text: string): ToolCallResult {
  return { content: [{ type: 'text', text }], isError: true }
}

export const toolsCallParams = z.object({
  name: z.string().min(1),
  arguments: z.unknown().optional(),
})

export function ok(id: string | number, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

export function error(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: data === undefined ? { code, message } : { code, message, data } }
}

/**
 * Routes one request. Protocol methods are answered here; a tool call is handed to `call`,
 * which is the function's business, with its input already validated against the tool's
 * schema so a handler never sees a shape it did not declare.
 */
export async function route(
  request: JsonRpcRequest,
  call: (name: McpToolName, input: unknown) => Promise<ToolCallResult>,
): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null

  // Notifications carry no id and get no reply.
  if (request.method.startsWith('notifications/')) return null
  if (id === null) return error(null, RPC.invalidRequest, 'A request needs an id.')

  switch (request.method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'baz', version: '0.1.0' },
        instructions: SERVER_INSTRUCTIONS,
      })
    case 'ping':
      return ok(id, {})
    case 'tools/list':
      return ok(id, { tools: TOOLS })
    case 'tools/call': {
      const params = toolsCallParams.safeParse(request.params)
      if (!params.success) return error(id, RPC.invalidParams, 'tools/call needs a name and arguments.')
      const name = params.data.name
      if (!(name in TOOL_INPUTS)) return error(id, RPC.methodNotFound, `No tool called ${name}.`)
      const toolName = name as McpToolName
      const input = TOOL_INPUTS[toolName].safeParse(params.data.arguments ?? {})
      if (!input.success) {
        return ok(id, toolError(`${name}: ${input.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`))
      }
      return ok(id, await call(toolName, input.data))
    }
    default:
      return error(id, RPC.methodNotFound, `Unknown method ${request.method}.`)
  }
}
