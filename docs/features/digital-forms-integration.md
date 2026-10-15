---
title: Digital forms integration
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/
  - supabase/functions/_shared/tenants/boi/forms/
  - src/admin/FormsScreen.tsx
---

# Digital forms integration

The strongest claim this project makes: Baz completes the bank's **actual** product journey, by
reading the same definition the bank's own web journey reads.

The engine is documented in [architecture/digital-forms](../architecture/digital-forms.md) and
[submission generation](../architecture/submission-generation.md). This is the feature.

## What it does

Two of the bank's published forms are snapshotted:

| Form | Product | Fields | Rules |
|---|---|---|---|
| `1833` SuperSaver | `savings` | 499 | 540 across 246 fields |
| `1940` Consumer Loans | `personal_loan` | 418 | 371, including 13 numeric comparisons |

When a customer starts one of those products, a `form_applications` row is created against the
form. From then on:

1. The engine works out which of the form's questions actually apply to this customer.
2. Anything Baz already knows as a **fact** prefills.
3. The rest are asked in conversation, one at a time.
4. Declarations are shown in the form's own published wording and ticked on a card.
5. Documents are requested with the form control's own size and type limits.
6. A submission packet is built — and never sent.

The customer never sees a 499-field form. They have a conversation, and the form fills in.

## What the customer never does

- Does not read a page of questions.
- Does not answer anything the form's own logic says does not apply to them.
- Does not give a figure twice — the total is calculated from its parts, by the form's own
  formula.
- Does not get an eligibility answer from a language model.

## What is faithful and what is not

Stated plainly, because this is where a demonstration could mislead:

| | |
|---|---|
| **Faithful** | The definition, the field set, the branching rules, the page gating, the calculations, the packet's shape and ordering, the declaration wording, the upload limits |
| **A labelled fixture** | Eligibility. Always, without exception |
| **Computed from declared inputs** | Repayments and quotes |
| **Deliberately divergent** | Quote and eligibility control parameters carry JSON rather than the literal `[object Object]` the real packet contains |
| **Deliberately absent** | `x-file-hash` and `x-signed-file-hash`, left null, because the service issuing them is not ours |
| **Never** | Submission. Nothing POSTs anything |

The console shows which fidelity produced every number on screen, so this is visible in the
product and not only in a document.

## Adding a third form

A snapshot plus two rows in `tenants/boi/forms/mapping.ts`. Nothing in `_shared/domain/forms`
knows a form id.

```bash
node scripts/fetch-form-definition.ts <formId>
```

Then add the product → form mapping and its prefill table. A product with no entry has no form,
which is the normal state for most of the catalogue and **is not an error**: the case still runs
through Baz's own journey, there is simply no published definition to map it onto.

## Why two forms, not one

Because one was not enough to know the shape of the problem.

SuperSaver calculates nothing and uses two operators. The loan form adds calculated fields,
numeric comparisons, circular dependencies between what applies and what is calculated, and an
eligibility control. Everything genuinely hard about this feature only appeared on the second
form — which is also why the operator set is now counted from the definitions rather than
inferred from one of them.
