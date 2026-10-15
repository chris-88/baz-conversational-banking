---
title: Secrets and configuration
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - scripts/check-bundle-secrets.ts
  - supabase/functions/_shared/env.ts
  - .gitignore
---

# Secrets and configuration

## The boundary

Vite only exposes `VITE_`-prefixed variables to the browser, which makes **the prefix the entire
safety boundary**. One mis-prefixed secret in a `.env` file would ship to every visitor of a
public site.

So the rule is absolute: nothing secret in a `VITE_*` variable, ever.

| Where | What may live there |
|---|---|
| `.env` → the browser | Supabase URL and anon key, VAPID **public** key, Sentry DSN, base path |
| Edge Function secrets | `ANTHROPIC_API_KEY`, `VAPID_PRIVATE_D`, `PRESENTER_KEY`, and everything else |

The Anthropic key, the VAPID private key and the presenter key exist **only** as Edge Function
secrets. The browser never sees them and never needs to.

## The scanner

`npm run check:bundle` runs after every build, locally and in CI, and fails if a secret reached
`dist/`.

It checks two things:

**Credential shapes, whatever they are named:**

```text
sk-ant-…                          Anthropic API key
sbp_…                             Supabase personal access token
sb_secret_…                       Supabase service role key
AC[32 hex]                        Twilio auth token
-----BEGIN … PRIVATE KEY-----     any private key block
```

**Exact values** of every non-`VITE_` variable in `.env`, with an explicit allowlist of
non-secrets that may legitimately appear: `SUPABASE_PROJECT_REF` (it is part of the Supabase URL),
`BAZ_MODEL`, `GATE_MODEL`, `APP_BASE_URL`, the audience caps, `LLM_PROVIDER`, `TWILIO_FROM`.

The allowlist approach is the right way round: a new secret added to `.env` is caught by default,
and only a deliberate addition to `NOT_SECRET` can let something through.

## Required means required

`_shared/env.ts` throws when a required variable is unset. There is no sensible default for an API
key, a VAPID key or a base URL, and a function that starts without one fails later and further
from the cause.

Only `AUDIENCE_MAX_CASES` and `PRESENTER_KEY` are soft-read, because for both of them unset is a
valid configuration — an unset presenter key means nobody can open the all-conversations switcher,
which is the safe default.

## What is gitignored, and why each one

```text
.env, .env.local, .env.*.local      environment, with .env.example committed
supabase/.env.local                 Edge Function secrets
.admin-credentials                  admin console login, written once by the setup script
.presenter-key                      unlocks the all-conversations switcher
.google-oauth, client_secret*.json  OAuth client credentials — belt to the braces of deleting them
docs/01-…, docs/03-…                the two internal source documents
```

The two internal documents are gitignored because the repository is public. **They are
nonetheless in the public git history** — see
[the public repository review](public-repository-review.md).

## Rotation

If a credential may have been exposed, rotate it. Do not reason about whether exposure was likely.

Two things to know about rotation here:

- The Supabase access token exists in two places that must rotate together — the GitHub secret
  and wherever it is held locally.
- `VITE_VAPID_PUBLIC_KEY` and `VAPID_PUBLIC_KEY` must match. Rotating the VAPID pair means
  updating both, and existing push subscriptions break.

## Reporting

See [responsible disclosure](responsible-disclosure.md). Do not open a public issue containing a
credential.
