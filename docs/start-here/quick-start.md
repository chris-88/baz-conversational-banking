---
title: Quick start
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - package.json
  - .env.example
  - supabase/.env.local.example
---

# Quick start

## What you will need

- Node 20 or later, and npm.
- A Supabase project. Local via the CLI, or a hosted one.
- An Anthropic API key, if you want Baz to actually reply.

There is no demo mode. **Nothing in this repository can hold a conversation without calling the
real model**, which is a deliberate gap and the most consequential one in the project — see
[testing](../dev/testing.md). Everything that is not a conversation (routes, cards, the admin
console, the forms engine, all 779 unit tests) runs without an API key.

## The short version

```bash
npm install
cp .env.example .env
npx supabase start
npm run dev
```

That gets you the app at `http://127.0.0.1:5173` with a database behind it. The conversation will
fail until you also serve the Edge Functions with an Anthropic key:

```bash
cp supabase/.env.local.example supabase/.env.local   # then fill in ANTHROPIC_API_KEY
npx supabase functions serve --env-file supabase/.env.local
```

## Filling in the environment

Two files, two audiences.

| File | Loaded by | Holds |
|---|---|---|
| `.env` | Vite, shipped to the browser | `VITE_*` only, nothing secret |
| `supabase/.env.local` | `supabase functions serve` | every secret |

`npx supabase start` prints the local `API URL` and `anon key` — those are
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Every variable is explained in
[environment variables](../dev/environment-variables.md).

The minimum to get a reply out of Baz: `ANTHROPIC_API_KEY`, `BAZ_MODEL`, `GATE_MODEL` and
`APP_BASE_URL` in `supabase/.env.local`. The VAPID keys are required by the admin function, so
leave them unset only if you are not touching notifications.

## Where to go in the app

| Address | What it is |
|---|---|
| `/#/` | Landing page, and the way in |
| `/#/baz` | Baz itself — the conversation |
| `/#/how-it-works` | The explainer, written for someone evaluating the work |
| `/#/admin` | The presenter console. Reachable only by typing the address |
| `/#/join/:token` | A second applicant's link, issued by the partner invite card |

Hash routing throughout, because GitHub Pages has no rewrites.

## Checks

```bash
npm run check               # the pre-merge gate: typecheck, lint, seed, test, build, bundle scan
```

Or individually:

```bash
npm run typecheck           # tsc -b
npm run lint                # eslint
npm run test                # vitest, 779 tests
npm run build
npm run typecheck:functions # deno check, needs Deno installed separately
npm run e2e                 # Playwright; route and render only
```

`check` mirrors what CI runs on a pull request, apart from `typecheck:functions`: Deno is a
separate install, so CI does that step with its own action. Run it yourself before touching
anything under `supabase/functions/` — `tsc` cannot see Deno code, so a call to a function that
does not exist typechecks clean and deploys. See [testing](../dev/testing.md).

`npm run eval:guardrails` runs the adversarial set against the live gate. It costs money and
needs `ANTHROPIC_API_KEY` in `.env`.

## If it does not work

[Troubleshooting](../operations/troubleshooting.md) covers the failures people actually hit:
a conversation that returns nothing, push that never arrives, and a stale deployed build.
