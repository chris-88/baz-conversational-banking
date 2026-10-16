---
title: Tool system
status: current
scope: poc
last_verified: 2026-10-16
sources:
  - supabase/functions/_shared/llm/tools.ts
  - supabase/functions/_shared/contracts/cards.ts
  - supabase/functions/case-action/index.ts
  - supabase/functions/baz-turn/index.ts
---

# Tool system

Fifteen tools. Every input is Zod-validated before it has any effect, and an invalid input
returns a tool error to the model — plus a `tool_rejected` event — rather than throwing to the
user.

None of them change state. That is the whole design; see [the AI boundary](ai-boundary.md).

## The tools

### Recording

| Tool | What the server enforces |
|---|---|
| `record_facts` | The key exists in the catalogue, is marked `extractable`, and the value matches the catalogue schema. Writes `customer_stated` or `partner_stated` |
| `record_form_answers` | The field is live on the current branch, is a question, and a choice value is one the form actually offers. **Refuses declarations and uploads outright**, whatever it is sent |

### Offering products

| Tool | Notes |
|---|---|
| `show_product_options` | Product ids plus one line each on why, tied to what the customer said. Selection happens in the card |
| `show_comparison` | Two to four catalogue products side by side. Everything beside each option is read from the catalogue. Nothing is started by tapping one |
| `show_quote` | What something costs, pays or takes. Pass only what the customer said; any two of amount, months and monthly is enough and the third is worked out. The model never does the arithmetic and never restates the figures |
| `show_mortgage_rates` | The bank's published rate table, indexed by customer type, BER, amount and term. All four are required, so the model must ask rather than quote a range. **The server decides which rates they may see and works out the repayments**; the model explains what separates them |

### Progressing an application

| Tool | Notes |
|---|---|
| `show_review` | Takes an application id. The server builds the review content from the database, not from model text. The card is headed with the name stored on the application row (`SuperSaver`), not the journey's generic name, and values are printed as the reuse card prints them: money as money, a PPS number masked |
| `show_pause_prompt` | Takes an application id. The customer confirms in the card |
| `show_status` | Renders from the case, independently of whatever the model writes alongside it. Each row carries the application's own name |
| `request_upload` | Must point at an existing open `application_request` |
| `show_partner_invite` | The invitation is sent only when the customer taps. Refused unless at least one of the named applications has an outstanding requirement for the second applicant: a savings journey asks a partner for nothing, so there is nobody to invite for it |
| `propose_plan` | Offers to keep a goal that outlives any one application. Nothing is kept until they tap |

### The bank's own forms

| Tool | Notes |
|---|---|
| `show_form` | The next form the application needs. The model names the application only; which form is due is decided for it |
| `show_form_declarations` | The form's declarations in its own published wording. The model supplies no text |
| `show_form_upload` | The next document the form wants, with the control's own size and type limits |

## What is deliberately absent

No tool creates, submits, pauses or resumes an application, grants consent, invites a partner,
makes a declaration, or sets an eligibility outcome. Those are `case-action` operations, reached
by a customer tapping a card.

A declaration can only be made by tapping. `record_form_answers` refuses a checkbox or an upload
whatever it is sent — not because the model would usually misuse it, but because "usually" is not
a guarantee and a declaration is a legal act.

## Tool availability is computed

The model is not offered all fifteen every turn. The conversation's **stage** decides which tools
it gets, and the form tools are gated further on a form existing for the application.

Telling a model "no products yet" works most of the time. Withholding `show_product_options`
works every time.

## One card, no trailing question

Several tool descriptions end with the same instruction: one line of your own before the card and
nothing after, and do not ask the customer anything in the turn you show it.

That is not politeness. A card that waits for a tap is the question of that turn, and a question
underneath it leaves the customer choosing which thing to answer — in practice, answering the text
and scrolling past the card. `turn-shape.ts` computes what else a turn is allowed to be doing.

## Stream events

Everything the model produces reaches the browser as a Zod discriminated union:

```ts
text_delta | retract | card | status | done | error
```

A `retract` takes back what a round said before a tool it then called was refused, so a sentence
introducing a card that never came does not stand on screen. A handler marks a refusal by
returning `refused: true` with its reason: a show or propose call that showed nothing. "Already on
screen, point at it" is not one, and neither is a `record_facts` or `record_form_answers` call
that took some of what it was sent. [The conversation runtime](conversation-runtime.md) has the
mechanics.

Card payloads are validated against `_shared/contracts/cards.ts` on the way out, which also means
any card can be rendered from a fixture object in a test without a model call.

## Adding a tool

1. Define the input schema in `tools.ts` and add the tool with a description written for the
   model — what it is for, when to reach for it, and what it must not do alongside it.
2. Add the card contract to `_shared/contracts/cards.ts`.
3. Build the card in `src/baz/cards/` and register it with the card renderer.
4. If tapping it must change something, add a `case-action` action with its own validation.
   **Do not shortcut this by letting the tool write.**
5. Wherever the handler can show nothing, return `refused: true` with the reason. The words the
   model wrote beside the call are withdrawn and it writes again from the result.
6. Decide which stages may offer it.
7. Write the tests: input validation, server-side refusal of the thing it must not do, and the
   card rendering from a fixture.
