# CLAUDE.md: Baz Conversational Banking POC

## What this is

Baz is a conversational orchestration layer over (simulated) Bank of Ireland product journeys. The customer says what they are trying to do. Baz discovers needs, the customer chooses products, facts are collected once and reused across concurrent applications, and the case persists across channels, sessions, a partner and time.

Source of truth, in `docs/`:

- `03-baz-conversational-banking-poc-requirements.md`: the spec. Cite sections as §N.
- `01-conversational-banking-poc-vision.md`: intent and tone.

Where they conflict, the requirements doc wins. Both are gitignored (the repo is public) and
both are still retrievable from the public git history - see
`docs/security/public-repository-review.md`.

`docs/README.md` is the map of everything else. This file is the operational summary; where it
and a document under `docs/` disagree, check the code - this file has been the stale one before.

The only test that matters is §67: a customer comes for a mortgage, Baz discovers the wider life event, the customer picks products, facts are reused across applications, the customer moves from public web to the app without restarting, the spouse joins separately and advances several applications, the personal loan is deliberately held, the customer leaves, the bank moves, a notification arrives, the customer returns and Baz knows exactly what changed.

## Priorities

When trading off, follow §63 in order: persistent context, natural conversation, domain restriction, multi-application orchestration, reuse, state integrity, public-to-app continuity, confirmation, partner, return, notification, admin, persona, audience QR, visual polish.

- Weak orchestration with perfect visuals is a failed POC.
- Do not build production infrastructure because production would need it.
- Do not fake orchestration to improve polish.

## Stack

Standard prototyping stack. Do not add frameworks or services outside it without asking.

| Concern | Choice |
|---|---|
| Build | Vite, React, TypeScript (strict) |
| UI | shadcn/ui (mandatory default), Tailwind |
| Routing | React Router, hash routing (GitHub Pages has no rewrites) |
| Server state | TanStack Query, invalidated by Supabase Realtime |
| Client state | Zustand, ephemeral UI state only |
| Validation | Zod at every boundary |
| Forms | React Hook Form + zodResolver |
| Backend | Supabase: Postgres, RLS, Auth (anonymous + email for admins), Realtime, Storage, Edge Functions (Deno) |
| LLM | Anthropic API, called only from Edge Functions |
| PWA | vite-plugin-pwa |
| Notifications | Web Push (RFC 8291/8292), hand-written in an Edge Function. Twilio was never built — push needs no per-message charge and no sender registration |
| Tests | Vitest, Playwright |
| Monitoring | Sentry in the browser. **Edge Functions have none**: failures there surface as `events` rows and function logs |
| Hosting | GitHub Pages via GitHub Actions; hosted Supabase project |

Models are env-configured. Defaults: `BAZ_MODEL=claude-sonnet-5-5`, `GATE_MODEL=claude-haiku-4-5-20251001`.

## Architecture

```
Browser: one SPA on GitHub Pages
  /#/                landing page
  /#/baz             Baz itself - the same screen in a tab and in the installed PWA
  /#/how-it-works    the explainer, for somebody evaluating the work
  /#/privacy         what happens to what you type
  /#/join/:token     partner experience
  /#/admin/*         presenter console
  /#/app/*, /#/try   redirect to /#/baz (old links and printed QR codes)
    reads:  supabase-js under RLS (primary customer and admin only)
    writes: Edge Functions only
    live:   Realtime -> TanStack Query invalidation

The replica BOI public site and the authenticated app shell behind a simulated login were
deleted on 2026-10-06 (`9569094`): scaffolding around the only part worth showing. There is no
signed-in version of Baz that knows more about you. `src/app/routes.ts` explains the pivot.

Edge Functions (service role; hold ANTHROPIC_API_KEY, VAPID keys, PRESENTER_KEY)
  baz-turn      gate -> Baz model with tools -> SSE stream -> persist
  case-action   UI-committed actions: select products, submit, pause/resume,
                consent, invite partner, upload complete
  session       anonymous start, case listing and switching, participant claiming
  partner       join via invite, scoped DTO reads, partner task submission
  upload        the only way a document enters a case
  admin         simulate events, send notification, reset, persona/domain
                config, case inspection, metrics

Postgres
  26 tables. Core: cases, participants, participant_sessions, customers
  (synthetic bank-held), facts, messages, events, consents, tokens.
  Applications: applications, application_requests, application_confirmations,
  documents, product_interests.
  Plans and discovery: plans, plan_milestones, plan_checkins, plan_watches,
  need_decisions.
  Forms: form_applications, form_answers.
  Config and ops: persona_config, domain_config, catalogue_overrides,
  admin_users, push_subscriptions.
```

### A Baz turn (`baz-turn`)

1. **Load** the case: facts, applications, outstanding requirements (computed, not remembered), advisories, product interests including declined ones, persona, domain config.
2. **Gate** the latest message, with the previous Baz turn as context so short answers ("about 92k", "yes", "Emma") classify correctly. Out of scope: canned response, `request_blocked` event, stop. The Baz model never sees blocked input.
2b. **Compute the stage** from the case: `opening`, `direction`, `discovering`, `planning`, `choosing`, `applying`. Ordered, first match wins, never stored and never chosen by the model, so correcting a fact moves the conversation back by itself. The stage decides the guidance, the declared reply length, and which tools the turn is offered (§6, §63).
3. **Generate** with the system prompt in fixed order: policy (immutable) → domain → product catalogue → persona style → case digest. Stable prefix first for prompt caching. Stream over SSE.
4. **Persist** messages, validated facts and events. Recompute requirements.

## Invariants

Never weaken one of these to make a demo step work. Fix the data or the flow instead.

1. **The model proposes, the UI commits.** The model has no tool that creates, submits, pauses or resumes an application, grants consent, invites a partner or makes a declaration. It renders a card; the customer's tap calls `case-action`, which validates session access, state, required information and business rules (§27, §48).
2. **State comes from the database.** Every status Baz states must appear in the case digest built from controlled data (§14). Status cards render from the DB independently of model text. Baz reports an action only after `case-action` confirms it (§59).
3. **What is outstanding is computed.** `outstanding(journey, facts)` in `_shared/domain` decides what an application still needs. The model decides only how to ask (§8).
4. **The gate is enforcement.** Domain restriction is a classifier plus deterministic checks in front of the model, not a prompt instruction (§25). Blocked responses are short and never contain the answer (§26).
5. **Persona is style only.** Persona composes into a labelled style block after policy. It cannot change scope, tools, rules or protections (§18). Sensitive turns force humour, sarcasm, playfulness and poetic to zero.
6. **No sensitive inference.** Protection health data is collected only through an explicit structured form with consent. `record_facts` rejects any fact marked `extractable: false` (§7.5, §11).
7. **Partner isolation.** The partner never reads tables directly. `partner` returns scoped DTOs: their own tasks, their own facts, the names and states of applications they are party to. Never the primary's conversation or facts (§33).
8. **Nothing sensitive in URLs.** Links carry opaque single-use tokens: 128-bit random, stored hashed, short TTL, consumed on redemption (§29, §58).
9. **Everything significant writes an event.** Every item in §52 is an `events` row with actor (`customer | partner | model | admin | system`). Metrics are derived from events.
10. **Synthetic data only.** No real credentials, no real BOI auth, no real customer data. The simulated login accepts anything and says so.
11. **Baz is portable.** `src/baz/**` and `_shared/domain/**` never import from `src/shells/boi/**` or `_shared/tenants/boi/**`. Tenant config is injected. Enforced with ESLint `no-restricted-imports` (§32).

## Domain model

All domain logic is pure TypeScript in `supabase/functions/_shared/domain/`, imported by Edge Functions (relative paths) and by the app (`@domain` alias). No Deno or browser APIs in this folder. The only third-party import allowed is bare `zod`, mapped in the functions' Deno import config and pinned to the same major version as the app.

### Facts

A fact is a typed value about a subject, with provenance.

```ts
type Fact = {
  key: FactKey;                 // from the catalogue, never free text
  subject: ParticipantId | 'household';
  value: unknown;               // validated by the catalogue schema for key
  source: 'customer_stated' | 'partner_stated' | 'bank_held'
        | 'document_extracted' | 'document_verified' | 'system_derived';
  verified: boolean;
  capturedFor: ApplicationId | null;  // used for questions-avoided
  supersededBy: FactId | null;
};
```

The catalogue (`facts.ts`) defines each key once:

```ts
'income.annualBasic': {
  schema: z.number().int().positive(),
  subject: 'person',
  reuse: 'confirm',          // auto | confirm | fresh | never
  sensitivity: 'standard',   // standard | special
  extractable: true,
},
```

Person-specific data is handled by `subject`: the primary's income never satisfies the partner's income requirement.

### Journeys

One file per product in `journeys/`, translated from the recordings (§8). Each requirement references a fact key or is a declaration, document or confirmation. Per-requirement reuse policy overrides the catalogue default.

```ts
export const creditCard = defineJourney({
  product: 'credit_card',
  status: 'draft',                         // 'draft' until matched to recording
  source: 'recording: <file> @ mm:ss',
  requirements: [
    { id: 'address', fact: 'identity.address', subject: 'primary', reuse: 'confirm' },
    { id: 'income', fact: 'income.annualBasic', subject: 'primary' },
    { id: 'declaration', kind: 'declaration', fresh: true },
  ],
  branches: [ /* conditional requirements */ ],
});
```

Products: `mortgage`, `joint_account`, `credit_card`, `personal_loan`, `protection`,
`current_account`, `savings` (§7). Seven journeys, all `status: 'draft'`.

### Application state machine

`state-machine.ts` holds the transition table. The only path to a state change is `transition(app, event)`, called from Edge Functions. Clients cannot update `applications`.

States (§13): `not_started`, `in_progress`, `waiting_customer`, `waiting_partner`, `ready`, `submitted`, `under_review`, `info_required`, `approved`, `declined`, `paused`, `completed`. `paused` stores `resumeTo`. `ready → submitted` requires a customer confirmation from the review card.

### Advisories

Deterministic rules in `advisories.ts`, not model judgement. Required: `loan_vs_mortgage` fires when a personal loan is progressing while a mortgage is active. Baz explains; the advisory card offers Pause or Continue (§6 Stage 8).

### Questions avoided

A requirement satisfied by a fact that was bank-held or captured for a different application writes a `context_reused` event. The metric is the count (§53). Pure function, fully tested.

### Product catalogue

`_shared/tenants/boi/products.ts`: names, plain-language descriptions, eligibility notes, illustrative terms clearly marked synthetic. Baz states product details only from this catalogue (§51).

### Product interests

`offered | accepted | declined | deferred`. Declined products are listed in the case digest as "do not raise again" (§49).

### Digital forms

Baz reads the bank's own published form definitions and is another renderer of them. Two are
snapshotted: `1833` SuperSaver (499 fields) and `1940` personal loan (418). Adding a third is a
snapshot plus two rows in `tenants/boi/forms/mapping.ts`; nothing in `_shared/domain/forms`
knows a form id.

- `definition.ts` parses the published JSON. Operators are `is`, `isnot`, `>`, `<`.
- `logic.ts` decides what applies. **Most branching is on the page, not the field**: a page
  break gates every field carrying its `pageNumber`.
- `calculations.ts` evaluates the definition's own formulas (`{:179}+{:218}`) with a
  hand-written four-operator parser. Never `eval`, never the model.
- `state.ts` settles: defaults, then calculations, then active fields, repeat. Stale answers on
  abandoned branches are dropped.
- `ndi.ts` handles the calculating controls, each declaring its fidelity:
  `source_faithful | fixture | unsupported`. Repayments are computed from the control's own
  declared inputs; **eligibility is always a fixture** and the model can never set it.
- `submission.ts` builds the ordered FormData packet. **Nothing ever POSTs it.** The endpoint is
  recorded as intended-destination metadata.

Facts are canonical and each form has its own adapter table: the two forms share two toscana
names out of 120 and 154, and a name is not unique within a form either, so destinations
resolve against the live branch. Never prefill a `hidden` field. Where several fields share a
name, required ones win.

Answers that are not facts (a form-specific question, a declaration, a document reference) live
in `form_answers`, with the wording for consents. `form_applications.answers` is the merge,
facts last.

A declaration can only be made by tapping the card; `record_form_answers` refuses a checkbox or
an upload whatever it is sent. Document manifests leave `x-file-hash` and `x-signed-file-hash`
null, because the service issuing them is not ours.

## Baz model tools

Every tool input is Zod-validated before any effect. Invalid input returns a tool error to the model and is never thrown to the user.

- `record_facts`: facts from the conversation. Server checks catalogue key, `extractable`, value schema; writes `customer_stated` or `partner_stated`.
- `show_product_options`: product ids plus one-line reasons tied to what the customer said. Selection happens in the card.
- `show_review`: application id. The server builds the review content from DB data, not model text.
- `show_pause_prompt`: application id. Customer confirms in the card.
- `request_upload`: an existing open `application_request` only.
- `show_partner_invite`: application ids the partner is needed for.
- `show_status`: renders the DB status card.
- `record_form_answers`: an answer to the bank form's own question. Server checks the field is
  live, is a question, and that a choice value is one the form offers. Refuses declarations and
  uploads outright.
- `show_form_declarations`: the form's declarations, in its published wording, for the customer
  to tick. The model supplies no text.
- `show_form_upload`: the next document the form wants, with the control's own size and type
  limits.
- `show_form`: the next form an application needs. The model names the application only; which
  form is due is decided for it.
- `propose_plan`: offers to keep a goal that outlives any one application. Nothing is kept until
  the customer taps.
- `show_comparison`: two to four catalogue products side by side. Nothing is started by tapping.
- `show_quote`: what something costs, pays or takes. Any two of amount, months and monthly is
  enough; the server works out the third. The model never does the arithmetic.
- `show_mortgage_rates`: the published rate table, indexed by customer type, BER, amount and
  term. All four required, so the model must ask rather than quote a range. The server decides
  which rates are shown and computes the repayments.

Fifteen tools. **Which ones a turn is offered is decided by the conversation's stage** - the
form tools are gated further on a form existing. Withholding a tool is enforcement; telling the
model not to use one is advice.

Stream events are a Zod discriminated union: `text_delta | card | status | done | error`.

## Guardrails (§19 to §27, §39, §47)

Gate output:

```ts
{ category: 'banking' | 'ambiguous' | 'general_knowledge' | 'competitor'
          | 'off_topic' | 'abusive' | 'prompt_injection' | 'unsupported',
  profanity: boolean, sensitive: boolean }
```

- Deterministic pre-checks first: input length cap, empty input, known injection patterns (flagged, still classified).
- `banking` → Baz. `ambiguous` → Baz, instructed to clarify within banking scope. Profanity with banking intent is `banking` (§23).
- Everything else → canned response from `refusals.ts`, keyed by category and persona tone bucket.
- Classifier error or timeout fails closed with a short retry message.
- `max_tokens` on Baz is low enough that "count to 10,000" cannot succeed even if it slips through.
- `sensitive: true` zeroes humour for that turn and suppresses product offers (§50).
- Output re-classification is not in v1. Add it only if evals show leaks.

## Persona (§16 to §18, §38, §56)

- Sliders 0 to 1: `length`, `humour`, `sarcasm`, `formality`, `playfulness`, `poetic`.
- Presets are named slider sets: default, concise, friendly, formal, dry humour, poetic. Custom means custom slider values. No free-text persona instructions.
- `persona.ts` maps sliders to fixed prose fragments. Snapshot-tested.
- Read fresh every turn so admin changes apply immediately.
- Baz always discloses it is AI and never claims to be human.

## Identity, sessions and continuity (§12, §28, §29)

- Every visitor gets a Supabase anonymous user. `participant_sessions` maps auth users to a participant, so one participant can span browser contexts (Safari and an installed PWA have separate storage on iOS).
- Public → app: `session` issues a handoff code → `/#/app/login?h=<code>` → simulated BOI login → redeem: attach the new session to the same participant, link the case to the synthetic customer, set `auth_level = authenticated`, load bank-held facts.
- Bank-held facts are not re-asked unless the journey requirement says `confirm` or `fresh` (§6 Stage 5).
- Admins use real Supabase email auth plus an `admin` role, checked client-side for routing and server-side on every `admin` call.

## Partner (§6 Stage 9, §33)

- Invite link carries a single-use token. Redemption creates a partner participant with its own anonymous session.
- v1 partner experience: task list with RHF forms and uploads. Baz in partner mode is a stretch goal.
- One partner answer (e.g. income, employment) writes one fact that satisfies requirements in every application the partner is party to. The demo must show this.
- Partner completion writes events and updates the primary's case via Realtime.

## Events, notifications, return (§6 Stages 11 to 13, §35, §36, §42)

- Admin simulates downstream events through the state machine. No random timers.
- Sending a notification is a separate explicit admin action, over Web Push. The console can send the fixed copy or write its own.
- The copy contains nothing about the application. Link: `/#/app?n=<code>`, carrying an opaque single-use token.
- On return, `baz-turn` runs with a `return` trigger: the digest includes events since `last_seen_at`. Baz phrases the summary; the status card renders from DB beside it.
- `src/components/NotificationCard.tsx` is a simulated lock-screen notification, kept as a
  filming fallback. **Nothing renders it**: push has been confirmed arriving on a real phone,
  so it has never been needed. Wire it to an admin trigger if that changes.

## Admin console (§37 to §44)

- Case inspector: context with provenance, partner, applications, outstanding requirements, conversation, events.
- Event simulator: buttons for §41 events, each a state-machine transition.
- Notify, persona sliders and presets, domain category view, audience metrics.
- Reset restores the canonical presenter case from `_shared/domain/seed/canonical.ts`. Build a minimal reset in M1; you will need it constantly.
- Purge audience cases. Global kill switch that makes the gate return a "demo paused" response.

## Audience (§45 to §47)

- `/#/try` creates an isolated anonymous session and a new case. Options: start fresh, or clone the canonical customer (authenticated, bank-held facts present).
- Isolation is by case ownership under RLS. Audience cases can never touch the presenter case.
- Cap via env: `AUDIENCE_MAX_CASES`, customer cases created in the last 24 hours. A rate, not a
  lifetime total. No SMS.
- `AUDIENCE_MAX_TURNS` is declared but nothing reads it: there is no per-conversation turn
  limit. The cap limits how many people can start, not what any one of them can spend.
- A case created by an automated probe is tagged `kind = 'test'` through the admin-only
  `tag_test_case` action, which takes it out of the cap. Live probes go through
  `scripts/live-probe.mjs`, which tags on create and deletes on exit — twenty-five replays
  against the live model once used the day's allowance up and started refusing real visitors.

## Engineering standards

**TypeScript**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitOverride`. No `any`. No non-null `!` outside tests. `satisfies` for config objects. Discriminated unions with exhaustive `switch` and `assertNever` for states, categories, cards and stream events.

**Zod**: every Edge Function validates its request body and returns `{ ok: true, data } | { ok: false, error: { code, message } }`. Request and response schemas live in `_shared/contracts/` and types are inferred from them. Never hand-write a type that duplicates a schema.

**TanStack Query**: query key factory in `src/lib/queryKeys.ts`. No fetching in `useEffect`. Mutations invalidate by key. Realtime handlers invalidate; they do not write to the cache. The only manual cache write is the optimistic chat message.

**Zustand**: composer draft, open sheets, unsaved admin slider drafts. Never cases, applications, facts or messages.

**Forms**: React Hook Form + zodResolver + shadcn `Form` for every form.

**shadcn/ui**: add components with the CLI. Never hand-roll something shadcn provides. BOI look comes from theme tokens in `src/shells/boi/theme.css`, not per-component overrides. Mobile first at 390px wide.

**Sentry**: initialised in `main.tsx`, browser only. Never send message content or fact values. Tag `case_id`, participant role, gate category.

**Edge Function failures**: there is no Sentry on the server. A write that matters goes through `mustWrite`, which throws rather than failing silently, and anything worth explaining afterwards writes an `events` row (`tool_rejected`, `turn_tools`, `request_blocked`). This was learned the hard way: thirty-nine writes had no error check, and one of them broke §49 for a week without a symptom.

**Secrets**: nothing secret in `VITE_*`. The Anthropic key, the VAPID private key and `PRESENTER_KEY` exist only as Edge Function secrets.

**GitHub Pages**: Vite `base` from env (`/<repo>/` or `/` with a custom domain). PWA `start_url` and `scope` follow `base`. Service worker precaches the shell and uses network-only for the Supabase domain. Never cache API responses.

## Repo layout

```
docs/                       README.md is the map; start-here, dev, architecture,
                            design, features, journeys, decisions, learnings,
                            security, operations, archive
src/
  app/                      router, providers, lazy boundaries, stale-deploy
  baz/                      portable chat UI, cards/, card registry, hooks
  surfaces/                 Landing, BazScreen, HowItWorks, Privacy
  content/                  the explainer's figures, every one sourced
  partner/  admin/
  components/ui/            shadcn generated
  lib/                      supabase client, query client, queryKeys, identity, sentry
supabase/
  migrations/
  functions/
    _shared/
      domain/               facts, journeys/, state-machine, requirements,
                            advisories, metrics, seed/   (pure TS, @domain)
      contracts/            Zod request/response schemas
      llm/                  gate, prompt composer, persona, refusals, tools
      tenants/boi/          products, domain config, brand strings
    baz-turn/  case-action/  session/  partner/  admin/
e2e/                        Playwright
evals/guardrails/           cases.jsonl + runner
.github/workflows/          ci.yml, deploy-pages.yml, deploy-supabase.yml
```

## Commands

```
npm run dev                  # Vite
npx supabase start           # local Supabase
npx supabase functions serve --env-file supabase/.env.local
npm run check                # the pre-merge gate: typecheck, lint, seed, test, build, bundle scan
npm run typecheck
npm run lint
npm run test                 # Vitest
npm run typecheck:functions  # deno check; needs Deno. `tsc` cannot see the Edge Functions
npm run e2e                  # Playwright: route and render checks only (see below)
npm run eval:guardrails      # live gate against the adversarial set
```

**The fixture LLM provider.** `LLM_PROVIDER=fixture` replays a script from
`supabase/functions/baz-turn/fixtures/` instead of calling Anthropic, so a conversation can be
driven with no key and no bill. `LLM_FIXTURE` names the script; the turn within it is chosen by
how many times Baz has already spoken on the case, so a scripted conversation advances as a real
one does. Scripts are transcribed from real conversations, turn for turn. `runBazTurn` takes a
`ModelProvider` (`_shared/llm/model.ts`); the Anthropic adapter and the fixture are the only two
implementations, and `_shared` reads no environment to choose between them.

## Environment

App (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`, `VITE_BASE_PATH`.

Edge Function secrets, as actually read: `ANTHROPIC_API_KEY`, `BAZ_MODEL`, `GATE_MODEL`,
`APP_BASE_URL`, `AUDIENCE_MAX_CASES`, `PRESENTER_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_D`,
`VAPID_SUBJECT`.

Soft-read, unset in production: `LLM_PROVIDER` (`fixture` replays a script) and `LLM_FIXTURE`
(which one).

Set on the project but read nowhere: `TWILIO_*` and `SENTRY_DSN` (never built) and
`AUDIENCE_MAX_TURNS` (declared, never implemented). Removed from the `.env.example` files on
2026-10-15; `docs/dev/environment-variables.md` is the full reference.

GitHub: repo vars for the `VITE_*` values; secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

## CI and deploy

- `ci.yml` on PR: typecheck, lint, Vitest, build.
- `deploy-pages.yml` on main: build, upload Pages artifact, deploy.
- `deploy-supabase.yml` on main when `supabase/**` changes: `supabase db push`, `supabase functions deploy`.
- Playwright runs locally against `supabase start`. Move it to CI later if it earns its keep.

## Testing

- **Vitest, required**: requirement engine, reuse policies, subject matching, state machine (every legal and illegal transition), advisories, questions-avoided, persona composer, gate routing given fixed classifier outputs, token issue and redeem.
- **Playwright**: route, render and disclosure checks at iPhone viewport. It does not yet drive
  a conversation; the fixture provider (`LLM_PROVIDER=fixture`) now makes that possible.
- **Guardrail evals**: `evals/guardrails/cases.jsonl` holds a must-block set (§22, §24, §47: trivia, jokes, competitors, excessive output, injection, persona escape) and a must-allow set (profane banking questions, short contextual answers, sensitive but in-scope disclosures). 100% on both before any presentation.

## Build order

Each milestone ends deployed.

- **M0 Skeleton**: Vite, shadcn, routes for all five surfaces, Supabase project, CI, Pages deploy, browser Sentry.
- **M1 Domain core**: fact catalogue, draft journeys, requirement engine, state machine, reuse, advisories, metrics, canonical seed, minimal reset. Tests first.
- **M2 Baz turn**: gate, prompt composer, tools, SSE, chat UI, card registry, eval set.
- **M3 Applications**: product selection, concurrent applications, review and submit, loan advisory and pause.
- **M4 Continuity**: public site, handoff, simulated login, bank-held enrichment, PWA.
- **M5 Partner**: invite, tasks, cross-application partner facts.
- **M6 Return**: event simulation, Web Push, return summary.
- **M7 Admin**: inspector, notify, persona, domain view, metrics, purge, kill switch.
- **M8 Audience**: QR entry, clone, caps.
- **M9 Polish**: BOI shell fidelity, film run-through.

## Working rules

- Read the relevant § before implementing. Reference §N in commit messages.
- Domain logic goes in `_shared/domain` as pure functions, with tests written first.
- Where the spec is silent, choose the fastest credible option (§68) and add one line to `docs/decisions.md`: date, decision, §.
- Ask before adding any dependency outside the stack.
- When a journey is matched against its recording, set `status: 'final'` and fill `source`.
- A change that invalidates a document under `docs/` updates it in the same change, and bumps its
  `last_verified`. Never describe something unbuilt in the present tense.
- Any change that moves what a turn costs — prompt size, cache breakpoints or TTLs, model
  choice, tool rounds, reply length — updates `docs/04-cost-of-running-a-conversational-assistant.md`,
  including its changelog. The numbers in it are measured; do not revise them from memory.
- A live model is for checking what the model does. Layout, card ordering and copy placement
  are not that, and running a full conversation to check them is how an API budget disappears.
  Check those against `LLM_PROVIDER=fixture`, which costs nothing.

## Open items

- Journey recordings not yet translated. All journeys start as `draft`.
- Partner name: the vision doc says Sarah, the requirements say Emma. Seed uses Emma.
- Primary customer name and synthetic bank-held record: define in the seed.
- Web Push is built and delivers to a real phone. No SMS, and no plan to add it.
- Custom domain or github.io base path.
