---
title: Typography
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/styles/fonts.css
  - src/index.css
---

# Typography

One typeface: **Inter Variable**, self-hosted, Latin subsets only.

## Why self-hosted

Not fetched from Google Fonts, for two reasons that are both about the demonstration:

- **The demo has to work on conference wifi.** No external request, no dependency on another
  origin answering.
- **The service worker precaches `woff2`**, so there is no flash of unstyled text mid-presentation.

## Why Latin only

Base Latin is 48KB. The full package also ships Latin Extended, Cyrillic, Greek and Vietnamese,
which together added about 175KB to the precache.

Everything this product needs is in the base range: Irish fadas, the euro sign, em-dashes and
curly quotes. Anything outside it falls back to the system sans **for that glyph**, rather than
failing — a missing character degrades to a different shape, not to a box.

If a surface ever needs a script outside base Latin, add that subset's `@font-face` with its own
`unicode-range` rather than switching to the full package.

## Variable, one file

`font-weight: 100 900` from a single `woff2`, which is why there is one request rather than four
and why intermediate weights are available without shipping more.

`font-display: swap`.

## Use

Through Tailwind's type scale. A heading does not get a hand-set `font-size`; it gets the step
that reads correctly at 390px and is allowed to grow.

Line length matters more than size on a phone: a conversation is read in short bursts, and a
message bubble that runs to the full width of a tablet is harder to read than the same text
wrapped.
