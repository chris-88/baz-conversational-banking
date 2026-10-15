---
title: ADR-0002 — The model proposes, the engine decides
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/llm/tools.ts
  - supabase/functions/_shared/domain/requirements.ts
  - docs/decisions.md
---

# ADR-0002 — The model proposes, the engine decides

## Status

Accepted from the start of the build (2026-09-30). Extended to the conversation's own shape on
2026-10-15.

## Context

The product is a conversation that orchestrates real banking applications. A language model is
excellent at working out how to ask for something and unreliable as a record of what has
happened.

A conversational assistant that can write application state will eventually write the wrong
state, and it will be perfectly fluent about having done so. Every guarantee this project makes —
reuse, orchestration, continuity, "it knows exactly what changed" — rests on the database being
correct.

## Decision

The model has no capability to change anything. It renders a card; a customer's tap calls
`case-action`, which validates and writes.

Concretely:

- No tool creates, submits, pauses or resumes an application, grants consent, invites a partner,
  makes a declaration, or sets an eligibility outcome.
- What an application still needs is `outstanding(journey, facts)`, a pure function, recomputed
  every turn and never remembered.
- Every status Baz states must appear in a digest built from controlled data, and status cards
  render from the database independently of model text.
- Every tool input is Zod-validated; an invalid one returns a tool error and writes
  `tool_rejected`.
- The permitted conversational domain is enforced by a classifier and deterministic checks in
  front of the model, not by an instruction inside it.

**Extended 2026-10-15:** the conversation's own arc became a state machine too. Nothing knew
whether a customer had been understood yet, so nothing could say "not products, not yet" — a
transcript could run eight questions deep and then produce a product card with no goal and no
moment where anybody was asked what they wanted. Six stages are now derived from the case, and
the tools a turn is offered are the tools that stage allows.

## Alternatives considered

**Give the model write tools and validate server-side.** This is the common pattern and it was
rejected because validation that can reject an action still means the model chose to take it. The
customer's tap is not ceremony; it is the record of consent.

**Instruct the model in the prompt.** Rejected explicitly by the requirements for domain
restriction, and the same reasoning applies throughout: a prompt instruction is advice. "Do not
offer products yet" works most of the time. Withholding `show_product_options` works every time.

**Let the model compute what is outstanding.** Rejected. It would be wrong occasionally and
unaccountably, and the consequence is not cosmetic — a required field that is not active must not
block a journey, and an active field must not be skipped.

## Consequences

- The worst case for a hallucinated approval is a sentence the status card beside it contradicts.
- Adding a tool is more work: a contract, a card, a `case-action` action, and tests. That friction
  is the feature.
- The engine has to be genuinely complete. A requirement engine that cannot express something
  means the product cannot do it, and there is no escape hatch of "the model will handle it".
- 779 tests are possible because the decisions are in pure functions.
- Eligibility is a labelled fixture rather than a calculation, because the honest alternative to
  inventing a verdict is declaring that one is not being produced.

## Revisit when

Never, for state. The validation layer could be revisited if a future model's tool use became
reliable enough that the *customer's tap* were the only reason to keep the pattern — but the tap
is the consent record, so the pattern would stay regardless.
