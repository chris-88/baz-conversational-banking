import { requireSupabase } from '@/lib/supabase'
import { apiErrorSchema } from '@contracts/common.ts'
import {
  caseActionResponseSchema,
  type CaseActionRequest,
  type CaseActionResponse,
} from '@contracts/case-action.ts'

/**
 * Everything the customer commits by tapping (Invariant 1).
 *
 * Nothing here is reachable by the model: these are called from card buttons, and the server
 * re-validates access, state and rules on every one.
 */
export async function runCaseAction(action: CaseActionRequest): Promise<CaseActionResponse> {
  const supabase = requireSupabase()

  const invoked = await supabase.functions.invoke<unknown>('case-action', { body: action })

  if (invoked.error) {
    const message = invoked.error instanceof Error ? invoked.error.message : 'That did not work.'
    throw new Error(message)
  }

  const envelope = invoked.data as { ok?: boolean; data?: unknown; error?: unknown }
  if (envelope.ok !== true) {
    const parsed = apiErrorSchema.safeParse(envelope.error)
    throw new Error(parsed.success ? parsed.data.message : 'That did not work.')
  }

  return caseActionResponseSchema.parse(envelope.data)
}
