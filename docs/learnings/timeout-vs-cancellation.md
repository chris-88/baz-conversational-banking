---
title: A timeout is not a cancellation
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - docs/04-cost-of-running-a-conversational-assistant.md
  - supabase/functions/_shared/llm/gate.ts
---

# A timeout is not a cancellation

**Authoritative version: finding 4 of
[the cost paper](../04-cost-of-running-a-conversational-assistant.md).**

The smallest finding in the paper by amount, and the one most worth carrying elsewhere.

## What happened

The gate gives up on the classifier after four seconds and fails closed with a short retry
message. **That behaviour is correct and was kept** — if the gate cannot decide, the model does
not run.

What was wrong is that giving up on the answer did not stop the request. It ran to completion and
was billed in full.

Worse: the client was configured to retry once, so a slow call could be billed **twice**, for two
answers neither of which anything ever read.

## The fix

An abort signal. When the deadline passes, cancel the request rather than merely stop waiting for
it.

## Why it is in here at all

The amount is small, because the gate runs on a cheap model.

The *shape* of the bug is not small:

> **A deadline that abandons a request is not the same as a deadline that ends one, and the
> difference is invisible in every metric except the invoice.**

Nothing in the application behaved incorrectly. The user got the right message. The logs showed a
timeout. The only symptom was money.

> **Anywhere you race a request against a timer, check what happens to the request when the timer
> wins.**

## Where else this pattern lives in the codebase

Worth checking whenever one of these changes:

- The SSE keepalive, which is sized to sit comfortably inside the client's 45-second silence limit.
- Any retry. A retry on top of an un-cancelled timeout is the doubling case above.
- The `rate limit` versus `spend limit` distinction in the gate: a 429 is deliberately treated as
  retryable, because it is the one failure where trying again shortly is the right advice. A spend
  limit is not, and the two arrive from Anthropic as the same 400 `invalid_request_error`, so they
  are told apart on the message text.
