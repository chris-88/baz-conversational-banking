# What a conversational assistant costs to run

**Baz POC — technical lessons learned**
Last updated: 8 October 2026

---

## Why this document exists

The first question anyone asks about a conversational product is what it costs per
conversation, and "a few cents" is a worse answer than a number.

This is the number, how we arrived at it, and the four things we got wrong on the way. Most of
it is not specific to banking or to Baz. If you are building anything that puts a large
language model behind a chat box, the shape of the bill will look like this one, and the
mistakes are available to you too.

Everything here was measured against the running system, not estimated from a pricing page.

---

## The headline

| | Per 12-turn conversation |
|---|---|
| Before optimisation | **€0.59** |
| After | **€0.31** |

No change to the model, the product catalogue, or what Baz is capable of saying. The entire
saving came from caching things that do not change, and from not paying for requests nobody
reads.

At that rate, a thousand full conversations costs about €310. A demo day with fifty audience
sessions of five turns each costs under €5.

---

## The anatomy of a turn

A single customer message triggers two model calls:

1. **The gate** — a Haiku-class classifier that decides whether the message is in scope at all.
   It runs before anything else, on every turn, including ones it blocks.
2. **Baz** — a Sonnet-class model with the full system prompt, the conversation so far, and a
   set of tools. One to three rounds, depending on whether it needs to render a card.

The system prompt measures **17,285 tokens**. It breaks down like this:

| Section | Tokens | Share |
|---|---:|---:|
| Product catalogue (61 real products) | 11,331 | 66% |
| Tool guidance | 1,684 | 10% |
| Fact reference | 1,360 | 8% |
| Voice | 951 | 6% |
| How applying works | 558 | 3% |
| Policy | 511 | 3% |
| What we can do | 484 | 3% |
| Domain scope | 160 | 1% |
| Persona | 149 | 1% |

Add roughly 800 tokens of tool definitions, 3,600 tokens of conversation history (a rolling
24-message window), 300 tokens of case state, and about 350 tokens of reply.

### Where the money went, before

A steady-state turn with a warm cache cost **€0.021**:

| | |
|---|---:|
| 18k cached prefix, read | €0.0050 |
| 3.6k conversation history, **uncached** | €0.0099 |
| ~350 output tokens | €0.0048 |
| Gate (Haiku) | €0.0004 |

**The first surprising thing.** The conversation history cost twice what the entire 17,000-token
system prompt cost. The prompt was cached; the history was not. We had optimised the big
obvious block and left the one that actually grows at full price.

**The second surprising thing.** Output tokens cost as much as the entire cached system prompt.
Output is priced at five times input. A model that answers in three paragraphs where one would
do is a cost decision as much as a style one.

---

## Finding 1: cache the conversation, not just the prompt

We had one cache breakpoint, on the system prompt. The message history sat after it and was
re-read at full price on every round of every turn — and a turn that renders a card is two
rounds, so it was paid for twice.

The fix is a second breakpoint, placed on the last message of the conversation so far. Each
turn, everything before that point is read at a tenth of the price and only the newest message
is written.

**€0.021 → €0.012 per turn.** This was the single largest steady-state saving, and it took
about fifteen lines.

> **Transferable lesson.** Caching the system prompt is the advice everyone follows, because
> it is the block you wrote and the one you can see. The conversation is the block that grows
> without anyone deciding it should. Cache both.

---

## Finding 2: match the cache lifetime to how people actually talk

We were using the default five-minute cache. Every pause longer than that re-paid the full
prompt write — €0.062, each time.

Five minutes is a long time in a benchmark and a short time in a conversation. A customer reads
a product comparison and thinks. A presenter demonstrating the product talks over it. In a
filmed run-through, most gaps exceed five minutes, so we were paying the write on most turns.

Switching to a one-hour cache makes the write cost 2× input instead of 1.25×. That is only
worth it if it saves a second write — and it saves many:

| | Cost |
|---|---:|
| Cache miss, 5-minute TTL | €0.078 |
| Cache miss, 1-hour TTL | €0.115 |
| 12-turn conversation, ~4 misses at 5m | €0.59 |
| 12-turn conversation, 1 miss at 1h | €0.45 |

The larger effect is one we nearly missed. **The cached prefix does not depend on the case.**
Policy, domain, tool guidance, the fact reference and the product catalogue are byte-identical
for every customer. The cache is keyed on content, so one entry serves the presenter's
run-through, every audience session, and every parallel conversation at once.

With a one-hour lifetime, a demo day pays for that write **once**, not once per visitor.

> **Transferable lesson.** Work out whether your cached prefix is per-user or shared before you
> price the TTL. If it is shared, a longer lifetime is not a marginal trade — it is divided by
> the number of concurrent users.

---

## Finding 3: put volatile content after the breakpoint, however small

Our persona block — 149 tokens of style instructions — sat inside the cached prefix, at the end.

On any turn the gate marks *sensitive*, the system zeroes humour and playfulness, which rewrites
that block. With the only breakpoint sitting after it, a 149-token change invalidated all
17,285 tokens in front of it. We then paid to write the whole thing back, and paid again on the
next ordinary turn when it flipped back.

We also, without noticing, maintained two cache entries permanently instead of one.

The demo this product was built for turns on life events — a house move, a new baby, a
bereavement. Sensitive turns are not an edge case here; they are the point. We were paying a
premium precisely on the turns that matter most.

Moving the breakpoint earlier cost nothing. The persona block sits in exactly the same place in
the prompt; only the boundary moved.

> **Transferable lesson.** A cache breakpoint is invalidated by anything in front of it, so the
> cost of a volatile section is not its own size — it is the size of everything it precedes.
> Audit your prompt for small things sitting in front of large ones.

---

## Finding 4: a timeout is not a cancellation

Our gate gives up on the classifier after four seconds and fails closed with a short retry
message. That behaviour is correct and we kept it.

What was wrong is that giving up on the answer did not stop the request. It ran to completion
and was billed in full. Worse, the client was configured to retry once, so a slow call could be
billed twice — for two answers, neither of which anything ever read.

The fix is an abort signal: when the deadline passes, cancel rather than merely stop waiting.

The amount is small, because the gate runs on a cheap model. We mention it because the shape of
the bug is not small: **a deadline that abandons a request is not the same as a deadline that
ends one**, and the difference is invisible in every metric except the invoice.

> **Transferable lesson.** Anywhere you race a request against a timer, check what happens to
> the request when the timer wins.

---

## What we deliberately did not do

Just as useful as the list of changes.

**We did not shrink the product catalogue.** It is 66% of the prompt and the obvious target.
But once caching works it costs about €0.003 per turn to carry all 61 products, and the
alternative — a compact index plus a lookup tool — adds a model round trip of roughly €0.015
to every turn that needs detail. At any realistic hit rate it costs more than it saves, and the
product gets worse: the real rates are what make a savings comparison land.

*The obvious optimisation was the wrong one, and only measurement showed it.*

**We did not downgrade the model.** Conversation quality is the second-highest priority in this
project's own ordering. A cheaper model that answers worse fails the thing the POC exists to
demonstrate.

**We did not skip the gate on safe-looking messages.** Domain restriction is enforcement, not a
suggestion, and €0.0004 is not a reason to put a hole in it.

**We did not cache per-case state.** The case digest is ~300 tokens and changes every turn.
Caching it would cost more to write than to read.

---

## The largest cost was not the product

An honest accounting of the day this work was triggered: the Anthropic credit that ran out was
spent mostly on **development testing**, not on customer conversations.

Verifying that a badge wrapped correctly, that cards appeared in the right order, that a
calculation used the right opening balance — each of these was checked by running a full live
conversation against the production model. A fixture-backed provider existed for exactly this
and was not being used.

> **Transferable lesson.** Decide early which tests need a real model and which need a
> deterministic stand-in, and make the stand-in the default. Model behaviour needs the model.
> Layout does not.

---

## How these numbers were produced

So they can be reproduced, and so their limits are clear.

- **Token counts** are derived from character counts at approximately 3.6 characters per token,
  not from a tokeniser. Treat them as ±10%.
- **Prices** are Anthropic's published rates converted to euro at 0.92, held as constants in
  `_shared/domain/cost.ts`. Change them there and every figure in the admin console moves.
- **Per-turn token usage is measured, not modelled.** Every API response reports exactly what it
  consumed; a turn records the sum across its rounds plus the gate call in front of it, and the
  console reports it per case.
- **Per-conversation totals are modelled** from those measurements against an assumed turn
  count, round count and cache-miss rate. They have not yet been confirmed end-to-end against a
  full recorded conversation. That confirmation is outstanding.

The admin console shows measured cost per case and in total, in euro and tokens. It can only
count conversations still in the database — purging cases deletes the record of what they cost.

---

## Summary of levers, by size

| Lever | Saving | Cost to implement |
|---|---|---|
| Cache the conversation history | €0.009/turn | ~15 lines |
| One-hour cache TTL on a shared prefix | ~€0.19/conversation | 1 line |
| Move volatile sections behind the breakpoint | Avoids full re-write on sensitive turns | ~20 lines |
| Shorter replies (style configuration) | €0.002/turn | configuration |
| Cancel abandoned requests | Small, but pure waste | ~10 lines |
| Pre-warm the cache before a demo | Converts every take's first turn to a hit | one throwaway request |

---

## Changelog

This document is updated whenever a change lands that moves the cost of a turn.

| Date | Change | Effect |
|---|---|---|
| 2026-10-08 | Baseline measured; history cache breakpoint, 1h prefix TTL, persona moved behind the breakpoint, abort signal on the gate timeout | €0.59 → €0.31 per 12-turn conversation (modelled) |
