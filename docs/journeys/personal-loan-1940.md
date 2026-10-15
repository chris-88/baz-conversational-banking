---
title: Personal loan (form 1940)
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/tenants/boi/forms/form-1940.json
  - supabase/functions/_shared/domain/forms/ndi.ts
  - supabase/functions/_shared/domain/journeys/personal-loan.ts
---

# Personal loan — form 1940

The form that made the feature real. Mapped to the `personal_loan` product.

## The snapshot

| | |
|---|---|
| Form id | `1940` |
| Form's own version | `Consumer Loans E2E Combined - R9.10.1` |
| Source | `https://digital.bankofireland.com/api/forms/1940` |
| Retrieved | 2026-10-14 |
| Size | 444,194 bytes |
| Fields in the definition | **418** |
| Rules | **371**, including 13 numeric comparisons |
| Operators used | `is`, `isnot`, `>`, `<` |
| Calculated fields | **6** |
| Calculating controls | **4**, one of which decides whether the application can proceed |
| Customer journey | `https://digital.bankofireland.com/consumer-lending/personal-loan` |

Captured entries for one completed branch: **74** — a new standard loan for a car, repaid
monthly. That is a different count from the 418 fields, and the two are deliberately never shown
as the same thing.

## Why this form is the stronger proof

SuperSaver is a long questionnaire with branching. This form *decides things*.

### Calculated fields

Six, and they are not cosmetic. Field 255 is the total amount, summing whichever of **seven**
possible loan-amount fields the active branch uses — and the rules deciding whether an amount is
valid compare against it.

```text
255  {:179}+{:218}+{:219}+{:381}+{:396}+{:453}+{:501}
525  ({:523}/{:255})*100
618  {:525}
```

The third is why calculations resolve in dependency order rather than definition order.

Hand-written four-operator parser. **Never `eval`, never the model.** Ask a customer for a total
they have already given in pieces and the journey is wrong; let the model add it up and the number
is a guess.

### Circular dependency

Which fields apply depends on the total amount. The total is calculated from the loan amount.
Which loan-amount field is the one that counts depends on which fields apply.

SuperSaver never showed this because it calculates nothing. This form puts it on the **first
page**.

So `state.ts` settles rather than computes: work out what applies, calculate from what applies,
work out what applies again, stop when it stops moving. Two passes is the normal case; the bound
exists for the pathological one.

### The eligibility control

This is the most dangerous part of the whole feature, and it is handled by refusing to implement
it.

> A conversational assistant that invents an eligibility result is not a demonstration of
> anything anybody would ship.

Each calculating control declares its fidelity:

| Control | Fidelity |
|---|---|
| Repayment / quote | `source_faithful` — computed from the control's own declared inputs |
| **Eligibility** | **`fixture`, always** |
| Others | `unsupported`, declared and labelled as such |

The model can never set an eligibility outcome, and the console shows which fidelity produced
every number on screen.

### The `[object Object]` divergence

A quote control sends two entries; an eligibility control sends one. The browser serialises the
parameters object into `FormData`, which turns it into the literal string `"[object Object]"` —
and that is what the captured submission actually carries. The platform evidently recomputes from
the rest.

Baz's packet carries the JSON instead, because an entry reading `[object Object]` is
indistinguishable from a bug and tells a reader nothing. A deliberate, recorded divergence —
`docs/decisions.md`, 2026-10-14.

## Documents

Requested with the form control's own size and type limits.

What goes into the packet is a **reference, never bytes and never a signature**. The genuine
journey uploads to a service issuing `x-file-hash` and `x-signed-file-hash`; Baz leaves both
null. A fabricated signature is a forged credential however synthetic the file it describes.

## The Baz-side journey

`domain/journeys/personal-loan.ts` — 14 requirements, `status: 'draft'`, no partner.

The loan is also the subject of the required advisory: `loan_vs_mortgage` fires when a personal
loan is progressing while a mortgage is active. Baz explains, and the card offers Pause or
Continue. The customer decides — the advisory is a deterministic rule, not a model judgement, and
not an automatic action.

## Source definition

The feature was specified in detail before it was built. That document is archived at
`docs/archive/source-definitions/personal-loan-1940.md`.
