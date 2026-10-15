---
title: Deployment
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - .github/workflows/
  - vite.config.ts
  - src/app/staleDeploy.ts
---

# Deployment

Static site on GitHub Pages, Edge Functions and schema on a hosted Supabase project, both
deployed from `main`.

Live at `baz.chrisquinn.ie`.

## Three workflows

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | Pull request and push to `main` | typecheck, lint, Deno typecheck of the functions, `seed:check`, unit tests, build, bundle secret scan |
| `deploy-pages.yml` | Push to `main` | build, upload the Pages artifact, deploy |
| `deploy-supabase.yml` | Push to `main` touching `supabase/**` | `supabase db push`, `supabase functions deploy` |

Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`. Repository
variables carry the `VITE_*` values, which are not secret because they ship to the client
anyway.

The two deploys are independent, so a schema change and a frontend change that depend on each
other will be live at slightly different moments. Order the migration to be backward compatible,
as you would anywhere else.

## Hash routing, and why

GitHub Pages has no rewrites. A request for `/baz` is a 404 because there is no `baz` file, so
every route lives after a `#`. That is the whole reason, and it is worth knowing before
proposing browser routing.

`VITE_BASE_PATH` is `/<repo>/` on a project Pages site or `/` with a custom domain, and `base`
in `vite.config.ts` is derived from it with a trailing slash enforced.

## PWA

`vite-plugin-pwa`, generating a service worker.

- `start_url` is `${base}#/baz` and `scope` is `base`, so the installed app opens on the
  conversation and stays within the deployment. `scope` deliberately stays at the base rather
  than narrowing.
- The shell is precached: `js`, `css`, `html`, `svg`, `png`, `woff2`. Self-hosted Inter is
  included, which is why there is no flash of unstyled text mid-presentation and no external
  request on conference wifi.
- `navigateFallback` is the base `index.html`.
- **The Supabase domain is `NetworkOnly`.** API responses are never cached. A cached case is a
  wrong case.

## The stale build problem

A service worker will happily serve an old shell to someone who left a tab open across a deploy,
and during a demonstration that reads as a bug in the product.

`src/app/staleDeploy.ts` detects it and reloads. Two entries in the decisions log cover this —
2026-10-08 for the page, 2026-10-15 for the cached build — because the first fix handled the
page and not the service worker.

## Checking a deployment

```bash
E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e
```

Both Playwright specs run against a deployment as well as locally: every surface mounts and
carries the prototype disclosure, and each beat of the film sequence is reachable.

`npm run check:bundle` asserts nothing secret reached `dist/`, and CI runs it on every build,
because **the site is public and anything in `dist/` is readable by anyone.**

## Edge Functions

Deployed by the Supabase CLI, run on Deno with the service role. They hold
`ANTHROPIC_API_KEY`, the VAPID keys and `PRESENTER_KEY`, which is why every write goes through
them and why the browser has no credential worth stealing.

There is no error reporting on them. A failure appears in the function logs and, where it
matters, as an `events` row. See [debugging](../dev/debugging.md).
