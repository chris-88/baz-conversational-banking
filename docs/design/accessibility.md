---
title: Accessibility
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/components/StatusDot.tsx
  - src/index.css
  - src/lib/viewTransition.ts
  - e2e/smoke.spec.ts
---

# Accessibility

Honest summary: this is a proof of concept and has not had a formal accessibility audit. What
follows is what is actually in place, and what is not.

## In place

**shadcn/ui as the mandatory default.** This is the single biggest contributor. Generated
components bring their own keyboard handling, focus management and ARIA, so the baseline is
correct without each component being reviewed individually. 119 `aria-*` attributes, 16 explicit
`role`s and 12 `sr-only` labels across the app, most of them from generated components.

**Colour is never the only signal.** Every design board uses colour *and* a label for application
state, which is why `StatusBadge` renders both and `StatusDot` is paired with text. A status is
never distinguishable by hue alone.

**Reduced motion is respected completely.** Not reduced — stopped. The idle mark animation, the
thinking indicator and the ghost prompt all turn off under `prefers-reduced-motion`, and
`withViewTransition()` checks the query itself and applies the DOM change immediately. Nothing
the motion does carries meaning, so there is nothing to preserve in a degraded form.

**Focus is visible.** 37 `focus-visible` rules; the token set defines a ring and components use
it rather than removing outlines.

**`oklch` throughout, in surface/foreground pairs.** Every colour token is defined alongside the
text colour that sits on it, which is what keeps contrast correct when a token changes rather
than leaving each component to get it right.

**Text from the model becomes React text nodes, never HTML.** The markdown renderer builds nodes
rather than strings, so there is no sanitiser to get wrong and no path from a model reply to
injected markup.

**Every surface carries the prototype disclosure**, and the smoke test asserts it. Not strictly
accessibility, but it is the same instinct: the user should never be misled about what they are
using.

## Not in place

- **No audit.** No axe run in CI, no screen-reader pass, no keyboard-only walkthrough of the
  whole conversation.
- **No contrast verification.** The token pairs are built to be correct and have not been
  measured against WCAG ratios.
- **Dark mode is defined but unreachable.** The tokens exist; nothing applies `.dark` and the app
  does not follow the OS appearance setting. Someone who needs a dark interface cannot get one.
- **No speech input.** There was a microphone button; it was removed because nothing was behind
  it, and a dead control is worse than no control.
- **The conversation has not been tested with a screen reader.** A streaming transcript with cards
  appearing in it is exactly the kind of surface that needs that testing, and it has not had it.

## If you are picking this up

The cheapest useful work, in order:

1. Run axe over the five surfaces. The shadcn baseline means the findings will be in the
   hand-written parts, which is a short list.
2. Keyboard-only pass through one full conversation, including a card tap.
3. Decide whether a streaming message should announce — an `aria-live` region on the transcript is
   either right or very wrong, and it needs testing rather than guessing.
4. Measure the token pairs for contrast, and fix them in `index.css` rather than per component.
5. Either finish dark mode or say in the UI that it is not supported.
