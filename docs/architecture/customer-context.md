---
title: Customer context
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/facts.ts
  - supabase/functions/_shared/domain/requirements.ts
  - supabase/functions/_shared/domain/metrics.ts
  - supabase/functions/_shared/db/loaded-case.ts
---

# Customer context

The thing the project is actually about: a fact is collected once and does everything it can.

## A fact

A typed value about a subject, with provenance. The full shape is in
[the data model](data-model.md); the parts that matter here are:

- **`key`** comes from a catalogue, never free text. The catalogue defines the value's schema,
  whose fact it is, the default reuse policy, its sensitivity, and whether the model may extract
  it from conversation at all.
- **`subject`** is a participant or `household`. This is what keeps people apart.
- **`source`** records where it came from: stated by the customer or the partner, held by the
  bank, extracted from a document, verified from a document, or derived by the system.
- **`capturedFor`** records which application prompted it, which is what makes reuse countable.
- **`supersededBy`** means facts are never updated in place. A correction writes a new fact and
  points the old one at it.

## What is outstanding is computed

`outstanding(journey, facts)` is a pure function over the journey definition and the facts on
the case. Computed every time, never remembered by the model. The model decides only how to ask.

Reading facts goes through one function — by key and subject, newest first, ignoring superseded
ones — and it is exported rather than private because **the needs engine reads the same facts
through the same rules.** Two readers disagreeing about what the case says would be worse than
either being wrong.

## Reuse policy

Four values: `auto`, `confirm`, `fresh`, `never`.

The catalogue sets a default per key; a journey requirement may override it. The rule is that
**a requirement may tighten the catalogue's policy but never loosen it** — the stricter of the
two wins. Health data marked `never` in the catalogue stays `never` however a journey asks for
it.

| Policy | Behaviour |
|---|---|
| `auto` | Reuse silently. The customer is never asked again |
| `confirm` | Show what is held and ask them to confirm it. Bank-held address, typically |
| `fresh` | Ask again regardless of what is held |
| `never` | Cannot be reused at all |

## Subject matching

The primary's income does not satisfy the partner's income requirement. A journey requirement
names a role; the role resolves to the participant it belongs to, and returns null when that role
has no participant yet — which is how an application knows it is waiting on a partner who has not
joined.

Household information comes from the primary customer.

This was a real bug: facts recorded against the wrong person is a one-line mistake with a
demo-breaking effect, and it is now explicitly tested.

## Questions avoided

The headline measure. One count per requirement satisfied without asking inside that application:
a bank-held value, a value captured in general conversation, or one captured for a different
application. Each writes a `context_reused` event, and the metric is the count of those events.

The specification's own example — an address asked once and reused across four further journeys —
comes out as 4.

Two companion measures come from the same data: which facts did the most work, most reused first,
which is what makes reuse legible in the console and on screen; and how much distinct information
the customer actually supplied, where a corrected value supersedes the old one and counts once.

All of it is derived from controlled data rather than asserted. Pure functions, fully tested.

## The case digest

What the model is allowed to know, built from the database every turn: facts with provenance,
applications and their states, outstanding requirements, advisories, product interests **including
declined ones**, plans, and — on a return — events since `last_seen_at`.

Two rules about it:

- **Every status Baz states must appear here first.** If it is not in the digest, Baz cannot say
  it, and the status card beside the text renders from the database independently anyway.
- **Declined products are listed as "do not raise again".** A customer who said no to a credit
  card should not be offered one in the next breath, and the only way to guarantee that is to put
  the refusal in front of the model every turn.

## Bank-held facts

Loaded server-side when a case is linked to a synthetic customer record. They are not re-asked
unless the journey requirement says `confirm` or `fresh`.

This is the moment the demonstration turns on: the customer signs in and the questions they were
about to be asked stop being asked.

## A complete application

An application has everything except the things the customer confirms at the end.

Declarations, consents and reuse confirmations are blocking requirements, so an application can
never be `complete` while they are outstanding — which would mean the review card could never be
shown, and the review card is exactly where those confirmations are made.
