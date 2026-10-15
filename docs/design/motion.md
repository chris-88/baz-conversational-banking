---
title: Motion
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/index.css
  - src/lib/viewTransition.ts
  - src/baz/useGhostPrompt.ts
  - docs/archive/source-definitions/opening-transition.md
---

# Motion

Three rules, and all three are about the same thing: motion is decoration here, so it must cost
nothing and stop when asked.

## 1. Composite-only properties

Scale, translate and opacity. Nothing that triggers layout or paint.

That is what lets the Baz mark's idle motion hold sixty frames on a phone, and it is a hard
constraint rather than a preference — a demonstration that stutters reads as a slow product.

The thinking indicator is **opacity only, never vertical travel**.

## 2. Everything stops under `prefers-reduced-motion`

Not "reduces". Stops.

```css
@media (prefers-reduced-motion: reduce) { /* idle motion off entirely */ }
```

The mark is decoration and nothing it does carries meaning, so there is nothing to preserve in a
reduced form. The ghost prompt returns a static line for the same reason — the suggestion is the
content, the animation was a hint.

`withViewTransition()` checks the media query itself and applies the update immediately when
reduced motion is set.

## 3. The opening transition is one object moving

The mark waiting in the middle of the opening screen **becomes** the avatar beside Baz's first
reply. Not a crossfade between two pictures — the same object, moved.

The View Transitions API does exactly that from two `view-transition-name` declarations and no
library: the browser snapshots either side of the DOM change and tweens between them.

Where the API is missing, or reduced motion is set, the update still happens. It just happens at
once. That is the documented fallback, not a degraded path worth apologising for.

This is also why the brand mark and the wordmark are drawn in components rather than imported as
files — the thing waiting on the opening screen and the first letter of the name are one object,
and `currentColor` lets the same component be the brand blue, a muted header and a dark ground.

## The `motion` library

Added to the stack on 2026-10-14 for the explainer page, and extended to the conversation on
2026-10-15. Both decisions are in `docs/decisions.md`.

The explainer settled the grammar by use: four durations, one easing curve, entries that rise
a few pixels as they fade in. `src/lib/motion.ts` names those numbers and `index.css` mirrors
them as `--motion-*` tokens, so Framer and CSS cannot drift. `src/components/Primitives.tsx`
holds the shared pieces (`Surface`, `Reveal`, `Claim`, `Tile`, `Stat`), built on `m` under the
`LazyMotion` root in `providers.tsx`, so the conversation's chunk carries only the
`domAnimation` features rather than the whole library.

The three rules above do not change. The opening morph, the mark becoming the avatar, stays
on View Transitions and not on the library.

## Where the spec lives

The opening transition has its own written specification, now at
`docs/archive/source-definitions/opening-transition.md`. Code comments reference it by section —
"opening-transition spec §3", "§6" — so that is the document they mean.
