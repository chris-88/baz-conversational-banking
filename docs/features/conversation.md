---
title: Conversation
status: current
scope: poc
last_verified: 2026-10-18
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

Now and then a sentence Baz has started disappears and is written again. That is the server
refusing something the model was about to show, and taking back the words that introduced it
rather than leaving a promise of a card that never came. The saved conversation keeps only what
was left standing.

## What happens underneath

A turn is handled end to end by `baz-turn`: gate, load the case, compute the stage, select the
tools that stage allows, compose the prompt in a fixed order, stream, persist, recompute.
[The conversation runtime](../architecture/conversation-runtime.md) has the detail.

The part worth knowing as a feature: **the conversation has a computed shape.** Six stages, read
off the case every turn, deciding what the turn is for and which tools are available. A customer
cannot be shown a product card before anybody has asked what they want, because at that stage the
tool does not exist.

## Cards

19 of them. A card is a proposal; the tap is the commitment. Tapping calls `case-action`, which
validates and writes — the model never does.

One card per turn, with one line of text before it and nothing after. A card that waits for a tap
is the question of that turn.

A card that waits for a tap is the only question on its turn, and it stays the question until it
is tapped. When the customer answers it in words instead ("great", "yes"), the turn is told, from
the transcript and the case rather than from the model, that the card is still waiting, and Baz
says nothing has started and points at it. A reply that asks something new while a card waits
leaves a `question_while_card_awaits` event; the same thing on the turn the card was shown is
`question_with_card`.

## Continuity

- Close the tab and come back: the case is still there, with its cards.
- Sign in with an email address and a code: the conversation carries over, and bank-held facts
  arrive without being re-asked.
- Come back after the bank has moved something: the turn runs with a `return` trigger and Baz
  says what changed, with the status card rendering from the database beside it.
- Come back after the bank has opened the account (the console simulates `completed`): the turn
  opens with the welcome card before Baz has said a word. The account's name, an illustrative
  IBAN with real check digits under a bank code no bank holds, where the debit card is going,
  and what to do next. The server builds it from the case and sends it first on whatever turn
  comes next, once per opened account; the model has no tool that shows it and writes none of
  it. It is something to read, so it is not the question of its turn.

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
