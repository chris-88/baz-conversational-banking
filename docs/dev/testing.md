---
title: Testing
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - vitest.config.ts
  - playwright.config.ts
  - e2e/
  - evals/guardrails/
---

# Testing

Three layers, and one deliberate hole you need to know about before you trust the suite.

## The fixture provider

`LLM_PROVIDER=fixture` replays a script instead of calling Anthropic. `runBazTurn` takes a
`ModelProvider` (`supabase/functions/_shared/llm/model.ts`): the Anthropic adapter passes
requests through, and the fixture (`fixture-provider.ts`) replays one scripted round per model
call. Scripts live in `supabase/functions/baz-turn/fixtures/`, named by `LLM_FIXTURE`, and are
transcribed from real conversations turn for turn; the turn to replay is chosen by how many
times Baz has already spoken on the case.

This was the hole in the suite until 2026-10-15. The output-ceiling, data-notice and
product-collapse bugs all reached a person before a test, because nothing could drive a
conversation without paying for it. The `runBazTurn` unit tests now run against the fixture,
and a Playwright spec that drives a whole conversation through it is the next thing to write.

The discipline still holds for the live model: it is for checking what the model itself does,
and nothing else.

## Vitest — 788 tests in 62 files

The layer that carries the weight. Everything deterministic is tested here, and domain logic is
written test-first.

```bash
npm run test
npm run test:watch
```

Required coverage, from the engineering standards:

- the requirement engine, reuse policies and subject matching
- the state machine, **every legal and illegal transition**
- advisories
- questions-avoided
- the persona composer (snapshot-tested, so a prompt change is visible in a diff)
- gate routing given fixed classifier outputs
- token issue and redeem
- the forms engine: definition parsing, logic, calculations, settling, NDI, submission

This works because `_shared/domain/` is pure TypeScript — no Deno, no browser APIs — so the same
module that runs inside an Edge Function runs directly under Vitest.

## Playwright — route, render and disclosure

```bash
npm run e2e
E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e   # against a deployment
```

Two specs, at iPhone viewport:

- `smoke.spec.ts` — every surface mounts, renders its own content, and carries the prototype
  disclosure.
- `film.spec.ts` — the structural half of the film sequence: each beat's screen exists, carries
  the control the presenter reaches for, and is reachable from the one before. Those are the
  things that broke in practice, and none of them need a model.

Neither drives a conversation. A turn costs a live call and takes fifteen seconds, so asserting
on what Baz says would be slow, expensive and flaky.

Playwright runs locally against `npx supabase start`. It is not in CI; move it there if it earns
its keep.

## Guardrail evals — 54 cases against the live gate

```bash
npm run eval:guardrails
npm run eval:guardrails -- --only=inj
```

`evals/guardrails/cases.jsonl` holds a must-block set (trivia, jokes, competitors, excessive
output, injection, persona escape) and a must-allow set (profane banking questions, short
contextual answers, sensitive but in-scope disclosures).

This calls the live classifier, because that is the only way to know whether domain enforcement
actually holds — the gate's whole premise is that it does not depend on asking the main model
nicely.

**100% on both sets before any presentation.** It costs money; it is not a pre-commit hook.

## What CI runs

On every pull request: typecheck, lint, Edge Function typecheck under Deno, `seed:check`, unit
tests, build, and a scan asserting no secret reached `dist/`.

`npm run check` is the same thing locally, minus the Deno step.

## Adding a test

Beside the code, named `<module>.test.ts`. Domain tests import through relative paths with `.ts`
extensions, the way the Edge Functions do. App tests use the `@/` alias and render through the
helper in `src/test/` with the real providers, rather than each test discovering a missing
provider for itself.

If you are tempted to write a test that needs a model reply, you have found the hole. Write the
deterministic part, and note what you could not cover.
