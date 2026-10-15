---
title: Synthetic data policy
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/seed/canonical.ts
  - supabase/functions/_shared/domain/forms/submission.ts
---

# Synthetic data policy

Invariant 10. Everything in this repository is invented, and there is **no mechanism by which real
data could be introduced**. The absence of that mechanism is the control; see
[ADR-0004](../decisions/ADR-0004-synthetic-data-only.md).

## The rules

- No real names, except where intentionally fictional.
- No real account identifiers, IBANs or card numbers.
- No real PPS numbers.
- No real phone numbers or email addresses.
- No real customer documents.
- No reusable auth tokens.
- **No production signed hashes.**
- No real credentials, and no real bank authentication of any kind.

## The canonical case

Aoife Ní Bhriain, bank reference `BOI-SYNTHETIC-000417`, and her spouse Emma Ní Bhriain.

The seed file states its synthetic nature in its own header, which is the right place for it —
the person most likely to need the reminder is whoever is editing the file.

Fixtures are meant to be **obviously** synthetic. `BOI-SYNTHETIC-000417` is not a plausible bank
reference, and that is deliberate.

## Signed hashes are the sharp edge

The genuine document journey uploads to a service that issues `x-file-hash` and
`x-signed-file-hash`. Baz leaves both **null**.

> A fabricated signature is a forged credential, however synthetic the file it describes.

This is the one thing in the forms feature that must not be invented under any circumstances, and
it is stated in the submission module, the upload function and
[ADR-0006](../decisions/ADR-0006-submissions-never-sent.md) because it is the sort of fidelity
that looks impressive and is indefensible.

Likewise eligibility: always a labelled fixture, never computed, and the model can never set one.

## Product content is public, not synthetic — and that is a different question

Mortgage rates and product copy are captured from the bank's **public** website. That is public
information rather than customer data, so it does not engage this policy.

It does engage a separate one: it is still the bank's content, and redistributing it in a public
repository needs its own review. Illustrative product terms in the catalogue are clearly marked
synthetic; the captured rate tables are not synthetic, they are real published figures. See
[the public repository review](public-repository-review.md).

## Brand assets

`boi-mark-placeholder.svg` and `boi-wordmark-placeholder.svg` — named "placeholder" so they
cannot be used by accident. Generated from the concept, not supplied by the bank.

## If you add a fixture

1. Invent the values. Do not copy a real one and change a digit.
2. Make it obviously synthetic where a reader might wonder.
3. If it is a document, record a reference, never a signature.
4. If it is a product figure, mark whether it is illustrative or captured from public material.
