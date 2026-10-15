---
title: Design tokens
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/index.css
  - docs/design/asset-manifest.json
---

# Design tokens

169 custom properties in `src/index.css`. This is the only place a colour, radius or state hue is
defined.

## The base

The slate scale and the BOI blue are the two things every supplied design board agrees on, so
they are the foundation and the rest is expressed through them.

```css
--boi-blue: oklch(0.49 0.2 264);
--boi-navy: oklch(0.26 0.09 266);
--radius: 0.75rem;
```

Colours are in `oklch` throughout. Perceptually uniform, so lightening a hue does not shift its
apparent colour, and a palette derived by adjusting one channel stays coherent.

## Semantic layer

Components never reference `--boi-blue`. They reference what the colour is *for*:

```css
--background / --foreground
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--brand-deep / --brand-deep-foreground
--destructive / --destructive-foreground
--warning / --warning-foreground / --warning-border
--success / --success-foreground
```

Every pair is a surface and the text that sits on it, which is what keeps contrast correct when a
token changes.

## Application state hues

```css
--state-progress   blue     moving
--state-waiting    amber    needs somebody
--state-review     violet   being looked at
--state-done       green    done
--state-declined   red      declined
--state-idle       grey     not started
```

Six hues for twelve states, grouped by what the customer should feel about them rather than by
what the state machine calls them. `StatusDot.tsx` holds the mapping.

**Every board uses colour *and* a label, never colour alone**, which is why `StatusBadge` renders
both. Do not build a status indicator that distinguishes states by hue only.

There are also per-product accent tokens — `--product-mortgage`, `--product-credit-card` and so
on — so each product reads as itself on a card.

## Dark mode

Defined so dark mode is *correct* rather than half-themed — but **nothing applies `.dark`**. The
tokens exist and are consistent; no surface opts into them, and the app does not follow the OS
appearance setting.

That is a deliberate state, not an oversight: a demonstration filmed in one appearance does not
need two, and a half-themed dark mode is worse than none. The tokens are there so turning it on
later is a switch rather than a project.

## Adding a token

1. Define it in the `:root` block in `src/index.css`, beside its neighbours.
2. Give it a dark-mode value in the same change, even though nothing reads it yet.
3. If it is a colour, make it a surface/foreground pair.
4. Use it through Tailwind's theme, not as a raw `var()` in a component where it can be avoided.

Do not add a colour to a component. The asset manifest in `docs/design/asset-manifest.json` and
the inventory beside it record what the supplied pack defined, which is the reference for whether
a new value is actually new.
