---
title: Working with fixtures
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/seed/canonical.ts
  - scripts/generate-seed.ts
  - scripts/live-probe.mjs
---

# Working with fixtures

Everything in this project is synthetic. The question is only which fixture you want and how to
get it back.

## The canonical presenter case

`domain/seed/canonical.ts` is the case the demonstration runs on, and the case a reset restores.

The customer is Aoife Ní Bhriain, an existing Bank of Ireland customer with only a personal
current account, recently married, recently a parent, buying a first home with her spouse. The
spouse is Emma Ní Bhriain. Bank reference `BOI-SYNTHETIC-000417`.

Nothing in it corresponds to a real person, a real customer record or a real national
identifier, and the file says so at the top. That is invariant 10, not a nicety.

> The vision document calls the spouse Sarah and the requirements call her Emma. The requirements
> win, so the seed uses Emma. If you see Sarah anywhere, it is stale.

## Regenerating it

```bash
npm run seed:generate     # rebuild canonical.ts
npm run seed:check        # assert it matches the domain; CI runs this
```

`seed:check` failing on CI means the domain changed — a new fact key, a changed journey
requirement — without the seed being rebuilt. Rebuild it rather than editing `canonical.ts` by
hand; it is generated.

## Resetting during a demonstration

The admin console's reset restores the canonical case. Build this early and keep it working; you
will use it constantly. As of 2026-10-13 a reset also clears the sign-ins, because a case
restored underneath a signed-in browser was a case nobody could reproduce.

Purge is separate, and clears audience cases without touching the presenter case.

## Audience cases and the cap

`AUDIENCE_MAX_CASES` limits customer cases created in a rolling 24 hours. It is a rate, not a
lifetime total, and the isolation is by case ownership under RLS — an audience case can never
touch the presenter case.

## Live probes

If you must drive the real model, use the probe:

```bash
node scripts/live-probe.mjs
```

It tags its case `kind = 'test'` on create, through the admin-only `tag_test_case` action, which
takes it out of the cap, and deletes the case on exit.

This exists because twenty-five replays against the live model once used the day's allowance up
and started refusing real visitors. Do not drive the live model with anything that does not
clean up after itself.

## Generated tenant data

Three fixtures are generated from captured inputs rather than written:

| Fixture | Generator | Input |
|---|---|---|
| `tenants/boi/mortgage-rates.ts` | `scripts/generate-mortgage-rates.ts` | `docs/baz-boi-mortgage-rates.zip` |
| The product knowledge base | `scripts/generate-product-kb.ts` | `docs/baz-boi-retail-product-kb.zip` |
| `forms/form-1833.json`, `form-1940.json` | `scripts/fetch-form-definition.ts` | The bank's published form API |

All four are marked generated at the top of the file. Edit the generator or the input, never the
output.

The form snapshots carry their own provenance — source URL, retrieval timestamp, the form's own
version string and a hash of the bytes — which is what lets somebody in the room satisfy
themselves the definition is the bank's document and not ours.

## Rendering a card without a turn

Cards take their props from the contract schemas in `_shared/contracts/cards.ts`, so any card in
`src/baz/cards/` can be rendered from a fixture object in a test. This is the right way to work
on card layout, and it costs nothing. The alternative — running a conversation to see where a
card sits — is how an API budget disappears.
