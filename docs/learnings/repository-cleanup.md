---
title: Repository cleanup, 2026-10-15
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - docs/archive/source-definitions/repository-hardening.md
---

# Repository cleanup, 2026-10-15

A cleanup and documentation pass, from the definition now archived at
`docs/archive/source-definitions/repository-hardening.md`.

**The source restructure in that definition was not carried out** — no directories under `src/`
were moved and no module boundaries changed, by decision. What follows is what did happen.

## Removed

| Thing | Why |
|---|---|
| `src/baz/BazConversation.tsx` | An abandoned duplicate of the portable conversation surface, superseded by `BazChat.tsx` and imported nowhere. 60 lines |
| `date-fns` | Unused dependency. Its only plausible consumer is `ui/calendar.tsx`, which is also unreferenced |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS was never built and there is no plan to. They were in the example env file implying otherwise |
| `SENTRY_DSN` (server) | Edge Functions have no Sentry. Listing it implied server-side error reporting that does not exist |
| `AUDIENCE_MAX_TURNS`, `LLM_PROVIDER` | Declared and read nowhere. Removed from the example file; documented as dead in [environment variables](../dev/environment-variables.md) |

## Merged

**Six identical copies of `env()`** — one in each of `baz-turn`, `case-action`, `session`,
`partner`, `upload` and `admin` — hoisted to `supabase/functions/_shared/env.ts`. Two of them had
drifted to a different error message.

It is exempted in `eslint.config.js` alongside `_shared/http/**`, with the reason stated: it reads
`Deno.env`, so it sits outside the app's tsconfig include list and the project service has no
project to lint it against.

## Added

- **`npm run check`** — typecheck, lint, `seed:check`, test, build, bundle secret scan. The
  pre-merge gate, mirroring CI apart from the Deno step, which needs a separate install.
- **Four required variables that were missing from `supabase/.env.local.example`**:
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_D`, `VAPID_SUBJECT` and `PRESENTER_KEY`. Three of them throw
  on startup if unset, so a developer following the example file could not have started the admin
  function.
- **The documentation taxonomy** this document sits in, built from the code rather than from the
  existing feature definitions.

## Moved

Eight delivered feature definitions, about 7,500 lines, from `docs/` root into
`docs/archive/source-definitions/`. They are source material, not current-state documentation —
the distinction the definition asked for, and the reason `docs/` had come to read as a dumping
ground.

The already-superseded brand set moved to `docs/archive/superseded/brand/`. Asset manifests moved
to `docs/design/`.

## Retained deliberately

Not residue. Do not delete these as cleanup.

| Thing | Why |
|---|---|
| `src/components/NotificationCard.tsx` | A simulated lock-screen notification, kept as a filming fallback. Nothing renders it because real push has been confirmed arriving on a phone |
| 9 of the 41 `components/ui/*` | shadcn-generated, unreferenced. They cost nothing; hand-rolling a replacement later would cost more |
| `react-hook-form`, `@hookform/resolvers`, `zustand` | Unreferenced today. The partner task surface and the composer draft are specified to use them, and they are in the mandated stack |
| `docs/decisions.md`, `docs/04-...md` at the docs root | Both are cited by path from `CLAUDE.md`, from source comments and from `src/content/how-it-works/economics.ts`. Moving them would break live references for no gain |
| `docs/goal-catalogue/`, `docs/needs-engine/`, `docs/qr-code/`, `docs/brand/` | All referenced by path from source code |
| The two BOI zips at the docs root | Generator inputs, and one is cited by a dated entry in the decisions log |

## What the cleanup found about the code

The code was in considerably better shape than the definition assumed. Across 321 files:

```text
console.log              0
TODO / FIXME / XXX       0
@ts-ignore               0
eslint-disable           0
duplicate implementations 1  (env(), now hoisted)
```

There was no prototype residue to speak of. The mess was entirely in `docs/`.

## Two documents describe a fixture provider that has never existed

The one real conflict the pass turned up, and worth resolving properly.

`CLAUDE.md` states there is no fixture LLM provider, and that is correct — `LLM_PROVIDER` has been
read nowhere since it was introduced at M0, and no file matching `fixture` has ever existed in the
history of `_shared/llm/`.

Two places say otherwise:

1. **The cost paper**, in "The largest cost was not the product": *"A fixture-backed provider
   existed for exactly this and was not being used."* It did not exist.
2. **`scripts/live-probe.mjs`**, whose header comment advises setting `LLM_PROVIDER=fixture`.
   Nothing reads that variable.

Both were corrected on 2026-10-15 to say the provider does not exist. The lesson is the one the
definition itself names: **a document that describes an intention in the present tense costs the
next person the time they spend looking for something that was never there.**

Building the provider remains the single change that would most improve what the test suite can
catch.

## Not done

| Item | Status |
|---|---|
| The `src/` restructure | Not carried out, by decision. The portability boundary that ESLint enforces is the structure worth protecting, and it already holds |
| Git history remediation | Deferred. `docs/01` and `docs/03` remain retrievable from the public history — see [public repository review](../security/public-repository-review.md) |
| A licence | Still absent. The repository is public, which makes it all-rights-reserved |
| A demo mode | Not built. It needs the fixture provider first |
