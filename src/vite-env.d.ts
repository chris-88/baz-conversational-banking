/// <reference types="vite/client" />

/**
 * Declaring these explicitly keeps `import.meta.env` typed and makes it obvious that only
 * these four values exist on the client. Anything else belongs in an Edge Function secret.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

