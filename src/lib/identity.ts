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

/**
 * Where to land after signing in.
 *
 * The remembered route when there is one, and the conversation otherwise. The fallback is not
 * a nicety: a magic link is opened from an email client, frequently in a different browser or
 * an in-app webview, so the tab that stored the route is not the tab that comes back. Without
 * a default that lands somebody on the front page — which, having just signed in, reads as
 * having been signed out.
 */
function restoreRoute(): void {
  let route: string | null = null
  try {
    route = window.localStorage.getItem(ROUTE_KEY)
    window.localStorage.removeItem(ROUTE_KEY)
  } catch {
    // No storage; the fallback below is the whole point.
  }

  window.location.hash = route?.startsWith('#/') === true ? route : '#/baz'
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

/**
 * Set while a link has been downgraded to an ordinary sign-in, so it happens once.
 *
 * Without it, an account that cannot be linked would bounce between Google and here forever.
 */
const RETRIED_KEY = 'baz.signInRetried'

/**
 * Whether Supabase refused the link because that Google account already belongs to somebody.
 *
 * This is the ordinary second-device case: they signed in on a laptop, opened Baz on a phone,
 * and tapped sign in from a fresh anonymous session. Linking is impossible — the identity is
 * taken — and signing in is the right answer, because the account it finds is the one holding
 * their conversation.
 *
 * It cannot be caught where it is raised. `linkIdentity` does not fail locally; it redirects,
 * and Supabase rejects it during the callback, so the refusal arrives as a parameter on the
 * way back rather than as a rejected promise.
 */
function identityTaken(reason: string): boolean {
  return /identity_already_exists|already linked|already been linked|already registered/i.test(
    reason,
  )
}

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

function alreadyRetried(): boolean {
  try {
    return window.sessionStorage.getItem(RETRIED_KEY) === '1'
  } catch {
    return true
  }
}

function markRetried(): void {
  try {
    window.sessionStorage.setItem(RETRIED_KEY, '1')
  } catch {
    // Without storage the retry cannot be bounded, so it is not attempted at all.
  }
}

function clearRetried(): void {
  try {
    window.sessionStorage.removeItem(RETRIED_KEY)
  } catch {
    // Nothing to clear.
  }
}

function rememberFailure(message: string): void {
  try {
    window.sessionStorage.setItem(FAILURE_KEY, message)
  } catch {
    // Nothing to remember it with. The console still has it.
  }
}

/**
 * A session handed back in the URL fragment rather than as a code.
 *
 * `updateUser` is not an OAuth flow and creates no PKCE verifier, so the link in a
 * confirmation email comes back the old way: `#access_token=…&refresh_token=…`. That is also
 * exactly where this app keeps its route, so without this the router is handed a pile of token
 * parameters, nothing reads the session, and somebody who just clicked "Open Baz" lands on the
 * front page signed out. Which is what happened.
 */
async function sessionFromFragment(): Promise<'none' | 'ok' | 'failed'> {
  if (!supabase) return 'none'

  const raw = window.location.hash.replace(/^#/, '')
  // A route, not a token payload. `#/baz` has no `=` in it.
  if (!raw.includes('access_token=')) return 'none'

  const fragment = new URLSearchParams(raw)
  const access_token = fragment.get('access_token')
  const refresh_token = fragment.get('refresh_token')
  if (access_token === null || refresh_token === null) return 'failed'

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })

  // Out of the address bar and out of the history either way: these are credentials.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (error) {
    console.error('sign-in from the email link failed:', error.message)
    rememberFailure(error.message)
    return 'failed'
  }
  return 'ok'
}

export async function completeSignIn(): Promise<{ signedIn: boolean; error?: string }> {
  if (!supabase) return { signedIn: false }

  /*
   * The email link arrives this way; the Google redirect arrives as `?code=`.
   *
   * Routed on either outcome. Somebody who followed a link from their inbox should end up in
   * the conversation whether or not the token in it was still good, because the alternative is
   * the front page, which is indistinguishable from having been signed out.
   */
  const fromFragment = await sessionFromFragment()
  if (fromFragment !== 'none') {
    if (fromFragment === 'ok') clearRetried()
    restoreRoute()
    return { signedIn: fromFragment === 'ok' }
  }

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

    if (oauthError !== null && identityTaken(oauthError) && !alreadyRetried()) {
      /*
       * Linking was refused because the account exists. Go straight back to Google as a plain
       * sign-in rather than returning them to a card that can only fail the same way again.
       */
      markRetried()
      const client = requireSupabase()
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnTo() },
      })
      if (!error) return { signedIn: false }
      rememberFailure(error.message)
    } else if (oauthError !== null) {
      console.error('sign-in refused:', oauthError)
      rememberFailure(oauthError)
    }

    restoreRoute()
    return { signedIn: false, ...(oauthError === null ? {} : { error: oauthError }) }
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  clean()
  restoreRoute()
  if (!error) clearRetried()
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

/**
 * The same thing by email, for somebody who does not want to involve Google.
 *
 * Structured exactly like the Google path and for the same reason: an anonymous visitor is
 * CONVERTED rather than replaced, so the conversation they are in the middle of survives.
 * `updateUser` attaches the address to the user that already exists and keeps `auth.uid()`;
 * `signInWithOtp` creates or finds a separate one, which is right only when they already have
 * an account somewhere else.
 *
 * Slower than Google by the length of time it takes an email to arrive, and it supplies no
 * name — so Baz cannot promise to fill anything in. It is offered second for both reasons.
 */
export async function startEmailSignIn(
  email: string,
): Promise<{ ok: boolean; message?: string; checkInbox?: boolean }> {
  const client = requireSupabase()
  const trimmed = email.trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { ok: false, message: 'That does not look like an email address.' }
  }

  rememberRoute()
  const { data: userData } = await client.auth.getUser()

  if (userData.user?.is_anonymous === true) {
    // Keeps the conversation: same user, now with an address on it.
    const { error } = await client.auth.updateUser(
      { email: trimmed },
      // A second argument, not an attribute. Without it Supabase falls back to the project's
      // Site URL, which is the front page, and the customer lands there instead of the chat.
      { emailRedirectTo: returnTo() },
    )
    if (!error) return { ok: true, checkInbox: true }
    console.warn('could not attach the address, sending a sign-in link instead:', error.message)
  }

  const { error } = await client.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: returnTo() },
  })
  return error ? { ok: false, message: error.message } : { ok: true, checkInbox: true }
}
