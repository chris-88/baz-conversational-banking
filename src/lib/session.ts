import { requireSupabase } from '@/lib/supabase'
import { callFunction } from '@/lib/callFunction'
import {
  listCasesResponseSchema,
  sessionResponseSchema,
  type ListCasesResponse,
  type SessionResponse,
} from '@contracts/session.ts'

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

export async function startSession(mode: 'new' | 'known' = 'new'): Promise<SessionResponse> {
  return sessionResponseSchema.parse(await invoke({ action: 'start', mode }))
}

/**
 * The presenter key, kept on the device rather than in the URL.
 *
 * Arrives once as `?presenter=…`, is stored, and the parameter is dropped from the address bar
 * — a key that lives in the URL is a key in every screenshot, every screen share and every
 * browser history on the machine. Without it the switcher lists only this browser's own
 * conversations, which is what a visitor should see.
 */
const PRESENTER_STORAGE_KEY = 'baz.presenterKey'

export function rememberPresenterKey(key: string): void {
  try {
    window.localStorage.setItem(PRESENTER_STORAGE_KEY, key)
  } catch {
    // Private browsing, or storage disabled. The menu simply stays on the visitor's own list.
  }
}

export function presenterKey(): string | undefined {
  try {
    return window.localStorage.getItem(PRESENTER_STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function forgetPresenterKey(): void {
  try {
    window.localStorage.removeItem(PRESENTER_STORAGE_KEY)
  } catch {
    // Nothing to forget if it could never be stored.
  }
}

export async function listCases(): Promise<ListCasesResponse> {
  const key = presenterKey()
  return listCasesResponseSchema.parse(
    await invoke({ action: 'list_cases', ...(key === undefined ? {} : { presenterKey: key }) }),
  )
}

export async function switchCase(caseId: string): Promise<SessionResponse> {
  const key = presenterKey()
  return sessionResponseSchema.parse(
    await invoke({
      action: 'switch_case',
      caseId,
      ...(key === undefined ? {} : { presenterKey: key }),
    }),
  )
}

export async function startNewCase(mode: 'new' | 'known' = 'new'): Promise<SessionResponse> {
  return sessionResponseSchema.parse(await invoke({ action: 'new_case', mode }))
}
