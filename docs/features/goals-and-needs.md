---
title: Goals and needs
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/needs/engine.ts
  - supabase/functions/_shared/domain/goals/engine.ts
  - docs/needs-engine/baz-needs-catalogue.json
  - docs/goal-catalogue/baz-goal-catalogue.json
---

# Goals and needs

How Baz works out what somebody probably needs, without guessing.

Two engines, sharing one confidence calculation. 49 needs in the catalogue, plus a goal catalogue
with clusters.

## Evidence to confidence: noisy-or

Each signal independently *fails* to establish the need, and the need is established if any of
them succeeds. Several weak signals add up without any one being decisive, and nothing can exceed
certainty however much evidence arrives.

The alternatives both misbehave, and this is worth knowing before anyone proposes one:

- **A maximum ignores corroboration entirely.** Marriage plus separate finances plus shared costs
  would score exactly the same as marriage alone.
- **A sum passes 1.0 on three soft signals** and keeps going.

Calibration: the design's worked example puts marriage, separate finances and shared costs at
about 0.85; the implementation gives 0.87. The design's other figures are illustrative rather than
derived, so they are deliberately not fitted to.

## What the goals engine adds

Confidence is imported from the needs engine rather than reimplemented, so the two cannot drift
into disagreeing about what "established" means.

On top of that, the goals engine knows four things the needs engine has no view of:

1. **Goals arrive in clusters.** A life event implies several at once.
2. **Only one of them is what the customer actually came to talk about.**
3. **Some are right but mistimed** — correct, and not now.
4. **Two of them can quietly lay claim to the same money.**

That last one is the most useful and the least obvious. A deposit plan and a loan repayment drawn
from the same income are not two independent goods.

## Nothing activates itself

**Every function returns a reading of the case.** Creating a plan, starting an application or
raising a product takes the customer saying yes.

An engine that acted on its own confidence would be the AI boundary broken in a new place.

## Where discovery sits in the conversation

The `discovering` stage. The fork comes first: Baz reacts to what the customer said, says what it
involves, and puts the choice to them. Discovery is the *plan* branch of that fork — somebody who
wants to get straight to a product is not interrogated first.

And discovery lifts after four customer turns regardless, because a customer who will not answer
questions must still be able to get somewhere.

## Recorded decisions

What the customer decided about a need that was raised goes in `need_decisions`. A product they
declined goes in `product_interests` as `declined`, and declined products are listed in the case
digest as **do not raise again** — which is the only reliable way to stop a model offering a
credit card to somebody who just refused one.

## In the console

The engine section shows what the engines currently read from a case: which needs are established
and on what evidence, which goals are in play, which are held for later, and where two lay claim
to the same money. `GoalInsight.tsx` renders it.

## Catalogues

| Catalogue | File | Read by |
|---|---|---|
| Needs | `docs/needs-engine/baz-needs-catalogue.json` (49 entries) | `domain/needs/catalogue.ts` |
| Goals | `docs/goal-catalogue/baz-goal-catalogue.json` | `domain/goals/catalogue.ts` |

Both are referenced from the domain code by path, which is why they live in `docs/` rather than
beside the engines. The JSON is the catalogue; the TypeScript seeds from it.
