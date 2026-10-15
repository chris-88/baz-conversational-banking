---
title: Architecture overview
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/app/router.tsx
  - supabase/functions/
  - supabase/migrations/
---

# Architecture overview

One React SPA on GitHub Pages, six Deno Edge Functions, and a Supabase Postgres database. The
browser reads under row-level security and writes nothing.

```text
Browser — one SPA, hash routing (GitHub Pages has no rewrites)
  /#/                 landing
  /#/baz              the conversation
  /#/how-it-works     the explainer
  /#/privacy          what happens to what you type
  /#/join/:token      the second applicant
  /#/admin/*          the presenter console

    reads:  supabase-js under RLS
    writes: Edge Functions only
    live:   Realtime → TanStack Query invalidation

Edge Functions — service role; hold ANTHROPIC_API_KEY, VAPID keys, PRESENTER_KEY
  baz-turn      gate → model with tools → SSE stream → persist
  case-action   everything the UI commits
  session       anonymous start, case listing and switching, participant claiming
  partner       join by token, scoped DTO reads, task submission
  upload        the only way a document enters a case
  admin         inspection, event simulation, notification, persona, metrics, reset

Postgres — 26 tables, 23 forward-only migrations
```

## The one idea

A language model is excellent at knowing how to ask and unreliable as a source of truth. So it
is given the first job and denied the second, everywhere, by construction rather than by
instruction:

- **The model proposes, the UI commits.** There is no tool that creates, submits, pauses or
  resumes an application, grants consent, invites a partner or makes a declaration. The model
  renders a card; the customer's tap calls `case-action`, which validates and decides.
- **What is outstanding is computed.** `outstanding(journey, facts)` is a pure function. The
  model decides only how to ask for what it returns.
- **Every status comes from the digest**, built from controlled data. Status cards render from
  the database independently of model text.

[The AI boundary](ai-boundary.md) is the full version, and it is the document to read first.

## Where the logic lives

Not in `src/`. The business logic is pure TypeScript in `supabase/functions/_shared/domain/`,
imported by the Edge Functions through relative paths and by the app through the `@domain` alias.
No Deno APIs, no browser APIs, one permitted third-party import (`zod`).

That purity is what lets the same requirement engine run inside a function and inside a Vitest
test, and it is why the test suite can be fast and large while the conversation itself is
untestable.

## A request, end to end

A customer types something:

1. The browser posts to `baz-turn` with the case id.
2. The **gate** runs: deterministic checks, then a small classifier model. Out of scope means a
   canned response, an event, and a stop — the Baz model never sees the input.
3. The case is **loaded**: facts, applications, computed outstanding requirements, advisories,
   product interests including declined ones, plans, persona, domain config.
4. The **stage** is computed from the case, and the stage decides which tools this turn is
   offered.
5. The **prompt** is composed in a fixed order — policy, domain, product catalogue, persona,
   case digest — so the volatile part is last and everything before it caches.
6. The model streams back over **SSE**. Tool calls take effect as they arrive.
7. Messages, validated facts and events are **persisted**, and requirements are recomputed.

[The conversation runtime](conversation-runtime.md) goes through this properly.

## Live updates

Realtime on the tables that matter, invalidating TanStack Query keys. Handlers invalidate; they
never write to the cache. This is what makes a partner's answer appear in the primary's case
without a refresh, and what makes the admin console a live view rather than a snapshot.

## The pieces, and their documents

| Concern | Document |
|---|---|
| Why the model cannot decide anything | [AI boundary](ai-boundary.md) |
| A turn, in detail | [Conversation runtime](conversation-runtime.md) |
| The 15 tools and what each may do | [Tool system](tool-system.md) |
| Domain restriction, enforced | [Guardrails](guardrails.md) |
| The 26 tables | [Data model](data-model.md) |
| Anonymous users, sign-in, continuity | [Authentication](authentication.md) |
| Facts, reuse and the digest | [Customer context](customer-context.md) |
| The bank's own forms, as data | [Digital forms](digital-forms.md) |
| The packet that is built and never sent | [Submission generation](submission-generation.md) |
| Pages, Supabase, CI | [Deployment](deployment.md) |

## What this architecture is not

There is no queue, no cache layer, no background worker, no feature-flag service and no
observability stack. Production would need several of those. A proof of concept that builds them
has spent its time proving something nobody asked about.
