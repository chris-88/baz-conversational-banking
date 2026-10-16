---
title: Runbooks
status: current
scope: poc
last_verified: 2026-10-15
---

# Runbooks

Short procedures for things that are done rarely enough to be forgotten.

## Rotate a credential

Do this whenever a credential **may** have been exposed. Do not first reason about whether
exposure was likely.

1. Issue the new value at the provider.
2. Set it as an Edge Function secret on the Supabase project.
3. Redeploy the functions so they pick it up.
4. Revoke the old value.
5. If it is the Supabase access token, update **both** places it lives: the GitHub secret and the
   local copy.
6. If it is the VAPID pair, update `VAPID_PUBLIC_KEY` on the server and
   `VITE_VAPID_PUBLIC_KEY` in the app together. **Every existing push subscription breaks** —
   re-subscribe the demonstration device and confirm delivery before relying on it.

## Add a new form definition

```bash
node scripts/fetch-form-definition.ts <formId>
```

1. The snapshot lands in `tenants/boi/forms/` with its provenance: source URL, retrieval
   timestamp, the form's version string, a hash of the bytes.
2. Add the product → form row in `mapping.ts`, with its prefill table.
3. Run the forms tests. If the definition uses an operator the parser does not know, **it will
   fail to parse entirely** rather than partially — that is how form 1940 was caught.
4. `rebuild_form_applications` from the console, to re-derive existing cases.

Nothing in `_shared/domain/forms` should need changing. If it does, that is worth a decisions log
entry.

## Refresh captured product data

```bash
node scripts/generate-mortgage-rates.ts     # from docs/baz-boi-mortgage-rates.zip
node scripts/generate-product-kb.ts         # from docs/baz-boi-retail-product-kb.zip
```

Both write generated TypeScript marked `do not edit by hand`. Replace the zip, regenerate, commit
both. Note the provenance in `docs/mortgage-rates-source.md`.

## Change the model

`BAZ_MODEL` and `GATE_MODEL` are Edge Function secrets, so this is a configuration change.

Before changing `BAZ_MODEL`, run the harness:

```bash
npm run compare:models
```

It runs the same turns through both and reports what each did. The thing to look at is **tool
calling**, not fluency: a model that holds a pleasant conversation and calls no tools orchestrates
nothing. Haiku was measured and rejected for this reason — 1/6 on tool calls against Sonnet's
6/6.

Then update `docs/04-cost-of-running-a-conversational-assistant.md` **and its changelog** with
measured figures.

## Warm the cache before a presentation

The cached prefix is shared across cases and lives an hour (docs/04, Finding 2), and there is
one prefix per conversation stage because the stage decides the tool list (Finding 9). A cold
prefix costs about €0.10 and a visible pause on the first round that meets it. Within the hour
before the run, take one throwaway conversation through the stages on a test-tagged case:
opening, a direction, a few facts, keep a plan, show the arrangement, choose, start an
application. Every stage the presenter will reach is then a hit, for the presenter and for the
audience's phones alike. Delete the case afterwards (`delete_case`, or let the probe script do
it).

## Change anything that moves the cost of a turn

Prompt size, cache breakpoints or lifetimes, model choice, tool rounds, reply length, a new tool.

1. Make the change.
2. **Measure.** The paper explains how its numbers were produced; use the same method.
3. Update the paper and add a changelog row with the date, the change and the effect.
4. Update `src/content/how-it-works/economics.ts` if a published figure moved.

Never revise those numbers from memory. If you cannot measure yet, say "not yet measured" in the
changelog row — there is precedent for that, and it is better than an estimate that reads as a
measurement.

## Add an admin action

1. Add the request and response schema to `_shared/contracts/admin.ts`.
2. Handle it in `supabase/functions/admin/index.ts`, **checking the admin role server-side** —
   the client-side check is for routing only.
3. If it changes case state, go through `transition()`. Do not write a state directly.
4. Write an `events` row with actor `admin`.
5. Add the control to the relevant console screen.
6. `npm run typecheck:functions`.

## Investigate a case somebody reports

1. Get the case id. The console's case list is searchable.
2. `/#/admin/case/:caseId` — context with provenance, applications, outstanding requirements, the
   conversation, the event stream.
3. Read the events first. They are ordered, actored, and they are the record; the transcript is
   what was said about it.
4. For a form question, `/#/admin/forms/:formApplicationId` shows what the form decided and which
   fidelity produced each number.

## Hand a case to a person

The case inspector's handoff note is built for this: what the customer said they wanted, what they
agreed to, what they turned down, where each application has got to, and what is outstanding.

Built from the case, **never written by the model** — a brief somebody is about to act on is the
last place for invented prose.
