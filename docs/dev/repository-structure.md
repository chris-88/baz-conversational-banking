---
title: Repository structure
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/
  - supabase/
  - eslint.config.js
  - tsconfig.app.json
---

# Repository structure

One Vite SPA, six Deno Edge Functions, and a Postgres schema. The thing worth understanding
before anything else is that **the business logic does not live in `src/`** — it lives in
`supabase/functions/_shared/domain/`, as pure TypeScript imported by both sides.

## The tree

```text
src/
  app/            router, providers, lazy boundaries, stale-deploy detection
  baz/            the portable conversation UI: chat, composer, cards, hooks
  surfaces/       Landing, BazScreen, HowItWorks, Privacy
  partner/        the second applicant's join and task surface
  admin/          the presenter console
  components/     NotFound, NotificationCard, and components/ui (shadcn-generated)
  content/        the explainer's figures, one directory so every number has a source
  hooks/  lib/    Supabase client, query keys, identity, session, Sentry
  assets/         avatars, backgrounds, icons, illustrations, logos, qr
  styles/         self-hosted Inter Variable

supabase/
  migrations/     23 SQL migrations, forward-only
  functions/
    _shared/
      domain/     pure TypeScript. Facts, journeys, state machine, requirements,
                  advisories, metrics, plans, goals, needs, quotes, savings, forms, seed
      contracts/  Zod request and response schemas; types are inferred from them
      db/         repositories, generated database types
      llm/        gate, classifier, prompt composer, persona, refusals, tools
      push/       Web Push, hand-written
      tenants/boi/ products, rates, knowledge base, form snapshots and mappings
      http/       Deno serve helpers
      env.ts      required-environment accessor
    baz-turn/  case-action/  session/  partner/  admin/  upload/

e2e/              Playwright: route, render and disclosure checks
evals/guardrails/ cases.jsonl plus a runner, against the live gate
scripts/          generators, model comparison, bundle secret scan, live probe
docs/             this
```

## Where to find a thing

| Looking for | It is in |
|---|---|
| A route | `src/app/routes.ts` — every path in one place, with why |
| The prompt | `supabase/functions/_shared/llm/prompt.ts` |
| A tool definition | `supabase/functions/_shared/llm/tools.ts` |
| Guardrail enforcement | `supabase/functions/_shared/llm/gate.ts` |
| What an application still needs | `domain/requirements.ts` |
| Legal state changes | `domain/state-machine.ts` |
| A product's requirements | `domain/journeys/<product>.ts` |
| A fact's schema and reuse policy | `domain/facts.ts` |
| What the bank's form decided | `domain/forms/logic.ts` and `state.ts` |
| Product copy and rates | `tenants/boi/` |
| A request or response shape | `_shared/contracts/` |

## The boundaries that are enforced

Three, and all three are machine-checked rather than conventions.

**Baz is portable.** `src/baz/**` and `_shared/domain/**` may not import a tenant or a shell.
Tenant configuration is injected. Enforced by `no-restricted-imports` in `eslint.config.js`,
and it is the boundary to protect in any restructure.

**The domain is pure.** `_shared/domain/**` additionally may not import from `src/`, and may not
use Deno or browser APIs. The only third-party import allowed is bare `zod`, mapped in the
functions' Deno import config and pinned to the app's major version. That purity is what lets
the same requirement engine run in an Edge Function and in a Vitest test.

**Writes go through functions.** The browser reads under RLS and never writes to `cases`,
`applications` or `facts`. Every write is an Edge Function call.

## Path aliases

`tsconfig.app.json` maps the domain into the app so the browser can import the same code the
functions do:

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@domain/*` | `supabase/functions/_shared/domain/*` |
| `@contracts/*` | `supabase/functions/_shared/contracts/*` |
| `@db/*` | `supabase/functions/_shared/db/*` |
| `@llm/*` | `supabase/functions/_shared/llm/*` |
| `@tenants/*` | `supabase/functions/_shared/tenants/*` |

Edge Functions cannot use these — Deno resolves relative paths with explicit `.ts` extensions.
The same file is therefore imported two ways depending on who is importing it, which is the
price of sharing the domain and worth paying.

## What is not linted here

`supabase/functions/*/index.ts` and `_shared/http/**` and `_shared/env.ts` use Deno globals that
the TypeScript project service cannot resolve, so `deno lint` and `npm run typecheck:functions`
cover them instead. `src/components/ui/**` is shadcn-generated and `database.types.ts` is
generated from the linked project. The ignore list in `eslint.config.js` says so, each with its
reason.
