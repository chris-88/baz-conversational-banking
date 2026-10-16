---
title: Repository inventory
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/
  - supabase/
  - package.json
---

# Repository inventory

What is here, counted. Taken on 2026-10-15, after the cleanup pass recorded in
[repository cleanup](../learnings/repository-cleanup.md). Useful as a sanity check: if a number
here is badly wrong, this document is stale and the code is right.

## Scale

| | |
|---|---|
| TypeScript and TSX files | 321 |
| Lines in `src/` and `supabase/` | ~63,000 |
| React components | 130 (41 of them shadcn-generated, 9 of those unreferenced) |
| Conversation cards | 18 |
| Admin console files | 27 |
| Pure domain modules | 47, with 34 test files beside them |
| SQL migrations | 23, forward-only |
| Edge Functions | 6 |
| Database tables | 26 |
| Model tools | 15 |
| Product journeys | 7, all `status: 'draft'` |
| Vitest files / tests | 61 / 779 |
| Playwright specs | 2 |
| Guardrail eval cases | 54 |
| Dependencies | 23 production, 23 development |

## Surfaces

| Route | Component |
|---|---|
| `/` | `src/surfaces/Landing.tsx` |
| `/baz` | `src/surfaces/BazScreen.tsx` |
| `/how-it-works`, `/how-it-works/:section` | `src/surfaces/HowItWorks.tsx`, lazy |
| `/privacy` | `src/surfaces/Privacy.tsx` |
| `/join/:token` | `src/partner/PartnerJoin.tsx` |
| `/admin` and 8 sections | `src/admin/`, lazy |
| `/app/*`, `/try` | Redirect to `/baz`. Kept so old links and printed QR codes land somewhere |

## Edge Functions

| Function | Responsibility |
|---|---|
| `baz-turn` | A conversation turn: gate, model with tools, SSE stream, persistence |
| `case-action` | Everything the UI commits: product selection, submit, pause, resume, consent, partner invite, declarations |
| `session` | Anonymous start, case listing and switching, participant claiming |
| `partner` | Join by token, scoped DTO reads, partner task submission |
| `upload` | The only way a document enters a case |
| `admin` | Case inspection, event simulation, notification, persona, catalogue overrides, metrics, reset, purge, kill switch |

## Database tables

Core case: `cases`, `participants`, `participant_sessions`, `customers`, `facts`, `events`,
`messages`, `consents`, `tokens`.

Applications: `applications`, `application_requests`, `application_confirmations`, `documents`,
`product_interests`.

Plans and discovery: `plans`, `plan_milestones`, `plan_checkins`, `plan_watches`,
`need_decisions`.

Digital forms: `form_applications`, `form_answers`.

Configuration and operations: `persona_config`, `domain_config`, `catalogue_overrides`,
`product_catalogue`, `mortgage_rates`, `admin_users`, `push_subscriptions`.

## Scripts

| Script | What it does |
|---|---|
| `generate-seed.ts` | Builds the canonical presenter case. `seed:check` asserts it is current, and CI runs it |
| `generate-product-kb.ts` | Turns the captured BOI knowledge-base zip into a TypeScript module |
| `generate-mortgage-rates.ts` | Same for the rates zip |
| `fetch-form-definition.ts` | Pulls a published form definition and writes a snapshot |
| `compare-models.ts` | Measures candidate models against each other. Costs money |
| `check-bundle-secrets.ts` | Asserts nothing secret reached `dist/`. CI runs it |
| `build-metrics.mjs` | Counts the build out of git history |
| `live-probe.mjs` | Drives the live model, tagging its case as `test` on create and deleting it on exit |
| `push-auth-templates.mjs` | Pushes the auth email templates to the hosted project |

## Deliberately retained but unused

Not dead code — each is kept for a stated reason, so do not delete them as residue.

| File | Why it stays |
|---|---|
| `src/components/NotificationCard.tsx` | A simulated lock-screen notification, kept as a filming fallback. Nothing renders it, because real push has been confirmed arriving on a phone |
| 9 of the 41 `components/ui/*` | shadcn-generated and unreferenced. They are added by CLI and cost nothing; hand-rolling a replacement later would cost more |
| `react-hook-form`, `@hookform/resolvers`, `zustand` | Unreferenced today. The partner task forms and the composer draft are specified to use them, and they are in the mandated stack |

## Generated, never hand-edited

- `supabase/functions/_shared/db/database.types.ts` — `npm run db:types`
- `tenants/boi/mortgage-rates.ts` and the product knowledge base — their generator scripts
- `tenants/boi/forms/form-1833.json`, `form-1940.json` — `fetch-form-definition.ts`
- `domain/seed/canonical.ts` — `npm run seed:generate`
