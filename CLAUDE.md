# CLAUDE.md: Baz Conversational Banking POC

## What this is

Baz is a conversational orchestration layer over (simulated) Bank of Ireland product journeys. The customer says what they are trying to do. Baz discovers needs, the customer chooses products, facts are collected once and reused across concurrent applications, and the case persists across channels, sessions, a partner and time.

Source of truth, in `docs/`:

- `03-baz-conversational-banking-poc-requirements.md`: the spec. Cite sections as §N.
- `01-conversational-banking-poc-vision.md`: intent and tone.

Where they conflict, the requirements doc wins.

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
| SMS | Twilio, from an Edge Function |
| Tests | Vitest, Playwright |
| Monitoring | Sentry (browser and Edge Functions) |
| Hosting | GitHub Pages via GitHub Actions; hosted Supabase project |

Models are env-configured. Defaults: `BAZ_MODEL=claude-sonnet-5-5`, `GATE_MODEL=claude-haiku-4-5-20251001`.

## Architecture

```
Browser: one SPA on GitHub Pages
  /#/                public BOI site + Baz entry
  /#/app/*           authenticated mobile banking shell (PWA)
  /#/join/:token     partner experience
  /#/try             audience entry (QR)
  /#/admin/*         presenter console
    reads:  supabase-js under RLS (primary customer and admin only)
    writes: Edge Functions only
    live:   Realtime -> TanStack Query invalidation

Edge Functions (service role; hold ANTHROPIC_API_KEY, Twilio creds)
  baz-turn      gate -> Baz model with tools -> SSE stream -> persist
  case-action   UI-committed actions: select products, submit, pause/resume,
                consent, invite partner, upload complete
  session       anonymous start, handoff codes, simulated BOI login
  partner       join via invite, scoped DTO reads, partner task submission
  admin         simulate events, send notification, reset, persona/domain
                config, case inspection, metrics

Postgres
  cases, participants, participant_sessions, customers (synthetic bank-held),
  facts, applications, application_requests, documents, product_interests,
  messages, events, consents, tokens, persona_config, domain_config
```

### A Baz turn (`baz-turn`)

1. **Load** the case: facts, applications, outstanding requirements (computed, not remembered), advisories, product interests including declined ones, persona, domain config.
2. **Gate** the latest message, with the previous Baz turn as context so short answers ("about 92k", "yes", "Emma") classify correctly. Out of scope: canned response, `request_blocked` event, stop. The Baz model never sees blocked input.
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

Products: `mortgage`, `joint_account`, `credit_card`, `personal_loan`, `protection` (§7).

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

## Baz model tools

Every tool input is Zod-validated before any effect. Invalid input returns a tool error to the model and is never thrown to the user.

- `record_facts`: facts from the conversation. Server checks catalogue key, `extractable`, value schema; writes `customer_stated` or `partner_stated`.
- `show_product_options`: product ids plus one-line reasons tied to what the customer said. Selection happens in the card.
- `show_review`: application id. The server builds the review content from DB data, not model text.
- `show_pause_prompt`: application id. Customer confirms in the card.
- `request_upload`: an existing open `application_request` only.
- `show_partner_invite`: application ids the partner is needed for.
- `show_status`: renders the DB status card.

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
- Sending the SMS is a separate explicit admin action. Only for participants with an SMS consent. Disabled for audience sessions.
- SMS copy is fixed and contains nothing about the application. Link: `/#/app?n=<code>`, which requires the simulated login before showing anything.
- On return, `baz-turn` runs with a `return` trigger: the digest includes events since `last_seen_at`. Baz phrases the summary; the status card renders from DB beside it.
- Fallback if SMS delivery is unreliable for filming: an in-app simulated lock-screen notification component, triggered from admin.

## Admin console (§37 to §44)

- Case inspector: context with provenance, partner, applications, outstanding requirements, conversation, events.
- Event simulator: buttons for §41 events, each a state-machine transition.
- Notify, persona sliders and presets, domain category view, audience metrics.
- Reset restores the canonical presenter case from `_shared/domain/seed/canonical.ts`. Build a minimal reset in M1; you will need it constantly.
- Purge audience cases. Global kill switch that makes the gate return a "demo paused" response.

## Audience (§45 to §47)

- `/#/try` creates an isolated anonymous session and a new case. Options: start fresh, or clone the canonical customer (authenticated, bank-held facts present).
- Isolation is by case ownership under RLS. Audience cases can never touch the presenter case.
- Caps via env: turns per session, concurrent audience cases. No SMS.

## Engineering standards

**TypeScript**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitOverride`. No `any`. No non-null `!` outside tests. `satisfies` for config objects. Discriminated unions with exhaustive `switch` and `assertNever` for states, categories, cards and stream events.

**Zod**: every Edge Function validates its request body and returns `{ ok: true, data } | { ok: false, error: { code, message } }`. Request and response schemas live in `_shared/contracts/` and types are inferred from them. Never hand-write a type that duplicates a schema.

**TanStack Query**: query key factory in `src/lib/queryKeys.ts`. No fetching in `useEffect`. Mutations invalidate by key. Realtime handlers invalidate; they do not write to the cache. The only manual cache write is the optimistic chat message.

**Zustand**: composer draft, open sheets, unsaved admin slider drafts. Never cases, applications, facts or messages.

**Forms**: React Hook Form + zodResolver + shadcn `Form` for every form.

**shadcn/ui**: add components with the CLI. Never hand-roll something shadcn provides. BOI look comes from theme tokens in `src/shells/boi/theme.css`, not per-component overrides. Mobile first at 390px wide.

**Sentry**: initialised in `main.tsx` and in each Edge Function. Never send message content or fact values. Tag `case_id`, participant role, gate category.

**Secrets**: nothing secret in `VITE_*`. Anthropic and Twilio keys exist only as Edge Function secrets.

**GitHub Pages**: Vite `base` from env (`/<repo>/` or `/` with a custom domain). PWA `start_url` and `scope` follow `base`. Service worker precaches the shell and uses network-only for the Supabase domain. Never cache API responses.

## Repo layout

```
docs/                       vision, requirements, decisions.md
src/
  app/                      router, providers
  baz/                      portable chat UI, card registry, hooks
  shells/boi/               public site, mobile banking shell, theme, assets
  partner/  admin/  audience/
  components/ui/            shadcn generated
  lib/                      supabase client, query client, queryKeys, sentry
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
npm run typecheck
npm run lint
npm run test                 # Vitest
npm run e2e                  # Playwright against local stack, LLM_PROVIDER=fixture
npm run eval:guardrails      # live gate against the adversarial set
```

`LLM_PROVIDER=fixture` exists for tests only. It is never used for demos or filming.

## Environment

App (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`, `VITE_BASE_PATH`.

Edge Function secrets: `ANTHROPIC_API_KEY`, `BAZ_MODEL`, `GATE_MODEL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `SENTRY_DSN`, `APP_BASE_URL`, `AUDIENCE_MAX_TURNS`, `AUDIENCE_MAX_CASES`, `LLM_PROVIDER`.

GitHub: repo vars for the `VITE_*` values; secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

## CI and deploy

- `ci.yml` on PR: typecheck, lint, Vitest, build.
- `deploy-pages.yml` on main: build, upload Pages artifact, deploy.
- `deploy-supabase.yml` on main when `supabase/**` changes: `supabase db push`, `supabase functions deploy`.
- Playwright runs locally against `supabase start`. Move it to CI later if it earns its keep.

## Testing

- **Vitest, required**: requirement engine, reuse policies, subject matching, state machine (every legal and illegal transition), advisories, questions-avoided, persona composer, gate routing given fixed classifier outputs, token issue and redeem.
- **Playwright**: the §55 film sequence end to end with fixture LLM, at iPhone viewport, including partner in a second browser context and admin-triggered events.
- **Guardrail evals**: `evals/guardrails/cases.jsonl` holds a must-block set (§22, §24, §47: trivia, jokes, competitors, excessive output, injection, persona escape) and a must-allow set (profane banking questions, short contextual answers, sensitive but in-scope disclosures). 100% on both before any presentation.

## Build order

Each milestone ends deployed.

- **M0 Skeleton**: Vite, shadcn, routes for all five surfaces, Supabase project, CI, Pages deploy, Sentry.
- **M1 Domain core**: fact catalogue, draft journeys, requirement engine, state machine, reuse, advisories, metrics, canonical seed, minimal reset. Tests first.
- **M2 Baz turn**: gate, prompt composer, tools, SSE, chat UI, card registry, eval set.
- **M3 Applications**: product selection, concurrent applications, review and submit, loan advisory and pause.
- **M4 Continuity**: public site, handoff, simulated login, bank-held enrichment, PWA.
- **M5 Partner**: invite, tasks, cross-application partner facts.
- **M6 Return**: event simulation, SMS, return summary.
- **M7 Admin**: inspector, notify, persona, domain view, metrics, purge, kill switch.
- **M8 Audience**: QR entry, clone, caps.
- **M9 Polish**: BOI shell fidelity, film run-through.

## Working rules

- Read the relevant § before implementing. Reference §N in commit messages.
- Domain logic goes in `_shared/domain` as pure functions, with tests written first.
- Where the spec is silent, choose the fastest credible option (§68) and add one line to `docs/decisions.md`: date, decision, §.
- Ask before adding any dependency outside the stack.
- When a journey is matched against its recording, set `status: 'final'` and fill `source`.
- Any change that moves what a turn costs — prompt size, cache breakpoints or TTLs, model
  choice, tool rounds, reply length — updates `docs/04-cost-of-running-a-conversational-assistant.md`,
  including its changelog. The numbers in it are measured; do not revise them from memory.
- Verify with `LLM_PROVIDER=fixture` by default. A live model is for checking what the model
  does. Layout, card ordering and copy placement are not that, and running a full conversation
  to check them is how an API budget disappears.

## Open items

- Journey recordings not yet translated. All journeys start as `draft`.
- Partner name: the vision doc says Sarah, the requirements say Emma. Seed uses Emma.
- Primary customer name and synthetic bank-held record: define in the seed.
- SMS sender and Irish delivery: test in week one, not the week of filming.
- Custom domain or github.io base path.
