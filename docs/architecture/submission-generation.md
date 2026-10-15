---
title: Submission generation
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/submission.ts
  - docs/decisions.md
---

# Submission generation

The packet the existing web journey would POST, built from the same definition it renders.

**Nothing ever POSTs it.** The endpoint is recorded as intended-destination metadata and that is
all. This is the point of the exercise, not a limitation of it.

## What it is

Not a summary of the application, and not an approximation of it: the ordered entries a browser's
`FormData` would carry to `POST /api/forms/<id>`, so that the definition, the answers and the
wire format can be put side by side and read against each other.

That is the artefact the whole feature exists to produce. A conversation that fills in a bank's
real form is a claim; a packet that can be diffed against a captured one is evidence.

## An ordered array, not an object

`FormData` permits repeated keys and the real SuperSaver packet uses them: `input_1189[]` appears
twice, once for the number and once for the country. A JSON object would silently lose one of
them.

## Three entry shapes

All three observed in real captured packets rather than invented:

| Shape | For |
|---|---|
| `input_<id>` | A plain field |
| `input_<id>.<n>` | A checkbox's sub-input |
| `input_<id>[]` | A compound field carrying more than one value |

## The `[object Object]` decision

A quote control sends two entries; an eligibility control sends one. The browser serialises the
parameters object by appending it to `FormData`, which turns it into the string
`"[object Object]"` — and that is literally what the captured submission carries. The platform
evidently recomputes from the rest rather than reading it.

A packet built for inspection carries the JSON instead. An entry reading `[object Object]` is
indistinguishable from a bug and tells a reader nothing.

This is a deliberate, recorded divergence from the captured wire format, and it is the kind of
thing that must be written down rather than discovered later by someone diffing the two. It is in
`docs/decisions.md` under 2026-10-14.

## Provenance per entry

Every entry records where its value came from, so the console can show the difference between a
fact, a form answer, a default, a calculation and a prefill. The forms section of the admin
console is built on this: what the form decided, and who decided it.

Structural fields — layout, copy, containers — are marked as structure and are never asked and
never submitted.

Some types are marked as not to be shown in full in an inspector.

## Documents are references, never signatures

A file attached to an upload control is recorded as a **reference, never bytes**: enough to show
which file answered which control, and nothing that could pass for the real upload service's
receipt.

Document manifests leave `x-file-hash` and `x-signed-file-hash` **null**, because the service
issuing them is not ours. Fabricating a signed hash would be manufacturing a receipt from a
system this project does not operate — which is exactly the kind of fidelity that looks
impressive and is indefensible.

## Why it is never sent

Three reasons, in order:

1. It is somebody else's production system. Writing to it is not ours to do.
2. Everything the demonstration needs is in the packet existing and being inspectable.
3. A proof of concept that can submit is a proof of concept that can submit something wrong.

The intended destination is metadata. If this were ever to become real, the change would be
deliberate, reviewed, and nothing like a one-line flag.
