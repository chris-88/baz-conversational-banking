---
title: Persona studio
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/llm/persona.ts
  - src/admin/PersonaControls.tsx
---

# Persona studio

Six sliders that change how Baz sounds, and nothing else.

## The sliders

All 0 to 1: `length`, `humour`, `sarcasm`, `formality`, `playfulness`, `poetic`.

`persona.ts` maps slider values to **fixed prose fragments** — there is no free-text persona
instruction anywhere in the system, and there is deliberately no way to add one. The composer is
snapshot-tested, so a change to how a slider reads shows up in a diff rather than in a
conversation.

## Presets

Named slider sets: `default`, `concise`, `friendly`, `formal`, `dry humour`, `poetic`. "Custom"
simply means values of your own.

## Style only

The persona block composes into the prompt **after the policy**, labelled as style. It cannot
change scope, tools, rules or protections.

Two hard behaviours enforce that:

- **A sensitive turn forces humour, sarcasm, playfulness and poetic to zero.** Somebody disclosing
  an illness or a bereavement does not get a joke, and the way to guarantee that is to zero the
  sliders rather than to ask the model nicely.
- **Refusals collapse the persona to one of three tone buckets** — `formal`, `neutral`, `playful`
  — so a refusal sounds like the same assistant without the persona being able to soften what it
  refuses or add to it.

Formality at or above 0.67 reads as the formal bucket.

## Read fresh every turn

Persona is loaded from `persona_config` on each turn, so moving a slider in the console changes
the next thing Baz says. No restart, no cache to clear.

That is a presentation feature: changing the personality live, mid-conversation, is a thing to
show rather than describe.

## In the console

`/#/admin/persona` — the six sliders, the presets, and a preview. `preview_persona` renders what
the current settings would do to a sample reply without spending a conversation turn on it.

Unsaved slider drafts are the one legitimate use of Zustand in this project.

## What it cannot do

- It cannot widen the permitted domain.
- It cannot grant a tool.
- It cannot change what a refusal refuses.
- It cannot make Baz claim to be human. Baz always discloses that it is AI, at every persona
  setting.
