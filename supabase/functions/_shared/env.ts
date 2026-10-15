/**
 * Required environment for an Edge Function.
 *
 * Every secret this project reads is required: there is no sensible default for an API key, a
 * VAPID key or a base URL, and a function that starts without one fails later and further from
 * the cause. So this throws at the point of use rather than returning an empty string.
 *
 * Deno is reached through `globalThis` because `_shared` is type-checked by the app's TypeScript
 * as well as by `deno check`, and the app has no Deno types.
 *
 * Soft-read variables (`AUDIENCE_MAX_CASES`, `PRESENTER_KEY`) are deliberately not here: they
 * have defaults and an unset value is a valid configuration, so they read `Deno.env` directly at
 * their call site. `docs/dev/environment-variables.md` lists both sets.
 */
export function env(name: string): string {
  const value = (globalThis as { Deno?: { env?: { get(key: string): string | undefined } } }).Deno
    ?.env?.get(name)
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing environment variable ${name}`)
  }
  return value
}
