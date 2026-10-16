---
title: Development principles
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - CLAUDE.md
  - eslint.config.js
  - tsconfig.base.json
---

# Development principles

## The eleven invariants

These are not style preferences. Never weaken one to make a demo step work — fix the data or the
flow instead.

1. **The model proposes, the UI commits.** The model has no tool that creates, submits, pauses or
   resumes an application, grants consent, invites a partner or makes a declaration. It renders a
   card; the customer's tap calls `case-action`, which validates session access, state, required
   information and business rules.
2. **State comes from the database.** Every status Baz states must appear in the case digest
   built from controlled data. Status cards render from the database independently of model text.
   Baz reports an action only after `case-action` confirms it.
3. **What is outstanding is computed.** `outstanding(journey, facts)` decides what an application
   still needs. The model decides only how to ask.
4. **The gate is enforcement.** Domain restriction is a classifier plus deterministic checks in
   front of the model, not a prompt instruction. Blocked responses are short and never contain
   the answer.
5. **Persona is style only.** It cannot change scope, tools, rules or protections. Sensitive
   turns force humour, sarcasm, playfulness and poetic to zero.
6. **No sensitive inference.** Health data is collected only through an explicit structured form
   with consent. `record_facts` rejects any fact marked `extractable: false`.
7. **Partner isolation.** The partner never reads tables directly. Scoped DTOs only: their own
   tasks, their own facts, the names and states of applications they are party to. Never the
   primary's conversation or facts.
8. **Nothing sensitive in URLs.** Links carry opaque tokens: 128-bit random, stored hashed.
   Handoff codes and notification links are single-use with a short TTL, consumed on
   redemption. The partner invite neither expires nor is used up; inviting again voids it for
   anyone who has not already joined.
9. **Everything significant writes an event.** With an actor. Metrics are derived from events.
10. **Synthetic data only.** No real credentials, no real bank auth, no real customer data.
11. **Baz is portable.** `src/baz/**` and `_shared/domain/**` never import a tenant or a shell.
    Enforced by ESLint.

Invariants 1 to 3 are one idea seen from three angles, and it is the idea the project is for: a
language model is excellent at knowing how to ask and poor at being a source of truth, so it is
given the first job and denied the second.

## Priority order

When two good things conflict, the earlier wins:

persistent context → natural conversation → domain restriction → multi-application
orchestration → reuse → state integrity → public-to-app continuity → confirmation → partner →
return → notification → admin → persona → audience QR → visual polish.

Two corollaries worth saying out loud:

- Weak orchestration with perfect visuals is a failed proof of concept.
- Do not fake orchestration to improve polish.

And one more, because it is where prototypes usually go wrong: **do not build production
infrastructure because production would need it.**

## TypeScript

`strict`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noFallthroughCasesInSwitch`, `noImplicitOverride`.

- No `any`.
- No non-null `!` outside tests.
- `satisfies` for configuration objects.
- Discriminated unions with exhaustive `switch` and `assertNever` for states, categories, cards
  and stream events. When a new state is added, every place that must handle it fails to
  compile — which is the point.

## Validation

Zod at every boundary. Each Edge Function validates its request body and returns
`{ ok: true, data } | { ok: false, error: { code, message } }`.

Request and response schemas live in `_shared/contracts/` and **types are inferred from them**.
Never hand-write a type that duplicates a schema — the duplicate is the one that goes stale.

## Server state

TanStack Query, with a key factory in `src/lib/queryKeys.ts`. No fetching in `useEffect`.
Mutations invalidate by key. Realtime handlers invalidate; they do not write to the cache. The
only manual cache write is the optimistic chat message.

Zustand is for ephemeral UI state only — composer draft, open sheets, unsaved admin slider
drafts. Never cases, applications, facts or messages.

## UI

shadcn/ui is the mandatory default, added with the CLI. Never hand-roll something shadcn
provides. The look comes from theme tokens, not per-component overrides. Mobile first at 390px.

## Writing for the next person

The code in this repository explains itself at the point of use, and that is deliberate. A
comment says **why**, not what: why the font is self-hosted, why `participant_sessions` is
many-to-one, why eligibility is a fixture and not a calculation. Several of those comments
record a bug that cost a week.

Match that when you add to it. The best documentation in this project is in the files; this
directory exists to tell you which files to open.

## Where the spec is silent

Choose the fastest credible option and add one line to `docs/decisions.md`: the date, the
decision, and the requirements section it serves. That log is now 1,400 lines and is the most
useful document here.
