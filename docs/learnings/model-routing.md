---
title: Model routing
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - docs/decisions.md
  - scripts/compare-models.ts
  - supabase/functions/_shared/llm/gate.ts
---

# Model routing

Two models, each doing the thing it is good at. The split was measured, not assumed.

## The configuration

| Variable | Default | Job |
|---|---|---|
| `GATE_MODEL` | `claude-haiku-4-5-20251001` | Classify one message into one of eight categories |
| `BAZ_MODEL` | `claude-sonnet-5-5` | Hold the conversation and call the tools |

Both are environment-configured, so changing one is a deploy rather than a code change.

## Haiku was measured for the conversation, and rejected

`npm run compare:models` runs the same turns through both and reports what each did.

Across two runs of three turns:

| | Right tool called | `show_product_options` |
|---|---|---|
| Sonnet | **6/6**, identical behaviour on both runs | Called |
| Haiku | **1/6** — `record_facts` on one run, nothing on the next, same input | **Never** |

Haiku is roughly 3× faster and half the price. Neither pays for losing the orchestration, which
is the fourth priority in the order and the whole of the end-to-end test.

> **Without tool calls there is no orchestration.** A cheaper model that holds a pleasant
> conversation and records nothing looks fine on screen and orchestrates nothing underneath.

The harness still exists. Re-run it whenever this is worth revisiting — which is the right way to
leave a decision like this, because the answer is a property of the models rather than of the
design.

## Haiku is right for the gate

Classification into a fixed set of categories is what a small, fast model is good at, and the
gate scores 100% on both guardrail sets with it.

A small model in front of a large one is also most of why a turn is affordable: the gate runs on
every message, including every message that is about to be refused, and the Baz model never sees
those at all.

## The model tier is not the cost lever

This is the finding that reframed the whole cost question.

> **Prompt caching is the real cost lever, not the model tier.**

A stable prefix written once and read from cache thereafter costs roughly a tenth of its input
price. The prefix is shared across every customer, because it does not depend on the case.

Moving from Sonnet to Haiku would halve the per-token price and lose the product. Getting caching
right cut a 12-turn conversation's cost by about 42% and lost nothing. See
[prompt caching](prompt-caching.md).

## What the prompt had to be given as well

Three additions made on the same day, each because the model was guessing where it should have
been told:

- **`TOOL_GUIDANCE`.** The policy said what Baz may not do; nothing said what it must actively do.
- **A generated fact reference.** `record_facts` types `value` as `unknown`, so the model was
  guessing — it sent `"spouse"` for a key whose enum is alone/partner/other, the write was
  silently refused, and a fact was lost for a reason the customer never caused. Generated from the
  catalogue so it cannot drift, and it omits non-extractable keys so health data is not even
  named.
- **The catalogue decides household versus personal, not the model.** Asking the model to classify
  it lost facts: it sent household keys under `primary` and the write was refused. `subject` is now
  optional and only means "this belongs to the second applicant".

All three are the same lesson: where a server will refuse something, tell the model the rule
rather than letting it discover the refusal.
