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

  /**
   * The conversations this browser can open.
   *
   * A visitor sees their own. A presenter holding the key sees every case, because running a
   * demonstration means jumping back to a prepared conversation from the screen the audience
   * is looking at, not from a console on another tab.
   */
  z.object({ action: z.literal('list_cases'), presenterKey: z.string().max(200).optional() }),

  /** Move this browser onto another conversation. */
  z.object({
    action: z.literal('switch_case'),
    caseId: z.uuid(),
    presenterKey: z.string().max(200).optional(),
  }),

  /** Leave the current conversation where it is and begin a fresh one. */
  z.object({ action: z.literal('new_case'), mode: z.enum(['new', 'known']).default('new') }),
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

/** One row in the conversation switcher. Everything it needs and nothing it does not. */
export const caseSummarySchema = z.object({
  caseId: z.uuid(),
  /** What the presenter named it, when anything did. */
  label: z.string().nullable(),
  /** The first thing the customer said, which is what makes one conversation recognisable. */
  opening: z.string().nullable(),
  messages: z.number().int().nonnegative(),
  applications: z.number().int().nonnegative(),
  lastActivityAt: z.string().nullable(),
  /** True for the conversation this browser is in right now. */
  current: z.boolean(),
  /** True when this browser is already a participant, as opposed to reachable with the key. */
  mine: z.boolean(),
})

export const listCasesResponseSchema = z.object({
  cases: z.array(caseSummarySchema),
  /** Whether the key was accepted, so the menu can say which list it is showing. */
  presenter: z.boolean(),
})

export type CaseSummary = z.infer<typeof caseSummarySchema>
export type ListCasesResponse = z.infer<typeof listCasesResponseSchema>

export type SessionStartRequest = z.infer<typeof sessionStartRequestSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
