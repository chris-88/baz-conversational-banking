---
title: Guardrails
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/admin/GuardrailsScreen.tsx
  - src/admin/GuardrailTest.tsx
  - supabase/functions/_shared/llm/gate.ts
---

# Guardrails

What a presenter can see and do about domain restriction. The mechanism is in
[architecture/guardrails](../architecture/guardrails.md); this is the feature.

## What the customer experiences

An out-of-scope question gets a short reply that does not answer it and does not acknowledge what
was asked. No "I can't help with that, but here's the answer anyway", and no banking disclaimer
appended to a trivia answer — that exact pattern is what the design rules out.

The reply's tone follows the persona, collapsed to one of three buckets, so a refusal still sounds
like the same assistant.

In scope and allowed through:

- A banking question with profanity in it. Someone swearing about their overdraft is asking a
  banking question.
- A short contextual answer. "about 92k", "yes", "Emma" — meaningless alone, obvious given the
  previous turn, which the classifier is given.
- A sensitive disclosure that is in scope. It suppresses humour and product offers for that turn
  rather than being refused.

## What the presenter sees

`/#/admin/guardrails`:

- **The permitted domain**, as the categories it is actually configured with — not prose, because
  the domain is data.
- **A live test box.** Type an input, see the category it classifies as and what the customer
  would get. This is the thing to use when someone in the room asks "what if I ask it about the
  weather".
- **Blocked requests** in the event stream, each with its category, so a session can be reviewed
  afterwards.
- **The kill switch**, which makes the gate return a "demo paused" response for everything.

## The categories

`banking`, `ambiguous`, `general_knowledge`, `competitor`, `off_topic`, `abusive`,
`prompt_injection`, `unsupported`.

`banking` and `ambiguous` reach the model. Everything else gets a canned refusal.

## Why it is a classifier and not a prompt

Because a prompt instruction is advice. The requirement is explicit that domain restriction must
not depend on asking the main model nicely, and the implementation follows it: deterministic
checks, then a small classifier, then routing — all of it in front of the model, with the model
never seeing blocked input.

A blocked turn produces a canned string, so there is no path by which the model could be induced
to answer the blocked question at all.

## The evals

54 cases in `evals/guardrails/cases.jsonl`, run against the live classifier.

```bash
npm run eval:guardrails
```

**100% on both the must-block and must-allow sets before any presentation.** The must-allow set
matters as much: a gate that refuses a customer swearing about their overdraft has failed too.
