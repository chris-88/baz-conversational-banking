---
title: Troubleshooting
status: current
scope: poc
last_verified: 2026-10-15
---

# Troubleshooting

The failures people actually hit, most common first. [Debugging](../dev/debugging.md) is the
developer-facing version of this.

## Baz does not reply at all

In order:

1. **Are the functions running?** `npx supabase functions serve --env-file supabase/.env.local`.
   The app runs fine without them; nothing that writes does.
2. **Is `ANTHROPIC_API_KEY` set in `supabase/.env.local`?** A missing required variable throws on
   startup, and the only place you will see it is the `functions serve` output. There is no
   Sentry on the server.
3. **Read the `functions serve` output.** A thrown error is a 500 with no stack trace anywhere
   else.
4. **Has the allowance run out?** A spend limit and a malformed request both arrive from Anthropic
   as a 400 `invalid_request_error`, so they are told apart on the message text. The error event
   should say which.

## The reply arrives but nothing is recorded

Check the `events` rows for the case. Then:

- `tool_rejected` — a tool input failed validation. For `record_facts`, the usual causes are a key
  not in the catalogue, a key marked `extractable: false`, or a value that does not match the
  catalogue schema.
- `turn_tools` — what the model actually called. If the tool you expected is not there, check
  which stage the conversation is in: **the stage decides which tools the turn is offered**, and a
  tool that is not offered cannot be called.

## Baz claims something that did not happen

Look at the events, not the transcript. The model proposes; `case-action` commits. If there is no
event, it did not happen, and the status card beside the text will be showing the truth.

`card_promised_not_shown` exists for the case where Baz described a card that never rendered.

## A requirement will not clear

Nothing is remembered — it is recomputed. Two usual causes:

- **The fact is on the wrong subject.** The primary's income does not satisfy the partner's
  requirement. Check `facts.subject`.
- **The reuse policy says `confirm` or `fresh`.** The fact exists and is deliberately being
  re-asked. Check the catalogue default and the journey's override, and remember a requirement may
  tighten a policy but never loosen it.

`outstanding(journey, facts)` is pure, so the fastest way to settle it is to call it in a test
with the case's facts.

## Push notifications never arrive

- **`VITE_VAPID_PUBLIC_KEY` must exactly equal `VAPID_PUBLIC_KEY`.** A mismatch makes the browser
  reject the subscription, silently.
- The site must be installed or at least served over HTTPS. `127.0.0.1` is treated as secure;
  a LAN IP is not.
- On iOS, push requires the PWA to be **installed to the home screen**. A Safari tab will not
  receive it.
- Check `push_subscriptions` has a row for the device you are expecting.
- Rotating the VAPID pair invalidates every existing subscription.

## The deployed page is stale, or behaves like an old version

`staleDeploy.ts` detects this and reloads. If it has not:

- Hard-reload. On an installed PWA, close it fully and reopen.
- Confirm `deploy-pages.yml` actually succeeded for the commit you expect.
- The Supabase domain is `NetworkOnly`, so an API response is never the stale thing. It is the
  shell.

Do not rely on the automatic reload during a presentation. Hard-reload the device after a deploy.

## A visitor is refused with a cap message

`AUDIENCE_MAX_CASES` counts customer cases created in a rolling 24 hours. Testing counts.

Check for probe cases that did not clean up — `scripts/live-probe.mjs` tags `kind = 'test'` on
create and deletes on exit, but a killed probe leaves its case behind. Tagged cases are excluded
from the cap.

## The all-conversations switcher will not open

`PRESENTER_KEY` must be set on the project **and** held by the device. Unset means nobody can open
it, which is the intended default.

## The guardrail evals fail

- If **must-block** cases pass through, that is a real regression. Do not present.
- If **must-allow** cases are refused, that is equally a failure — a gate that refuses a customer
  swearing about their overdraft has failed.
- A classifier timeout fails closed with a retry message. That is correct behaviour, and it will
  show as a failure in the eval run; check whether the model is simply slow before treating it as
  a bug.

## `seed:check` fails in CI

The domain changed without the seed being rebuilt. `npm run seed:generate`, then commit.

## Lint fails on a new file under `supabase/functions/_shared/`

A top-level file there is not covered by any tsconfig, so the ESLint project service cannot lint
it. If it is Deno-only — it touches `Deno.*` — add it to `DENO_ENTRYPOINTS` in
`eslint.config.js` with a comment saying why, as `_shared/env.ts` and `_shared/http/**` do. If it
is pure TypeScript, it belongs in one of the included subdirectories instead.
