---
title: The AI boundary
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/llm/tools.ts
  - supabase/functions/case-action/index.ts
  - supabase/functions/_shared/domain/requirements.ts
  - supabase/functions/_shared/domain/state-machine.ts
---

# The AI boundary

The most important document here. Everything else is downstream of it.

## The rule

**The model proposes. The UI commits. The database decides what is true.**

A language model is very good at working out how to ask something, and unreliable as a record of
what happened. So it is given the first job and structurally prevented from doing the second.

Not by a prompt instruction. By not having the capability.

## What the model cannot do

There is no tool that:

- creates an application
- submits an application
- pauses or resumes an application
- grants a consent
- invites a partner
- makes a declaration
- sets an eligibility outcome
- changes a state, of anything

It renders a card. The customer's tap calls `case-action`, which validates session access, the
current state, the required information and the business rules, and only then writes.

So the worst case for a model that hallucinates an approval is a sentence on screen that the
status card beside it contradicts — not an approved application.

## The three invariants this splits into

**1. The model proposes, the UI commits.** Above.

**2. State comes from the database.** Every status Baz states must appear in the case digest,
built from controlled data. Status cards render from the database independently of model text.
Baz reports an action as done only after `case-action` has confirmed it.

**3. What is outstanding is computed.** `outstanding(journey, facts)` in `_shared/domain` decides
what an application still needs — a pure function over the journey definition and the facts on
the case. The model decides only how to ask for what it returns. Nothing is remembered; it is
recomputed every turn, which is why correcting a fact immediately changes what gets asked.

## Where the line sits, concretely

| Decision | Made by |
|---|---|
| What an application still needs | `outstanding(journey, facts)` |
| Whether a state change is legal | `state-machine.ts` transition table |
| Whether a fact may be reused, confirmed or must be fresh | The fact catalogue and the journey requirement |
| Whether a loan should be paused against a mortgage | `advisories.ts`, deterministic |
| What the repayment on a form's figures is | The form's own declared formula, parsed by hand |
| Whether someone is eligible | A fixture. Never computed, never the model |
| Whether an input is in scope | The gate: deterministic checks plus a classifier |
| Which stage the conversation is in | Computed from the case, every turn |
| Which tools this turn may use | The stage |
| **How to say any of it** | The model |

## It applies to the conversation's shape too

This was the last exception and it is now closed. Nothing used to know whether a customer had
been understood yet, so nothing could say "not products, not yet" — a transcript could run eight
questions deep and then produce a product card with no goal, no plan, and no moment where anybody
was asked what they actually wanted.

So the arc became a state machine like any other. Six stages — `opening`, `direction`,
`discovering`, `planning`, `choosing`, `applying` — derived from the case, never chosen by the
model and never stored. The guidance for each stage is declared in one file, and **the tools a
turn is offered are the tools that stage allows.**

Telling a model "no products yet" works most of the time. Withholding `show_product_options`
works every time. A conversation still finding out what somebody wants cannot produce a product
card, because there is no tool to produce one with.

Because the stage is read off the case rather than stored, correcting a fact or changing one's
mind moves the conversation back by itself.

## Validation is the other half

Every tool input is Zod-validated before it has any effect. An invalid one returns a tool error
to the model — and writes a `tool_rejected` event — rather than throwing to the user.

`record_facts` is the sharpest case. The server checks the catalogue key exists, that the key is
marked `extractable`, and that the value matches the catalogue schema. A fact marked
`extractable: false` is refused no matter how confidently the model asserts it, which is how
health data stays out of inference and inside an explicit consented form.

## Why it is worth the ceremony

Because the alternative fails quietly. A model that can write state will, eventually, write the
wrong state, and the conversation will be perfectly fluent about it. Every guarantee this project
makes about reuse, orchestration and continuity rests on the database being right, and the only
way to keep it right is to be the only thing allowed to write it.
