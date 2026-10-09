# The brand kit in this repo

`svg/`, `tokens/`, `README.md` and `implementation-notes.md` are the supplied Baz dev kit,
copied in unmodified. They are the source of truth for the artwork: if a component here and a
file there disagree, the file is right.

## Where each one lives in the code

| Kit asset | In the app |
|---|---|
| `baz-face-mark.svg` | `src/baz/BazMark.tsx` — chat avatar, zero state |
| `baz-wordmark-horizontal.svg` | `src/baz/BazWordmark.tsx` — every header |
| `baz-app-icon.svg` | `public/favicon.svg`, used verbatim; `public/icons/*.png` rendered from it |
| `tokens/brand-tokens.css` | `--baz-primary` and `--baz-ink` in `src/index.css` |

## The two deliberate departures

**The `az` is set in Inter, not the kit's DejaVu.** The kit says so itself: the wordmark's
lettering ships "as a clean starter asset using SVG text", to be outlined later. SVG `<text>`
renders in whatever font the device happens to have, so on a phone the kit file would quietly
become something else. Setting it in the application's own typeface at the kit's weight and
tracking is stable; outlining it properly is the real fix, and it is still outstanding.

**`--baz-primary` is not `--primary`.** The tenant's blue is Bank of Ireland's, and Baz is
meant to be portable to another one (Invariant 11, §32) — a logo that changes colour with the
bank it is sitting inside is not a logo. The two are within a couple of points of each other
today; that is a coincidence.

## Keeping to it

The kit's own guidance, worth repeating because it is easy to drift from: the face mark is for
chat, the wordmark is for brand and header contexts, and the full wordmark is never a chat
avatar. The dark-mode blue is ours, not the kit's — it specifies one blue, for a white ground.
