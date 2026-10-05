import { z } from 'zod'

/**
 * `session` — attaches the caller's anonymous auth user to a participant on a case (§12, §28).
 *
 * One participant can span several auth users, because Safari and an installed PWA have
 * separate storage on iOS: the same person arrives twice and must land on the same case.
 */
export const sessionRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    mode: z.enum(['demo', 'fresh', 'clone']).default('fresh'),
  }),
  /** §29 — hands the case to the app. The code is opaque and single-use. */
  z.object({ action: z.literal('create_handoff') }),
  z.object({ action: z.literal('redeem_handoff'), code: z.string().min(16).max(64) }),
])

export type SessionRequest = z.infer<typeof sessionRequestSchema>

export const handoffResponseSchema = z.object({ code: z.string() })

export const sessionStartRequestSchema = z.object({
  action: z.literal('start'),
  /**
   * `demo` joins the canonical presenter case, already signed in with the facts the bank
   * holds. `fresh` creates a new case that knows nothing (§46).
   */
  mode: z.enum(['demo', 'fresh', 'clone']).default('fresh'),
})

export const sessionResponseSchema = z.object({
  caseId: z.uuid(),
  participantId: z.uuid(),
  role: z.enum(['primary', 'partner']),
  authLevel: z.enum(['anonymous', 'authenticated']),
  customerFirstName: z.string().nullable(),
  /** True when this call created the case rather than joining an existing one. */
  created: z.boolean(),
  /** §36 — something happened while they were away, so the next turn should be a return. */
  hasUpdates: z.boolean().default(false),
})

export type SessionStartRequest = z.infer<typeof sessionStartRequestSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
