---
title: Visual language
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/assets/
  - docs/design/asset-pack.md
  - docs/brand/USING-THIS.md
---

# Visual language

## The Baz brand

Two pieces of artwork, and they are the source of truth: if a component and one of these files
disagree, the file is right.

| Artwork | Where it appears |
|---|---|
| `docs/brand/baz-icon.svg` | `src/baz/BazMark.tsx` — chat avatar, zero state; `public/favicon.svg`, `public/icons/*.png` |
| `docs/brand/baz-name.svg` | `src/baz/BazWordmark.tsx` — every header |
| `#0029F8` | `--baz-primary` in `src/index.css` |

The icon is a lowercase `b` — a stem and a ring for its bowl — with two eyes inside the bowl. It
is the same letter that opens the wordmark, and that is the point: the thing waiting in the middle
of the opening screen and the first letter of the name are one object, which is what the
[opening transition](motion.md) moves.

Both are **drawn in components rather than imported as files**, so they take a colour through
`currentColor` — one component serves the brand blue, a muted header and a dark ground.

## Bank of Ireland assets are placeholders

`src/assets/logos/boi-mark-placeholder.svg` and `boi-wordmark-placeholder.svg`, named that way so
nobody can use them by accident.

They were generated from the concept, not supplied by the bank. **Official brand artwork must
replace them before any external or production use**, and redistributing real brand assets needs
approval — see [the public repository review](../security/public-repository-review.md).

## The asset pack

`src/assets/`, derived from the supplied visual direction and documented in
[asset-pack.md](asset-pack.md), with a full inventory in `asset-inventory.csv` and a mapping in
`asset-manifest.json`.

```text
avatars/        synthetic customer and partner faces
backgrounds/    hero and section grounds
icons/          product, navigation, status, utility
illustrations/  hero and supporting
logos/          Baz, and the BOI placeholders
qr/             the audience entry code
```

Prefer SVG everywhere in the app. PNGs exist for raster-only contexts. No font files are in the
pack — [typography](typography.md) covers that.

## The look

Derived from the supplied design boards rather than invented, and expressed entirely in
[tokens](tokens.md).

- **Slate neutrals with a single strong blue.** The boards agree on those two things, so they are
  the foundation.
- **Generous radii.** `--radius: 0.75rem`, applied consistently.
- **Cards as the unit of structure.** The conversation is a column of bubbles and cards; the
  console is a grid of cards. There is no third pattern.
- **Colour plus a label, never colour alone**, for anything carrying state.

## Avatars

Synthetic faces for the customer and the partner, from the asset pack. They are illustrations
rather than photographs, which keeps them obviously not-a-real-person — the same instinct as
naming the BOI marks "placeholder".

## What there is no visual language for

There is no dashboard, no account list, no transaction view and no product browse experience.
Those were built and deleted. If a design question assumes one of them, the answer is that the
conversation is the surface.
