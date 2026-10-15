---
title: Customer plans
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/plans/
  - src/admin/PlanControls.tsx
  - docs/archive/source-definitions/customer-plans.md
---

# Customer plans

A plan is a commitment that outlives any single application: saving for a deposit, getting to a
target, buying something that is still a year away.

It exists because an application is the wrong unit for most of what a customer is actually trying
to do. An application finishes; a goal continues.

## What it looks like

Baz proposes a plan with `propose_plan` when what the customer wants takes months rather than one
conversation. The card is how they accept — **nothing is kept until they tap it.**

Once accepted, the plan carries:

| Piece | Table |
|---|---|
| The goal and its target | `plans` |
| Its steps | `plan_milestones` |
| When to come back to it | `plan_checkins` |
| A balance or condition the bank is watching for | `plan_watches` |

## Every number is computed

The deterministic system calculates and the model explains. Every figure a customer is told about
their own money comes from `plans/engine.ts`, so *"you'll get there around February"* is something
the bank can stand over rather than something a model found plausible.

Months are the unit, because months are what customers think in and the only unit the inputs can
support.

**The engine returns nulls rather than zeros wherever the case genuinely cannot say.** A projected
date invented from a missing saving rate is the exact failure the engine exists to prevent,
because the customer would act on it.

## A promise carries its condition

Baz once told a customer "we'll come back to you when your savings reach €32,000" before they held
any account. The watch is only created once a savings account exists — the code had always been
honest about that, but nothing said so, so the promise went out with an invisible condition.

A bank can only watch a balance it can see. The prompt now says so.

## Plans are not applications

A plan can be built with up to two things still unknown. An application cannot start with anything
outstanding.

That difference is deliberate: a plan needs enough of the picture to be worth the paper, not every
figure the eventual products will want. Holding out for all of them turns the one branch somebody
actively asked for into the interrogation they were trying to avoid.

## In the console

`PlanControls.tsx` shows a case's plans, their projections and their watches, and lets a presenter
move one. Plan events — `plan_completed`, `plan_abandoned`, `checkin_due` — are in the event
stream like everything else.

## Source

The feature was specified in detail before it was built; that document is archived at
`docs/archive/source-definitions/customer-plans.md`. The decisions log entry for 2026-10-05 is
the shorter version.
