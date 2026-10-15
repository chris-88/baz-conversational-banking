---
title: Admin console
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/admin/
  - supabase/functions/admin/index.ts
  - supabase/functions/_shared/contracts/admin.ts
---

# Admin console

`/#/admin`, reachable only by typing the address. Real Supabase email auth plus a row in
`admin_users`, checked client-side for routing and **server-side on every call**.

Eight sections.

## Cases

The list, and a workspace. Open one and you get the case behind the conversation.

## Case inspector

`/#/admin/case/:caseId`. Split in two, because a page that opens with everything on it is a page
nobody reads:

- **Always on screen** — what a person handling a phone call needs: applications, the plan, the
  notification, the conversation, the event stream, and context with provenance.
- **A click away** — what the engines concluded. The most interesting part of the build and the
  least useful part of a phone call.

### The handoff note

The note a person reads before picking up the phone. **Built from the case, never written by the
model** — a brief somebody is about to act on is the last place for invented prose, and everything
worth telling them is already recorded: what the customer said they wanted, what they agreed to,
what they turned down, where each application has got to, and what is outstanding.

### Event simulation

Every button is a state-machine transition, and **the server only offers the ones the machine will
actually accept**, so nobody can reach an impossible state live.

The simulated events include: received by bank, assessment approved and declined, information
requested and supplied, mortgage to assessment, mortgage requests a document, documents verified,
credit card / joint account / protection approved, pause, resume, complete, abandon, plan move,
trigger check-in, reach savings target, set savings balance.

No random timers. A presenter presses a button.

### Notification

Sending a notification is a **separate, explicit action** from simulating the event. The console
can send the fixed copy or write its own.

The copy contains nothing about the application, and the link carries an opaque single-use token.

## Guardrails

The permitted domain as configured, a live classifier test box, blocked requests with their
categories, and the kill switch. See [guardrails](guardrails.md).

## Persona

Six sliders, presets, and a preview that does not spend a conversation turn. See
[persona studio](persona-studio.md).

## Engine

What the needs and goals engines currently read from a case: which needs are established and on
what evidence, which goals are in play, which are held for later, where two lay claim to the same
money.

## Analytics

**Seven panels, not the nine originally specified.** Channel mix and new-versus-returning are
absent because there is no channel field and no identity across sessions — and the requirement is
explicit that a dashboard should not be populated with numbers that have nothing behind them.
*Two empty panels would say less about the product than their absence does.*

Everything is derived from `events`. Each headline names the event type behind it, so the
sparkline and the number cannot disagree.

## Forms

`/#/admin/forms` and `/#/admin/forms/:formApplicationId`. What the bank's own form decided, and
who decided it: which fields are live, what the form calculated, which values came from facts
versus answers versus defaults versus prefill, the submission packet, and each calculating
control's declared fidelity.

The snapshot's provenance is shown here — source URL, retrieval time, the form's own version
string, a hash of the bytes — which is what lets somebody satisfy themselves the definition is
the bank's.

## Profile

The admin's own account.

## Presenter controls

| Action | Effect |
|---|---|
| `reset_case` | Restores the canonical presenter case. Also clears the sign-ins, since 2026-10-13 |
| `purge_cases` | Clears audience cases without touching the presenter case |
| `set_kill_switch` | The gate returns "demo paused" for everything |
| `tag_test_case` | Marks a case `kind = 'test'`, taking it out of the audience cap |
| `delete_case` | Removes one case |
| `rebuild_form_applications` | Re-derives form applications after a snapshot or mapping change |

## The all-conversations switcher

Gated on `PRESENTER_KEY`, which unlocks it on whichever device holds it. Unset means nobody can
open it.
