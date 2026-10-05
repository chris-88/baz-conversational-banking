import { requireSupabase } from '@/lib/supabase'
import { apiErrorSchema } from '@contracts/common.ts'

/**
 * Calls an Edge Function and surfaces the message the server actually sent.
 *
 * `functions.invoke` reports any non-2xx as "Edge Function returned a non-2xx status code" and
 * keeps the body on the error's `context` response. Left alone, every server-side refusal —
 * an expired invite, an application that is not ready, a forbidden case — reaches the customer
 * as that sentence, which tells them nothing.
 */
export async function callFunction(name: string, body: Record<string, unknown>): Promise<unknown> {
  const supabase = requireSupabase()
  const invoked = await supabase.functions.invoke<unknown>(name, { body })

  if (invoked.error) {
    throw new Error(await messageFrom(invoked.error))
  }

  const envelope = invoked.data as { ok?: boolean; data?: unknown; error?: unknown }
  if (envelope.ok !== true) {
    const parsed = apiErrorSchema.safeParse(envelope.error)
    throw new Error(parsed.success ? parsed.data.message : 'That did not work.')
  }

  return envelope.data
}

/**
 * The same thing for a file. `invoke` passes a FormData body straight through without setting
 * a JSON content type, which is what the upload function reads.
 */
export async function callFunctionWithFile(name: string, body: FormData): Promise<unknown> {
  const supabase = requireSupabase()
  const invoked = await supabase.functions.invoke<unknown>(name, { body })

  if (invoked.error) throw new Error(await messageFrom(invoked.error))

  const envelope = invoked.data as { ok?: boolean; data?: unknown; error?: unknown }
  if (envelope.ok !== true) {
    const parsed = apiErrorSchema.safeParse(envelope.error)
    throw new Error(parsed.success ? parsed.data.message : 'That did not work.')
  }

  return envelope.data
}

async function messageFrom(error: unknown): Promise<string> {
  const context = (error as { context?: unknown }).context

  if (context instanceof Response) {
    try {
      const parsed = apiErrorSchema.safeParse(
        ((await context.clone().json()) as { error?: unknown }).error,
      )
      if (parsed.success) return parsed.data.message
    } catch {
      // Fall through to the generic message below.
    }
  }

  return error instanceof Error && !error.message.includes('non-2xx')
    ? error.message
    : 'Something went wrong. Try again.'
}
