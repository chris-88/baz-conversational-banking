---
title: ADR-0003 — Supabase as the whole backend
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/
  - docs/decisions.md
---

# ADR-0003 — Supabase as the whole backend

## Status

Accepted 2026-09-30, at M0.

## Context

The project needed a database, authentication including anonymous users, file storage, live
updates, and somewhere to run server code holding an API key — on a two-week timeline, built by
one person, with no infrastructure budget and no operations capacity.

## Decision

Supabase for all of it: Postgres with row-level security, Auth (anonymous plus email for admins),
Realtime, Storage, and Edge Functions on Deno.

The frontend is a static SPA on GitHub Pages. There is no server of our own at all.

Two rules make this safe rather than merely convenient:

- **Clients read under RLS and never write.** There is not a single insert, update or delete
  policy in the schema. Every mutation goes through an Edge Function holding the service role.
- **Only the primary customer and an admin can read a case.** Four tables — `customers`,
  `participant_sessions`, `tokens`, `admin_users` — have no read policy at all, and their SELECT
  grant is revoked as well, so a policy added by mistake later still would not expose them.

## Alternatives considered

**A conventional API server.** Rejected on time. It would have needed hosting, deployment,
secrets management, a database anyway, and an auth implementation — all of it production
infrastructure built because production would need it, which the priorities explicitly rule out.

**Firebase.** Rejected: the relational model is the product here. Facts, requirements, journeys
and applications are joins, and the reuse story is a query. A document store would have fought it.

**Postgres with a thin function layer elsewhere.** Rejected: that is Supabase, with more assembly.

## Consequences

- Anonymous auth came free, which is what makes "every visitor is already a user, and the case
  follows the person" cheap. That is the continuity story.
- Realtime came free, which is what makes a partner's answer appear in the primary's case without
  a refresh.
- **Edge Functions are Deno**, so `tsc` cannot see them. A call to a function that did not exist
  typechecked clean and deployed. CI now runs `deno check` as its own step.
- Supabase client calls return `{ error }` rather than rejecting, so an unchecked write quietly
  does nothing. Thirty-nine writes had no error check and one broke a rule for a week.
  `mustWrite` now throws.
- **There is no error reporting on the server.** Failures surface as function logs and `events`
  rows, which is why the event vocabulary is as rich as it is.
- The domain had to be written as pure TypeScript with no platform APIs so the same code could run
  in Deno and in Vitest. That constraint turned out to be the best structural decision in the
  project.

## Revisit when

Someone needs this in production, where the service-role-in-a-function pattern and the absence of
server-side observability both stop being acceptable.
