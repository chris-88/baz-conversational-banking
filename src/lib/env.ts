import { z } from 'zod'

/**
 * Browser environment. Nothing secret is ever exposed through `VITE_*`
 * (CLAUDE.md > Secrets): the Anthropic and Twilio keys live only as Edge Function secrets.
 */
const browserEnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_BASE_PATH: z.string().default('/'),
})

export type BrowserEnv = z.infer<typeof browserEnvSchema>

const parsed = browserEnvSchema.safeParse(import.meta.env)

/**
 * Fails soft on purpose. M0 must deploy and render before the Supabase project exists,
 * so a missing backend shows a setup notice rather than a blank page.
 */
export const env: BrowserEnv | null = parsed.success ? parsed.data : null

export const isBackendConfigured = parsed.success

export const envProblems: readonly string[] = parsed.success
  ? []
  : parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
