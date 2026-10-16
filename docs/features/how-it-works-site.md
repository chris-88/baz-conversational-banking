---
title: How it works (the explainer)
status: current
scope: poc
last_verified: 2026-10-16
sources:
  - src/surfaces/HowItWorks.tsx
  - src/content/how-it-works/
---

# How it works — the explainer

`/#/how-it-works`. Written for somebody **evaluating** the work rather than somebody using the
product, which is why it has its own address and reads as a case study rather than a dashboard.

Each chapter pairs a claim with the evidence for it, and the evidence is real: published form
definitions, measured token counts, commits counted out of git history.

## Ten chapters

```text
opportunity    why the current interaction model wastes the bank's own context
story          the §67 acceptance story, beat by beat, through the real cards
capabilities   what is built, as tiles, six rendered cards and three running proofs
experience     what the conversation actually does
architecture   where the model sits and what it is not allowed to decide
discovery      the bank's published form definitions, read as another renderer
build          how it was built, and how fast
lessons        what went wrong
economics      what a turn costs, measured
future         what this could become
```

Eight are in the top navigation. Lessons and the close are read on the way past.

## The story: a show and tell for people who were not there

The §67 acceptance story is the only test that matters, and until 2026-10-16 the page never
told it. The story chapter does, as nineteen beats grouped under the thirteen §6 stages, each
one a phone-width transcript beside a strip of what the system did.

The transcript is built from the product's own pieces: `ChatBubble`, `MessageText` and
`CardRenderer`, with no actions and every control disabled, so what is on the page is what is
on a phone and nothing can be started from it. Where the story has moved on, a card is shown
settled with the wording the product uses the moment a tap lands. The partner's task list, the
console and the lock screen are drawn as rows, and each says where the real screen is.

The words are synthetic and labelled. Three lines are quoted byte for byte from the fixture
scripts transcribed off a live case. The shape is not synthetic: `story.test.ts` parses every
card against `cardSchema`, recomputes the arrangement, the rate selection and the plan draft
from the engines that produced them, reads the advisory from `evaluateAdvisories`, and checks
the §6 stages run in order with none missing. The tools shown on each beat are read from
`CONVERSATION`, the object a live turn is handed, so the list is the enforcement and not a
description of it.

The heavy tenant data (the knowledge base and the rate table) stays out of the explainer's
chunk: engine figures are pinned in `story.ts` and recomputed in the test rather than computed
on the page.

## What it can do: the inventory

Three grids of tiles, by who meets the thing: in the conversation, around it, for the bank.
Each tile is labelled POC or a production direction, and the two directions (Baz for the
partner, a plan surface for the customer) say in their body that they are not built. Counts
carry the date they were measured; the ones a test can recompute (cards, tools, rate rows,
decision records, eval cases) are recomputed in `capabilities.test.ts`.

Then six real cards in tabs, through `CardRenderer` with every control disabled: the rates,
a comparison, a quote, the arrangement, a plan and a review. The comparison and the quote are
built from the same catalogue helpers the server uses and pinned; the test recomputes them.
The quote is labelled illustrative because `products.ts` says its variants are invented.

Then three proofs that are the running code rather than copy about it:

- **Persona** (§56): the presets, the six slider values, the prose the composer turns them
  into and the tone bucket a refusal would use, all from `@llm/persona.ts`; a switch applies
  `applySensitivity`. The §56 example sentences are shown as the spec's own and labelled.
- **Guardrails** (§57): ten cases copied by id from `evals/guardrails/cases.jsonl`, with the
  exact refusal from `@llm/refusals.ts` in a chosen tone bucket. No classifier is called; the
  test checks each case is identical to the eval set.
- **Stage gating**: `STAGES` and `CONVERSATION` rendered directly, so the tool list per stage
  is the enforcement and not a description of it.

Each chapter is deep-linkable — `/#/how-it-works/architecture` lands on it and scrolls once,
without fighting later scrolling, so a single chapter can be sent on its own.

## Three rules hold the page together

1. **Nothing is only legible once it has animated.** Motion emphasises; it never carries the
   content. The page reads with animation disabled.
2. **Every number carries where it came from.** The draft this replaced had three of four headline
   figures wrong, which is why the figures now live in `src/content/how-it-works/` — one directory,
   each file sourced, so a number on screen can be traced to what produced it.
3. **Anything the prototype does not do is labelled as a direction**, not described in the present
   tense.

That third rule is the one worth copying into anything else written about this project.

## Where the numbers come from

| File | Holds |
|---|---|
| `economics.ts` | Cost figures, sourced to `docs/04-cost-of-running-a-conversational-assistant.md` |
| `build-metrics.json` | Generated by `scripts/build-metrics.mjs`, counted out of git history |
| `forms.ts` | The two published form definitions: ids, field counts, rule counts, versions |
| `architecture.ts` | The component and boundary diagram's content |
| `pivots.ts` | The before-and-after comparisons |
| `scenarios.ts` | Three worked customer situations: `home`, `cash`, `difficulty` |
| `story.ts` | The §67 story: nineteen beats, their card payloads, and what the system did. Engine figures pinned, recomputed in `story.test.ts` |
| `capabilities.ts` | The inventory tiles, grouped, with measured counts and their date |
| `gallery.ts` | Six real card payloads for the gallery; comparison and quote pinned from the catalogue helpers |
| `guardrails.ts` | Ten cases copied by id from the eval set, with the category each exercises |
| `copy.ts` | Chapter identifiers, navigation labels, prose |

`build-metrics.mjs` is run by hand, so the build figures are as fresh as the last run. The cost
figures are **measured, and must never be revised from memory** — the cost paper has a changelog
for exactly that reason.

## The chapter navigation

A left rail showing where you are in the argument and how much is left.

It was first a row of pills across the top, which had two problems and the second was the real
one: tapping a pill scrolled the heading underneath the sticky bar that had just been tapped, and
the chapter tracker kept reassigning the active chapter while the smooth scroll was still
running. `useActiveChapter.ts` carries the fix — a jump suppresses tracking until it settles.

The section the reading line is inside wins outright. Measured by heading distance alone, the
story chapter, which is tall, lost to the short one after it as soon as its own heading had
scrolled away, and the rail said "The experience" through most of the story.

## Motion

This is the only surface that uses the `motion` library, added to the stack on 2026-10-14 and
recorded in the decisions log. A scroll-driven case study where the page demonstrates the
qualities it describes would have been a bad use of time to hand-roll.

The conversation itself stays on CSS and View Transitions.

## Keeping it honest

If you change what a turn costs — prompt size, cache breakpoints, model choice, tool rounds,
reply length — update `docs/04-cost-of-running-a-conversational-assistant.md` **and its
changelog**, then update `economics.ts` from it. The numbers are measured. Do not revise them
from memory.
