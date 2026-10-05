import { callFunction } from '@/lib/callFunction'
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
  return caseActionResponseSchema.parse(await callFunction('case-action', action))
}
