---
title: Tool schema cost
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - docs/04-cost-of-running-a-conversational-assistant.md
---

# Tool schema cost

**Authoritative version: findings 5 and 8 of
[the cost paper](../04-cost-of-running-a-conversational-assistant.md).**

Two findings about tools, and the second is the more surprising.

## Tool definitions are part of the prompt, and nobody counts them

At the time of measurement, the tool schemas were **18% of everything sent** — more than the
policy, the voice, the fact reference and the tool guidance put together.

They had not been counted at all. The prompt had been audited line by line; the tool schemas were
invisible because nobody writes them as prose: they are generated from validators, they live in a
different file, and they do not appear in anything called "the prompt".

They cache along with the system prompt, so the cost is small once caching works.

> **Count what is actually sent, not what you wrote.** Tool schemas, injected examples and
> formatting instructions are all input tokens.

This is also why adding a tool now has a cost entry. The three digital-forms tools added roughly
600 tokens to the cached prefix — read once per conversation, so a fraction of a cent — and that
is recorded in the paper's changelog rather than discovered later.

## With a cached prefix, the round is the unit of cost

`record_facts` accepted at most 12 facts per call. A realistic opening message contains fifteen.

The model asked to record all fifteen, the schema refused, and the model recovered correctly by
splitting the batch and trying again. **That recovery is a whole extra model round, and every
round re-reads the entire cached prefix.**

The same turn, measured twice: three rounds instead of two, 46% more expensive, on exactly the
kind of message that makes the product look best.

The cap is now 24. Nothing was admitted by raising it — each fact is still checked against the
catalogue individually, and anything marked `extractable: false` is still refused.

> **Any validation limit tight enough for the model to hit regularly is a limit that silently
> doubles the price of the turn.** Set tool bounds by what the conversation actually contains.

## And record what the server refuses

The second half of that lesson is about observability, and it is why `tool_rejected` exists.

> A refusal the model recovers from leaves no trace at all, and looks exactly like an expensive
> turn.

A tool bound that the model works around is invisible in every metric except the invoice — the
conversation reads perfectly, the facts all arrive, and the turn costs half again as much. The
only way to see it is to write an event when the server says no.
