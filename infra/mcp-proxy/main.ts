/**
 * mcp.baz.chrisquinn.ie: the one hostname an agent is given for Baz.
 *
 * Supabase serves the function at its own hostname and nowhere else, so a short address needs
 * something in front. This is that something: a Deno Deploy app that takes every request to the
 * host and forwards it, body and MCP headers intact, to the `mcp` Edge Function. It adds no
 * behaviour and holds no secret; the function needs no key, because MCP clients carry none and
 * the function makes the agent a customer itself (`supabase/functions/mcp/index.ts`).
 *
 * Deployed from this folder by Deno Deploy's GitHub integration; `UPSTREAM` is the function's
 * URL and defaults to the live project.
 */

const UPSTREAM =
  Deno.env.get('UPSTREAM') ?? 'https://xuptshuyjjjgcknczflc.supabase.co/functions/v1/mcp'

/** The request headers worth carrying across; everything else is the browser's or the hop's. */
const FORWARDED = ['content-type', 'accept', 'authorization', 'mcp-session-id', 'mcp-protocol-version']

/** Headers that describe this hop rather than the reply, which the runtime sets itself. */
const DROPPED = new Set(['content-length', 'content-encoding', 'transfer-encoding', 'connection', 'keep-alive'])

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, mcp-session-id, mcp-protocol-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  const headers = new Headers()
  for (const name of FORWARDED) {
    const value = request.headers.get(name)
    if (value !== null) headers.set(name, value)
  }

  let upstream: Response
  try {
    upstream = await fetch(UPSTREAM, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
    })
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Baz is not reachable right now.' } }),
      { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  const reply = new Headers(CORS)
  upstream.headers.forEach((value, name) => {
    if (!DROPPED.has(name.toLowerCase()) && !name.toLowerCase().startsWith('access-control-')) reply.set(name, value)
  })
  return new Response(upstream.body, { status: upstream.status, headers: reply })
})
