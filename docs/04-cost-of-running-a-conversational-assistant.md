---
title: What a conversational assistant costs to run
status: current
scope: shared
last_verified: 2026-10-15
note: >-
  Living document. The figures are measured, not estimated. Any change that moves the
  cost of a turn updates this and its changelog, with a new measurement. Never revise
  these numbers from memory.
---

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

## Finding 7: an output ceiling is a cost, not a saving

Baz had `max_tokens: 1_024`, set as a guardrail: a hard stop so that "count to 10,000" could
not succeed even if it slipped past the gate. It read like a saving. It was the opposite.

A customer opened with everything at once — a mortgage, a savings account, switching their
banking, two children, their income, their rent, what they had saved and a twelve-month window
— in one message. That turn needs prose, a dozen facts through `record_facts`, and a
three-product card. It came to **exactly 1,024 output tokens**, every time, and was cut off
inside the tool call. The result was an assistant message with no finished text and no usable
tool block: no reply, no card, nothing recorded.

What that cost, measured:

| | Tokens | Cost |
|---|---:|---:|
| Gate | 1,412 in / 21 out | €0.0014 |
| Cached prefix read | 28,633 | €0.0079 |
| Output, all of it discarded | 1,024 | €0.0141 |
| **Total, for "Sorry — I lost my thread there."** | | **€0.0234** |

The customer sent the same message three times. Three turns, about €0.07, nothing delivered and
nothing recorded. A truncated turn is the most expensive kind there is: it pays full price for
output nobody reads, and then gets retried.

The ceiling is now 3,072, and a round that produces nothing at all is retried once with double
the room. Neither is a licence to ramble — the gate refuses long-output requests before the
model sees them, which is where that rule belongs.

> **Transferable lesson.** A token ceiling does not bound your bill, it bounds your answers.
> Spending is bounded by what the model is asked to do and how many times it is asked. If a
> ceiling is ever reached in normal use, you are paying for truncated output and a retry.

---

## Finding 8: a refused tool call buys an entire round

`record_facts` accepted at most 12 facts per call. The opening message above states fifteen.

The model asked to record all fifteen, the schema refused the call, and the model recovered the
way it should — it split the batch and tried again. That recovery is a whole extra model round,
and **every round re-reads the entire cached prefix**. The same turn, measured twice:

| | Rounds | Cache read | Output | Cost |
|---|---:|---:|---:|---:|
| The batch fitted | 2 | 57,266 | 1,419 | €0.041 |
| The batch was refused | 3 | 85,899 | 1,884 | **€0.061** |

A bound meant to keep one tool call small was buying a second model call instead — 46% more for
the same turn, on exactly the messages that make the product look best. The cap is now 24.
Nothing is admitted by raising it: each fact is still checked against the catalogue one at a
time, and anything marked `extractable: false` is still refused.

Re-measured on the same message after the change, three runs: one `record_facts` call and one
card, no refusals, two rounds, 57,266 cache read, **€0.037 to €0.043**. The fifteen facts that
used to take three attempts now take one.

> **Transferable lesson.** With a cached prefix, the round is the unit of cost, not the token.
> Any validation limit tight enough for the model to hit regularly is a limit that silently
> doubles the price of the turn. Set tool bounds by what the conversation actually contains,
> and record what the server refuses — a refusal the model recovers from leaves no trace at
> all, and looks exactly like an expensive turn.

---

## Finding 9: a tool list that changes is a cache key that changes

Which tools a turn is offered is decided by the conversation's stage: `opening`, `direction`
and `discovering` get two, `planning` four, `arranging` three, `choosing` eight, `applying`
thirteen. Withholding a tool is enforcement, which is why it is done this way (CLAUDE.md,
"Baz model tools"). The tools are also the first thing in every request, ahead of the system
prompt, and the cache is keyed on everything in front of the breakpoint. So each stage has its
own cached prefix, and a conversation that moves through five stages can write the prefix five
times.

Measured on one real conversation (case aed80555, 16 October, 36 Baz turns, €1.69 at the
prices above, which is €0.047 a turn and in line with the headline). The three turns where the
stage moved to `planning`, `arranging` and `choosing` each report cache read equal to cache
write: 28,259, 27,910 and 30,295 tokens, a miss on the first round and a hit on the second.
That is 86,464 cache-write tokens, **€0.30 of the €1.69**, for three stage changes. The
`discovering` and `applying` prefixes were hits from the first round only because other
conversations had used those stages within the hour: the prefix is shared across cases
(Finding 2), and so is the warming.

We are keeping the stage-dependent lists. The alternative, one constant list with the server
refusing out-of-stage calls, is also enforcement, but it turns every attempt into a refused
round (Finding 8) and gives the model thirteen tools to consider on a turn that can use two. At
roughly €0.10 per cold transition, the cost is bounded, it falls with every conversation that
runs ahead of this one, and the pre-warm step before a presentation now covers each stage
rather than the opening alone.

> **Transferable lesson.** Count the prefixes, not the prefix. Anything that varies between
> requests ahead of the breakpoint, tool lists included, makes a separate cache entry, and the
> cost of a "stable" prefix is the number of distinct ones you actually send multiplied by how
> often each goes cold.

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
conversation against the production model. None of them needed one.

An earlier version of this section said a fixture-backed provider existed and was not being used.
That was wrong, and the correction matters more than the original claim: **no fixture provider has
ever existed in this repository.** `LLM_PROVIDER` is declared in the environment and read nowhere.
There was no stand-in to reach for, which is why the discipline had to be the author's and why it
failed under time pressure.

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
| Pre-warm the cache before a demo, one request per stage | Turns every take's first turn, and every stage change, into a hit | one throwaway conversation through the stages |
| Raise a tool bound the model keeps hitting | ~€0.019 per dense turn | 1 line |
| Raise an output ceiling that truncates real answers | ~€0.023 per failed turn, plus the retry | 1 line |

---

## Changelog

This document is updated whenever a change lands that moves the cost of a turn.

| Date | Change | Effect |
|---|---|---|
| 2026-10-08 | Baseline; history cache breakpoint, 1h prefix lifetime, persona moved behind the breakpoint, abort signal on the gate timeout | €0.94 → €0.55 per 12-turn conversation |
| 2026-10-08 | Verified live and replaced every estimated token count with a measured one. Added findings 5 and 6 | No behaviour change; published figures rose ~70%, the saving held at ~42% |
| 2026-10-12 | Output ceiling 1,024 → 3,072 with one retry on a round that produces nothing; `record_facts` batch cap 12 → 24. Added findings 7 and 8 | Removes a €0.023 turn that delivered nothing, and a €0.019 extra round on dense turns |
| 2026-10-12 | Re-measured the prefix: 28,633 tokens read on the first round of a first turn, against 26,974 when this document was written | Prefix has grown ~6% as the catalogue, mortgage rates and the data notice landed. No action; recorded so the next reading has a baseline |
| 2026-10-15 | Conversation stages: a stage section after the cache breakpoint, and a declared reply length per stage | The section is about 250 uncached tokens a turn. The length budget is the reason it is here at all: adding stages doubled the average reply, 205 characters to 442 and roughly 500 output tokens to 950, because three instructions in a stage reliably produce three paragraphs. Output is the most expensive token and the slowest, so a stage that adds work has to say how long its answer is |
| 2026-10-15 | `loadCustomerName` and `loadEventsSince` folded into the existing parallel batch | Two round trips off the critical path of every turn. Both only ever needed the case row, which was already in hand |
| 2026-10-14 | Digital forms: three tool definitions added to the cached prefix, and a form section added to the case digest, which sits after the cache breakpoint | Prefix: roughly 600 tokens, read once per conversation rather than per turn, so a fraction of a cent across a conversation. Digest: 208 tokens measured on a live personal-loan case, charged on every round of every turn while a form-backed application is open. On a 12-turn conversation with 1.5 rounds a turn that is about 3,700 uncached input tokens, under half a cent. The section is capped at five questions for this reason: the same case has 27 outstanding, and listing them all would cost five times as much and produce an interrogation |
| 2026-10-15 | Corrected "The largest cost was not the product": it claimed a fixture-backed provider existed. None ever has — `LLM_PROVIDER` is read nowhere. No figures affected | No cost change. The lesson is unchanged and now accurate: the stand-in that should have been the default was never built |
| 2026-10-15 | A card is the question: an 18-line rule in the stage section and one sentence added to three tool descriptions (`show_comparison`, `show_product_options`, `propose_plan`) | Not yet measured. The stage section sits after the cache breakpoint, so the rule is charged on every round of every turn; the three sentences are in the cached prefix and read once a conversation. Both are small and both point the same way as finding 7: the rule exists to stop a turn asking two questions alongside a card, and a turn that asks nothing extra is a shorter turn. Re-measure the prefix on the next live reading rather than estimating it here |
| 2026-10-15 | Signing in now fires a turn, so Baz picks the conversation back up instead of going silent | One extra turn per sign-in, at most once a conversation. At the measured €0.55 per twelve turns that is roughly €0.05, and it buys the moment the sign-in was asked for: the reply names what is outstanding and does not re-ask for the email, which `adoptIdentity` has just recorded from the account |
| 2026-10-15 | `show_arrangement`: one tool definition in the cached prefix, one stage section (`arranging`, shown once), and an arrangement section in the digest whenever the engine has one | Not yet measured. The tool definition is read once a conversation; the digest section is a few hundred uncached tokens on the turns where a kept plan and the figures coincide, which is a minority of turns. It replaces a comparison turn and a product-options turn with one card, so on the conversations it applies to it is likely a net saving. Re-measure the prefix on the next live reading |
| 2026-10-16 | The product catalogue and the mortgage rate table are read from `product_catalogue` and `mortgage_rates` rows at the start of every turn, when any exist, and the prompt prefix is built from them | Two small queries, in the same parallel batch as the case load, so nothing on the critical path. The prefix stays byte-identical turn to turn as long as the rows do, so the cache is untouched until a presenter edits something, when it rewrites once: one uncached read of the prefix, roughly 28k tokens at the last measured size, per edit. A disabled product shortens the prefix. Not re-measured |
| 2026-10-16 | Measured, no change: one cached prefix per conversation stage, because the stage decides the tool list and the tools sit ahead of the breakpoint (Finding 9) | Three stage changes in case aed80555 wrote 86,464 cache tokens, €0.30 of a €1.69 conversation. Bounded at about €0.10 per cold transition and shared across cases, so it falls as the day goes on. The pre-warm step before a presentation now runs one request per stage |
| 2026-10-16 | Field ids on every line of the form digest section, a four-line recording instruction, and "or N others" on cut choice lists | Estimate, not measured. The section is after the breakpoint, so charged every round while a form-backed application is open: about 5 tokens an id across at most five lines and about 60 for the instruction, roughly +85 uncached tokens a round against the 208 measured on 2026-10-14. Before this the section bought nothing, since no answer it elicited was ever recorded. Re-measure on the next live reading |
| 2026-10-16 | A bank request (information requested from the console) is an outstanding document: one line per open request in the application's digest entry | Estimate: about 40 uncached tokens per open request per turn, only while the application sits in `info_required`. It replaces a failed `request_upload` round (a call, a refusal, a second model round) with one that renders the card, so a saving on the turns it applies to |
| 2026-10-16 | "A card is waiting": a short section after the stage section on turns where an earlier card is still untapped, computed from the case | Estimate: about 60 uncached tokens a round on those turns and nothing otherwise. Four lines added to the card rule in the stage section are charged every round. The turn it replaces, discovery for an application that did not exist, ran twelve minutes and six turns in aed80555 |
| 2026-10-16 | Withdrawn rounds: a round that spoke and then had a tool refused is taken back and the model writes again | A refused turn pays that round's output twice. On aed80555 that was 4 of 36 turns, each round's withdrawn text in the tens of tokens, so under a cent a conversation at €0.0138 per thousand output tokens; nothing on turns with no refusal. The refusals themselves are now rarer, since three of the four causes in that case are fixed (bank requests, partner invite, review naming) |
| 2026-10-16 | `income.partnerAnnualStated` and a sentence about partner facts in the prompt prefix; refusal wording that says not to retry | About 60 to 80 tokens in the cached prefix, read once a cache window. The point is fewer rounds: the same refusal came back five turns running in aed80555 |
| 2026-10-18 | A current account line in the suitability section of the digest, after the cache breakpoint, on turns where the `everyday_banking` need is ready or clarifying or a current account application exists; `show_product_options` re-reads the case once when a current account is among the options | Estimate from the rendered strings: about 90 to 125 uncached tokens a round once the deciding facts are held, about 210 while none is (the line then says which facts would change the pick), plus the section heading when it is the only suitability line. Nothing on other turns and nothing in the cached prefix. The welcome card, the documents-checked narration and the `everyday_banking` need add no model tokens beyond one narrated line on a return. Re-measure on the next live reading |
| 2026-10-18 | Measured: the onboarding run-through (`docs/journeys/onboarding.md`), 14 Baz turns from the typed opener to the welcome card, on the live model | €0.50 at the prices above, €0.035 a turn: 4,685 uncached input, 5,304 output, 662k cache read, 62k cache written. Cheaper per turn than the mortgage case because every stage prefix was warm and the turns are short. Three lines were added to the gate's classifier prompt for where pay should land; the gate is uncached, so about 40 tokens a turn at the gate's price, under €0.0001 |
