# The brand

`baz-icon.svg` and `baz-name.svg` are the artwork. They are the source of truth: if a component
here and one of those files disagree, the file is right.

| Artwork | In the app |
|---|---|
| `baz-icon.svg` | `src/baz/BazMark.tsx` — chat avatar, zero state; `public/favicon.svg` and `public/icons/*.png` |
| `baz-name.svg` | `src/baz/BazWordmark.tsx` — every header |
| `#0029F8` | `--baz-primary` in `src/index.css` |

The icon is a lowercase `b` — a stem and a ring for its bowl — with two eyes inside the bowl.
It is the same letter that opens the wordmark, which is the point: the thing waiting in the
middle of the opening screen and the first letter of the name are one object, and the opening
transition moves that object rather than swapping one picture for another.

## How they are used

Both are drawn in the components rather than imported as files, so they can take a colour
through `currentColor` — one component for the brand blue, a muted header and a dark ground,
instead of three assets. The geometry is copied verbatim; only the fill is parameterised.

The app icon is the one place that keeps its own copy, because an icon cannot inherit anything:
a favicon has no page to take a colour from, and a home screen composites it on whatever ground
it likes, so the tile and the ink are both written out.

Sizing differs by kind. The icon is square-ish artwork at 64 by 72 and is sized by its box
(`size-8`, `size-20`), with the aspect preserved so the ring never becomes an oval. The wordmark
is sized by height like any logo — `h-7`, `h-8` — and the width follows.

## `--baz-primary` is not `--primary`

The tenant's blue is Bank of Ireland's, and Baz is meant to be portable to another one
(Invariant 11, §32). A logo that changes colour with the bank it is sitting inside is not a
logo. The dark-mode value is ours: the artwork specifies one blue, for a white ground.

## superseded/

An earlier dev kit — a different face mark, a different wordmark and a different blue
(`#1D4ED8`). Kept for reference and not in use anywhere. Nothing in `src/` should match it, and
if something does, that is the bug.
