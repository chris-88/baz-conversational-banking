---
title: Conversation design
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/baz/ZeroState.tsx
  - src/baz/useGhostPrompt.ts
  - src/baz/MessageText.tsx
  - supabase/functions/_shared/domain/conversation/turn-shape.ts
  - supabase/functions/_shared/llm/prompt.ts
---

# Conversation design

The decisions here are mostly about restraint, and most of them replaced something that read as
a more conventional product and worked less well.

## The empty state asks, it does not explain

There was a scripted greeting that explained what Baz was before the customer had done anything.
It was replaced with one question and a wait.

The claim this product makes — that you do not have to know which product you need — **is better
made by asking the question than by asserting it.**

## No suggestion chips

A row of tappable openers cost a tap less and read as a menu. A menu of five situations quietly
contradicts the one claim the product makes.

So the openers are typed into the empty composer instead, one at a time, typed and deleted. That
says "something like this, in your own words" without narrowing it to five.

It stops the moment anything is typed — an animation under live text is a distraction rather than
a hint — and returns a static line under `prefers-reduced-motion`.

## One card per turn, and no question after it

A card that waits for a tap **is** the question of that turn.

Baz once showed a comparison of two savings accounts and, underneath it, asked what the customer
paid in rent and whether they banked jointly. Three demands in one breath, and whichever the
customer answered, the others were left hanging. The card is also the thing that gets scrolled
past when there is text under it to reply to.

Several tool descriptions therefore end with the same instruction: one line of your own before the
card, nothing after. `turn-shape.ts` computes what else a turn is allowed to be doing.

## One question at a time

Where the engine needs four values — the mortgage rate table is indexed by customer type, BER,
amount and term — the model asks for whichever is missing, one at a time, rather than listing
four questions or guessing.

## The model never does arithmetic

It never restates figures that are on a card, and it never computes a repayment, a total or an
eligibility outcome. Those are on the card because the server worked them out.

"Never restate the figures: they are on the card" appears verbatim in a tool description, because
a model that repeats a number is a model that can repeat it wrong.

## Two markdown constructs, hand-parsed

Bold and bullets. Nothing else.

The model reaches for `**label:**` and `- ` when listing what changed since somebody was last
here — the one turn the prompt asks for a list — and the transcript was printing the asterisks.

Hand-written rather than a markdown library, for two reasons: the surface is two constructs, so a
parser that also does tables, images and raw HTML is a lot of behaviour to accept for them; and it
builds React nodes rather than HTML, so **there is no sanitiser to get wrong.** Text from the
model can only ever become text.

## What the prompt had to be told to say

Two cases worth knowing, because both are failures of omission rather than of instruction:

**"How long does this take" is not a number.** Asked how long an application takes, whether an
appointment was needed and what documents were required, Baz said it had no timeframe, nothing
about appointments and no document list, and declined all three. Two of those were honest. The
real failure was that the answer is that there is nothing to turn up to, nothing to sit down and
fill in, and no need to have anything ready before starting — and nothing in the prompt said so.
A customer who has only ever applied on paper assumes a folder of documents and a morning off.

**A promise needs its condition attached.** Baz told a customer "we'll come back to you when your
savings reach €32,000" before they held any account. The watch is only ever created once a savings
account exists; the code had always been honest about it, but nothing said so, so the promise went
out with an invisible condition. A bank can only watch a balance it can see, and that is worth
saying out loud.

## Baz discloses what it is

Always AI, never claims to be human. Warm without pretending to be a person.

## Persona is style, not scope

Six sliders — length, humour, sarcasm, formality, playfulness, poetic — mapped to fixed prose
fragments and composed into a labelled block *after* the policy. No free-text persona
instructions, ever.

A sensitive turn forces humour, sarcasm, playfulness and poetic to zero. Someone disclosing an
illness does not get a joke, and the way to guarantee that is to zero the sliders rather than to
ask nicely.
