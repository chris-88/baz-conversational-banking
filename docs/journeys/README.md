---
title: Journeys
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/journeys/
  - supabase/functions/_shared/tenants/boi/forms/mapping.ts
---

# Journeys

A journey is one product's requirements, as a data structure. One file per product in
`supabase/functions/_shared/domain/journeys/`.

## The seven

| Product | Display name | Requirements | Partner | Bank form |
|---|---|---|---|---|
| `mortgage` | Mortgage | 29 | Yes | — |
| `protection` | Life assurance and family protection | 18 | Yes | — |
| `joint_account` | Joint current account | 16 | Yes | — |
| `personal_loan` | Personal loan | 14 | No | [1940](personal-loan-1940.md) |
| `credit_card` | Credit card | 11 | No | — |
| `current_account` | Current account | 10 | No | — |
| `savings` | Savings account | 8 | No | [1833](supersaver-1833.md) |

## All seven are `status: 'draft'`

This is the honest state of the project and it is worth stating clearly.

The journeys are translated from product knowledge and the captured product knowledge base. They
have **not** been matched against the recordings of the real journeys, and `source` is `null` on
every one of them.

When a journey is verified against its recording, set `status: 'final'` and fill `source` with the
file and timestamp:

```ts
status: 'final',
source: 'recording: <file> @ mm:ss',
```

Two of the seven have a stronger claim than draft implies, because their questions come from the
bank's own published form definition rather than from translation — see
[the two forms](#the-two-form-backed-journeys) below.

## The shape

```ts
export const savings = defineJourney({
  product: 'savings',
  status: 'draft',
  source: null,
  displayName: 'Savings account',
  supportsPartner: false,
  requirements: [
    { kind: 'fact', id: 'address', fact: 'identity.address', subject: 'primary',
      label: 'Your home address' },
    { kind: 'declaration', id: 'savings-declaration', subject: 'primary',
      label: 'Savings account declaration', fresh: true },
  ],
  branches: [ /* conditional requirements */ ],
})
```

A requirement is a **fact key**, or a declaration, document or confirmation. Each names the
`subject` it belongs to — which is what stops the primary's income satisfying the partner's
requirement.

A requirement may carry its own `reuse` policy, which **may tighten the catalogue's default but
never loosen it.** Health data marked `never` in the catalogue stays `never` however a journey asks
for it.

## Length is a design decision

The savings journey is eight requirements, deliberately. A savings account is not a credit
decision: there is no affordability to assess and nothing to underwrite, so asking for the
furniture of a mortgage application would be theatre.

What it does need is the target and the monthly amount — because those are what make the plan, and
the follow-up when the target is reached, possible at all.

The mortgage is 29 for the opposite reason.

## The two form-backed journeys

`savings` → form `1833`, `personal_loan` → form `1940`, mapped in
`tenants/boi/forms/mapping.ts`.

For these, the questions are not a translation of anything. They are the bank's own published
definition, parsed, with its own branching rules and its own calculations. See
[digital forms](../architecture/digital-forms.md).

**A product with no form entry is not an error.** It is the normal state for most of the
catalogue: the case still runs through Baz's own journey, there is simply no published definition
to map onto.

## Adding a journey

1. Create `journeys/<product>.ts` with `defineJourney`, `status: 'draft'`, `source: null`.
2. Every fact key must already exist in the catalogue — add it there first, with its schema,
   subject type, reuse policy, sensitivity and `extractable` flag.
3. Add the product to the catalogue in `tenants/boi/products.ts`, with plain-language copy and
   illustrative terms clearly marked synthetic.
4. Register it in `journeys/index.ts`.
5. Write the tests: what is outstanding on an empty case, what clears on reuse, what a branch
   adds, and what the partner is needed for.
6. If a published form completes it, snapshot the form and add two rows to `mapping.ts`.
