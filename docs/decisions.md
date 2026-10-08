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

- ~~The migration is unverified.~~ Resolved 2026-10-01: pushed to the hosted project and
  verified through PostgREST. See below.

## 2026-10-01 — Live at baz.chrisquinn.ie

- **2026-10-01** — The repo is public, because GitHub Pages needs that on a free plan. The two
  internal source documents are untracked and gitignored; `docs/README.md` records where they
  live. Nothing in the build reads them. §61
- **2026-10-01** — The site carries Bank of Ireland branding on a personal domain, so it states
  what it is: a persistent disclosure banner above the simulated chrome on every surface,
  `noindex, nofollow, noarchive, nosnippet`, and a `robots.txt` disallowing everything. A unit
  test and an e2e test both assert the disclosure, so it cannot quietly disappear. Invariant 10
- **2026-10-01** — For Actions-based Pages the `CNAME` file in the artifact does NOT configure
  the custom domain; it is only served as a file. The domain must be set through
  `PUT /repos/.../pages`, and that call fails with "the certificate does not exist yet" until
  DNS resolves. Order is: DNS record, then set the domain, then enforce HTTPS.
- **2026-10-01** — `VITE_BASE_PATH` is `/`. The `github.io/<repo>/` URL therefore serves a page
  whose assets 404; that is expected and harmless, since the custom domain is the real address.
- **2026-10-01** — `deploy-supabase.yml` gates on a first step rather than a job-level `if`: the
  `secrets` context is not available there. It skips with a notice until the hosted project
  exists, so it stops failing every push and masking real failures.
- **2026-10-01** — Playwright runs Chromium with iPhone 14 emulation rather than WebKit. WebKit
  needs system libraries that cannot be installed without root on this machine. Revisit if
  iOS-specific behaviour matters (§30 PWA storage partitioning).
- **2026-10-01** — Testing Library's automatic cleanup only registers under Vitest `globals:
  true`. This project imports test helpers explicitly, so `afterEach(cleanup)` is registered by
  hand in `src/test/setup.ts`; without it, rendered DOM accumulated between tests in a file.
- **2026-10-01** — Email for the project goes to `*@chrisquinn.ie`, which ImprovMX forwards to
  Chris's personal address. Use a descriptive local part per purpose, e.g. `baz-admin@` for the
  Supabase admin login.

## 2026-10-01 — Backend connected

- **2026-10-01** — **A secret must never carry a `VITE_` prefix.** Vite compiles every
  `VITE_*` value into the public bundle, and `env.ts` previously handed the whole
  `import.meta.env` object to Zod, which makes Vite inline *all* of them. It now reads each
  variable explicitly, `src/vite-env.d.ts` declares exactly the four that exist, and
  `scripts/check-bundle-secrets.ts` fails CI if a credential shape or any non-`VITE_` value
  from `.env` appears in `dist/`. The guard is tested by planting a leak and confirming it
  fails. CLAUDE.md > Secrets
- **2026-10-01** — **The migration is verified.** Both migrations are applied to the hosted
  project. RLS behaves as designed: `persona_config` and `domain_config` read (they have
  `using (true)`), `cases` and `facts` return empty under RLS, and the four internal tables
  return 401.
- **2026-10-01** — Added `20261001140000_revoke_internal_tables.sql`. RLS already denied every
  row on `customers`, `participant_sessions`, `tokens` and `admin_users`, but the `SELECT`
  grant remained, so PostgREST still treated them as readable relations returning `[]`.
  Revoking the grant denies them at two levels. §58, Invariant 8
- **2026-10-01** — The canonical seed is applied to the hosted database through the Management
  API query endpoint, because `supabase db push` does not run `seed.sql` against a remote
  project. The in-app reset (§43) supersedes this in M7.
- **2026-10-01** — Anonymous sign-ins enabled, and `rate_limit_anonymous_users` raised from the
  default 30 to 500 through the Management API, matching the local `config.toml`. An audience
  sharing one NAT'd IP would otherwise lock itself out mid-demonstration. §28, §45
- **2026-10-01** — `BAZ_MODEL=claude-sonnet-5-5` confirmed against the live model list, where it
  is the current Sonnet. `GATE_MODEL=claude-haiku-4-5-20251001` likewise.
- **2026-10-01** — The gate classifier uses structured outputs (`output_config.format` with
  `zodOutputFormat`), not an assistant prefill. Prefill returns a 400 on the current model
  generation, and constraining the shape at the API level is stronger anyway. §25
- **2026-10-01** — The classifier's system prompt is built from the tenant's `DomainConfig`, so
  the permitted domain stays configurable rather than hard-coded, and Baz stays portable.
  §20, §32
- **2026-10-01** — `npm run eval:guardrails` is NOT in CI: it makes live API calls and costs
  money per run. It is a release gate run by hand before any presentation, as CLAUDE.md
  requires. First full run scored 100% on both sets.
- **2026-10-01** — `@anthropic-ai/sdk` is a devDependency: the browser never imports it (the
  LLM is called only from Edge Functions), and Node needs it only to run the guardrail eval.
  Deno resolves it through `supabase/functions/deno.json`.

## 2026-10-01 — Design system

- **2026-10-01** — **Visual direction: a deliberately neutral prototype, not a replica of any
  bank.** The product still refers to Bank of Ireland in copy, because the POC is meaningless
  without it, but the chrome is plainly a prototype: a neutral mark, one restrained accent, no
  brand assets. This also retires the impersonation concern raised when the site went public.
  §61, Invariant 10
- **2026-10-01** — **Tokens live on `:root`, never on a wrapper element.** `.boi-theme` was
  applied to a `<div>` inside `#root` on five surfaces. Radix portals every dialog, sheet,
  dropdown, tooltip and toast to `document.body`, outside that div — so none of them would have
  received the theme. That was a defect, not untidiness. `src/shells/boi/theme.css` is deleted.
- **2026-10-01** — Added `--warning` / `--warning-foreground` / `--warning-border` tokens. The
  prototype notice previously hardcoded `bg-amber-100 text-amber-950`, breaking CLAUDE.md's own
  rule that the look comes from theme tokens rather than per-component overrides.
- **2026-10-01** — Added a `--text-2xs` step to the theme, replacing the `text-[10px]` and
  `text-[11px]` arbitrary values that had crept into four components.
- **2026-10-01** — Dark tokens are defined correctly, but nothing applies `.dark`: the demo
  stays light deliberately, so what is filmed does not depend on the presenter's OS appearance
  setting.
- **2026-10-01** — **Inter Variable, self-hosted, base Latin only (48KB).** Self-hosted rather
  than Google Fonts because the demo must survive conference wifi and the service worker
  precaches woff2 — no external request, no flash of unstyled text mid-presentation. Latin
  Extended, Cyrillic, Greek and Vietnamese subsets were dropped: they added ~175KB for glyphs
  this prototype never renders, and Irish fadas, the euro sign, em-dashes and curly quotes all
  sit in the base Latin range. §60
- **2026-10-01** — The admin tab bar is now shadcn `Tabs` with the `line` variant, triggers
  rendered `asChild` as router links and selection driven by the URL rather than Radix state.
  It was a hand-rolled `<nav>`.

## 2026-10-01 — Design, second pass (against the mock-up)

- **2026-10-01** — Direction reversed from the neutral pass: the supplied mock-up is a Bank of
  Ireland retail look, and that is now the brief. Vivid blue actions on white, a deep navy for
  feature panels, tinted icon tiles. The prototype banner and `noindex` stay, and the wordmark
  is a synthetic three-stroke mark — **not** a reproduction of BOI's actual logo, which is a
  registered trademark. §61, Invariant 10
- **2026-10-01** — Added `--brand-deep` and four `--state-*` tokens. Application state colour is
  keyed by the state machine's own union in `StatusDot`, so a new state cannot be added without
  deciding how it reads, and colour is never the only signal — every use pairs it with the
  state's label. §13, §14
- **2026-10-01** — Baz sits raised in the centre of the app's tab bar. That placement is the
  proposition in one piece of UI: the conversation is the primary route through the app, not a
  help widget in a corner.
- **2026-10-01** — Chat components live in `src/baz/` and import no tenant and no shell, so the
  conversation surface stays portable. The BOI shell supplies the chrome. §32, Invariant 11
- **2026-10-01** — The hero gradient is absolutely positioned, so it painted *above* the product
  cards that follow it in the DOM — positioned elements paint after static content in the same
  stacking context regardless of order. The cards need `relative z-10`.
- **2026-10-01** — Added explicit emoji fonts to `--font-sans`. Inter carries no emoji glyphs,
  and with only the Latin subset loaded the 👋 in Baz's greeting rendered as tofu.
- **2026-10-01** — `ListRow` renders a link when it navigates, a button when it acts, and a
  plain row when it does neither, so a row is never announced as interactive when it is not and
  a row that goes somewhere can be opened in a new tab.
- **2026-10-01** — The branch badge moved from a fixed bottom overlay into normal flow at the
  top: pinned to the bottom it covered the app tab bar's labels.

## 2026-10-01 — baz-turn

- **2026-10-01** — **The shared-domain double-compile is proven.** `_shared/domain` now compiles
  under Deno (via `supabase functions deploy`) and under Vite, from the same files. The two
  things that make it work are the explicit `.ts` extensions on relative imports and the
  `zod` entry in `supabase/functions/deno.json`.
- **2026-10-01** — Edge Functions need `[functions.<name>]` in `config.toml` with an explicit
  `import_map`. Without it the bundler ignores `supabase/functions/deno.json` and fails on the
  first bare npm specifier.
- **2026-10-01** — `_shared/db/**` takes a `SupabaseClient` as a parameter and touches no Deno
  global, so it typechecks and tests under Node as well as Deno. Only the function entrypoint
  reads `Deno.env`.
- **2026-10-01** — Database rows are parsed with Zod rather than trusted. The database is a
  boundary like any other, and this catches a migration that has drifted from the domain at
  the point of reading instead of somewhere inside the requirement engine.
- **2026-10-01** — **Cards are buffered until the turn's text is finished.** The model calls its
  tool in the first round and explains itself in the second, so emitting cards as they happened
  put the options on screen before the sentence introducing them. Baz explains, then offers.
- **2026-10-01** — M2 exposes only `record_facts`, `show_product_options` and `show_status`.
  The tools whose cards need M3 are left out of the tool list entirely rather than offered and
  failed: the model cannot misuse what it cannot see.
- **2026-10-01** — `BAZ_MAX_TOKENS` is 1024 and the tool loop is bounded at 3 rounds. The first
  is §47 — "count to 10,000" cannot succeed even if it reached the model. The second is because
  no tool takes an action, so there is no legitimate reason to loop.

## 2026-10-01 — Model choice, measured

- **2026-10-01** — **`BAZ_MODEL` stays `claude-sonnet-5-5`; Haiku 4.5 was measured and rejected.**
  `npm run compare:models` runs the same turns through both. Across two runs of three turns,
  Sonnet called the right tools 6/6 times with identical behaviour on both runs. Haiku called a
  tool 1/6 times — `record_facts` on one run and nothing on the next, same input — and never
  called `show_product_options` at all. Without tool calls there is no orchestration, which is
  §63 priority 4 and the whole of §67. Haiku is roughly 3× faster and half the price, and
  neither pays for losing the orchestration. Re-run the harness whenever this is worth
  revisiting.
- **2026-10-01** — `GATE_MODEL` is already the cheapest model available and scores 100% on both
  guardrail sets. Classification is what Haiku is good at; this is the right place for it.
- **2026-10-01** — Added `TOOL_GUIDANCE` to the prompt. The policy said what Baz may not do but
  nothing said what it must actively do, so a model would hold a pleasant conversation and
  record nothing — which looks fine on screen and orchestrates nothing underneath.
- **2026-10-01** — Added a generated fact reference to the prompt. `record_facts` types `value`
  as unknown, so the model was guessing: it sent `"spouse"` for a key whose enum is
  alone/partner/other, and the write was silently refused — a fact lost for a reason the
  customer never caused. Generated from the catalogue so it cannot drift, and it omits
  non-extractable keys so health data is not even named (Invariant 6).
- **2026-10-01** — **The catalogue decides whether a fact is household-level or personal, not
  the model.** Asking the model to classify it lost facts: it sent household keys under
  `primary` and the write was refused. `subject` is now optional and only means "this belongs
  to the second applicant".
- **2026-10-01** — Prompt caching verified: the stable prefix is ~3,900 tokens, written once
  and read from cache thereafter, at roughly a tenth of the input cost. This is the real cost
  lever, not the model tier.

## 2026-10-01 — Baz is live

- **2026-10-01** — The `session` function attaches an anonymous visitor to a participant. If the
  caller is already attached it returns the same case, which is what makes a browser tab and an
  installed PWA land on the same conversation rather than starting two (§12, §28).
- **2026-10-01** — `/#/app/baz` joins the canonical presenter case, so the conversation starts
  with the bank-held facts in place. `mode: 'fresh'` creates an empty case and is what the
  audience entry will use in M8 (§46).
- **2026-10-01** — The SSE client uses `fetch`, not `EventSource`: the turn is a POST carrying
  an Authorization header and EventSource supports neither. Frames are buffered until the
  blank-line boundary, so a partial frame is never parsed.
- **2026-10-01** — The card registry is an exhaustive `switch`, so adding a card type to the
  contract without building its component fails the typecheck rather than silently rendering
  nothing at the customer.
- **2026-10-01** — The public hero carries the first message across to the app as a query
  parameter rather than making the customer retype it (§6 Stage 1). It is not sensitive — it is
  what they just typed in public — so it does not need a token.
- **2026-10-01** — `/#/baz` is the conversation on the public website; `/#/app/baz` is the same
  `BazChat` inside the app shell. Only the chrome differs, which is the point of §32.
- **2026-10-01** — The conversation is loaded from persisted messages on join. Without it the
  model and the customer saw different conversations: the model reads history and would refer
  to a card it showed last time, while the screen started empty — it read as Baz apologising
  for something the customer never saw. Cards are not yet persisted, so they do not come back
  on reload; the text does.

## 2026-10-05 — Giving Baz a voice

- **2026-10-05** — **The prompt was 32 prohibitions and no character**, which produced exactly
  the bot the vision document opens by mocking: correct, procedural, and indistinguishable from
  a decision tree. §63 ranks natural conversation second only to persistent context, so this is
  not polish. Added a `VOICE` section placed immediately after policy.
- **2026-10-05** — The voice is taught with worked bad/good pairs rather than adjectives. A model
  mirrors a demonstrated example far better than it follows a description, and "be warm and
  concise" had already failed to produce either.
- **2026-10-05** — The persona fragments granted permission rather than instructed — "a light
  touch of humour is welcome where it fits naturally", "a little personality is welcome". A model
  given permission to be dull will take it. They now instruct.
- **2026-10-05** — `TOOL_GUIDANCE` ended with "keep your own words short", which was actively
  suppressing character. It now says to give one line on why the card is there, since the card
  carries the detail.
- **2026-10-05** — The AI disclosure moved out of the persona block and is guaranteed by policy
  and voice, where no slider can touch it. Asserting it in the persona test made it look like a
  persona setting, which is precisely what §18 says it must not be.
- **2026-10-05** — Measured: the discovery turn went from 107 words to 31, still calling both
  tools. The comparison harness now includes a frustrated turn and a bereavement turn, so the
  §50 suppression is checked every time the voice is touched.

## 2026-10-05 — M3 applications

- **2026-10-05** — `case-action` is the only route to a state change, and every action
  re-reads the case, checks the caller owns it, and puts the change through `transition`. An
  illegal move is refused rather than written (Invariant 1, Invariant 2, §27, §48).
- **2026-10-05** — `confirm_requirement` checks the requirement actually belongs to that
  journey. A confirmation for something the journey never asks would satisfy nothing and must
  not be stored.
- **2026-10-05** — `show_review` refuses to render unless the application is genuinely
  complete. A review card is a promise that submission is one tap away, so offering one that
  cannot be submitted would be a lie (§48).
- **2026-10-05** — `show_pause_prompt` refuses unless a deterministic advisory applies to that
  application. The model may explain an advisory, never invent one (§6 Stage 8).
- **2026-10-05** — `record_facts` now recomputes afterwards, because a fact can complete an
  application and the model must not be the thing that notices (Invariant 3).
- **2026-10-05** — Nothing is pre-selected in the product card and "Not right now" is offered
  beside it, because §49 is explicit that discovery must not become cross-selling.
- **2026-10-05** — A tap tells Baz what happened, phrased as the customer, because from the
  model's point of view the customer did it — which is true. That keeps the conversation in
  step with the case without the model inventing the outcome.
- **2026-10-05** — Verified live: choosing two products created two applications, derived their
  state through the machine, and wrote 8 `context_reused` events — §53 measuring itself from
  the bank-held facts rather than being asserted.
- **2026-10-05** — The app home reads applications directly under RLS rather than through an
  Edge Function, because it is a read and RLS already restricts it to the primary customer. The
  display name and state label come from the domain, so the screen and the model describe state
  in identical words.
- **2026-10-05** — Verified live, the §6 Stage 8 / §67 beat: asked for a loan while a mortgage
  was open, Baz advised against it *before* offering it, offered it anyway when the customer
  pressed, then offered the pause. Pausing wrote `state: paused, resume_to: waiting_customer` —
  the machine recording where to return, not the model remembering.
- **2026-10-05** — Added `readyForReview()`. Declarations, consents and reuse confirmations are
  blocking requirements, so an application could never be `complete` while they were
  outstanding — which meant the review card could never be shown, and §48 says the review card
  is exactly where those are made. `readyForReview` is "everything except what the customer
  agrees to at the end".
- **2026-10-05** — The confirmations the customer ticks travel with `submit_application` rather
  than being separate calls, so an application cannot end up half-confirmed if the tap fails
  partway: either everything is agreed and it submits, or nothing changes.
- **2026-10-05** — Nothing is pre-ticked on the review card and submit stays disabled until
  every box is checked by hand. A declaration nobody actually read is worth nothing (§48).
- **2026-10-05** — Verified live end to end: discovery, selection, one fact gathered in
  conversation, seven values reused from bank-held facts and confirmed, one declaration made,
  then submitted. `state: submitted`, `submitted_at` set, 8 confirmations recorded.

## 2026-10-05 — Protection, consent and the health form

- **2026-10-05** — Added a `show_form` tool, an eighth beyond CLAUDE.md's seven. §7.5 requires
  health data to be collected through a consented form, so there has to be a way to surface
  one. It still only *shows*: the model names the application and nothing else, and the server
  decides which form is due — so the health questions are unreachable until consent is recorded.
- **2026-10-05** — `submit_health_form` refuses unless the consent is already recorded for that
  application, and refuses any key the catalogue does not mark `special`. It is the only door
  special-category data can come through, so both checks live at it (Invariant 6).
- **2026-10-05** — The `health_form_completed` event carries a count, never values. Nothing
  sensitive goes in an event payload.
- **2026-10-05** — **Invariant 6 has two halves, and I only built one.** The model must never
  see special-category values — and it must know they exist, or it reports answered health
  questions as outstanding, which is exactly what happened. The digest now names the area and
  says "answered and recorded", with no values.
- **2026-10-05** — Outstanding items now carry *why* they are outstanding. Without it the model
  could not tell "never been told this" from "we have it, the customer confirms it at review",
  so it asked again for things the customer had already given.
- **2026-10-05** — Naming a product in conversation does not start an application, and the
  model assumed it did. The prompt now says so explicitly: `show_product_options` is the only
  route in, even when the customer names the product themselves.

## 2026-10-05 — The presenter console, wired up

- **2026-10-05** — The console is behind real email auth, and the server checks `admin_users` on
  every single call. The site is on a public URL, so client-side routing decides only what is
  drawn — anyone could otherwise reset the case or flip the kill switch mid-presentation. §28, §37
- **2026-10-05** — Admin account is `baz-admin@chrisquinn.ie`, created through the auth admin
  API with `email_confirm: true` rather than turning on project-wide `mailer_autoconfirm`,
  which would have made every signup self-confirming. The password is in `.admin-credentials`,
  gitignored.
- **2026-10-05** — `reset_case` deletes only `kind = 'presenter'`. Audience cases are deliberately
  untouched (§43, §45).
- **2026-10-05** — Metrics are counted from the event log rather than recomputed, so the number
  on screen is the same number the §53 definition describes.
- **2026-10-05** — Added `@llm` and `@tenants` aliases. The admin screen had been importing
  through `@domain/../llm/...`, which works but breaks the moment anything moves.
- **2026-10-05** — `site_url` corrected to the real domain; it was still `localhost:3000`, which
  would have broken any auth email link.

## 2026-10-05 — M4 continuity, and the dead frontend

- **2026-10-05** — **The public conversation now starts anonymous** (`mode: 'fresh'`). It was
  joining the seeded customer directly, which skipped §6 Stages 4 and 5 entirely and faked the
  continuity the whole demo is built on.
- **2026-10-05** — Handoff codes are 128-bit, stored only as a SHA-256 hash, valid ten minutes
  and consumed on redemption. Expired, consumed and unknown all return the same message, so a
  caller learns nothing about which part was wrong. §29, §58, Invariant 8
- **2026-10-05** — Redeeming attaches the new auth user to the **same participant**, which is
  what makes the conversation continue rather than restart, then links the case to the customer
  and loads the bank-held facts (§6 Stage 5). Facts already captured anonymously are kept.
- **2026-10-05** — Dead frontend fixed: product cards and site nav now open the conversation
  with an opener written as the customer would say it, rather than being inert text. The mic
  button is gone — there is no speech input planned and a dead button is worse than no button.
  "View all" no longer looks like a link. Unbuilt tab bar entries say so.
- **2026-10-05** — Surface tests render through a helper with the real providers, rather than
  each test discovering a missing one for itself.

## 2026-10-05 — M5 partner

- **2026-10-05** — The `partner` function returns scoped DTOs and the partner never touches a
  table. Not RLS — code that cannot accidentally widen. They see their own tasks and the names
  and states of applications they are party to, never the primary's conversation or facts
  (§33, Invariant 7).
- **2026-10-05** — Tasks are grouped by **fact**, not by application, which is what makes one
  answer satisfy several journeys. Each task carries the applications it covers, so §6 Stage 9
  is visible on screen rather than merely true underneath.
- **2026-10-05** — Partner facts are written with `source: 'partner_stated'`, so provenance
  records who actually said it (§10).
- **2026-10-05** — A partner cannot be asked for special-category data this way either: the
  submit refuses any key the catalogue marks `special` (Invariant 6).
- **2026-10-05** — Completed tasks are shown as done rather than dropped. Building the list only
  from outstanding requirements meant finished rows vanished, which reads as a bug.
- **2026-10-05** — Enum facts render as a chooser with the catalogue's own values. They were
  free text, so answering `employment.status` meant typing `employed_full_time` — and the
  server correctly rejected anything else.

## 2026-10-05 — M6 return

- **2026-10-05** — `baz-turn` marks the case as seen when a turn completes, so "since last seen"
  means something. Without it the return summary would either repeat everything or nothing.
- **2026-10-05** — `hasUpdates` counts only events a customer would recognise. Sending the
  notification is not itself news, and a return summary opening with "we sent you a message" is
  worse than not opening at all.
- **2026-10-05** — The two lists that drive this — what counts as an update, and what Baz can
  narrate — drifted: a completed application counted as worth returning for but had no words
  written for it, so Baz said something had changed and then could not say what. A test now
  asserts every narratable type produces a sentence.
- **2026-10-05** — The event simulator only offers transitions the state machine will accept,
  computed per application. The presenter cannot reach an impossible state live, and "received
  by the bank" simply is not offered for something that was never submitted (§41).
- **2026-10-05** — The notification carries fixed copy saying nothing about the application, and
  its link is an opaque single-use code requiring a sign-in before anything is shown (§35, §58).
  Delivery is in-app rather than SMS: Twilio is not configured, and CLAUDE.md names the in-app
  notification as the fallback for exactly this reason.

## 2026-10-05 — M8 audience, and cards that survive a reload

- **2026-10-05** — Every audience scan gets its own case. Isolation is by ownership, so nothing
  anyone in the room does can reach the presenter's case. Verified: an audience visitor calling
  `admin` gets 403 (§45, §47).
- **2026-10-05** — `AUDIENCE_MAX_CASES` is a hard ceiling checked before a case is created, so a
  room cannot exhaust the project. Configured, not hard-coded (§47).
- **2026-10-05** — `clone` gives an audience visitor the same starting point as the presenter
  case — authenticated, bank-held facts — in a case of their own (§46).
- **2026-10-05** — Cards are persisted on the message. Without it a reload showed the text but
  none of the cards, so the customer lost the options they had been offered while the model,
  which does read history, would refer to a card no longer on screen. A card that no longer
  parses is dropped rather than breaking the whole transcript.
- **2026-10-05** — Purging clears audience cases only, and says so on screen (§44).

## 2026-10-05 — The asset pack, and the UI built to it

- **2026-10-05** — The visual language is now the supplied pack's, not one invented to fill a
  gap. Tokens are the pack's slate scale, BOI blue and navy, a colour per application state and
  an accent per product. Colour never carries meaning alone: `StatusBadge` pairs each state
  colour with the state machine's own label, `ProgressBar` announces its percentage, and the
  status card's marks carry a name as well as a tint.
- **2026-10-05** — The tab bar's centre action was a generic speech bubble and is now Baz's
  face. Baz sitting in the middle of the navigation is the whole proposition in one piece of
  UI; a speech bubble says "help widget".
- **2026-10-05** — The status card now carries the journey's requirements rather than a count,
  built from the requirement engine server-side so the card still cannot agree with model text
  that is wrong (Invariant 2, §59).
- **2026-10-05** — That card lists what is **outstanding**, not what is done. Built first in
  journey order, it showed five green ticks and "and 34 more steps": a mortgage carries nearly
  forty requirements and the first several are always the identity the bank already holds, so
  the card filled with things the customer could do nothing about. The done count lives in the
  progress bar; the list answers "what do you need from me".
- **2026-10-05** — The confirmation card is rendered by the component that completed the
  action, not asked for by the model. `commit` now reports whether the server accepted the
  action, so the tick can only appear because `case-action` returned — the model's reply
  arrives separately and is not evidence.
- **2026-10-05** — Baz's text is broken into paragraphs across tool rounds. Each round is its
  own stream and the deltas went straight through, so live transcripts read "They're here
  now.Mortgage first is usually the sensible order." A round emitting only whitespace does not
  count as having spoken, so a tool-only first round does not open the message with a blank
  line.
- **2026-10-05** — `ListRow` gained `wrap`. Truncating is right for a one-line row and wrong
  once the same row is stacked into a card, where it was cutting product descriptions mid-word.
- **2026-10-05** — The public header's ghost "Chat to Baz" and search are desktop-only. With
  the wordmark and Log in they overflowed 390px, and both are redundant on a phone where the
  hero carries a composer and a Chat to Baz pill.
- **2026-10-05** — Not built, deliberately: the board's four-tab app home (Your accounts / Your
  applications / Insights / Documents). Two of the four have no content, and the mobile journey
  board — which is the actual screen design — does not use tabs. Two dead tabs are worse than
  the current layout.
- **2026-10-05** — Not built: the upload card. `upload_request` is in the card contract and
  `request_upload` is in the tool list, but `baz-turn` does not offer the tool and `case-action`
  has no upload action, so the card is unreachable. The UI is the last piece of that feature,
  not the first — storage, RLS and the action come before it.
- **2026-10-05** — The home screen computes its own progress. It reads facts, participants,
  confirmations and documents under RLS and evaluates each journey with the same requirement
  engine the Edge Functions use (`@db` alias added so the row schemas are reused rather than
  duplicated). The alternative was another Edge Function call for a read, which CLAUDE.md
  reserves for writes. Invariant 3 holds either way: the domain decides what is outstanding,
  never the model.
- **2026-10-05** — The bell was disabled and said nothing. It now carries a dot when
  `hasUpdates` and leads to the conversation, which is the only place what changed is actually
  explained (§36). The notification card beside it says nothing about the application itself.

## 2026-10-05 — What the §67 run-through found

- **2026-10-05** — A card reports its outcome when `case-action` confirms it, not when Baz
  finishes narrating it. Both `commit` and `onInvitePartner` awaited the whole streamed turn
  first, so "Create their link" sat on "Creating…" for ten to twenty seconds with the link
  already in hand. Measured after the change: 1.4s. Cards are disabled while a turn streams,
  so detaching the `send` cannot let a second action slip in.
- **2026-10-05** — BLOCKER for §55 beats 17–20, found by running it: every one of the five
  demo moves starts from `received_by_bank` or `information_requested`, so each needs a
  *submitted* application. Submitting the mortgage means satisfying 39 blocking requirements,
  which cannot be done on camera. The journeys are all `draft` and the recordings were never
  translated, so the fix is to size them for the demo rather than to add a move that
  force-submits — that would be faking the orchestration §68 forbids.
- **2026-10-05** — BLOCKER for one continuous film: public Baz starts in `fresh` mode, which
  creates a case with `kind: 'audience'`, while the demo moves and the notification are wired
  to `presenterCaseId` (AdminOverview). So a run that starts on the public website — as §55
  beat 3 requires — cannot be driven from the console afterwards. Needs either a presenter
  entry to the public site that uses the presenter case, or demo controls that target the
  selected case.
- **2026-10-05** — Verified working in the run, not just in isolation: life-event discovery,
  concurrent applications, web→app handoff with the conversation intact, bank-held facts
  loading at sign-in without overwriting what the customer already said, partner isolation
  (the join page names the inviter and shows only the partner's own tasks), cross-application
  partner reuse shown as "Used for Mortgage and Life assurance", the loan advisory with its
  Keep going / Hold it for now card, the notification's opaque sign-in-gated link, and the
  return summary.

## 2026-10-05 — What hands-on use exposed that scripted runs did not

- **2026-10-05** — "One question at a time" is gone from the voice. It was written so Baz would
  not feel like a form, and against a 43-requirement mortgage it produced the opposite: 23
  fact-capture turns over seven minutes, each one a 15–20 second wait. Baz now asks for related
  things together in one natural sentence, capped at about three, and still never as a bulleted
  list. Measured on the same opening: 40 facts over ~23 turns became 51 facts over 4.
- **2026-10-05** — Signing in loads the canonical customer's facts only when the conversation
  has not already established somebody else. A live session as "Chris Quinn" was silently given
  Aoife's email, mobile and PPS number under a `bank_held` label, because the loader skipped
  only keys already present and the customer had not mentioned those three. The bank knows one
  synthetic customer; about a stranger it holds nothing.
- **2026-10-05** — `show_partner_invite` refuses to render a second card while one is already
  in the last few turns, and refuses outright once the partner has joined. Asked only through
  the prompt, the model re-offered it on nearly every turn — four stacked in one transcript —
  and the customer tapped each new one, creating the same invite three times. Enforcement, not
  instruction (Invariant 1). Message rows now carry their card types so the server can see what
  is already on screen.
- **2026-10-05** — Savings and deposit are NOT a duplicate requirement: someone can hold 60,000
  and put 50,000 in. The defect was asking for them in two separate turns as though unrelated,
  which reads as not listening. The voice now says to ask whether all of it is going in rather
  than asking for the second number cold.

## 2026-10-05 — Document upload

- **2026-10-05** — `request_upload` now takes an application and a requirement id rather than a
  pre-existing request row. The old shape could only reference an `application_requests` row
  that something else had created, and nothing created one for a journey's own document
  requirements — so the mortgage's five documents were unreachable and the conversation simply
  stopped there. The server checks the requirement exists, is a document, and is outstanding,
  then creates the request itself: the model still cannot invent a document to ask for.
- **2026-10-05** — Uploads go through their own Edge Function as multipart rather than base64
  through `case-action`. The bucket is private with no `anon` policies, so bytes only ever come
  out through a function. The open request row is the authorisation — a document can only be
  sent against one the bank has asked for, on a case the caller is a participant in.
- **2026-10-05** — An uploaded document is `verified: false`. A requirement marked
  `requiresVerification` therefore stays outstanding after the upload, which is the truthful
  state: nothing has checked it. The mortgage payslip is the only one affected, and the bank
  verifying it wants to be an admin move — not yet built.
- **2026-10-05** — A document that has arrived but not been checked is its own outstanding
  reason, `awaiting_verification`, not `awaiting_document`. With one reason for both, uploading
  the payslip left the case looking identical to never having sent it, so Baz read the case
  correctly and told the customer it had not gone through — then invented a reason why ("that's
  the same file as last time, so it hasn't been accepted"), which is a confident fabrication
  about something it cannot see.
- **2026-10-05** — Nothing inspects an uploaded file. The function checks its media type and
  size and stores it; a photo of anything is accepted as a payslip. Content verification is
  production infrastructure (§68) and the demo does not turn on it. "The bank checks the
  documents" is an admin move, which is also the only thing that can clear
  `awaiting_verification`.
- **2026-10-05** — Baz never describes its own machinery. It told a customer it could not bring
  up an upload card because the case "doesn't give me the IDs the card needs". That was a real
  defect — requirement ids live in the journey files and never reach the model — but narrating
  it is a separate failure, and the voice now forbids it.
- **2026-10-05** — GAP: the Edge Function entry points are not typechecked. `tsconfig.app.json`
  includes only `_shared/domain`, `_shared/contracts` and `_shared/tenants`, because the rest
  uses Deno globals and bare specifiers the app's config cannot resolve. A call to a function
  that does not exist deployed cleanly and was caught only by reading it. Worth a `deno check`
  step in CI.
- **2026-10-05** — PPS number is collected in conversation like any other banking detail; the
  DPA covers it. It was `extractable: false`, which produced a dead end rather than a
  protection: the case said "not yet known, ask for it", nothing told Baz it could not record
  it, so Baz asked, the customer sent it, `record_facts` refused, and Baz retracted in front of
  them. Special-category health data stays `extractable: false` — that is Invariant 6 and the
  consent-plus-form flow is a demonstrated feature, not an obstacle.
- **2026-10-05** — The prompt now lists what cannot be taken in conversation, by label and
  never by key. Listing only what *can* be recorded left the model unable to tell "not in the
  catalogue" from "not allowed", which is how the dead end happened. The key stays hidden
  because the key is the one string a write would need (Invariant 6). The digest marks the same
  requirements as form-only rather than telling Baz to ask.

## 2026-10-05 — Facts recorded against the wrong person

- **2026-10-05** — `superseded_by` is now written. It never was, so a corrected answer sat
  beside the old one and the domain's "superseded facts never satisfy anything" rule was dead
  code. Found in a real case: the customer's salary was recorded twice, 150,000 and then
  100,000 — the second being his wife's, attributed to him — and because the engine takes the
  newest, the case had him earning her salary. Silent, and wrong in the direction that matters
  for affordability.
- **2026-10-05** — An identical value is not written again. Restating something is not a
  correction; written each time it inflated the captured-facts metric and filled the inspector
  with the same number repeated.
- **2026-10-05** — The fact reference now warns whose answer is being recorded: a number the
  customer quotes about their partner is still the partner's. Guessing wrong is worse than
  asking, because the wrong subject silently replaces a correct answer.

## 2026-10-05 — The Edge Functions were never typechecked

- **2026-10-05** — `npm run typecheck:functions` runs `deno check` over every function entry
  point, and CI runs it. `tsconfig.app.json` covers only `_shared/domain`, `contracts` and
  `tenants`, because the rest uses Deno globals and bare specifiers it cannot resolve — so
  `baz-turn`, `session`, `case-action`, `admin`, `partner` and `upload` were checked by nobody.
  A call to a function that does not exist deployed cleanly today and was found by reading the
  file. The first run found seven errors, including a property read on a value the compiler
  knew was always `undefined`.
- **2026-10-05** — The service-role client is typed against the real schema, generated from the
  linked project by `npm run db:types`. Untyped it resolved every insert payload to `never` and
  every column name was unchecked, so a misspelt column was a runtime error on the day. The
  generated file is excluded from lint.
- **2026-10-05** — `show_status` refuses a second card in consecutive turns. Two in a row is
  what happens when the model reaches for one as something to say. The window is two messages
  rather than the invite card's eight, because status genuinely is worth refreshing.
- **2026-10-05** — `e2e/film.spec.ts` covers the structure of §55, not the conversation. Every
  turn is a live model call at roughly fifteen seconds, so asserting on Baz's words would be
  slow, costly and flaky. What it asserts is what has actually broken: the openers being a
  product menu, the demo entry landing somewhere other than the conversation, the console
  sitting behind a real sign-in, an invalid invite refusing rather than rendering a page.
- **2026-10-05** — Guardrail eval re-run after the voice and tool changes: 100% on both sets
  (27 must-block, 20 must-allow). CLAUDE.md requires that before any presentation.
- **2026-10-05** — The discovery gate counts what the current turn has just learned, not only
  what the case held when the turn began. `loaded` is a snapshot from the start of the turn,
  and the model records facts in one tool round and asks to offer in the next — so a customer
  who said everything in one message was measured against a case that knew nothing about them.
  The better the opening message, the more likely it was to stall.
- **2026-10-05** — The digest states the absence of applications as an instruction rather than
  a fact. "There are no applications yet" was already there and was ignored: a transcript ran
  four turns with Baz asking for documents and describing progress on a mortgage that had
  never been started.
- **2026-10-05** — Product selection verified end to end after the discovery change: the card
  arrives on the third exchange, the checkbox ticks, the button becomes "Start 1 application"
  and the application is created. Two earlier runs that looked like a selection bug were the
  test harness checking once after a single message and never looking again.
- **2026-10-05** — The transcript scrolls itself rather than calling `scrollIntoView`, which
  moved the nearest scrollable ancestor — the page — so sending a message nudged the whole
  screen and left the reply under the composer. It follows only when the customer is already
  near the bottom, so scrolling up to re-read is not yanked back down mid-stream.
- **2026-10-05** — Waiting for Baz is three dots in the bubble the answer will arrive in, not a
  line of text under the composer. That line was replacing the AI disclosure, which has to be
  there at all times (§16).

## 2026-10-05 — A live console, and cases you can tell apart

- **2026-10-05** — Realtime is given the signed-in token before the channel opens. The socket
  is created with the anon key at module load, before anybody signs in, and Realtime
  authorises every row against that token — so the console subscribed successfully and then
  received nothing, because `is_admin()` was false for the connection. No error anywhere: the
  WebSocket was open the whole time. The same trap waits on the customer side for §33, where
  an anonymous participant's socket would be equally authorised for nothing.
- **2026-10-05** — The Realtime handler only invalidates; nothing is written into the cache by
  hand. Everything on the presenter's screen therefore came back through the same path as the
  first load and cannot drift from the case it claims to show (Invariant 2).
- **2026-10-05** — A case is labelled with the primary applicant's name, falling back to a
  short stable id. Eleven rows all reading "Audience case" told the presenter nothing the
  moment more than one person was talking.
- **2026-10-05** — Baz records a name when it is offered. It did not: a case opened with "my
  name is Niamh Gallagher" held exactly one fact, the objective. Today's discovery work is why
  — the prompt drives hard at situation facts, and `identity.fullName` normally arrives from
  bank-held data at sign-in, so nothing pressed for it in conversation. Worth having well
  beyond the label: being told a name and carrying on regardless is the plainest way to look
  like you are not listening.

## 2026-10-05 — The Needs Engine

- **2026-10-05** — Confidence combines by noisy-or: each signal independently fails to
  establish the need, and the need holds if any succeeds. Weak evidence accumulates without any
  one piece being decisive and nothing exceeds certainty. A maximum ignores corroboration —
  marriage plus separate finances plus shared costs would score exactly what marriage alone
  scores. A sum passes 1.0 on three soft signals. The design left this unspecified; its §14
  worked example says about 0.85 and noisy-or gives 0.87, which is the only calibration point
  available.
- **2026-10-05** — Signals are predicates over recorded facts, never phrases to match. The
  supplied catalogue writes them as things a customer might say; matching those strings would
  make this the keyword engine §1 of the design explicitly rules out. Extraction turns language
  into facts, and the engine turns facts into needs — which is also what lets the bank answer
  "why did this need appear" with evidence rather than a guess.
- **2026-10-05** — The health non-commercialisation rule reads the gate's per-turn `sensitive`
  flag, not a fact. It cannot be fact-driven: a health disclosure is the one thing the
  catalogue refuses to record (Invariant 6), so nothing in the case can evidence it. The gate
  sees the message, the engine sees only the flag.
- **2026-10-05** — Eight needs are implemented, not the catalogue's 49. They are the ones §67
  exercises; the rest are data in `needs-engine/`, so adding one is a catalogue entry rather
  than code. A need is not an application: most map to no journey at all and are explained
  only, which is what keeps this clear of the five-product union the state machine runs on.
- **2026-10-05** — "Two or three exchanges, not one" is gone from the voice. It was a heuristic
  standing in for what the engine now measures, and with both present they disagreed — live,
  an explicit mortgage request sat at 1.00 and ready to surface while Baz kept asking
  questions. The case now tells Baz when it knows enough.
- **2026-10-05** — `show_product_options` refuses to re-render while the same offer is still on
  screen, matching the invite and status guards. Live, the mortgage card was offered on two
  consecutive turns, which reads as the conversation going in circles.

## 2026-10-05 — Savings, plans, and keeping a promise

- **2026-10-05** — Savings is a product with its own short journey. A customer six months from
  a deposit asked which savings account suited them and was told Baz could not help; that was
  true, because the catalogue held five products and none of them was a place to put money.
  The journey is short deliberately — there is no affordability to assess — but it does ask for
  the target and the monthly amount, because those are what make a plan possible.
- **2026-10-05** — The deposit gap is computed, not asked for. A first-time buyer typically
  needs a tenth of the price, so a price is enough; a target the customer states outright beats
  it. Requiring both meant someone who said "we're aiming for 60k" got no plan at all.
- **2026-10-05** — A plan exists only where there is genuinely a sequence. Someone who already
  has the deposit does not need a plan, they need an application. Steps are derived like
  everything else (Invariant 3), and the plan says nothing about timing it cannot know: no
  monthly amount means "depends on what you can put away", never a guess.
- **2026-10-05** — The watch is recorded when the customer opens the savings account, not when
  Baz describes the plan. A promise attaches to something the customer chose to do, not to Baz
  having mentioned it (Invariant 1). Someone who hears the plan and does nothing gets no
  follow-up, which is the right default.
- **2026-10-05** — A watch is a condition the system can actually check — a number to reach or
  a date to pass. "We'll be in touch" is not a plan, and a promise nothing evaluates is worse
  than no promise (§35).
- **2026-10-05** — Three copies of "what a customer would come back for" had drifted: the
  notifier, the narrator and a test. `savings_target_reached` was added to the narrator alone,
  so the bank reached the milestone it had promised to watch for and said nothing. One
  exported list now, with a test. The log already records this drift happening once in the
  other direction.
- **2026-10-05** — The case inspector shows the engine's reasoning: every need with its
  confidence, the evidence in the customer's own words, the plan, and what the bank is
  watching for. That is §15's audit view, and without it the needs engine was unobservable —
  which is how a missing watch went unnoticed.

## 2026-10-05 — Customer Plans

- **2026-10-05** — Decisions are stored, derivations never are. A plan holds what the customer
  agreed, when a milestone was actually reached and when a check-in is due; progress, the gap,
  the projected date and whether it is on track are computed from the case every read. A stored
  percentage is a number that can disagree with the balance printed beside it.
- **2026-10-05** — The plan engine owns every figure (§40). Where the case cannot support a
  projection — no saving rate — it returns null and tells the model not to guess, because a
  projected date is something a customer acts on.
- **2026-10-05** — `propose_plan` is the first tool not named show_/record_/request_, so the
  Invariant 1 test says why in writing: it writes a draft nobody is held to, and the plan
  becomes the customer's when they tap. Proposing is not acting.
- **2026-10-05** — Check-in agendas are written when the check-in is created, not when it
  fires. A check-in whose reason is invented at the moment of contact is a marketing trigger
  wearing a different hat (§20).
- **2026-10-05** — The console's balance control reports what the engine evaluated: the balance
  read back, active plans found, milestones checked, milestones reached. "No milestone reached"
  means the same thing whether nothing qualified, nothing was looked at, or the read was stale.
  Those counts turned three runs of guessing into one run that named the bug.
- **2026-10-05** — Facts are written through `recordFacts` only. A hand-rolled insert paired
  `subject_kind: household` with a participant id, which `participant_matches_subject_kind`
  rejects — correctly — and the rejection went unread, so `set_savings_balance` was a no-op
  that reported success from the moment it shipped. One writer, which reads the catalogue.
- **2026-10-05** — PATTERN, four times today: a failure that presents as silence. Unchecked
  `.error`, `data ?? []`, a diagnostic whose condition hid `null`, and an insert whose result
  was never examined. In every case the system reported "nothing here" where it meant "this
  broke". Worth treating `?? []` on a query result as a smell.
- **2026-10-05** — The schema-drift test extracts check constraints per table now. It compared
  application states against `need_decisions.state` the moment a second table had a column of
  that name, because it took the last match in the whole migration set.
- **2026-10-05** — §48 passes end to end, as one continuous story rather than verified in
  pieces: the goal and the gap understood, the mortgage deliberately not started, a plan
  proposed with the target computed from the price, kept by the customer and visible on their
  home screen, savings reaching the target months later, the console signalling the milestone
  and the check-in coming due, and the customer returning to "your savings have reached
  €60,000, so that step is done — the next step is the mortgage application".
- **2026-10-05** — The console event feed is built from one server-side describer, so the
  overview and the case inspector cannot say different things about the same event. An
  unrecognised type still renders readably, because a describer that silently does nothing for
  unknown input is how the three NARRATABLE lists drifted apart earlier today.
- **2026-10-05** — Deploy Pages waits a long time for a runner, while CI and Deploy Supabase
  triggered by the same push get one immediately. With `cancel-in-progress: true`, pushing
  again inside that window cancels the run already waiting — so retrying makes it worse. Wait,
  do not retry, and verify by grepping the live bundle rather than trusting the run status.
- **2026-10-06** — `cases.kind` is defined once, in `_shared/domain/case.ts`, with the schema
  drift test checking it against the migrations. The migration that made `customer` the
  ordinary kind left the Zod row schema accepting only `presenter | audience`, so every case in
  the system failed to parse and every conversation died on load. The union was written down in
  four places; the drift test covered application states, products, fact sources and document
  types, but not this one. Both halves of the fix matter — one definition, and a test that
  notices.
- **2026-10-06** — `baz-turn` catches anything thrown before the stream opens and answers with
  an SSE `error` event. Without it the runtime's own 500 carries no CORS headers, so the browser
  blocks the response and the customer sees "Load failed" with no cause anywhere: not in the
  response, not in the network tab, and `supabase functions logs` does not exist. Half an hour
  went on finding an error the function already knew. A turn may fail; it may not fail mutely.
- **2026-10-06** — Goal discovery and plan milestones come from blueprints, not from code. All
  26 catalogue goals and 10 life-event clusters are data; signals are conditions over recorded
  facts, with one exception — `goals.primaryObjective`, the customer's own statement of what
  they came in about, which extraction has already turned into a fact. Everything else about a
  customer's circumstances is read, not matched.
- **2026-10-06** — Primary goal means a goal the customer declared, with no fallback. Ranking by
  confidence put "organise money together" under "what they came in about" for someone who had
  only mentioned buying a house. A case with no stated objective has no primary goal, and the
  related ones are still there to work with.
- **2026-10-06** — A `facts` milestone kind: reached once the case can answer a set of fact
  keys. Most of the catalogue's milestones read "affordability understood" or "debts understood",
  which is not a tick box but whether the information exists. Plan progress now moves as the
  conversation happens rather than waiting for somebody to mark it, which is Invariant 3 applied
  to plans.
- **2026-10-06** — Keeping a plan records its target as `goals.savingsTarget`. Until the customer
  said yes it was Baz's estimate from the purchase price; once agreed, it is something they told
  the bank, so the deposit engine stops re-deriving it and the "target defined" milestone can be
  evidenced rather than ticked.
- **2026-10-06** — Product options are gated on understanding the customer's position, not on a
  need being established. The two were conflated: "is a need established" is answered the moment
  somebody says the word mortgage, so a customer who had asked for a broad conversation about
  their whole position got a mortgage card in the same turn Baz was still asking what price range
  they had in mind. The gate is now the Goal Engine's `missing` — most of what the leading goal
  needs to know has to be answerable — and the refusal names the specific gaps, so the next
  question is targeted rather than generic. Patience raised from 4 customer turns to 7; four was
  two exchanges.
- **2026-10-06** — `send` guards re-entry on a ref, not on React state. `streaming` is still
  false for every handler that runs before the next render, so two taps on a card inside one tick
  both passed and the customer saw four "noted, I'll leave that" messages and five near-identical
  replies to one decision. A card that has committed also stays spent, and `decline_product` no
  longer writes a second event — metrics are derived from events, so a duplicate is not just
  noise on screen.
- **2026-10-06** — Purge clears every conversation except the one on screen, anything marked
  `presenter`, and anything somebody named. It used to delete `kind = 'audience'`, which matched
  nothing once every visitor started getting an ordinary `customer` case — the button sat there
  reporting "Purge 0" while test conversations piled up, and the help text beside it already
  claimed to clear everything but the current one. The rule lives in `domain/case.ts` and takes
  an explicit `named` flag rather than reading a label, because the console is sent a display
  label that falls back to "Unnamed · 1a2b3c4d": sniffing it there found a name on every case
  and spared the lot. Same rule, same answer, on both sides.
- **2026-10-06** — The console is four screens: cases, guardrails, persona, goals & needs. It was
  six, and "overview", "cases" and "audience" were three lists of the same conversations under
  different headings — a distinction only the person who built it could hold. A case is now a
  page rather than a pane, so everything about one has room instead of competing with the others.
- **2026-10-06** — The handover note is composed on the server from the case, never written by
  the model. A brief somebody is about to act on — move an application, make a commitment,
  correct a figure — is the last place to put invented prose, and everything worth telling them
  is already recorded. Composing it is arranging facts, not summarising them (Invariant 2).
- **2026-10-06** — A case page opens on what a call needs and folds the rest away. Fully expanded
  it was 4,600px; the engines' reasoning is the most interesting part of the build and the least
  useful part of a phone call. Same for the catalogue: 26 goals open at once was 11,800px, which
  is a reference manual rather than a console.
- **2026-10-06** — Purge deletes every case, with no exceptions. It used to spare the one on
  screen, anything marked `presenter` and anything named, which meant a button saying "purge"
  left cases behind and nobody could tell which or why. The sample customer is one click to
  rebuild, so sparing it bought nothing and cost the button its meaning. It asks once, through
  an `AlertDialog`, because it cannot be undone.
- **2026-10-06** — The console is built from shadcn primitives rather than around them. It had
  drifted into hand-rolled layouts — `Card` with `divide-y p-0` standing in for a table, a raw
  `<button>` with a hand-placed chevron standing in for an accordion, a row of buttons standing
  in for tabs — and the result looked like what it was. `Table`, `Accordion`, `Tabs`,
  `AlertDialog`, `Tooltip`, `ScrollArea`, `Separator` and the `Card` sub-components were all
  already installed. CLAUDE.md says never hand-roll something shadcn provides; this is what
  ignoring that looks like after a few screens.
- **2026-10-06** — The console is laid out across the width, not down it, and a case is four tabs
  rather than one scroll. Handover, conversation, act as the bank, and how Baz worked it out are
  four genuinely different questions asked by four different people; stacked, the page was 4,600
  pixels and everyone scrolled past three quarters of it. It is 1,000 now and fits on a screen.
- **2026-10-06** — `useIsMobile` reads the media query through `useSyncExternalStore`. The
  shadcn-generated version held the answer in state and wrote to it from an effect, which renders
  once with the wrong answer and again with the right one — and trips this repo's lint rule about
  synchronous setState in effects. A media query is an external store; it is read as one.
- **2026-10-06** — The chat client gives up on a stream that has gone silent for 45 seconds.
  Reported live: a turn where the typing indicator ran forever with nothing to click. A read that
  never settles is the worst way for a turn to fail — the connection stays open, no bytes arrive,
  and the customer has no way out. Measured between chunks rather than across the turn, because a
  turn that is working sends text the whole way through and a stalled one sends nothing at all.
- **2026-10-06** — Three customer surfaces: a landing page, Baz, and the partner link. The replica
  Bank of Ireland website and the app behind a simulated login are gone, along with the handoff
  code that joined them. They were scaffolding around the only part worth showing, and a
  signed-in version that knows more about you is a claim this prototype no longer makes — every
  visitor is anonymous and tells Baz what it needs to know, the way they would tell a person.
  `/app/*` and `/try` redirect to Baz so old links and installed PWAs still land somewhere.
- **2026-10-06** — The installed PWA opens straight into the conversation. The landing page exists
  to explain Baz and offer the two ways in; somebody who has installed it has done both. `scope`
  stays at the base so the service worker still covers the landing page and the console.
- **2026-10-06** — The landing page offers the address and a copy button where the design has a QR
  code. Rendering a QR needs an encoder and CLAUDE.md says not to add a dependency without
  asking; the copy button is the part that has to work either way.
- **2026-10-06** — The prototype banner is gone from every surface. It existed because the site
  was a replica of a bank's own website carrying its branding on a public personal domain, and
  somebody landing on it cold could plausibly have taken it for the real thing. With the replica
  removed, what is left is a product called Baz that reads as what it is.
- **2026-10-06** — A tap is an `action` turn, recorded as a `system` message, not as something the
  customer said. "Started Savings account, Joint current account, Mortgage. 7 things carried over
  from what we already knew." used to appear in the transcript in the customer's own bubble; they
  had ticked two boxes. The transcript is the record a person reads before phoning them, so
  putting words in somebody's mouth there is not cosmetic. Baz is told what happened as an event
  and instructed not to reply as though they had written in. The instruction travels in a
  separate `note` field, because direction is not something that happened and has no business in
  the record.
- **2026-10-06** — A turn that produces no words and no card now says something. Seen once in
  testing: every round spent calling a tool the server refused, and the customer got an empty
  bubble. Silence is the one reply that cannot be recovered from — nothing to read, nothing to
  tap.
- **2026-10-06** — The chat screen is a fixed box the height of the visual viewport, not a page
  with a minimum height. Three things broke it in an installed PWA: the composer computed at
  14px, which makes iOS zoom the whole page on focus; `100dvh` does not shrink for the on-screen
  keyboard on iOS, so the composer sat behind it; and a `flex-1` child without `min-h-0` will not
  shrink below its content, so the transcript could not give the space back. `useViewportHeight`
  tracks `window.visualViewport` for the one measurement that reflects what is genuinely on
  screen, and `interactive-widget=resizes-content` covers Android.
- **2026-10-06** — Nothing sits under the composer. "Baz is an AI assistant." took a line and a
  margin on the screen where space is scarcest, and the header carries the same words
  permanently. The home-indicator inset is zeroed while the keyboard is up, because the keyboard
  covers the indicator and reserving space for it is a gap and nothing else. Connecting now shows
  in the composer's placeholder, which is where somebody waiting to type is looking.
- **2026-10-06** — The console is code-split out of the customer bundle. It is the larger half of
  the application — a charting library, a command palette, a data grid — and none of it is
  reachable without typing `/admin`, so bundling it together was a cost paid by the people the
  product is for. Recharts lands in the console's chunk rather than on every phone that opens Baz.
- **2026-10-06** — `.prettierrc.json` matches the house style: no semicolons, single quotes, 100
  columns. There was no config, so every `npx prettier --write` silently reformatted files to
  prettier's defaults and away from the rest of the repo. A formatter with no configuration is a
  second opinion about style, not a settled one.
- **2026-10-06** — A metric card takes the previous window's count, not a computed percentage, so
  it can tell apart "nothing to compare against", "the previous window was zero" and an ordinary
  change. A prototype a day old is in the middle case for every metric, and "0%" would claim
  nothing had happened. The arrow is never coloured: blocked requests falling is good and
  conversations falling is not, and the card cannot know which it is holding.
- **2026-10-06** — Case status is derived on every read: blocked, then needs review, then
  completed, then in progress. A case that was blocked *and* has an application waiting reports
  as blocked, because that is the thing somebody should look at. `new` is a fifth value and not a
  tab — every visitor gets a case the moment they arrive, so most are empty, and counting those
  as conversations would make the busiest tab the least useful.
- **2026-10-06** — `useRealtimeInvalidation` opens one channel per caller. `client.channel(topic)`
  returns the existing channel when the topic matches, and adding handlers after `subscribe()`
  throws — which never happened while only one screen was mounted, and happened immediately once
  the case pane sat inside the case list.
- **2026-10-06** — The console is a fixed app shell: the viewport height, scrolling inside. A
  screen is handed a definite height and chooses — the workspace fills it and scrolls within its
  panes, a long reference screen overflows and scrolls. A wrapper that decided for them clipped
  the long ones instead of scrolling them.
- **2026-10-06** — The case is fetched once by the workspace and shared with both panes. The
  conversation and the context are two views of the same case, and fetching them separately is
  two chances for them to disagree about what state it is in.
- **2026-10-06** — The right pane answers "what do I need to know": about this customer when one
  is selected, about everything when none is. The live feed is not lost, it is what that pane
  says when nothing is open.
- **2026-10-06** — The Events tab has no Result column, which §5 asks for. For almost every event
  the outcome *is* the event — "Mortgage approved" has no separate result — and a column of
  dashes is worse than no column. `object` was added instead, resolved from the payload, because
  "which application" is the question the table could not answer.
- **2026-10-06** — "Returning customer" is answered as distinct days on which they said something.
  There is no sign-in and no identity across sessions, so anything stronger would be a guess
  dressed as a fact.
- **2026-10-07** — "Test a request" runs the real gate: same classifier, same deterministic
  checks, same refusal wording, with no case attached. Nothing is recorded — a test is not
  something that happened to anybody, and logging it would make the blocked-requests metric a
  tally of how often the feature was demonstrated.
- **2026-10-07** — `request_blocked` now records the first 200 characters of what was asked. §39
  wants enforcement observable, and a log of categories and timestamps does not show that: "off
  topic at 14:06" proves nothing, "count to 10,000 — off topic" proves the thing. The request
  still never reaches the model (Invariant 4); recording what was turned away is the opposite of
  answering it.
- **2026-10-07** — A question about money is answered with a quote card, not prose. The model
  passes only what the customer said; the server computes every figure from the catalogue. A
  reply containing three numbers the model worked out is three numbers that can be wrong, and a
  repayment figure is the kind of wrong a customer acts on.
- **2026-10-07** — Choosing an option on a quote card commits nothing. It asks Baz to explain
  that option and to keep asking what the money is for and how soon they expect to clear it —
  because those are what decide whether it is the right product at all, and a repayment figure
  cannot tell anybody that. Deliberately not gated by discovery either: a question about cost is
  a question, and making somebody complete an interview before seeing a figure reads as evasive.
- **2026-10-07** — Whether the product they asked for suits them is decided by rules, not by the
  model noticing. A customer asks for a personal loan because that is the product they have heard
  of; whether it fits depends on two things nobody asked them — what the money is for, and how
  soon they mean to be rid of it. `borrowing.repaymentMonths` is the fact that distinguishes
  €3,000 cleared by Christmas from €3,000 over four years, and nothing else in the case does.
  The rules stay silent until both the amount and the horizon are known, because guessing a
  recommendation from an amount alone is how cross-selling works.
- **2026-10-07** — A quote offers the terms a product actually has when the one asked for is not
  among them. "€3,000 over about two years" against a loan offering three, five and seven used to
  return nothing, because every option failed the filter — and "I could not work that out" when
  three perfectly good options exist is the worst of both.

**2026-10-07 — Catalogue editing is a prose overlay, not a rules engine.** §6, plan §3.2.
`catalogue_overrides` holds name, summary, priority, milestone labels, check-in agendas and an
enabled flag, keyed by `(kind, entry_id)`. `domain/catalogue/overlay.ts` applies it to the
compiled catalogue; `loadCase` does that once so no call site can forget. Signals stay in code.
The split is the guarantee: a malformed edit can make Baz read badly and cannot make it behave
wrongly. Check-ins have no id in the catalogue, so the overlay keys them by what they are
(`every:3`, `on:mortgage_approved`) and a test asserts those are unique within every goal.

**2026-10-07 — A quote selection ends on the customer's move, not on a question.** §51.
Choosing an option to talk through used to be followed by "explain it, then keep finding out what
the money is for" — and Baz explained the four-year fixed and in the same breath asked what the
two of them earned and which county the house was in. The turn now ends by offering two ways
forward: more about this option, or what applying would involve. Discovery resumes after they
answer. Same principle as the product options card: explaining and interrogating at once reads as
not listening.

**2026-10-07 — "What applying involves" comes from the journey, not the model.** §8, §51.
`domain/prospect.ts` runs the requirement engine against a hypothetical application, so the
answer is the real journey against what the case already knows. Without it the model answered
from whatever it knew about Irish mortgages, which is inventing a bank's paperwork — the same
class of mistake as inventing its rates. `show_quote` writes a `product_quoted` event so the next
turn knows which product is in play.

**2026-10-07 — Variants are the only source of rates.** §51.
`illustrativeTerms` carried hand-written rates beside the computed ones and they had drifted: the
mortgage advertised "3.85% for 3 years" while the card offered 3.1%, 3.3%, 3.4% and 3.9%. The
prompt now derives rate lines from the variants, and `products.test.ts` fails any rate written in
prose beside a variant.

**2026-10-07 — The digest dropped everything it was not explicitly told to keep.** §14.
`buildCaseDigest` copied `plans`, `checkin` and `revived` into its return and nothing else, so
`goals` and `suitability` had been computed every turn and thrown away. It typechecked because
the caller spreads its options in, and TypeScript flags excess properties only on a direct
literal. Another one for the failures-presenting-as-silence list: no error, no warning, and a
model that simply never mentioned any of it. `digest.test.ts` now fails if any option stops
arriving.

**2026-10-07 — "How long does it take?" is not answered with a number.** §8.
Asked how long an application takes, whether an appointment was needed and what documents were
required, Baz declined all three. Two of those were honest; the third was wrong. But the real
miss was that the answer is that there is nothing to turn up to, nothing to sit down and fill
in, and nothing to have ready — the application is conversational, async and resumable, which is
the product's whole premise and nothing in the prompt said it. `HOW_APPLYING_WORKS` now does.
Document lists always carry "assessed individually, not exhaustive", and the follow-up after
"what is involved" is when they are hoping to do it — the one answer that decides between an
application now and a plan with a check-in.

**2026-10-07 — A target already passed is not a plan.** §38.
Somebody with €60,000 against a €320,000 house was offered a plan to save €32,000 — ten per cent
of the price, which is what `depositGap` assumes when nobody has said otherwise — and the card
rendered "€60,000 of €32,000, 100%" on a goal two years away. `propose_plan` now refuses a target
at or below what they already hold and tells the model to ask what they are actually aiming for.
The figure was not wrong so much as beside the point: they had said they wanted to save more and
nobody had asked what for.

**2026-10-07 — Only money arriving counts as reaching a savings target.** §38.
`savings_target_reached` was raised whenever *any* milestone was achieved, so defining a deposit
target fired the check-in meant for reaching one — a customer €3,500 short had a "mortgage
readiness review" come due the moment their plan was created. `reachesSavingsTarget` in the plans
engine now requires a numeric milestone at or above the plan's target.

**2026-10-07 — A card with nothing said reads as a dropped connection.** §14.
`show_status`, `show_review`, `show_partner_invite` and `request_upload` returned a bare "card
shown" with no instruction to speak, and the model duly shipped a status card with zero text —
the customer had just given their address and PPS number, got silence, and had to type "What's
next". Every card-producing tool result now says what to say. Also: anything said before a tool
call is already on the customer's screen, and the model did not know that, so it restated its
first paragraph in different words after the tool returned.

**2026-10-08 — Cost is measured tokens at assumed prices.** Console §4.
Every Anthropic response reports exactly what it consumed, so `messages.usage` holds the real
figure for each turn — all model rounds plus the gate in front of them. The estimate is entirely
in `domain/cost.ts`, where the euro prices live, and the console says "about" for that reason
rather than because the tokens are uncertain. Turns written before this existed have null usage
and fall back to `TYPICAL_TURN`, measured from this system; the card says how many of each.
USD→EUR is a constant in the same file.

**2026-10-08 — Say what the proactive callback depends on.** §38, Invariant 2.
Baz promised "we'll come back to you when your savings reach €32,000" to somebody holding no
account here. `plan_watches` is only ever written once a savings account exists — the code was
always honest — but nothing said so, so the promise went out with a condition the customer could
not see. `WHAT_WE_CAN_DO` now states it, and `propose_plan` adds it to the tool result when the
plan waits on an amount and there is no savings account. Framed as what service is possible,
never as a condition of being lent to.

**2026-10-08 — The primary relationship is where the salary is paid.** §9.
`banking.salaryPaidTo` (`this_bank | another_bank | not_working`), person-level because two
applicants can bank differently, and tenant-agnostic because `_shared/domain` does not know whose
bank it is in. It decides two things worth asking for: income and outgoings readable from the
account instead of asked for, and a standing order the day after payday.

**2026-10-08 — Typed hints in the composer, not a row of chips.** §55.
The opening suggestions were tappable, which cost a tap less, but five situations in a row read
as a menu — and a menu quietly contradicts the one claim this product makes, that you do not
have to pick from a list. The same openers now type themselves into the empty box: a suggestion
without a constraint. Drawn as an `aria-hidden` element behind the field rather than in
`placeholder`, so a string changing forty times a second is never announced or taken as the
field's accessible name, and it holds still under `prefers-reduced-motion`.

**2026-10-08 — The composer is a textarea that grows.** §55.
One line hid the start of what somebody had written at the moment they were deciding whether to
send it. Grows to six lines then scrolls. Enter sends, shift-enter breaks the line, and a
composition in progress does neither.

**2026-10-08 — Hold the send, not the keyboard.** §55.
The composer disabled the field itself while a turn streamed, and a browser answers a disabled
field by blurring it — so every turn took the caret away mid-thought and dropped the phone
keyboard with it. Only sending is held back now. Typing ahead while Baz answers is what every
other chat allows, costs nothing, and the send button greys out to show why Enter does nothing.

**2026-10-08 — A turn cannot be taken back.** §14.
Baz wrote "Tap the card to start it", asked a question, then wrote "Actually, hold off on that
card for a moment" — and no card was ever drawn, because the tool was never called. It composes
across rounds and had changed its mind between two of them, with the first half already on the
customer's screen. Three rules added: a sentence already written has been delivered, never
mention a card the tool was not called for, and discovery is not a reason to stall somebody who
has just handed over their name and PPS number in order to proceed. `card_promised_not_shown` is
written when a reply points at a card that was never drawn — it cannot be fixed after the fact,
but it can stop being invisible.

**2026-10-08 — The need scores govern what Baz volunteers, not what the customer asked for.** §15.
A customer who had given their name, date of birth, address and PPS number — because Baz had
just said that was what applying took — got three more questions instead of a card. The need was
at `clarify` (0.70 against a 0.75 threshold) and the model was correctly obeying "anything listed
as worth asking about is not ready to offer". That rule is about volunteering and now says so.

**2026-10-08 — A rough timeframe is still an answer, and the prompt needs today's date.** §9.
"Next year" was never recorded, because `goals.targetDate` wants a month and the prompt never
said what year it was. So the clarifying question behind it stayed unanswered, one signal short
of the threshold above. Today's date now goes in the volatile half of the prompt — not the cached
prefix, where it would be stale within a day and break the cache nightly.

**2026-10-08 — Money already saved counts towards the target.** §51.
A customer with €32,000 towards a €40,000 deposit, putting away €1,200 a month, was quoted two
years and nine months. That is how long €40,000 takes from nothing — thirty-three payments — and
they were seven months away. `monthsToSave` and `savedAfter` always took an opening balance and
nothing ever passed one. The balance is read from the case rather than from the model's tool
input, because the bank holds it (Invariant 2), and the card states that it counted it.
