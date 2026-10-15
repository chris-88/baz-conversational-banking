---
title: Guardrails
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/llm/gate.ts
  - supabase/functions/_shared/llm/classifier.ts
  - supabase/functions/_shared/llm/refusals.ts
  - supabase/functions/_shared/tenants/boi/domain-config.ts
  - evals/guardrails/cases.jsonl
---

# Guardrails

Domain restriction is **enforcement in front of the model**, not an instruction inside it.
Nothing reaches the Baz model that the gate has not allowed, and a blocked turn produces a canned
string rather than model output — so there is no path by which the model could be induced to
answer the blocked question and append a disclaimer afterwards.

## The order

Deterministic checks → classification → routing. The deterministic layer exists because a
classifier is a model too, and the specification explicitly rules out relying on asking a model
nicely.

### 1. Deterministic pre-checks

Run before any model call, so an empty or oversized turn costs nothing.

- **Input length cap.** Long enough for a customer explaining their circumstances, short enough
  that a prompt stuffed with instructions is refused before it costs anything.
- **Empty input.**
- **Known injection patterns.** Deliberately narrow: each requires an instruction-shaped object
  rather than a bare keyword, because they must not fire on ordinary banking language. *"Can I
  ignore the letter about my overdraft?"* must pass. A match is flagged **and still classified**,
  so the admin view shows both.

### 2. Classification

A small model — `GATE_MODEL`, Haiku by default — returns:

```ts
{ category: 'banking' | 'ambiguous' | 'general_knowledge' | 'competitor'
          | 'off_topic' | 'abusive' | 'prompt_injection' | 'unsupported',
  profanity: boolean,
  sensitive: boolean }
```

The previous Baz turn goes in as context, which is what makes short answers classify correctly —
"about 92k", "yes", "Emma" are meaningless in isolation and obvious in context.

The permitted domain is **data, not prose in a system prompt** — `tenants/boi/domain-config.ts`.
That is what makes it configurable per tenant, and what makes enforcement observable in the admin
console.

### 3. Routing

| Category | Outcome |
|---|---|
| `banking` | Goes to the Baz model |
| `ambiguous` | Goes to the Baz model, instructed to clarify within banking scope |
| Everything else | A canned refusal, keyed by category and persona tone bucket |

Profanity with banking intent is `banking`. Someone swearing about their overdraft is asking a
banking question.

Routing is a pure function, tested against fixed classifier output — so the routing table is
covered without spending a model call.

## Refusals

Short, and they never contain the prohibited answer. The pattern explicitly ruled out is
answering the question and appending a banking disclaimer, so **none of them acknowledge the
content of the request at all.**

Persona collapses to one of three buckets for refusal wording — `formal`, `neutral`, `playful` —
so a refusal still sounds like the same assistant without the persona being able to soften what
it refuses.

## Failing closed

A classifier error or timeout produces a short retry message. Not a pass-through: if the gate
cannot decide, the model does not run.

A spend limit is distinguished from a malformed request on the message text, because Anthropic
returns both as a 400 `invalid_request_error` and the status and type say nothing useful. A 429 is
deliberately not treated as fatal — a rate limit is the one failure where trying again shortly is
the right advice.

## Belt and braces

- **`max_tokens` is low** enough on the Baz model that "count to 10,000" cannot succeed even if
  it slips through.
- **`sensitive: true`** zeroes humour for that turn and suppresses product offers.
- **Persona cannot widen anything.** It composes into a labelled style block after the policy and
  cannot change scope, tools, rules or protections.
- **No sensitive inference.** `record_facts` refuses any catalogue key marked
  `extractable: false`, so health data cannot arrive by inference — only through an explicit
  consented form.

## Output re-classification

Not in v1. The gate protects the input; nothing re-reads the output. Add it only if the evals
show leaks.

## The evals

`evals/guardrails/cases.jsonl` — 54 cases, run against the live classifier because that is the
only way to know whether enforcement actually holds.

A **must-block** set: trivia, jokes, competitors, excessive output, injection, persona escape.
A **must-allow** set: profane banking questions, short contextual answers, sensitive but in-scope
disclosures.

```bash
npm run eval:guardrails
npm run eval:guardrails -- --only=inj
```

**100% on both sets before any presentation.** The must-allow set matters as much as the
must-block one: a gate that refuses a customer swearing about their overdraft has failed too.

## Observability

Every blocked turn writes a `request_blocked` event with its category. The admin console's
guardrails section shows the categories and lets a presenter test an input live. The kill switch
makes the gate return a "demo paused" response for everything.
