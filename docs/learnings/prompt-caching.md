---
title: Prompt caching
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - docs/04-cost-of-running-a-conversational-assistant.md
  - supabase/functions/_shared/llm/prompt.ts
---

# Prompt caching

**Authoritative version: findings 1, 2, 3 and 6 of
[the cost paper](../04-cost-of-running-a-conversational-assistant.md).** The figures are there and
are measured. This is the shape of what was learned.

Caching is the difference between this product being affordable and not. Four things were wrong
about it, and three of them were invisible.

## Cache the conversation, not just the prompt

There was one breakpoint, on the system prompt. The message history sat after it and was re-read
at full price every turn — so the cost of a turn grew with the length of the conversation, which
is the one thing a conversational product cannot afford.

> **Cache both.**

## Match the cache lifetime to how people actually talk

The default five-minute lifetime re-paid the full prefix after every pause longer than it, and
customers pause for longer than five minutes constantly.

A one-hour cache costs more to write and is worth it if the conversation outlives five minutes,
which it usually does.

The larger effect was nearly missed: **the cached prefix does not depend on the case.** Policy,
domain, catalogue and tool schemas are identical for every customer, and the cache is keyed on
content — so one entry serves everybody.

> **Work out whether your cached prefix is per-user or shared before you price it.**

## Put volatile content after the breakpoint, however small

The persona block is 178 tokens of style instructions, and it sat *inside* the cached prefix. Any
persona change invalidated the whole prefix — and because two persona states were being
alternated between, two cache entries were being maintained without anyone deciding to.

> **A cache breakpoint is invalidated by anything in front of it, so size is irrelevant: what
> matters is volatility.**

The composition order follows from this, and is enforced rather than conventional:

```text
policy (immutable) → domain → product catalogue → persona style → case digest
```

Policy first so nothing can outrank it, the volatile digest last.

## Caching fails open, and silently

The gate's system prompt carries a `cache_control` marker. Every measured turn reported **zero**
cache reads and zero writes for it: the classifier prompt is below the minimum length that model
class will cache, the marker is accepted, no error is returned, and nothing happens.

It had been there since the gate was written, and it was assumed to work because the code said so.

> **If you have not seen a non-zero `cache_read` for a block, you do not know it is cached.**

It has been left uncached, because padding a prompt to reach a cache threshold would cost more
than it saves. The comment beside it now records the measurement rather than the intention — which
is the right outcome for any assumption that turns out to be false.
