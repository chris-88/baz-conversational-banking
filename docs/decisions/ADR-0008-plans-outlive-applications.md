---
title: ADR-0008 — Plans outlive applications
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/plans/engine.ts
  - docs/archive/source-definitions/customer-plans.md
---

# ADR-0008 — Plans outlive applications

## Status

Accepted 2026-10-05.

## Context

An application is the wrong unit for most of what a customer is actually trying to do. "Buy our
first home" is not an application; it is a goal that several applications serve, over months,
with gaps.

Before this, a case that finished its applications was a case with nothing left in it — which
meant the product had nothing to say to somebody six weeks into saving for a deposit, who is
exactly the person a relationship bank should have something to say to.

## Decision

A plan is a first-class object that outlives any single application: a goal, its milestones, its
check-ins, and the balances or conditions the bank is watching for the customer.

Baz proposes one with `propose_plan`; the card is how the customer accepts, and **nothing is kept
until they tap it.**

Two consequences are deliberate and asymmetric with applications:

- **A plan can be built with up to two things still unknown**, measured against the goal
  catalogue. A plan is not an application: it needs enough of the picture to be worth the paper,
  not every figure the eventual products will want. Holding out for all of them turns the one
  branch somebody actively asked for into the interrogation they were trying to avoid.
- **Every number comes from `plans/engine.ts`.** The deterministic system calculates and the model
  explains, so *"you'll get there around February"* is something the bank can stand over. The
  engine returns **nulls rather than zeros** wherever the case genuinely cannot say, because a
  projected date invented from a missing saving rate is the exact failure it exists to prevent —
  the customer would act on it.

## Alternatives considered

**Model a goal as an application in a long-lived state.** Rejected: the state machine describes a
product journey, and a goal has no submission, no underwriting and no approval. Forcing it in
would have corrupted the one state machine the demonstration depends on.

**Keep goals as facts only.** Rejected: a goal needs milestones, a check-in schedule and a watch,
and those are rows, not a value.

**Let the model track the plan in conversation.** Rejected under
[ADR-0002](ADR-0002-ai-deterministic-boundary.md). Figures a customer will act on cannot come from
a model.

## Consequences

- Four tables: `plans`, `plan_milestones`, `plan_checkins`, `plan_watches`.
- The return story has something to return *to* even when no application has moved.
- **A promise needs its condition attached.** Baz told a customer "we'll come back to you when your
  savings reach €32,000" before they held any account. The watch is only created once a savings
  account exists — the code had always been honest, but nothing *said* so, so the promise went out
  with an invisible condition. A bank can only watch a balance it can see, and the prompt now says
  that.
- Plan events are in the event stream like everything else, so the metrics include them.

## Revisit when

The goals engine's clustering becomes strong enough to propose a plan without being asked. That
would change who initiates, which is a product decision rather than a modelling one.
