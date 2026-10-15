---
title: ADR-0007 — Anonymous first, identity attached later
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/lib/identity.ts
  - docs/decisions.md
---

# ADR-0007 — Anonymous first, identity attached later

## Status

Accepted 2026-09-30 (anonymous sessions). Simulated bank login removed 2026-10-06. Google removed
and address-based recognition adopted 2026-10-15.

## Context

The demonstration turns on continuity: a customer starts on a public page, moves to their phone,
signs in, and the questions they were about to be asked stop being asked.

For that to be worth watching, the conversation has to be real **before** the sign-in. An early
version joined the seeded customer directly, which skipped the whole continuity story and faked
the thing the demo is built on.

## Decision

Every visitor gets a Supabase **anonymous** user and a case on arrival. They can hold a complete
conversation, start applications and give facts without identifying themselves.

Signing in is email address then a one-time code, and nothing else. It **attaches** an identity to
the anonymous user that is already there, so `auth.uid()` does not change and the case, the
conversation, the applications and every fact carry over with nothing to move.

`participant_sessions` maps auth users to participants **many-to-one by design**: one person,
several auth users, one conversation. Safari and an installed PWA have separate storage on iOS, so
the same human genuinely does arrive as two auth users.

A returning customer is recognised **by address, never by cookie** — a cookie identifies a
browser, and the premise is that the case follows the person.

## Alternatives considered

**Require sign-in up front.** Rejected: it makes the continuity moment invisible and it is the
wrong product. A public visitor should be able to find out what Baz does without an account.

**A simulated bank login.** Built, then removed with the app shell. It implied there was a
signed-in version of Baz that knew more about you, when every visitor is anonymous and tells Baz
what it needs to know.

**Google sign-in.** Built, then **removed entirely rather than hidden** — a disabled provider is a
thing someone re-enables, and there was no second provider worth choosing between.

**A device-local identity.** Rejected: it identifies the browser, which is exactly the thing the
feature is meant to transcend.

## Consequences

- The sign-in moment is a genuine demonstration rather than a navigation change.
- **The attach path is not the only path, and assuming it was orphaned a live case.** Attaching
  fails whenever the address already belongs to a user — a second device, or anybody signing in
  twice — and the fall-through signs them into that existing account: different `auth.uid()`, no
  mapping, and a conversation gone at the precise moment it was meant to be made safe. Both paths
  now note who the browser was beforehand and claim the participant afterwards.
- One shared sign-in component, because the last time two sign-in paths drifted apart one of them
  stopped working for a week.
- RLS has to resolve a case through `participant_sessions`, which is why `can_read_case()` is a
  security-definer function.

## Revisit when

A second identity provider is genuinely needed. The lesson from Google is to remove rather than
disable, so adding one back is a deliberate change with its own entry.
