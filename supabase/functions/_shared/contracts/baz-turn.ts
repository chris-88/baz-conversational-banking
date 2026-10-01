import { z } from 'zod'
import { MAX_INPUT_LENGTH } from '../llm/gate.ts'

/** The request body for `baz-turn`. Validated before anything else happens. */
export const bazTurnRequestSchema = z.object({
  caseId: z.uuid(),
  /**
   * Why this turn is running. `return` makes the digest include everything that changed since
   * the customer was last here (§36).
   */
  trigger: z.enum(['message', 'opening', 'return']).default('message'),
  /** Absent for `opening` and `return`, which the customer did not type. */
  message: z.string().max(MAX_INPUT_LENGTH).optional(),
})

export type BazTurnRequest = z.infer<typeof bazTurnRequestSchema>
