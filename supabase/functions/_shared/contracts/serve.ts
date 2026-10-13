import { fail } from './common.ts'

/**
 * `Deno.serve`, with a floor under it.
 *
 * Every function was `Deno.serve(async (request) => { … })` with no try/catch around the body.
 * A throw inside the handler therefore escaped to the runtime, which answers with a bare
 * `500 Internal Server Error` and **none of the CORS headers the handler would have added**.
 * The browser is then obliged to discard the response, so the client never sees the 500 at
 * all: supabase-js reports `Failed to send a request to the Edge Function`, which reads as a
 * network fault and sends whoever is debugging it to look at the wrong thing entirely.
 *
 * That became reachable the moment thirty-nine silent database writes were changed to throw.
 * Making failures loud was right; letting a loud failure bypass CORS was not, and the two
 * belonged in the same change.
 *
 * The message is returned rather than swallowed. This is a prototype with synthetic data, and
 * an opaque 500 is precisely what cost an afternoon.
 */
export function serveJson(
  cors: Record<string, string>,
  handler: (request: Request) => Promise<Response>,
): void {
  Deno.serve(async (request: Request): Promise<Response> => {
    try {
      return await handler(request)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      // Also to the function log, because a 500 is an incident rather than a data point.
      console.error('unhandled:', message, error instanceof Error ? error.stack : '')
      return new Response(JSON.stringify(fail('internal', message)), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
  })
}
