---
title: ADR-0004 — Synthetic data only, with no real-data path
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/seed/canonical.ts
  - scripts/check-bundle-secrets.ts
---

# ADR-0004 — Synthetic data only, with no real-data path

## Status

Accepted 2026-09-30. Invariant 10.

## Context

A conversational banking prototype demonstrated to a bank is exactly the kind of project where
real data arrives by accident: a screenshot with a real name, a test account with a real IBAN, a
captured document from a colleague's journey.

The repository is also public, which removes any margin.

## Decision

Nothing real, anywhere, and no mechanism by which real data could be introduced.

- The canonical case is invented: Aoife Ní Bhriain, her spouse Emma, bank reference
  `BOI-SYNTHETIC-000417`. The seed file states its synthetic nature at the top.
- No real credentials and no real bank authentication. There is no integration that could reach a
  real customer record.
- No real PPS numbers, account numbers, IBANs, phone numbers or addresses.
- Illustrative product terms are **clearly marked synthetic** in the catalogue.
- The BOI mark and wordmark are named `boi-mark-placeholder.svg` and
  `boi-wordmark-placeholder.svg` so they cannot be used by accident.
- Uploaded documents are synthetic, and the submission packet records a **reference, never a
  signature** — `x-file-hash` and `x-signed-file-hash` are left null, because a fabricated
  signature is a forged credential however synthetic the file it describes.
- `npm run check:bundle` fails the build if a credential shape or a value from `.env` reaches
  `dist/`. CI runs it on every build, because the site is public and anything in `dist/` is
  readable by anyone.

## Alternatives considered

**Anonymised real data.** Rejected outright. Anonymisation is a judgement call made once and
relied on forever, in a public repository, by someone with no mandate to make it.

**Real data in a private environment, synthetic in public.** Rejected: two code paths, and the
wrong one eventually runs. The absence of a real-data path *is* the control.

## Consequences

- The demonstration is entirely reproducible, which is why a reset works and why an audience can
  be handed the same customer.
- Eligibility cannot be anything but a fixture, which turned out to be the right answer for other
  reasons too.
- Anyone can run this project without a data agreement.
- Mortgage rates and product copy are captured from the bank's **public** website. That is public
  information, not customer data — but it is still the bank's content, and redistributing it needs
  its own review. See [the public repository review](../security/public-repository-review.md).

## Revisit when

Never, in this repository. A production pilot with real customers is a different system with a
different data protection posture, and it would not inherit this one.
