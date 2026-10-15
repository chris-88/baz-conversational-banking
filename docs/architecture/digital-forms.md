---
title: Digital forms
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/
  - supabase/functions/_shared/tenants/boi/forms/
---

# Digital forms

Baz does not reimplement a product journey. It reads the definition the existing web journey
reads, works out which questions apply to this customer, and collects them in conversation. **The
definition stays the contract; Baz is another renderer of it.**

That is the strongest claim the project makes, and this is the machinery behind it.

## The two forms

| Form | What it is | Fields | Version |
|---|---|---|---|
| `1833` | SuperSaver | 499 | `SuperSaver - R2.0.1` |
| `1940` | Personal loan | 418 | `Consumer Loans E2E Combined - R9.10.1` |

Snapshotted rather than fetched live: a demonstration must not depend on another organisation's
website answering at the moment somebody is filming, and re-pulling 691KB on every turn to serve
our own is impolite when the definition changes rarely.

**The provenance travels with the snapshot** — source URL, retrieval timestamp, the form's own
version string, and a hash of the bytes. That is what lets somebody in the room satisfy
themselves the definition is the bank's document and not ours. The admin console shows all four.

Adding a third form is a snapshot plus two rows in `tenants/boi/forms/mapping.ts`. **Nothing in
`_shared/domain/forms` knows a form id.**

## `definition.ts` — parsing

Deliberately permissive. The SuperSaver definition carries far more metadata than is needed
(styling, placement, help text, analytics hooks), and a schema insisting on knowing every key
would break the first time the bank published a revision. What is parsed is what is used.

The operator surface is `is`, `isnot`, `>` and `<`, with `all` or `any`, acting to `show` or
`hide`. That is not a simplification — it is every operator the published definitions use,
counted rather than assumed.

> This is also a lesson. SuperSaver's 540 rules use `is` and `isnot` and nothing else, so the
> enum was closed around those two. The loan's 371 rules add `>` eleven times and `<` twice, and
> the loan definition did not parse at all. Count the real thing; do not infer the grammar from
> one sample.

## `logic.ts` — what applies

540 rules across 246 of SuperSaver's 499 fields. A model asked to work out which apply would be
wrong occasionally and unaccountably, and the consequence is not cosmetic: a required field that
is not active must not block the journey, and a field that is active must not be skipped.

**Most branching is on the page, not the field.** A page break gates every field carrying its
`pageNumber`, which is the single most important thing to understand about these definitions — it
is far more load-bearing than the per-field rules.

Values are compared as strings throughout, because that is what the definition does.

## `calculations.ts` — the form's own arithmetic

The loan definition carries six calculated fields, and they are not cosmetic. Field 255 is the
total amount, summing whichever of seven possible loan-amount fields the active branch uses, and
the rules deciding whether an amount is valid compare against it.

```text
255  {:179}+{:218}+{:219}+{:381}+{:396}+{:453}+{:501}
525  ({:523}/{:255})*100
618  {:525}
```

The third is why this resolves in dependency order rather than definition order.

A hand-written four-operator parser. **Never `eval`, never the model.** Ask a customer for a
total they have already given in pieces and the journey is wrong; let the model work it out and
the number is a guess.

## `state.ts` — settling

Active fields and calculated values are circular by nature: which fields apply depends on the
total, the total is calculated from the loan amount, and which loan-amount field counts depends
on which fields apply. SuperSaver never showed this because it calculates nothing; the loan form
puts it on the first page.

So it **settles** rather than computes: work out what applies, calculate from what applies, work
out what applies again, stop when the answer stops moving. Two passes is the normal case and the
bound exists for the pathological one.

Stale answers on abandoned branches are dropped.

## `ndi.ts` — the calculating controls

The loan definition describes four custom controls that calculate, and one of them decides
whether an application can proceed at all. That is what makes this form a stronger proof than
SuperSaver, and also the most dangerous part to implement: **a conversational assistant that
invents an eligibility result is not a demonstration of anything anybody would ship.**

So each control declares its fidelity:

| Fidelity | Meaning |
|---|---|
| `source_faithful` | Computed from the control's own declared inputs. Repayments are this |
| `fixture` | A fixed, labelled stand-in. **Eligibility is always this** |
| `unsupported` | Declared, not implemented, and says so |

The model can never set an eligibility outcome. The console shows which fidelity produced every
number on screen.

## Facts versus form answers

Facts are canonical. Each form has its own adapter table, because the two forms share **two**
toscana names out of 120 and 154 — and a name is not unique within a form either, so destinations
resolve against the live branch.

Two rules from that:

- **Never prefill a `hidden` field.**
- Where several fields share a name, required ones win.

Answers that are not facts — a form-specific question, a declaration, a document reference — live
in `form_answers`, with the wording for consents recorded alongside.
`form_applications.answers` is the merge, facts last.

## What the model may do

`record_form_answers` writes an answer to one of the form's own questions. The server checks the
field is live on the current branch, is a question, and that a choice value is one the form
offers. It **refuses declarations and uploads outright**, whatever it is sent.

`show_form_declarations` renders the form's declarations in its own published wording; the model
supplies no text. `show_form_upload` asks for the next document the form wants, with the
control's own size and type limits.

A declaration can only be made by tapping the card.

## And then nothing is sent

See [submission generation](submission-generation.md).
