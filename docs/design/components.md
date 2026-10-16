---
title: Components
status: current
scope: poc
last_verified: 2026-10-16
sources:
  - src/components/ui/
  - src/baz/cards/
  - components.json
---

# Components

130 React components. 41 of them are shadcn-generated and are not hand-maintained.

## shadcn/ui is mandatory

Added with the CLI, configured by `components.json`, generated into `src/components/ui/`.

**Never hand-roll something shadcn provides.** A generated component arrives with its keyboard
handling, focus management and ARIA already correct; a hand-rolled replacement arrives with an
accessibility review to do.

`src/components/ui/**` is excluded from linting because it is generated. Do not edit the files to
change appearance — change a [token](tokens.md).

Nine of the 41 are currently unreferenced. They stay: they cost nothing, and the alternative is
hand-rolling one later.

## Conversation cards

`src/baz/cards/` — 21 cards, plus `CardRenderer.tsx` which maps a card type to its component
and `Settling.tsx`, which cross-fades any of them into `SettledCard` once its decision is made.

```text
ProductOptionsCard   ComparisonCard      QuoteCard         MortgageRatesCard
ReviewCard           ConfirmationCard    StatusCard        PausePromptCard
PartnerInviteCard    PlanProposalCard    ConsentCard       HealthFormCard
UploadRequestCard    FormUploadCard      FormDeclarationsCard
SignInCard           DataNoticeCard      ArrangementCard   ReuseCard
SettledCard
```

`ArrangementCard` and `ReuseCard` are the two the engine writes every word of: the first is
how the customer's money should be split across accounts, the second is what they were never
asked because the bank already knew. `SettledCard` is what every card becomes once its
decision is made, on the spot and on reload alike.

Three things are true of every one of them:

1. **Its props come from a contract schema** in `_shared/contracts/cards.ts`, so it can be
   rendered from a fixture object in a test without a model call. That is how card layout should
   be worked on — see [local development](../dev/local-development.md).
2. **A tap calls `case-action`**, never a tool. The card is the proposal; the action is the
   commitment.
3. **It renders from data, not from model text.** A status card shows what the database says even
   if the sentence above it is wrong. That includes what an application is called: the review,
   status, pause and partner-invite cards take the name stored on the application row, the one
   the customer chose it by (`SuperSaver`), never the journey's generic name, so three savings
   accounts started together are three cards a customer can tell apart.

Card types are a discriminated union with an exhaustive `switch` and `assertNever`, so adding a
card type fails to compile until the renderer handles it.

## Structure

| Where | What belongs there |
|---|---|
| `src/components/ui/` | shadcn-generated. Do not hand-edit |
| `src/components/` | Shared app components: `Code`, `IconTile`, `NotFound`, `Primitives`, `ProductIcon`, `ProgressBar`, `StatusBadge`, `StatusDot`. `Primitives` holds the pieces the explainer and the conversation now share; `Code` is the one code-block renderer for both |
| `src/baz/` | The portable conversation UI. **May not import a tenant or a shell** |
| `src/baz/cards/` | Cards and the renderer |
| `src/surfaces/` | Whole screens |
| `src/admin/` | The console, lazily loaded |
| `src/partner/` | The second applicant's surface |

`src/baz/**` is held to the portability rule by ESLint: it is the part of this project that could
be lifted into another bank's product, so it takes its tenant configuration by injection.

## Forms

React Hook Form with `zodResolver` and the shadcn `Form` component, for every form.

Nothing currently uses them — the partner task surface that was specified to is not built yet, so
`react-hook-form`, `@hookform/resolvers` and `ui/form.tsx` are present and unreferenced. When
that surface arrives, it uses them rather than hand-rolled state.

## State

TanStack Query for anything from the server, with a key factory in `src/lib/queryKeys.ts`. No
fetching in `useEffect`. Realtime handlers invalidate keys; they do not write to the cache. The
one manual cache write is the optimistic chat message.

Zustand is for ephemeral UI state only — composer draft, open sheets, unsaved admin slider
drafts. Never cases, applications, facts or messages.

## Mobile first at 390px

Designed at that width and allowed to grow. Both Playwright specs run there.
