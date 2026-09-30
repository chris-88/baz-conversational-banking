# Decisions

Where the spec is silent, the fastest credible option wins (§68). One line each: date, decision,
section.

## 2026-09-30 — M0 skeleton

- **2026-09-30** — ESLint, not oxlint, despite `create-vite` now scaffolding oxlint. CLAUDE.md
  names ESLint `no-restricted-imports` as the enforcement for Baz portability, and the rule is
  configured per-directory. §32
- **2026-09-30** — `src/components/ui/**` is excluded from ESLint and kept byte-identical to what
  the shadcn CLI emits, so future `shadcn add` runs stay clean. §61
- **2026-09-30** — shadcn now emits `import { cn } from "cn"`, a bare specifier. Resolved with a
  `cn` alias in `vite.config.ts`, `vitest.config.ts` and the tsconfig `paths`, rather than
  rewriting the import in 25 generated files, which every later `shadcn add` would undo. §61
- **2026-09-30** — Two generated components (`slider`, `dropdown-menu`) passed explicit
  `undefined` into Radix props and failed `exactOptionalPropertyTypes`. Patched to conditional
  spreads. A future `--overwrite` reintroduces the error, and `npm run typecheck` catches it.
- **2026-09-30** — Sentry 11 removed `sendDefaultPii` in favour of `dataCollection`, whose
  defaults collect HTTP bodies, stack-frame locals and gen-AI inputs/outputs. Every category is
  denied explicitly in `src/lib/sentry.ts`; anything added there defaults to off. CLAUDE.md > Sentry
- **2026-09-30** — Browser env fails soft: `src/lib/env.ts` returns `null` and the surfaces show a
  setup notice rather than a blank page, so M0 deploys before the Supabase project exists.
- **2026-09-30** — `enable_anonymous_sign_ins = true`, and the anonymous rate limit raised from 30
  to 500 per hour per IP. An audience scanning the QR shares one NAT'd IP, so the default would
  lock the room out mid-demonstration. **The hosted project needs the same change.** §28, §45
- **2026-09-30** — `next-themes` removed from the generated `sonner` component. The POC is a
  single light-themed BOI surface, so the dependency and its provider earn nothing.
- **2026-09-30** — The guardrail eval runner uses Node's native TypeScript stripping
  (`node evals/guardrails/run.ts`) rather than adding `tsx`. §22
- **2026-09-30** — Deno entrypoints under `supabase/functions/<name>/` are linted by `deno lint`,
  not ESLint: `npm:`/`jsr:` specifiers and Deno globals defeat the TypeScript project service.
  `_shared/domain` and `_shared/contracts` are pure TypeScript and are linted by ESLint.
- **2026-09-30** — Relative imports inside `_shared/domain` carry an explicit `.ts` extension so
  the same files compile under Deno and Vite. `allowImportingTsExtensions` is on for this reason.
- **2026-09-30** — BOI brand tokens in `src/shells/boi/theme.css` are a placeholder navy/amber
  approximation, not the official palette, and the wordmark is synthetic. Replace before
  filming. §61, Invariant 10

## Open, needs a decision

- **Bundle size**: the initial chunk is ~668 kB (210 kB gzipped). Route-splitting the presenter,
  partner and audience surfaces is the obvious fix, deferred to M9 unless §60 bites sooner.
- **Base path**: `VITE_BASE_PATH` is `/` locally. It must become `/<repo>/` for
  `github.io` hosting, or stay `/` behind a custom domain.

## 2026-09-30 — M1 domain core

- **2026-09-30** — `Requirement` carries an explicit `kind` discriminant rather than inferring
  "fact" from the presence of a `fact` property, as CLAUDE.md's illustrative snippet does. The
  representation is an implementation decision (§8), and an explicit discriminant is what lets
  every consumer switch exhaustively as the engineering standards require. §8
- **2026-09-30** — A journey requirement's `reuse` may only *tighten* the catalogue's policy.
  The stricter of the two wins, so nothing can loosen `never` on health data however a journey
  asks for it. §11, Invariant 6
- **2026-09-30** — A branch condition receives a confirmation reader as well as a fact reader.
  This is what keeps protection's health questions behind an explicit consent confirmation
  rather than behind a fact, and the partner behind their own consent. §7.5, Invariant 6
- **2026-09-30** — A fact with `capturedFor = null` (general conversation, or bank-held) counts
  as *reused* rather than asked. So `auto` reuses it silently, `confirm` offers it for
  confirmation, and `fresh` still re-asks — which is what stops a legal declaration being
  satisfied by something said in passing. §11, §53
- **2026-09-30** — Added an `application_confirmations` table, which is not in CLAUDE.md's table
  list. The requirement engine needs per-application confirmations, and they are distinct from
  `consents`: a reuse confirmation is not a consent. The schema is left to the team (§9).
- **2026-09-30** — Database literals are `CHECK` constraints, not Postgres enums, so the spec
  can still move during the build. The cost is drift, so `state-literals.test.ts` parses the
  migration and fails if the literals disagree with the TypeScript unions.
- **2026-09-30** — One application per product per case (`unique (case_id, product)`). §12
  independence is per product; the demo never needs two of the same product.
- **2026-09-30** — `supabase/seed.sql` is generated from `seed/canonical.ts` by
  `npm run seed:generate`, and CI fails if it is stale. The canonical case is defined once, in
  the place where it is tested against the fact catalogue. §43
- **2026-09-30** — Reset state is the *start* of the story: existing customer, authenticated,
  bank-held facts loaded, but no applications, product interests or conversation. Baz discovers
  all of that live. §43, §46

## Open, needs a decision

- **The migration is unverified.** `supabase/migrations/20260930210000_init.sql` has never been
  applied: the Docker daemon is not running on this machine and the user is not in the `docker`
  group, and there is no local Postgres to check the SQL against. It needs
  `npx supabase start && npx supabase db reset` before it can be trusted.
