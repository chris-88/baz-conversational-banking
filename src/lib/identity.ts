import { requireSupabase, supabase } from '@/lib/supabase'

/**
 * Signing in, so the conversation follows the person rather than the browser.
 *
 * Every visitor already has an anonymous Supabase user, and `participant_sessions` maps that
 * user to their participant on a case. Signing in therefore does not create an account and
 * migrate anything into it — it **attaches** a Google identity to the anonymous user that is
 * already there. `auth.uid()` does not change, so the case, the conversation, the applications
 * and every fact carry over with nothing to move and nothing to reconcile.
 *
 * On a second device the same Google account resolves to that same user, `session start` finds
 * the existing mapping, and the conversation is simply there. That is the whole point: a
 * customer who starts on a laptop and picks up their phone should not begin again.
 */

export type Identity = {
  /** True while they are still just a browser. */
  readonly anonymous: boolean
  readonly email: string | null
  readonly name: string | null
  readonly avatarUrl: string | null
}

export const ANONYMOUS: Identity = {
  anonymous: true,
  email: null,
  name: null,
  avatarUrl: null,
}

function readMetadata(metadata: Record<string, unknown>, ...keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
}

/** Who is signed in, as far as the browser knows. */
export async function currentIdentity(): Promise<Identity> {
  if (!supabase) return ANONYMOUS
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return ANONYMOUS

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  return {
    // `is_anonymous` is the only reliable signal: an anonymous user still has an id and a JWT.
    anonymous: user.is_anonymous === true,
    email: user.email ?? null,
    name: readMetadata(metadata, 'full_name', 'name'),
    avatarUrl: readMetadata(metadata, 'avatar_url', 'picture'),
  }
}

/**
 * Where Google sends them back.
 *
 * Deliberately the bare origin and base path, with no fragment. Supabase appends `?code=…` to
 * whatever this is, and appending a query to a URL that already has a `#/baz` on the end
 * produces something neither the router nor the exchange can read.
 */
function returnTo(): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${window.location.origin}${base}`
}

/**
 * The route to put them back on afterwards.
 *
 * `returnTo` has to be a bare origin, because Supabase appends `?code=` and a URL that already
 * ends in `#/baz` cannot take a query string. That lost the route: signing in from the middle
 * of a conversation returned them to the front page, which reads exactly like being logged out.
 * The route is kept here across the redirect and restored once the code is redeemed.
 */
const ROUTE_KEY = 'baz.signInReturnRoute'

function rememberRoute(): void {
  try {
    window.localStorage.setItem(ROUTE_KEY, window.location.hash || '#/baz')
  } catch {
    // Storage blocked. They land on the front page, which is the old behaviour, not a failure.
  }
}

function restoreRoute(): void {
  try {
    const route = window.localStorage.getItem(ROUTE_KEY)
    window.localStorage.removeItem(ROUTE_KEY)
    if (route && route.startsWith('#/')) window.location.hash = route
  } catch {
    // Nothing to restore.
  }
}

/**
 * Begin signing in. Redirects away, so nothing after this runs.
 *
 * Linking is tried first, because that is the case that keeps the conversation. It fails when
 * the Google account is already attached to a user — which is exactly what happens on a second
 * device — and signing in normally is then the right answer, because the account it finds is
 * the one holding their case.
 */
export async function startGoogleSignIn(): Promise<{ ok: boolean; message?: string }> {
  const client = requireSupabase()
  const redirectTo = returnTo()
  rememberRoute()

  const { data: userData } = await client.auth.getUser()
  if (userData.user?.is_anonymous === true) {
    const linked = await client.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo },
    })
    if (!linked.error) return { ok: true }

    /*
     * Falling through to `signInWithOAuth` is right on a second device, where the account
     * already exists and holds their case. It is wrong everywhere else, because it creates a
     * new user and leaves this conversation behind — which is what happened when manual
     * linking was switched off at the project. Worth knowing it happened.
     */
    console.warn('could not link identity, signing in instead:', linked.error.message)
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  return error ? { ok: false, message: error.message } : { ok: true }
}

/**
 * Finish a sign-in that has just come back from Google.
 *
 * Called once on boot. Does nothing unless there is a `?code=` to redeem, and clears it from
 * the address bar either way so a refresh cannot try to redeem it twice.
 */
/**
 * Where the last sign-in attempt's failure is left for the UI to find.
 *
 * `completeSignIn` runs before React mounts, so it has nothing to render into. The first
 * version discarded the result entirely, which turned every OAuth failure into the screen
 * jumping away and coming back with no explanation — the single least debuggable outcome
 * available, and exactly what it did in front of somebody.
 */
const FAILURE_KEY = 'baz.signInError'

export function lastSignInError(): string | null {
  try {
    return window.sessionStorage.getItem(FAILURE_KEY)
  } catch {
    return null
  }
}

/** Cleared when they try again, rather than by reading it — see the card for why. */
export function clearSignInError(): void {
  try {
    window.sessionStorage.removeItem(FAILURE_KEY)
  } catch {
    // Nothing stored it in the first place.
  }
}

function rememberFailure(message: string): void {
  try {
    window.sessionStorage.setItem(FAILURE_KEY, message)
  } catch {
    // Nothing to remember it with. The console still has it.
  }
}

export async function completeSignIn(): Promise<{ signedIn: boolean; error?: string }> {
  if (!supabase) return { signedIn: false }

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const oauthError = params.get('error_description') ?? params.get('error')

  if (code === null && oauthError === null) return { signedIn: false }

  const clean = () => {
    params.delete('code')
    params.delete('error')
    params.delete('error_description')
    params.delete('state')
    const query = params.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }

  if (code === null) {
    clean()
    restoreRoute()
    if (oauthError !== null) {
      console.error('sign-in refused:', oauthError)
      rememberFailure(oauthError)
    }
    return { signedIn: false, ...(oauthError === null ? {} : { error: oauthError }) }
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  clean()
  restoreRoute()
  if (error) {
    console.error('sign-in exchange failed:', error.message)
    rememberFailure(error.message)
  }
  return error ? { signedIn: false, error: error.message } : { signedIn: true }
}

/**
 * Sign out, and get a fresh anonymous user.
 *
 * Without the second half they would be left with no session at all, which every read and
 * every Edge Function treats as "no session" rather than "a visitor" — a blank screen with no
 * way back. Signing out of Baz means becoming a stranger again, not becoming nobody.
 */
export async function signOutIdentity(): Promise<void> {
  const client = requireSupabase()
  await client.auth.signOut()
  await client.auth.signInAnonymously()
}
