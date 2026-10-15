---
title: SuperSaver (form 1833)
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/tenants/boi/forms/form-1833.json
  - supabase/functions/_shared/domain/journeys/savings.ts
  - src/content/how-it-works/forms.ts
---

# SuperSaver — form 1833

The first of the bank's published form definitions Baz reads. Mapped to the `savings` product.

## The snapshot

| | |
|---|---|
| Form id | `1833` |
| Form's own version | `SuperSaver - R2.0.1` |
| Source | `https://digital.bankofireland.com/api/forms/1833` |
| Retrieved | 2026-10-13 |
| Size | 707,337 bytes |
| Fields in the definition | **499** |
| Rules | **540**, across 246 of the 499 fields |
| Operators used | `is`, `isnot` — and nothing else |
| Calculated fields | None |
| Customer journey | `https://digital.bankofireland.com/personal-banking/supersaver/` |

The snapshot carries its own provenance — source URL, retrieval timestamp, the form's version
string and a hash of the bytes — and the admin console displays all four.

## Two different counts, and the difference matters

| Count | What it is |
|---|---|
| **499 fields** | Objects in the published definition, counted from the snapshot |
| **64 captured entries** | Entries a real browser submitted when somebody completed the genuine journey, for one branch |

They are not the same claim. A page that showed the captured number beside Baz's name would be
claiming Baz generated something it did not, which is why `src/content/how-it-works/forms.ts`
keeps them as separate fields with separate labels.

## What it exercises

Conditional logic, documents and consents.

No calculations — which made it a good first form and an incomplete picture of the problem.
Everything genuinely hard about this feature only appeared on [form 1940](personal-loan-1940.md):
calculated fields, numeric comparisons, circular dependencies, and an eligibility verdict.

## The lesson it taught by omission

SuperSaver's 540 rules use `is` and `isnot`. The operator enum was closed around those two, and
when the loan definition arrived with eleven `>` and two `<`, **it did not parse at all.**

The operator surface is now counted from the definitions rather than inferred from one of them.
That is the correct instinct for any third form added later.

## Branching is mostly on the page

The single most important thing to understand about this definition: a page break gates every
field carrying its `pageNumber`. That is far more load-bearing than the per-field rules, and it is
what `logic.ts` handles first.

## The Baz-side journey

`domain/journeys/savings.ts` — eight requirements, `status: 'draft'`:

identity (name, date of birth, address, PPS number), the savings target, the monthly amount, and
a fresh declaration.

Short on purpose. A savings account is not a credit decision, so there is no affordability to
assess and nothing to underwrite — asking for the furniture of a mortgage application would be
theatre. The target and the monthly amount are there because they are what make the
[plan](../features/customer-plans.md), and the follow-up when the target is reached, possible at
all.

## Prefill

`SUPERSAVER_PREFILL` in `tenants/boi/forms/prefill.ts` maps facts onto the form's own fields.

Two rules to remember:

- **Never prefill a `hidden` field.**
- Where several fields share a toscana name, required ones win — and names are not unique within
  a form, so destinations resolve against the live branch.

The two forms share only **two** toscana names out of 120 and 154, which is why each has its own
adapter table rather than a shared one.
