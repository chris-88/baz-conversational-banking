---
title: Design principles
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/index.css
  - docs/design/asset-pack.md
  - docs/decisions.md
---

# Design principles

## The conversation is the product

Everything else on screen exists to support it. There is no dashboard, no navigation tree and no
product catalogue to browse — those were built, and then deleted, because they were scaffolding
around the only thing worth showing.

The consequence for design work: a decision that makes the conversation clearer wins over one
that makes a page look more finished.

## Mobile first at 390px

Not "responsive down to". Designed at iPhone width and allowed to grow. The Playwright specs run
at that viewport.

## Tokens, never per-component overrides

169 custom properties in `src/index.css`, derived from the supplied asset pack and design boards.
The slate scale and the BOI blue are the two things every board agrees on, so they are the base
and everything else is expressed in terms of them.

A component that needs a colour reaches for a token. A component that needs a *new* colour is a
conversation about the token set, not a one-off value in a class attribute.

## shadcn/ui is the default, and it is mandatory

Added with the CLI, never hand-rolled. If shadcn provides it, use it.

This is not about taste, it is about time: 41 generated components cost nothing to keep and a
hand-rolled replacement costs a maintenance burden and an accessibility review that the generated
one already passed.

## A dead control is worse than no control

A product card that looked tappable and was inert text, a microphone button with no speech input
behind it, a "View all" that looked like a link and went nowhere. All three shipped, and all
three read as a broken product rather than an unfinished one.

If it is not built, it either says so or it is not on screen.

## Nothing claims to be the bank

The BOI mark and wordmark in the asset pack are **placeholders generated from the concept**, and
they are named `boi-mark-placeholder.svg` and `boi-wordmark-placeholder.svg` so nobody can use
them by accident. Every surface carries a prototype disclosure, and the smoke test asserts it.

## Baz discloses what it is

Baz always says it is AI and never claims to be human. That is a design constraint as much as a
policy one: the tone can be warm without being a person.

## Motion is decoration, and stops on request

Animation is scale, translate and opacity only, so it composites on the GPU and holds sixty
frames on a phone. Everything stops entirely under `prefers-reduced-motion`, because nothing the
motion does carries meaning.

[Motion](motion.md) has the specifics.

## The explainer is held to the same standard

`/how-it-works` is a product surface, not a slide deck. Its figures live in one content directory
so that every number on it has a source, and the numbers are measured rather than asserted.
