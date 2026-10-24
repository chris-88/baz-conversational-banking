import { createClient } from '@supabase/supabase-js'
import { serveJson } from '../_shared/http/serve.ts'
import { env } from '../_shared/env.ts'
import {
  RPC,
  error as rpcError,
  jsonRpcRequestSchema,
  route,
  toolError,
  toolResult,
  type JsonRpcResponse,
  type McpToolName,
} from '../_shared/mcp/protocol.ts'

/**
 * Baz as a tool for somebody else's agent (§32, §45).
 *
 * An MCP server over stateless Streamable HTTP: one JSON-RPC request per POST. Everything Baz
 * does is already behind `session`, `baz-turn` and `case-action`, so this function is an
 * adapter: it makes the agent a customer and calls those functions as that customer, which
 * keeps the gate, the cap, RLS and every invariant exactly where they are. An agent can do
 * nothing here that a visitor in a browser cannot.
 *
 * The handle is the customer. `baz_start` creates a user of its own for the conversation, a
 * synthetic email and a random password, confirmed on creation, and returns both as one opaque
 * string; every later call signs in with it and acts as that user. Stateless, so nothing is
 * kept here between calls, and the credential is scoped to one synthetic case on a prototype
 * with synthetic data. A production version would hold the agent's session server-side behind
 * OAuth; this one is written down as the shortcut it is.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, mcp-session-id, mcp-protocol-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

type Credential = { readonly email: string; readonly password: string }

function encodeHandle(credential: Credential): string {
  return btoa(JSON.stringify(credential)).replaceAll('+', '-').replaceAll('/', '_')
}

function decodeHandle(handle: string): Credential | null {
  try {
    const parsed = JSON.parse(atob(handle.replaceAll('-', '+').replaceAll('_', '/'))) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Credential).email === 'string' &&
      typeof (parsed as Credential).password === 'string'
    ) {
      return parsed as Credential
    }
    return null
  } catch {
    return null
  }
}

const url = () => env('SUPABASE_URL')
const anonKey = () => env('SUPABASE_ANON_KEY')

/** A session for the handle's user, or null when the handle is not one this server minted. */
async function signIn(handle: string): Promise<string | null> {
  const credential = decodeHandle(handle)
  if (credential === null) return null
  const response = await fetch(`${url()}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey() },
    body: JSON.stringify(credential),
  })
  if (!response.ok) return null
  const body = (await response.json()) as { access_token?: unknown }
  return typeof body.access_token === 'string' ? body.access_token : null
}

/** Calls a sibling function as the customer. */
async function asCustomer(token: string, fn: string, body: unknown): Promise<Response> {
  return await fetch(`${url()}/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

type Envelope = { ok: true; data: unknown } | { ok: false; error: { code: string; message: string } }

async function envelope(response: Response): Promise<Envelope> {
  const body = (await response.json()) as Envelope
  return body
}

/**
 * Baz's reply, read off the stream the browser would read: the text as it ended up (withdrawn
 * rounds taken back), the cards as data, and the message id.
 */
async function readTurn(response: Response): Promise<{ reply: string; cards: unknown[]; error: string | null }> {
  const raw = await response.text()
  let reply = ''
  const cards: unknown[] = []
  let failure: string | null = null
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue
    let event: { type?: unknown; text?: unknown; length?: unknown; card?: unknown; error?: { message?: unknown } }
    try {
      event = JSON.parse(line.slice(6)) as typeof event
    } catch {
      continue
    }
    if (event.type === 'text_delta' && typeof event.text === 'string') reply += event.text
    else if (event.type === 'retract' && typeof event.length === 'number') reply = reply.slice(0, Math.max(0, reply.length - event.length))
    else if (event.type === 'card') cards.push(event.card)
    else if (event.type === 'error') failure = typeof event.error?.message === 'string' ? event.error.message : 'Baz could not reply.'
  }
  return { reply: reply.trim(), cards, error: failure }
}

/** What an agent may do with each card, said once per card type so it never has to guess. */
function actionsFor(cards: readonly unknown[]): readonly string[] {
  const types = new Set(
    cards.flatMap((card) => (typeof card === 'object' && card !== null && typeof (card as { type?: unknown }).type === 'string' ? [(card as { type: string }).type] : [])),
  )
  const offers: string[] = []
  if (types.has('product_options') || types.has('arrangement')) offers.push('baz_act select_products with the product and catalogueId of each option the user wants')
  if (types.has('plan_proposal')) offers.push('baz_act decide_plan keep (or not_now) with the planId')
  if (types.has('review')) offers.push('baz_act submit_application with the applicationId and the requirementIds of the confirmations the user accepts')
  if (types.has('pause_prompt')) offers.push('baz_act pause_application or resume_application with the applicationId')
  if (types.has('connect_accounts')) offers.push('baz_act link_accounts with the bank id the user picks')
  if (types.has('transfer')) offers.push('baz_act initiate_transfer with the fromAccountId, toApplicationId, amount and cadence on the card')
  if (types.has('sign_in')) offers.push('signing in needs the person and an email code, so it happens in the Baz app, not here')
  return offers
}

async function call(name: McpToolName, input: unknown): Promise<ReturnType<typeof toolResult>> {
  switch (name) {
    case 'baz_start': {
      const { source } = input as { source?: string }
      const admin = createClient(url(), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
      const credential: Credential = {
        email: `agent-${crypto.randomUUID()}@agent.baz.invalid`,
        password: crypto.randomUUID() + crypto.randomUUID(),
      }
      const created = await admin.auth.admin.createUser({
        email: credential.email,
        password: credential.password,
        email_confirm: true,
        user_metadata: { agent: true },
      })
      if (created.error) return toolError(`Could not start: ${created.error.message}`)

      const handle = encodeHandle(credential)
      const token = await signIn(handle)
      if (token === null) return toolError('Could not start: the new customer could not sign in.')

      const started = await envelope(await asCustomer(token, 'session', { action: 'start', mode: 'new', source: source ?? 'mcp' }))
      if (!started.ok) return toolError(`Could not start: ${started.error.message}`)
      const caseId = (started.data as { caseId: string }).caseId

      return toolResult(
        'Baz is ready. It opens with one question: "What are you trying to do?" Relay your user\'s answer in their own words with baz_say. Keep the handle.',
        { handle, caseId, opening: 'What are you trying to do?' },
      )
    }

    case 'baz_say': {
      const { handle, message } = input as { handle: string; message: string }
      const token = await signIn(handle)
      if (token === null) return toolError('That handle is not a conversation this server started.')
      const sessionResponse = await envelope(await asCustomer(token, 'session', { action: 'start', mode: 'new' }))
      if (!sessionResponse.ok) return toolError(sessionResponse.error.message)
      const caseId = (sessionResponse.data as { caseId: string }).caseId
      const turn = await readTurn(await asCustomer(token, 'baz-turn', { caseId, message }))
      if (turn.error !== null) return toolError(turn.error)
      const next = actionsFor(turn.cards)
      return toolResult(
        [turn.reply, ...(next.length > 0 ? ['', 'Cards on screen offer:', ...next.map((offer) => `- ${offer}`)] : [])].join('\n'),
        { reply: turn.reply, cards: turn.cards, actions: next },
      )
    }

    case 'baz_act': {
      const { handle, ...rest } = input as { handle: string } & Record<string, unknown>
      const token = await signIn(handle)
      if (token === null) return toolError('That handle is not a conversation this server started.')
      const sessionResponse = await envelope(await asCustomer(token, 'session', { action: 'start', mode: 'new' }))
      if (!sessionResponse.ok) return toolError(sessionResponse.error.message)
      const caseId = (sessionResponse.data as { caseId: string }).caseId
      const acted = await envelope(await asCustomer(token, 'case-action', { ...rest, caseId }))
      if (!acted.ok) return toolError(acted.error.message)
      const summary = (acted.data as { summary?: unknown }).summary
      // The app reports a tap to Baz as an action turn, so the agent gets the same reply a person would.
      const turn = await readTurn(
        await asCustomer(token, 'baz-turn', { caseId, trigger: 'action', message: typeof summary === 'string' ? summary : 'Done.' }),
      )
      const next = actionsFor(turn.cards)
      return toolResult(
        [typeof summary === 'string' ? summary : 'Done.', '', turn.reply, ...(next.length > 0 ? ['', 'Cards on screen offer:', ...next.map((offer) => `- ${offer}`)] : [])].join('\n'),
        { done: acted.data, reply: turn.reply, cards: turn.cards, actions: next },
      )
    }

    case 'baz_status': {
      const { handle } = input as { handle: string }
      const token = await signIn(handle)
      if (token === null) return toolError('That handle is not a conversation this server started.')
      const sessionResponse = await envelope(await asCustomer(token, 'session', { action: 'start', mode: 'new' }))
      if (!sessionResponse.ok) return toolError(sessionResponse.error.message)
      const caseId = (sessionResponse.data as { caseId: string }).caseId
      const client = createClient(url(), anonKey(), { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
      const applications = await client.from('applications').select('id, product, display_name, state, catalogue_id').eq('case_id', caseId)
      if (applications.error) return toolError(applications.error.message)
      const rows = applications.data ?? []
      return toolResult(
        rows.length === 0 ? 'Nothing has been started yet.' : rows.map((row) => `${row.display_name ?? row.product}: ${row.state.replaceAll('_', ' ')}`).join('\n'),
        { caseId, applications: rows },
      )
    }
  }
}

serveJson(CORS, async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  // Stateless: there is no server-to-client stream to open.
  if (request.method === 'GET') return json(rpcError(null, RPC.methodNotFound, 'This server is stateless; POST JSON-RPC.'), 405)
  if (request.method !== 'POST') return json(rpcError(null, RPC.invalidRequest, 'Use POST.'), 405)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(rpcError(null, RPC.parse, 'Body must be JSON.'), 400)
  }

  // A batch is answered as a batch; a single request as one response.
  const requests = Array.isArray(body) ? body : [body]
  const responses: JsonRpcResponse[] = []
  for (const candidate of requests) {
    const parsed = jsonRpcRequestSchema.safeParse(candidate)
    if (!parsed.success) {
      responses.push(rpcError(null, RPC.invalidRequest, 'Not a JSON-RPC 2.0 request.'))
      continue
    }
    const response = await route(parsed.data, call)
    if (response !== null) responses.push(response)
  }
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS })
  return json(Array.isArray(body) ? responses : responses[0], 200)
})
