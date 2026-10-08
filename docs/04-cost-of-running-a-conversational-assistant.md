# What a conversational assistant costs to run

**Baz POC — technical lessons learned**
Last updated: 8 October 2026

---

## Why this document exists

The first question anyone asks about a conversational product is what it costs per
conversation, and "a few cents" is a worse answer than a number.

This is the number, how we arrived at it, and the six things we got wrong on the way. Most of
it is not specific to banking or to Baz. If you are building anything that puts a large
language model behind a chat box, the shape of the bill will look like this one, and the
mistakes are available to you too.

Two of those six mistakes were in the first version of this document, which is the first lesson
and is recorded below rather than quietly edited out.

---

## The headline

| | Per 12-turn conversation |
|---|---|
| Before optimisation | **€0.94** (modelled) |
| After | **€0.55** (measured) |

No change to the model, the product catalogue, or what Baz is capable of saying. The whole
saving came from caching things that do not change, and from not paying for requests nobody
reads.

At that rate, a thousand full conversations costs about €550. A demo day with fifty audience
sessions of five turns each costs about €10.

---

## The anatomy of a turn

A single customer message triggers two model calls:

1. **The gate** — a small, fast classifier that decides whether the message is in scope at all.
   It runs before anything else, on every turn, including ones it blocks.
2. **Baz** — a larger model with the full system prompt, the conversation so far, and a set of
   tools. One to three rounds; two is the norm on any turn that renders a card.

The cached prefix measures **26,974 tokens**. Counted exactly, through the token-counting API:

| Section | Tokens | Share |
|---|---:|---:|
| Product catalogue (61 real products) | 15,595 | 58% |
| **Tool definitions (JSON schemas)** | **4,739** | **18%** |
| Tool guidance | 1,806 | 7% |
| Fact reference | 1,711 | 6% |
| Voice | 1,097 | 4% |
| How applying works | 598 | 2% |
| Policy | 570 | 2% |
| What we can do | 522 | 2% |
| Domain scope | 158 | 1% |

After the cache breakpoint, and so paid at full price every turn: persona (178 tokens), the
case digest and this turn's notes — around 900 tokens in total.

### What a turn actually cost

Measured from a live three-turn conversation, every figure reported by the API itself:

| | Turn 1 | Turn 2 | Turn 3 |
|---|---:|---:|---:|
| Cache write | 26,974 | 922 | 1,064 |
| Cache read | 53,948 | 54,094 | 54,236 |
| Uncached input | 919 | 723 | 955 |
| Output | 495 | 569 | 850 |
| Gate (uncached) | 1,150 | 1,227 | 1,228 |
| **Cost** | **€0.174** | **€0.031** | **€0.036** |

Turn one writes the whole prefix; every turn after it writes only the newest message. That is
the history cache working, and it is visible in one column: **922 tokens written instead of
54,000 re-read at full price.**

---

## Finding 1: cache the conversation, not just the prompt

We had one cache breakpoint, on the system prompt. The message history sat after it and was
re-read at full price on every round of every turn — and a turn that renders a card is two
rounds, so it was paid for twice.

The fix is a second breakpoint, placed on the last message of the conversation so far. Each
turn, everything before that point is read at a tenth of the price and only the newest message
is written.

> **Transferable lesson.** Caching the system prompt is the advice everyone follows, because
> it is the block you wrote and the one you can see. The conversation is the block that grows
> without anyone deciding it should. Cache both.

---

## Finding 2: match the cache lifetime to how people actually talk

We were using the default five-minute cache. Every pause longer than that re-paid the full
prompt write.

Five minutes is a long time in a benchmark and a short time in a conversation. A customer reads
a product comparison and thinks. A presenter demonstrating the product talks over it. In a
filmed run-through, most gaps exceed five minutes, so we were paying the write on most turns.

A one-hour cache makes the write cost 2× input instead of 1.25×. That is only worth it if it
saves a second write — and it saves many. One write at the longer lifetime costs €0.149; four
writes at the shorter one cost €0.372.

The larger effect is one we nearly missed. **The cached prefix does not depend on the case.**
Policy, domain, tool guidance, the fact reference and the product catalogue are byte-identical
for every customer. The cache is keyed on content, so one entry serves the presenter's
run-through, every audience session, and every parallel conversation at once.

With a one-hour lifetime, a demo day pays for that write **once**, not once per visitor.

> **Transferable lesson.** Work out whether your cached prefix is per-user or shared before you
> price the lifetime. If it is shared, a longer one is not a marginal trade — it is divided by
> the number of concurrent users.

---

## Finding 3: put volatile content after the breakpoint, however small

Our persona block — 178 tokens of style instructions — sat inside the cached prefix, at the end.

On any turn the gate marks *sensitive*, the system zeroes humour and playfulness, which rewrites
that block. With the only breakpoint sitting after it, a 178-token change invalidated all 26,974
tokens in front of it. We then paid to write the whole thing back, and paid again on the next
ordinary turn when it flipped back. We also, without noticing, maintained two cache entries
permanently instead of one.

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

## Finding 5: the tool definitions are part of the prompt, and nobody counts them

Our eleven tools carry **4,739 tokens** of JSON schema. That is 18% of everything sent, and more
than the policy, the voice, the fact reference and the tool guidance put together.

We had not counted them at all. The prompt was audited line by line; the tool schemas were
invisible because nobody writes them as prose — they are generated from validators, they live in
a different file, and they do not appear in any document called "the prompt".

They cache along with the system prompt, so the cost is small once caching works. The point is
that an audit which only reads the prompt file misses a fifth of the prompt.

> **Transferable lesson.** Count what is actually sent, not what you wrote. Tool schemas,
> injected examples and formatting instructions are all input tokens.

---

## Finding 6: a cache instruction that silently does nothing

The gate's system prompt carries a `cache_control` marker. Every measured turn reports zero
cache reads and zero cache writes for it.

The classifier prompt is around 1,200 tokens, which is below the minimum length that model class
will cache. The marker is accepted, no error is returned, and nothing is cached. It had been
there since the gate was written and we assumed it worked because the code said so.

We have left it uncached — at €0.0013 a turn, padding a prompt to reach a cache threshold would
cost more than it saves — but the comment beside it now records the measurement rather than the
intention.

> **Transferable lesson.** Caching fails open and silently. If you have not seen a non-zero
> `cache_read` for a block, you do not know it is cached.

---

## What we deliberately did not do

Just as useful as the list of changes.

**We did not shrink the product catalogue.** It is 58% of the prompt and the obvious target.
But once caching works it costs about €0.004 per turn to carry all 61 products, and the
alternative — a compact index plus a lookup tool — adds a model round trip of roughly €0.02 to
every turn that needs detail. At any realistic hit rate it costs more than it saves, and the
product gets worse: the real rates are what make a savings comparison land.

*The obvious optimisation was the wrong one, and only measurement showed it.*

**We did not downgrade the model.** Conversation quality is the second-highest priority in this
project's own ordering. A cheaper model that answers worse fails the thing the POC exists to
demonstrate.

**We did not skip the gate on safe-looking messages.** Domain restriction is enforcement, not a
suggestion, and €0.0013 is not a reason to put a hole in it.

**We did not cache per-case state.** The case digest changes every turn. Caching it would cost
more to write than to read.

---

## The largest cost was not the product

An honest accounting of the day this work was triggered: the API credit that ran out was spent
mostly on **development testing**, not on customer conversations.

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

- **Token counts are exact.** Each section is counted through the token-counting API, which is
  free to call. The first version of this document derived them from character counts at an
  assumed 3.6 characters per token and claimed ±10%; the real figure is closer to 2.6 for a
  structured product catalogue, and the published total was **56% low**. See below.
- **Per-turn usage is measured**, not modelled. Every API response reports exactly what it
  consumed; a turn records the sum across its rounds plus the gate call in front of it, and the
  console reports it per case.
- **The "after" figure is measured** from a live conversation. **The "before" figure is
  modelled** from those same measurements against the previous caching behaviour, because the
  old code is no longer deployed. Treat the 42% as the shape of the saving rather than a
  precise claim.
- **Prices** are Anthropic's published rates converted to euro at 0.92, held as constants in
  `_shared/domain/cost.ts`. Change them there and every figure in the admin console moves.

The admin console shows measured cost per case and in total. It can only count conversations
still in the database — purging cases deletes the record of what they cost.

### The mistake in the first version of this document

It estimated tokens from character counts because measuring them looked like it needed a paid
API call. It does not: token counting is a free endpoint, and the first live conversation after
the fix reported the true prefix size in a field we were already storing.

The lesson is not about tokenisers. A document whose whole claim is *measure, do not assume*
had an assumption in its foundations, and it survived because the number looked plausible and
nobody had a reason to check it. The figures were wrong by more than half.

> **Transferable lesson.** When a document's argument is that measurement beats estimation,
> the estimates inside it are the ones most worth hunting down.

---

## Summary of levers, by size

| Lever | Saving | Cost to implement |
|---|---|---|
| One-hour cache lifetime on a shared prefix | ~€0.22 per conversation | 1 line |
| Cache the conversation history | ~€0.02 per turn, growing | ~15 lines |
| Move volatile sections behind the breakpoint | Avoids a full re-write on sensitive turns | ~20 lines |
| Shorter replies (style configuration) | ~€0.004 per turn | configuration |
| Cancel abandoned requests | Small, but pure waste | ~10 lines |
| Pre-warm the cache before a demo | Turns every take's first turn into a hit | one throwaway request |

---

## Changelog

This document is updated whenever a change lands that moves the cost of a turn.

| Date | Change | Effect |
|---|---|---|
| 2026-10-08 | Baseline; history cache breakpoint, 1h prefix lifetime, persona moved behind the breakpoint, abort signal on the gate timeout | €0.94 → €0.55 per 12-turn conversation |
| 2026-10-08 | Verified live and replaced every estimated token count with a measured one. Added findings 5 and 6 | No behaviour change; published figures rose ~70%, the saving held at ~42% |
