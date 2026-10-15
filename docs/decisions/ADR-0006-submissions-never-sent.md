---
title: ADR-0006 — Build the submission packet and never send it
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/submission.ts
  - supabase/functions/_shared/domain/forms/ndi.ts
---

# ADR-0006 — Build the submission packet and never send it

## Status

Accepted 2026-10-14.

## Context

Having read the bank's own form definition and collected its answers in conversation
([ADR-0005](ADR-0005-digital-forms-reuse.md)), the obvious next step is to submit it. The
endpoint is known. The packet can be built.

It is also somebody else's production system.

## Decision

Build the packet exactly — the ordered `FormData` entries a browser would carry to
`POST /api/forms/<id>` — and **never POST it.** The endpoint is recorded as intended-destination
metadata.

The packet is an ordered array rather than an object, because `FormData` permits repeated keys and
the real SuperSaver packet uses them: `input_1189[]` appears twice, once for the number and once
for the country. A JSON object would silently lose one.

Alongside it, two related refusals:

- **Eligibility is always a labelled fixture.** Each calculating control declares its fidelity —
  `source_faithful`, `fixture` or `unsupported` — and the eligibility verdict is never anything
  but a fixture. The model can never set one. A conversational assistant that invents an
  eligibility result is not a demonstration of anything anybody would ship.
- **Document manifests leave `x-file-hash` and `x-signed-file-hash` null**, because the service
  issuing them is not ours, and a fabricated signature is a forged credential however synthetic
  the file it describes.

## Alternatives considered

**Submit to a test environment.** Rejected: there is no test environment available to this
project, and arranging one is an integration programme rather than a prototype decision.

**Submit, behind a flag defaulting to off.** Rejected. A flag is a thing someone can turn on, and
the whole point is that this system has no capability to write to the bank. The absence of the
call is the control.

**Build a summary rather than the real packet.** Rejected, and this is the interesting one. A
summary proves nothing. The packet existing in the real wire format is what lets the definition,
the answers and the submission be put side by side and read against each other — a claim that can
be diffed rather than believed.

## Consequences

- The feature's output is an artefact for inspection, which is why the console shows the packet
  with per-entry provenance: fact, form answer, default, calculation or prefill.
- One deliberate divergence from the captured wire format, recorded here because it would
  otherwise be discovered by somebody diffing the two: a quote or eligibility control's parameters
  object serialises in a real browser to the literal string `"[object Object]"`, and that is what
  the captured submission carries. Baz's packet carries the JSON instead, because an entry reading
  `[object Object]` is indistinguishable from a bug and tells a reader nothing.
- The honest description of the product includes "and then it stops", which is a better
  demonstration than a fake success screen.

## Revisit when

A sanctioned integration exists, with a test environment and an owner on the bank's side. That
change would be deliberate and reviewed, and nothing like a one-line flag.
