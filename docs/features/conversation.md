---
title: Conversation
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/surfaces/BazScreen.tsx
  - src/baz/
  - supabase/functions/baz-turn/index.ts
---

# Conversation

The product. Everything else supports it.

## What the customer sees

One screen, `/#/baz`, in a browser tab or an installed app — the same screen either way.

It opens on a question and waits. Sample openers type themselves into the empty composer, one at
a time, and stop the moment anything is typed. There are no suggestion chips: a menu of five
situations would contradict the one claim the product makes.

On the first send, the mark waiting in the middle of the screen **becomes** the avatar beside
Baz's first reply — one object moving, via the View Transitions API.

From there it is a transcript of text and cards. Baz replies in streamed text; where an action is
available, a card appears and the customer taps it.

## What happens underneath

A turn is handled end to end by `baz-turn`: gate, load the case, compute the stage, select the
tools that stage allows, compose the prompt in a fixed order, stream, persist, recompute.
[The conversation runtime](../architecture/conversation-runtime.md) has the detail.

The part worth knowing as a feature: **the conversation has a computed shape.** Six stages, read
off the case every turn, deciding what the turn is for and which tools are available. A customer
cannot be shown a product card before anybody has asked what they want, because at that stage the
tool does not exist.

## Cards

18 of them. A card is a proposal; the tap is the commitment. Tapping calls `case-action`, which
validates and writes — the model never does.

One card per turn, with one line of text before it and nothing after. A card that waits for a tap
is the question of that turn.

## Continuity

- Close the tab and come back: the case is still there, with its cards.
- Sign in with an email address and a code: the conversation carries over, and bank-held facts
  arrive without being re-asked.
- Come back after the bank has moved something: the turn runs with a `return` trigger and Baz
  says what changed, with the status card rendering from the database beside it.

## The menu

`ConversationMenu.tsx` — sign in, start a new conversation, switch between conversations if the
presenter key is set, and the privacy notice.

## Guardrails, from the customer's side

Out-of-scope input gets a short reply that does not answer the question and does not acknowledge
what was asked. It never reaches the model. Profanity with a banking question in it is a banking
question. [Guardrails](guardrails.md).

## What it does not do

- No speech input. A microphone button existed with nothing behind it and was removed.
- No file browse outside an upload the bank asked for.
- No account view, transaction list or product catalogue to browse. The conversation is the
  surface.
