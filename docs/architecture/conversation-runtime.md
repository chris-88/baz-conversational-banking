---
title: Conversation runtime
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/baz-turn/index.ts
  - supabase/functions/_shared/llm/prompt.ts
  - supabase/functions/_shared/domain/conversation/stages.ts
  - supabase/functions/_shared/contracts/stream.ts
---

# Conversation runtime

One function, `baz-turn`, handles a turn end to end. The order is the architecture: nothing
reaches the model that the gate has not allowed, and the model's output is persisted only after
the tools it called have taken effect — so what the next turn reads is what actually happened.

## The sequence

### 1. Gate

Deterministic checks first — length cap, empty input, known injection patterns — then the
classifier. Out of scope produces a canned response, a `request_blocked` event, and a stop.
**The Baz model never sees blocked input.** [Guardrails](guardrails.md) has the detail.

### 2. Load the case

Facts, applications, computed outstanding requirements, advisories, product interests including
declined ones, plans, persona and domain config. Persona is read fresh every turn so an admin
change applies to the next thing Baz says.

Only a window of conversation history goes to the model: a turn needs recent history, and sending
all of it is paying to re-read a conversation the model has already acted on. The console loads
the opposite — it is the record somebody reads before phoning a customer.

### 3. Compute the stage

Six stages, in precedence order, first match wins:

| Stage | What the turn is for |
|---|---|
| `opening` | The first reply: react, say what this involves, put the fork to them |
| `direction` | The fork is open and unanswered. Keep it open |
| `discovering` | They want a plan, so discovery is worth doing. Life first, products later |
| `planning` | Enough of the picture to build a plan. Show it, let them decide |
| `choosing` | The options: the kind of thing first, then the ones inside it |
| `applying` | Something is started. Collect what it needs and get it submitted |

Derived from the case every turn, never stored and never chosen by the model. Correcting a fact
moves the conversation back by itself.

Two numbers worth knowing: a plan can be built with up to **two** things still unknown, measured
against the goal catalogue — a plan is not an application and holding out for every figure turns
the one branch somebody asked for into the interrogation they were avoiding. And the discovery
gate lifts after **four** customer turns regardless, because a customer who will not answer
questions must still be able to get somewhere.

### 4. Select the tools

**The stage decides which tools the turn is offered.** This is enforcement, not advice — see
[the AI boundary](ai-boundary.md). The form tools are gated further on a form actually existing,
because a tool the model can see is a tool it will eventually try, and on a case with no
form-backed application every such call would be refused by the server after spending a round.

Cards are also rate-limited by recency, so the model cannot reach for a card as something to say:
product options have a two-turn window, status a short one, quotes a longer one because a quote is
read and compared rather than acted on, and the partner invite counts eight turns of "still on
screen".

### 5. Compose the prompt

Fixed order, and the order is not cosmetic:

```text
policy (immutable) → domain → product catalogue → persona style → case digest
```

Policy is first so nothing after it can outrank it. The case digest is last because it is the
volatile part, which makes everything before it a stable prefix the API can cache across turns.
Prompt caching is most of why a turn is affordable — see
[the cost paper](../04-cost-of-running-a-conversational-assistant.md).

The policy section says what Baz may not do. A separate section says what it must actively do,
because without it a model will happily hold a pleasant conversation and record nothing — which
looks fine on screen and orchestrates nothing underneath.

### 6. Stream

Server-sent events, as a Zod discriminated union:

```ts
text_delta | card | status | done | error
```

The stream emits while it thinks, so a slow tool round never reads as a dead connection. The
keepalive is comfortably inside the client's 45-second silence limit and small enough to survive
an intermediary that drops idle streams.

A turn that fails has to say why: an error arrives as an `error` event with something a person
can act on. A spend limit and a malformed request both come back from Anthropic as a 400
`invalid_request_error`, so the two are distinguished on the message text — the only place the
distinction appears. A 429 is deliberately excluded, because a rate limit is the one failure where
trying again shortly is exactly the right advice.

### 7. Persist

Messages, validated facts and events. Then requirements are recomputed.

Cards are persisted too, so a reload does not lose the thing the customer was about to tap.

## One card per turn

A card that waits for a tap **is** the question of that turn. Baz once showed a comparison of two
savings accounts and underneath it asked what the customer paid in rent and whether they banked
jointly — three demands in one breath, and whichever the customer answered, the others were left
hanging. A card is also the thing that gets scrolled past when there is text under it to reply to.

So a turn that puts up a card owns the turn. `turn-shape.ts` computes that.

## Output ceiling

`max_tokens` on the Baz model is low enough that "count to 10,000" cannot succeed even if it
slips past the gate. This is a belt to the gate's braces, and it was added after the ceiling
turned out to be the thing nobody had set.
