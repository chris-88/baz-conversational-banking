---
title: ADR-0005 — Read the bank's published form definitions
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/
  - docs/decisions.md
---

# ADR-0005 — Read the bank's published form definitions

## Status

Accepted 2026-10-13 for form 1833; extended 2026-10-14 for form 1940.

## Context

The project's central claim is that a conversation can replace a product journey. The weak version
of that claim is a conversation that collects some information and hands off. The strong version
is a conversation that completes **the bank's actual journey**.

The bank's digital forms platform publishes its form definitions as JSON over an API — the same
definitions its own web journeys render.

## Decision

Baz does not reimplement a product journey. It reads the definition the existing web journey
reads, works out which questions apply to this customer, and collects them in conversation.

**The definition stays the contract; Baz is another renderer of it.**

Two forms are snapshotted rather than fetched live: `1833` SuperSaver (499 fields) and `1940`
Consumer Loans (418). A demonstration must not depend on another organisation's website answering
at the moment somebody is filming, and re-pulling 691KB on every turn to serve our own is
impolite when the definition changes rarely.

The provenance travels with each snapshot — source URL, retrieval timestamp, the form's own
version string, a hash of the bytes — so somebody in the room can satisfy themselves the
definition is the bank's document and not ours.

Nothing in `_shared/domain/forms` knows a form id. Adding a form is a snapshot plus two rows in
`tenants/boi/forms/mapping.ts`.

## Alternatives considered

**Write our own journey definitions for each product.** This is what `domain/journeys/` does, and
it remains in place for products with no published form. Rejected as the *primary* mechanism
because a hand-written journey proves only that we can write a questionnaire.

**Fetch the definition live.** Rejected: an external dependency during a presentation, and
needless load on somebody else's infrastructure.

**Parse the rendered HTML journey.** Rejected: fragile, and the JSON definition is the actual
contract the platform uses.

## Consequences

- The claim is demonstrable rather than assertable. The field count, the branching rules and the
  packet shape can all be put beside the bank's own.
- The engine had to handle things a hand-written journey never would: page-level gating, 540 rules
  across 246 fields, calculated fields, numeric comparisons, and circular dependencies between
  what applies and what is calculated.
- **One form was not enough to know the shape of the problem.** SuperSaver's 540 rules use `is`
  and `isnot`; the operator enum was closed around those two, and the loan definition — with
  eleven `>` and two `<` — did not parse at all. The operator surface is now counted from the
  definitions rather than inferred from one.
- Eligibility had to be confronted. See
  [ADR-0006](ADR-0006-submissions-never-sent.md) and the fidelity declarations in `ndi.ts`.
- Two forms share only two toscana names out of 120 and 154, and names are not unique within a
  form, so each form needs its own adapter table and destinations resolve against the live branch.

## Revisit when

A third form is added — which should be cheap, and is the test of whether the "nothing knows a
form id" boundary actually held.
