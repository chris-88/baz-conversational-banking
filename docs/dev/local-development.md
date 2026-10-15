---
title: Local development
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - package.json
  - supabase/config.toml
  - vite.config.ts
---

# Local development

## The three processes

```bash
npm run dev                                              # Vite, :5173
npx supabase start                                       # Postgres, Auth, Storage, Realtime
npx supabase functions serve --env-file supabase/.env.local   # the Edge Functions
```

The app runs without the functions — routes render, the admin console loads, every unit test
passes. What fails is anything that writes, which is everything the conversation does.

## Working on the domain

`supabase/functions/_shared/domain/` is pure TypeScript with no Deno and no browser APIs, so it
runs under Vitest directly and the fastest loop is:

```bash
npm run test:watch
```

Domain logic is written test-first. The engine, reuse policies, subject matching, the state
machine (every legal and illegal transition), advisories, questions-avoided, the persona
composer, gate routing given fixed classifier outputs, and token issue and redeem are all
required to have tests. Thirty-four test files sit beside 47 modules.

## Working on an Edge Function

`tsc` cannot see Deno code. Before you push:

```bash
npm run typecheck:functions
```

This needs Deno installed separately. It exists because a call to a function that does not
exist typechecks clean under `tsc` and deploys happily — which happened, and is recorded in
`docs/decisions.md` under "The Edge Functions were never typechecked".

Functions reload on save while `functions serve` is running. A thrown error becomes a 500 with
no Sentry behind it, so read the `functions serve` output — it is the only place a stack trace
appears. See [debugging](debugging.md).

## Working on the conversation

Every turn costs money. There is no fixture provider, so there is no way to exercise a
conversation without calling Anthropic.

The discipline that follows is not optional:

**A live model is for checking what the model does.** Layout, card ordering, copy placement and
anything else you could confirm by looking are not that. Running a full conversation to check
where a card sits is how an API budget disappears.

For UI work, render the card directly in a test or a Vitest component test and leave the model
out of it. `src/baz/cards/` components take their props from the contract schemas, so they can be
rendered with a fixture object without a turn happening.

If you do need live probes, use `scripts/live-probe.mjs`: it tags its case as `test` on create
and deletes it on exit, which keeps it out of `AUDIENCE_MAX_CASES`. Twenty-five replays against
the live model once used a day's allowance up and started refusing real visitors.

## Database changes

Forward-only migrations in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`.

```bash
npx supabase migration new my_change     # creates the file
npx supabase db reset                    # replays every migration, locally
npm run db:types                         # regenerates database.types.ts
```

`database.types.ts` is generated from the **linked** project, so regenerate it after the
migration is applied. Never hand-edit it.

Remember RLS. A new table is unreadable by the browser until a policy says otherwise, and that
is the correct default — the browser reads under RLS and writes nothing.

## Seed data

```bash
npm run seed:generate     # rebuild the canonical presenter case
npm run seed:check        # assert it is current; CI runs this
```

`seed:check` failing on CI means someone changed the domain without rebuilding the seed. See
[working with fixtures](working-with-fixtures.md).

## Before you commit

```bash
npm run check
```

Typecheck, lint, seed check, 779 tests, build, and a scan asserting no secret reached `dist/`.
