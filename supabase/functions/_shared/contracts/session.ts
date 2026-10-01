import { z } from 'zod'

/**
 * `session` — attaches the caller's anonymous auth user to a participant on a case (§12, §28).
 *
 * One participant can span several auth users, because Safari and an installed PWA have
 * separate storage on iOS: the same person arrives twice and must land on the same case.
 */
export const sessionStartRequestSchema = z.object({
  action: z.literal('start'),
  /**
   * `demo` joins the canonical presenter case, already signed in with the facts the bank
   * holds. `fresh` creates a new case that knows nothing (§46).
   */
  mode: z.enum(['demo', 'fresh']).default('fresh'),
})

export const sessionResponseSchema = z.object({
  caseId: z.uuid(),
  participantId: z.uuid(),
  role: z.enum(['primary', 'partner']),
  authLevel: z.enum(['anonymous', 'authenticated']),
  customerFirstName: z.string().nullable(),
  /** True when this call created the case rather than joining an existing one. */
  created: z.boolean(),
})

export type SessionStartRequest = z.infer<typeof sessionStartRequestSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
