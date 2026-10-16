---
title: Debugging
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/db/case-repository.ts
  - supabase/functions/_shared/db/admin-events.ts
  - src/lib/sentry.ts
---

# Debugging

## There is no Sentry on the server

Browser errors go to Sentry. **Edge Function failures do not go anywhere** except the function
logs and, where it matters, the `events` table. Know that before you start looking.

This shaped two conventions you will meet in the code.

**`mustWrite` throws rather than failing silently.** Supabase client calls return
`{ error }` rather than rejecting, so an unchecked write is a write that quietly does nothing.
Thirty-nine writes had no error check, and one of them broke the declined-products rule for a
week with no symptom at all. Any write that matters goes through `mustWrite(result, what)`.

**Anything worth explaining afterwards writes an event.** `tool_rejected`, `turn_tools`,
`request_blocked`, `card_promised_not_shown`, `question_while_card_awaits`, `customer_repeated` exist so that a failure leaves a record a person
can read later, in the console, without a log aggregator.

## Where to look, in order

| Symptom | Look at |
|---|---|
| Baz says nothing, or the stream dies | The `functions serve` output. A thrown error is a 500 with no stack trace anywhere else |
| Baz claims an action that did not happen | `events` for the case, then the `turn_tools` row. The model proposes; `case-action` commits. If there is no event, it did not happen |
| A card was described but never appeared | The `card_promised_not_shown` event. That is exactly what it is for |
| A tool call did nothing | `tool_rejected`. Every tool input is Zod-validated and an invalid one returns a tool error to the model rather than throwing to the user |
| A requirement will not clear | Nothing is remembered — recompute. `outstanding(journey, facts)` is pure, so call it in a test with the case's facts |
| A fact is on the wrong person | `facts.subject`. The primary's income never satisfies the partner's requirement, and this has been a real bug |
| An input was refused | `request_blocked`, with the gate category. The model never saw it |
| The deployed page is stale | `src/app/staleDeploy.ts` detects it and reloads. Two decisions log entries cover this |
| Push never arrives | `VITE_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY`. A mismatch makes the browser reject the subscription silently |

## Reading a case

The admin console's case inspector is the intended tool, not psql: context with provenance,
applications, outstanding requirements, the conversation and the event stream, in one place.

`/#/admin/case/:caseId`, and `/#/admin/forms/:formApplicationId` for what the bank's form
decided and who decided it.

## Events are the audit trail

Every significant thing writes an `events` row with an actor — `customer`, `partner`, `model`,
`admin` or `system`. Metrics are derived from events, not counted separately, so an event that
is not written is a metric that is silently wrong.

If you add behaviour that matters, write the event in the same change.

## Sentry rules

Initialised in `main.tsx`, browser only. **Never send message content or fact values.** Tags are
`case_id`, participant role and gate category — enough to find the case in the console, nothing
about what anyone said.
