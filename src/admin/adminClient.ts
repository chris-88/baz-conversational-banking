import { callFunction } from '@/lib/callFunction'
import {
  adminCaseSchema,
  adminOverviewSchema,
  notificationSchema,
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
const call = (action: AdminRequest) => callFunction('admin', action)

export const adminApi = {
  overview: async (): Promise<AdminOverview> =>
    adminOverviewSchema.parse(await call({ action: 'overview' })),
  inspect: async (caseId: string): Promise<AdminCase> =>
    adminCaseSchema.parse(await call({ action: 'inspect_case', caseId })),
  resetCase: () => call({ action: 'reset_case' }),
  purgeAudience: () => call({ action: 'purge_audience' }),
  setSavingsBalance: (caseId: string, amount: number) =>
    call({ action: 'set_savings_balance', caseId, amount }) as Promise<{
      amount: number
      seen: number | null
      plansActive: number
      milestonesConsidered: number
      milestonesReached: number
    }>,
  planMove: (
    caseId: string,
    planId: string,
    move: Extract<AdminRequest, { action: 'plan_move' }>['move'],
  ) => call({ action: 'plan_move', caseId, planId, move }),
  reachSavingsTarget: (caseId: string) =>
    call({ action: 'reach_savings_target', caseId }) as Promise<{ reached: boolean; target: number | null }>,
  verifyDocuments: (caseId: string) =>
    call({ action: 'verify_documents', caseId }) as Promise<{ verified: number }>,
  demoAction: (caseId: string, move: Extract<AdminRequest, { action: 'demo_action' }>['move']) =>
    call({ action: 'demo_action', caseId, move }),
  setKillSwitch: (enabled: boolean) => call({ action: 'set_kill_switch', enabled }),
  setPersona: (body: Omit<Extract<AdminRequest, { action: 'set_persona' }>, 'action'>) =>
    call({ action: 'set_persona', ...body }),
  simulate: (body: Omit<Extract<AdminRequest, { action: 'simulate_event' }>, 'action'>) =>
    call({ action: 'simulate_event', ...body }),
  notify: async (caseId: string): Promise<{ message: string; url: string }> =>
    notificationSchema.parse(await call({ action: 'send_notification', caseId })),
}
