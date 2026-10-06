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
    mode: z.enum(['new', 'known']).default('new'),
  }),
  /** §29 — hands the case to the app. The code is opaque and single-use. */
])

export type SessionRequest = z.infer<typeof sessionRequestSchema>

export const handoffResponseSchema = z.object({ code: z.string() })

export const sessionStartRequestSchema = z.object({
  action: z.literal('start'),
  /**
   * `new` is somebody the bank has never met. `known` is an existing customer, signed in with
   * the details the bank already holds — the difference a real customer would feel, and where
   * §53 has anything to show.
   */
  mode: z.enum(['new', 'known']).default('new'),
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
