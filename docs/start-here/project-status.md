---
title: Project status
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - docs/decisions.md
  - src/app/routes.ts
  - supabase/migrations/
  - supabase/functions/_shared/domain/journeys/
---

# Project status

A proof of concept under active development, deployed continuously to
`baz.chrisquinn.ie` from `main`. Nothing here is production software and nothing here touches a
real bank.

## Built and working

| Area | State |
|---|---|
| Conversation runtime | Gate → model with tools → SSE stream → persistence. 15 tools |
| Guardrails | 8-category classifier plus deterministic pre-checks, in front of the model |
| Persona | 6 sliders, presets, applied fresh every turn |
| Applications | 12-state machine, concurrent applications, review and submit, advisories |
| Fact reuse | Catalogue, per-requirement reuse policy, subject matching, reuse events |
| Customer plans | Plans, milestones, check-ins and watches |
| Needs and goals | Catalogue-driven discovery with recorded decisions |
| Digital forms | Two published form definitions (1833, 1940) parsed, branched, calculated |
| Partner | Invite by a token that does not expire, scoped DTOs, own session per browser |
| Notifications | Web Push, hand-written, confirmed delivering to a real phone |
| Admin console | 8 sections: cases, case inspector, guardrails, persona, engine, analytics, forms, profile |
| Explainer | `/how-it-works`, an interactive case study |
| Tests | 779 Vitest tests in 61 files; Playwright route and render specs; guardrail evals |

## Deliberately not built

These are choices, not gaps waiting to be filled.

| Thing | Why |
|---|---|
| A Playwright spec that drives a conversation | The fixture provider now exists (`LLM_PROVIDER=fixture`, 2026-10-15), so one is possible; none is written yet |
| SMS | Never built. Web Push needs no per-message charge and no sender registration |
| Server-side Sentry | Edge Functions have no error reporting. Failures surface as `events` rows and function logs |
| Output re-classification | Not in v1. To be added only if evals show leaks |
| Baz in partner mode | Stretch goal. The partner gets a task list, not a conversation |
| A per-conversation turn limit | `AUDIENCE_MAX_TURNS` is declared and read nowhere. The cap limits how many people can start, not what any one of them can spend |

## Removed along the way

The repository's history contains a replica of a public bank website and an authenticated mobile
banking shell behind a simulated login. Both were deleted: a lot of scaffolding around the only
thing worth showing, which is a conversation that understands what someone is trying to do.

`/#/app/*` and `/#/try` now redirect to `/#/baz` so old links and printed QR codes still land
somewhere. Google sign-in was removed entirely rather than hidden; a returning customer is
recognised by address, never by cookie.

See `src/app/routes.ts`, which explains the pivot where a reader will actually find it.

## Known open items

- **All seven journeys are `status: 'draft'`.** They are translated from product knowledge, not
  yet matched against the recordings. `source` is unfilled. See
  [journeys](../journeys/README.md).
- **The repository is public with no licence.** That makes it all-rights-reserved, which is the
  opposite of the stated intent. IP ownership needs establishing first. See
  [public repository review](../security/public-repository-review.md).
- **Two internal source documents are in the public git history.** `docs/01` and `docs/03` are
  gitignored now, but were committed in `0f0988f` and remain retrievable. Same document.
- **Partner name is inconsistent in the source documents.** The vision says Sarah, the
  requirements say Emma. The seed uses Emma.

## Build order

The project was built in milestones, each ending deployed. M0 to M8 are done; M9 (polish and the
film run-through) is the current work. `docs/decisions.md` is the running log, dated, with the
requirements section each choice serves.
