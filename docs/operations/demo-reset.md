---
title: Demo reset
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/admin/index.ts
  - supabase/functions/_shared/domain/seed/canonical.ts
---

# Demo reset

You will use this constantly. It is worth knowing exactly what each control does.

## Reset the case

`/#/admin` → reset. Restores the canonical presenter case from `domain/seed/canonical.ts`:
Aoife Ní Bhriain, her spouse Emma, and the state the demonstration starts from.

**Reset also clears the sign-ins**, since 2026-10-13. Before that, a case restored underneath a
signed-in browser produced a state nobody could reproduce — the browser held an identity the case
no longer knew about.

So after a reset, the device you were presenting on is signed out. That is correct, and it is also
the state the demonstration wants to start from.

## Purge audience cases

Separate control. Clears cases created by visitors without touching the presenter case.

Isolation is by case ownership under RLS, so an audience case can never have reached the presenter
case in the first place. Purge is about the cap and about tidiness, not about containment.

## The audience cap

`AUDIENCE_MAX_CASES` limits customer cases created in a **rolling 24 hours**. A rate, not a
lifetime total.

Two things to check before a session with a room in it:

- How much of the window is already used. Yesterday evening's testing counts.
- Whether anything is probing. A case tagged `kind = 'test'` is excluded from the cap, and
  `scripts/live-probe.mjs` tags on create and deletes on exit — but a probe that was killed
  rather than exited leaves its case behind.

Twenty-five replays against the live model once used the day's allowance up and started refusing
real visitors. That is the failure mode to avoid: it looks like the product is broken.

## The kill switch

Makes the gate return a "demo paused" response to everything, for every case. Use it between
sessions if the room has the URL.

It is in front of the model, so a paused demo costs nothing.

## Regenerating the seed

The seed is generated, not hand-written:

```bash
npm run seed:generate     # rebuild canonical.ts
npm run seed:check        # assert it matches the domain
```

`seed:check` runs in CI and fails if the domain changed — a new fact key, a changed journey
requirement — without the seed being rebuilt. Rebuild rather than editing `canonical.ts`.

## Simulating the bank's side

The case inspector's event buttons are state-machine transitions, and the server only offers the
ones the machine will accept, so you cannot reach an impossible state live.

**Sending a notification is a separate, explicit action** from simulating the event. Simulate the
event, then send the notification, in that order — that is the sequence the demonstration shows,
and conflating them loses the point that the bank moved before the customer was told.

No random timers anywhere. Every change happens because somebody pressed a button.
