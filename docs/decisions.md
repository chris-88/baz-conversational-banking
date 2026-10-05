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
