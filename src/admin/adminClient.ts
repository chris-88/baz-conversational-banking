import { requireSupabase } from '@/lib/supabase'
import { apiErrorSchema } from '@contracts/common.ts'
import {
  adminCaseSchema,
  adminOverviewSchema,
  type AdminCase,
  type AdminOverview,
  type AdminRequest,
} from '@contracts/admin.ts'

/**
 * Calls to the presenter console.
 *
 * Admin status is checked by the server on every call — being on this screen proves nothing,
 * which matters because the site is on a public URL (§37).
 */
async function call(action: AdminRequest): Promise<unknown> {
  const supabase = requireSupabase()
  const invoked = await supabase.functions.invoke<unknown>('admin', { body: action })

  if (invoked.error) {
    throw new Error(invoked.error instanceof Error ? invoked.error.message : 'That did not work.')
  }

  const envelope = invoked.data as { ok?: boolean; data?: unknown; error?: unknown }
  if (envelope.ok !== true) {
    const parsed = apiErrorSchema.safeParse(envelope.error)
    throw new Error(parsed.success ? parsed.data.message : 'That did not work.')
  }

  return envelope.data
}

export const adminApi = {
  overview: async (): Promise<AdminOverview> => adminOverviewSchema.parse(await call({ action: 'overview' })),
  inspect: async (caseId: string): Promise<AdminCase> =>
    adminCaseSchema.parse(await call({ action: 'inspect_case', caseId })),
  resetCase: () => call({ action: 'reset_case' }),
  setKillSwitch: (enabled: boolean) => call({ action: 'set_kill_switch', enabled }),
  setPersona: (body: Omit<Extract<AdminRequest, { action: 'set_persona' }>, 'action'>) =>
    call({ action: 'set_persona', ...body }),
}
