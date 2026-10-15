---
title: Learnings
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - docs/decisions.md
  - docs/04-cost-of-running-a-conversational-assistant.md
---

# Learnings

What this project found out, separated from what it decided. A
[decision](../decisions/README.md) is a choice; a learning is something that turned out to be
true whether we liked it or not.

| Learning | |
|---|---|
| [Product pivots](product-pivots.md) | What was built and then deleted, and why |
| [Prompt caching](prompt-caching.md) | Where the cost actually went |
| [Model routing](model-routing.md) | A small model in front of a large one |
| [Tool schema cost](tool-schema-cost.md) | A fifth of the prompt that nobody had counted |
| [Timeout vs cancellation](timeout-vs-cancellation.md) | A deadline that abandons is not a deadline that ends |
| [Digital forms discovery](digital-forms-discovery.md) | What two published definitions taught |
| [Repository cleanup](repository-cleanup.md) | The 2026-10-15 cleanup pass, and what it found |

## The cost findings live in the paper, not here

Four of these are cost findings, and the authoritative version of each is a numbered finding in
[`../04-cost-of-running-a-conversational-assistant.md`](../04-cost-of-running-a-conversational-assistant.md).

The documents here state the **transferable lesson** and point at the finding. They deliberately
do not repeat the figures, for the reason the paper itself gives: those numbers are measured, and
a second copy of a measurement is a number that will go stale quietly.

**The paper is living.** If you change anything that moves what a turn costs — prompt size, cache
breakpoints or lifetimes, model choice, tool rounds, reply length — update the paper and its
changelog, with a measurement. Never revise it from memory.

## The one that is not a cost finding, and matters most

From the paper's honest accounting of the day the API credit ran out:

> The API credit that ran out was spent mostly on **development testing**, not on customer
> conversations. Verifying that a badge wrapped correctly, that cards appeared in the right
> order, that a calculation used the right opening balance — each of these was checked by running
> a full live conversation against the production model.
>
> **Transferable lesson.** Decide early which tests need a real model and which need a
> deterministic stand-in, and make the stand-in the default. Model behaviour needs the model.
> Layout does not.

That lesson is unlearned, because the stand-in does not exist. See
[the note in repository-cleanup](repository-cleanup.md#two-documents-describe-a-fixture-provider-that-has-never-existed).
