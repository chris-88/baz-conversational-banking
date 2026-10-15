---
title: Environment variables
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - .env.example
  - supabase/.env.local.example
  - supabase/functions/_shared/env.ts
  - .github/workflows/
---

# Environment variables

Every variable this project reads, where it is read, and whether it is required. Verified by
grepping for the readers, not by reading the example files — the example files had drifted from
the code until 2026-10-15, missing four variables the functions require.

## Browser (`.env`)

`VITE_*` only. **Everything here ships to the client**, so nothing secret belongs in it, and
`npm run check:bundle` fails the build if a credential shape reaches `dist/`.

| Variable | Required | Read by |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | Yes | `src/lib/supabase.ts` |
| `VITE_VAPID_PUBLIC_KEY` | For push | Push subscription. Must match `VAPID_PUBLIC_KEY` on the server or the browser rejects the subscription |
| `VITE_SENTRY_DSN` | No | `src/lib/sentry.ts`. Blank disables browser error reporting |
| `VITE_BASE_PATH` | Yes | `vite.config.ts`. `/<repo>/` on a project Pages site, `/` with a custom domain. The PWA `start_url` and `scope` follow it |

## Edge Functions (`supabase/.env.local` locally, project secrets when deployed)

### Required

Each of these goes through `env()` in `_shared/env.ts`, which **throws on startup if unset**.
There is no sensible default for an API key or a base URL, and a function that starts without
one fails later and further from the cause.

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | The only model provider. Read in `baz-turn` and `admin` |
| `BAZ_MODEL` | The conversation model. Default `claude-sonnet-5-5` |
| `GATE_MODEL` | The classifier. Default `claude-haiku-4-5-20251001` — a small model in front of a large one, which is most of why a turn is affordable |
| `APP_BASE_URL` | Builds the links inside push notifications and the data-notice card. Must match the origin being browsed |
| `VAPID_PUBLIC_KEY` | Web Push. Must match `VITE_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_D` | The private key's `d` value |
| `VAPID_SUBJECT` | A `mailto:` the push service can contact |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform, locally and
deployed. Do not set them yourself.

### Optional

Read directly from `Deno.env` rather than through `env()`, because unset is a valid
configuration.

| Variable | Default behaviour when unset |
|---|---|
| `AUDIENCE_MAX_CASES` | A cap on customer cases created in a rolling 24 hours — a rate, not a lifetime total. Cases tagged `kind = 'test'` are excluded |
| `PRESENTER_KEY` | Unset means nobody can open the all-conversations switcher. Set it on one device and only that device gets it |
| `LLM_PROVIDER` | Unset means Anthropic. `fixture` replays a script from `baz-turn/fixtures/` and constructs nothing Anthropic-shaped, so no key is needed |
| `LLM_FIXTURE` | Which script, when the provider is `fixture`. Defaults to `opening` |

### Set on the project, read nowhere

These were removed from the example files on 2026-10-15. They may still exist as secrets on the
hosted project; they do nothing.

| Variable | Why it is dead |
|---|---|
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS was never built, and there is no plan to. Web Push needs no per-message charge and no sender registration |
| `SENTRY_DSN` | Edge Functions have no Sentry. Failures surface as `events` rows and function logs |
| `AUDIENCE_MAX_TURNS` | Declared, never implemented. There is no per-conversation turn limit |

If you delete them from the project, nothing changes. That is the point of listing them.

## CI and deployment

GitHub repository **variables** (not secrets, because they ship to the client anyway):
`VITE_BASE_PATH`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

GitHub **secrets**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

## Rules

- Nothing secret in a `VITE_*` variable, ever. `check:bundle` enforces it and CI runs it.
- The Anthropic key, the VAPID private key and `PRESENTER_KEY` exist only as Edge Function
  secrets. The browser never sees them and never needs to.
- `.env`, `.env.local` and `supabase/.env.local` are gitignored. The `.example` files are
  committed and must contain no values.
