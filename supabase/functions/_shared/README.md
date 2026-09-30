# Shared Edge Function code

## `domain/` — pure TypeScript, imported twice

`domain/` is the only code in the repo that both Deno and the browser compile. It holds the
requirement engine, the state machine, reuse policy, advisories and metrics.

Two rules make the double import work, and both are enforced:

1. **Relative imports inside `domain/` carry an explicit `.ts` extension.** Deno requires it;
   Vite tolerates it. Without it, the Edge Functions will not resolve the module.
2. **The only third-party import is bare `zod`.** It is mapped in `../deno.json` and pinned to
   the same major version as the app's `zod`, so the two compilers agree on the schema types.

No Deno APIs and no browser APIs belong in `domain/` — ESLint's `no-restricted-globals` fails the
build if one appears. The app reaches this folder through the `@domain` alias; the Edge Functions
reach it through relative paths.

## The other folders

| Folder       | Holds                                                              |
|--------------|--------------------------------------------------------------------|
| `contracts/` | Zod request/response schemas. Types are inferred, never hand-written. |
| `llm/`       | Gate, prompt composer, persona, refusals, tool definitions.         |
| `tenants/boi/` | Product catalogue, domain config, brand strings. Injected, never imported by `domain/` or `src/baz/`. |
