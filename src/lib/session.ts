import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'
import { callFunction } from '@/lib/callFunction'
import { sessionResponseSchema, type SessionResponse } from '@contracts/session.ts'

/**
 * Every visitor gets an anonymous Supabase user, which `session` then maps to a participant
 * on a case (§12, §28). The anonymous user persists in browser storage, so returning to the
 * tab returns to the same conversation.
 */
export async function ensureAnonymousUser(): Promise<string> {
  const supabase = requireSupabase()

  const existing = await supabase.auth.getSession()
  if (existing.data.session) return existing.data.session.access_token

  const created = await supabase.auth.signInAnonymously()
  if (created.error || !created.data.session) {
    throw new Error(created.error?.message ?? 'Could not start a session.')
  }
  return created.data.session.access_token
}

async function invoke(body: Record<string, unknown>): Promise<unknown> {
  await ensureAnonymousUser()
  return callFunction('session', body)
}

/** §29 — hands this conversation to the app. The code is opaque and single-use. */
export async function createHandoff(): Promise<string> {
  const data = await invoke({ action: 'create_handoff' })
  return z.object({ code: z.string() }).parse(data).code
}

export async function redeemHandoff(code: string): Promise<SessionResponse> {
  return sessionResponseSchema.parse(await invoke({ action: 'redeem_handoff', code }))
}

export async function startSession(mode: 'demo' | 'fresh' | 'clone'): Promise<SessionResponse> {
  return sessionResponseSchema.parse(await invoke({ action: 'start', mode }))
}
