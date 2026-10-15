---
title: Repository hardening (source definition)
status: historical
scope: poc
last_verified: 2026-10-15
note: >-
  Source material, written before the work and in the future tense. NOT a
  description of the current state. Partly delivered. See docs/learnings/repository-cleanup.md
---

# Baz Feature Definition — Repository Hardening, Documentation System & Source-Available Handoff

**Status:** Proposed  
**Scope:** POC hardening / developer handoff  
**Primary outcome:** Turn the Baz POC from a fast-moving prototype repository into a clean, navigable, well-documented project that another developer can clone, understand, run, modify and extend safely.

---

## 1. Why this feature exists

Baz has reached the point where the quality of the repository matters almost as much as the quality of the POC.

The project has evolved quickly, changed direction several times, accumulated feature-definition documents, experiments and implementation residue, and now contains a significant amount of product and architecture thinking that is not yet organised into a coherent developer experience.

The next phase should therefore do three things:

1. **Clean and rationalise the codebase**
2. **Build a best-in-class documentation system from the current project facts**
3. **Prepare the repository for safe public/source-available use and easy local experimentation**

The target is not merely a tidy repository.

The target is:

> **A project another capable developer can clone, understand in an hour, run in minutes, and improve without needing the original author beside them.**

---

# 2. Core principles

## 2.1 Preserve behaviour while restructuring

Repository cleanup is not a feature rewrite.

The cleanup phase should:

- preserve current POC behaviour;
- preserve existing routes and public interfaces unless explicitly approved;
- preserve working data contracts;
- move/rename/refactor incrementally;
- add tests or verification where missing before moving critical code;
- avoid combining structural cleanup with unrelated product changes.

Every structural change should leave the application runnable.

---

## 2.2 Documentation is reconstructed from the product, not invented

The docs directory should become the written model of the current POC.

It should be built by inspecting:

- source code;
- routes;
- database schema;
- environment variables;
- Supabase migrations;
- tool definitions;
- prompts;
- feature state;
- UI behaviour;
- existing feature-definition documents;
- captured Digital Forms journey definitions;
- tests;
- configuration;
- deployment scripts;
- git history where useful.

The agent doing this work must not silently turn future ideas into current-state documentation.

Each document should distinguish between:

- **Current POC**
- **Demonstrated / verified**
- **Production direction**
- **Historical / superseded**
- **Open question**

---

## 2.3 The repository should explain itself

A developer should not need tribal knowledge to answer:

- What is Baz?
- How does the app start?
- Where does conversation state live?
- Where do prompts live?
- Where are tools defined?
- How are guardrails enforced?
- How does authentication work?
- How does Supabase fit in?
- How are product journeys modelled?
- How do Digital Forms examples work?
- What is synthetic/demo-only?
- Which parts are deterministic?
- What is deliberately not implemented?
- How do I add a feature?
- How do I run without Bank of Ireland dependencies?
- How do I use my own AI account?
- How do I use my own Supabase project?

The repository and docs should answer these directly.

---

# 3. Workstream A — Codebase cleanup

## 3.1 Begin with an inventory

Before moving anything, generate a repository inventory.

Include:

```text
routes
entry points
features
components
services
hooks
prompts
tools
database access
API handlers
fixtures
tests
scripts
static assets
configuration
environment variables
generated files
dead/unused candidates
duplicate implementations
```

Create:

```text
docs/dev/repository-inventory.md
```

This is a temporary-but-useful map of what existed before restructuring and what moved where.

---

## 3.2 Target source structure

Do not force this exact structure if the current implementation suggests a better one, but the end result should follow these boundaries.

Recommended shape:

```text
/
├── README.md
├── LICENSE
├── COMMERCIAL-LICENSING.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── NOTICE.md
├── .env.example
├── package.json
├── vite.config.ts
│
├── src/
│   ├── app/
│   │   ├── routes/
│   │   ├── providers/
│   │   └── shell/
│   │
│   ├── features/
│   │   ├── conversation/
│   │   ├── goals/
│   │   ├── forms/
│   │   ├── authentication/
│   │   ├── documents/
│   │   ├── guardrails/
│   │   ├── persona/
│   │   └── admin/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── services/
│   │   ├── ai/
│   │   ├── data/
│   │   ├── banking/
│   │   └── telemetry/
│   │
│   ├── lib/
│   ├── hooks/
│   ├── config/
│   ├── types/
│   ├── fixtures/
│   └── styles/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── README.md
│
├── scripts/
│   ├── bootstrap/
│   ├── doctor/
│   └── demo/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
```

If the current app is small enough that some of these layers would create unnecessary ceremony, collapse them.

The goal is **clear ownership and discoverability**, not maximum folder count.

---

## 3.3 Feature-first boundaries

Business/product behaviour should generally live under `src/features`.

Example:

```text
src/features/forms/
  components/
  hooks/
  services/
  serializers/
  types.ts
  index.ts
```

Avoid a structure where all:

```text
components
hooks
services
types
```

for the entire application are mixed globally.

Shared primitives should only move to shared folders after they genuinely serve multiple features.

---

## 3.4 Dependency direction

Use an explicit dependency rule:

```text
app
 ↓
features
 ↓
services / shared components
 ↓
lib / config / types
```

Lower-level modules should not import application/page-level code.

Avoid circular feature dependencies.

Where two features need to collaborate, prefer:

- a service boundary;
- shared domain type;
- orchestration at the app layer.

---

## 3.5 Remove prototype residue

Identify and deal with:

- unused files;
- abandoned feature branches copied into source;
- duplicate components;
- commented-out implementations;
- stale fixtures;
- obsolete environment variables;
- debugging code;
- hard-coded demo data outside fixtures;
- unused dependencies;
- temporary browser interception utilities;
- obsolete prompts;
- stale screenshots/assets.

Do not delete uncertain code silently.

Create a cleanup report first:

```text
docs/learnings/repository-cleanup.md
```

with:

```text
Removed
Moved
Merged
Deprecated
Retained deliberately
Needs decision
```

---

# 4. Workstream B — Documentation system

The `docs/` directory becomes a first-class part of the product.

It should not be a feature-definition dumping ground.

It should mirror how the project is understood.

Recommended structure:

```text
docs/
├── README.md
│
├── start-here/
│   ├── what-is-baz.md
│   ├── quick-start.md
│   ├── project-status.md
│   └── glossary.md
│
├── dev/
│   ├── development-principles.md
│   ├── building-pocs-with-ai.md
│   ├── repository-structure.md
│   ├── local-development.md
│   ├── environment-variables.md
│   ├── testing.md
│   ├── debugging.md
│   ├── working-with-fixtures.md
│   └── repository-inventory.md
│
├── architecture/
│   ├── overview.md
│   ├── conversation-runtime.md
│   ├── ai-boundary.md
│   ├── tool-system.md
│   ├── guardrails.md
│   ├── data-model.md
│   ├── authentication.md
│   ├── customer-context.md
│   ├── digital-forms.md
│   ├── submission-generation.md
│   └── deployment.md
│
├── design/
│   ├── principles.md
│   ├── visual-language.md
│   ├── tokens.md
│   ├── typography.md
│   ├── components.md
│   ├── conversation-design.md
│   ├── motion.md
│   └── accessibility.md
│
├── features/
│   ├── conversation.md
│   ├── customer-plans.md
│   ├── goals-and-needs.md
│   ├── guardrails.md
│   ├── persona-studio.md
│   ├── authentication.md
│   ├── document-upload.md
│   ├── admin-console.md
│   ├── digital-forms-integration.md
│   └── how-it-works-site.md
│
├── journeys/
│   ├── README.md
│   ├── supersaver-1833.md
│   ├── personal-loan-1940.md
│   └── fixtures/
│
├── decisions/
│   ├── README.md
│   └── ADR-0001-*.md
│
├── learnings/
│   ├── README.md
│   ├── product-pivots.md
│   ├── prompt-caching.md
│   ├── model-routing.md
│   ├── tool-schema-cost.md
│   ├── timeout-vs-cancellation.md
│   ├── digital-forms-discovery.md
│   └── repository-cleanup.md
│
├── security/
│   ├── threat-model.md
│   ├── secrets-and-config.md
│   ├── synthetic-data.md
│   ├── responsible-disclosure.md
│   └── public-repository-review.md
│
├── operations/
│   ├── deployment.md
│   ├── troubleshooting.md
│   ├── demo-reset.md
│   └── runbooks.md
│
└── archive/
    └── superseded/
```

Additional categories may be introduced where the project facts justify them.

---

# 5. Documentation rules

## 5.1 Every document should answer a specific question

Bad:

```text
docs/architecture/misc.md
docs/features/notes.md
```

Good:

```text
docs/architecture/how-tools-are-authorised.md
docs/features/customer-plans.md
```

---

## 5.2 Use project evidence

Where practical, docs should point developers toward the implementation that proves the statement.

Example:

```md
Implementation:
- `src/features/forms/services/submission-builder.ts`
- `src/features/forms/types.ts`
```

Do not copy large code blocks merely to keep docs synchronised.

Explain the architecture and link to its implementation.

---

## 5.3 Add document metadata

Recommended frontmatter:

```yaml
---
title: Digital Forms integration
status: current
scope: poc
last_verified: 2026-10-14
owners:
  - project
sources:
  - src/features/forms/
  - docs/journeys/supersaver-1833.md
---
```

Suggested `status` values:

```text
current
draft
historical
superseded
```

Suggested `scope` values:

```text
poc
production-direction
shared
```

---

## 5.4 Current fact vs future direction

Use explicit callouts.

Example:

```md
> [!POC]
> The current POC generates a submission package but does not transmit it.

> [!PRODUCTION DIRECTION]
> A production implementation could integrate directly with an approved
> Digital Forms submission service.
```

Never present a production aspiration as implemented fact.

---

# 6. `docs/dev` — how we build POCs with AI

This area should capture the development method behind Baz.

It should be genuinely useful to another developer or AI coding agent.

Recommended `building-pocs-with-ai.md` principles:

## Human responsibility

Humans own:

- problem definition;
- product thesis;
- system boundaries;
- architecture;
- security/risk;
- acceptance criteria;
- taste;
- final decisions.

## AI responsibility

AI is used to accelerate:

- code generation;
- scaffolding;
- refactoring;
- test generation;
- code review;
- documentation;
- fixture creation;
- analysis;
- UI iteration.

## Working loop

```text
1. Understand existing state
2. Write/confirm feature definition
3. Identify affected boundaries
4. Implement the smallest coherent slice
5. Run typecheck/lint/tests/build
6. Inspect behaviour
7. Record new facts/learnings
8. Update docs
9. Commit
```

## Rules for AI coding agents

- inspect before editing;
- never assume file names or interfaces;
- preserve existing working behaviour;
- use existing patterns where good;
- simplify where accidental complexity exists;
- never expose secrets;
- never use real customer data;
- do not call production banking write endpoints;
- prefer deterministic code for rules and validation;
- update relevant docs when behaviour changes;
- explain architectural changes in an ADR when material.

---

# 7. Architecture Decision Records

Add:

```text
docs/decisions/
```

Use lightweight ADRs for material choices.

Template:

```md
# ADR-XXXX — Decision title

## Status
Accepted

## Context

## Decision

## Alternatives considered

## Consequences

## Revisit when
```

Candidate ADRs to reconstruct from the existing POC:

- conversation-first consumer UI;
- AI vs deterministic execution boundary;
- POC submissions are generated but never sent;
- Supabase as POC persistence layer;
- synthetic-only demo data;
- Digital Forms as reused journey capability;
- progressive authentication;
- customer plans outlive applications.

Do not fabricate historical dates if they are not known.

---

# 8. Workstream C — Developer experience

The public/source-available repository should be easy to run.

Target:

```bash
git clone <repo>
cd baz
npm install
cp .env.example .env.local
npm run dev
```

A new developer should reach a useful page without needing hidden infrastructure.

---

## 8.1 Zero-dependency demo mode

Strong recommendation:

Provide a mode that works without:

- a real AI account;
- Supabase;
- Bank of Ireland systems.

Example:

```env
BAZ_MODE=demo
```

Demo mode uses:

- synthetic customer;
- fixture conversations;
- local/in-memory persistence;
- captured/redacted form definitions;
- generated-not-sent submission fixtures.

This makes the repository immediately explorable.

---

## 8.2 Bring-your-own AI provider

Configuration should make AI replaceable.

Example:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=
```

API keys must remain server-side.

Never expose provider secrets through `VITE_*` client variables.

Where practical, isolate provider-specific implementation:

```text
src/services/ai/
  provider.ts
  openai.ts
```

Future providers can implement the same interface.

---

## 8.3 Bring-your-own Supabase

Provide:

```text
supabase/migrations/
supabase/seed.sql
supabase/README.md
```

Document:

1. create Supabase project;
2. copy project URL / anon key;
3. apply migrations;
4. load synthetic seed data;
5. configure redirect URLs if auth is enabled;
6. start Baz.

No private production schema dump should be included.

---

## 8.4 `.env.example`

The example file must:

- contain every supported variable;
- contain no secret values;
- indicate required vs optional;
- indicate demo vs connected mode;
- group variables logically.

Example:

```env
# Runtime
BAZ_MODE=demo

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional telemetry
TELEMETRY_ENABLED=false
```

Confirm actual names against the codebase before publishing.

---

## 8.5 Developer scripts

Recommended scripts:

```text
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run check
npm run doctor
npm run demo:reset
```

`npm run check` should run the standard pre-merge quality gate.

`doctor` should check common setup errors without exposing secrets.

---

# 9. Root README

The README should be concise and excellent.

Recommended structure:

```text
# Baz

A personal banker for everyone.

[short screenshot / GIF]

What Baz is
What this repository is
What it is not

Quick start
  Demo mode
  Connect your own OpenAI account
  Connect Supabase

Architecture at a glance

Project status

Documentation

Contributing

Security

License
```

Do not turn the README into the full architecture document.

Link to `/docs`.

---

# 10. Public repository hygiene

Before any public release, perform a dedicated publication review.

Search the full repository and history for:

- API keys;
- access tokens;
- cookies;
- auth headers;
- service-role keys;
- passwords;
- private URLs;
- customer information;
- real PPSNs;
- real bank account numbers;
- real IBANs;
- real phone/email values;
- uploaded documents;
- signed upload hashes;
- internal-only documents;
- proprietary Bank of Ireland content;
- confidential screenshots;
- internal hostnames;
- production credentials;
- `.env` files.

Use automated secret scanning and a manual review.

If sensitive values ever existed in Git history, removing them from the current tree is not enough.

Rewrite history or create a clean public repository/export as appropriate.

Rotate any credential that may have been exposed.

---

# 11. Bank / brand separation

Public source should not accidentally imply that it is an official Bank of Ireland supported product unless that has been approved.

Recommended disclaimer:

```text
Baz is a proof-of-concept project exploring conversational banking.
It is not a production banking service.
```

If Bank of Ireland trademarks, logos, brand assets, product content or proprietary material are present, obtain approval before redistributing them.

Where necessary:

- replace branding with neutral/demo assets;
- keep adapters but remove protected assets;
- provide synthetic fixtures rather than copied production material.

---

# 12. Licensing — important terminology

The requested licensing goal is:

> Anyone can inspect, clone, modify and experiment with the project, but they may not commercialise it without permission/remuneration.

That is **not OSI Open Source**.

An OSI-compliant open-source licence must permit commercial use.

Therefore the public project should be described accurately as:

> **source-available**

unless the commercial restriction is removed.

---

# 13. Recommended licensing approach

Do not select or publish a licence until ownership of the code has been confirmed.

If the licensing goal remains:

- public source;
- non-commercial experimentation allowed;
- modification allowed;
- redistribution allowed;
- commercialisation requires a separate agreement;

then a standard starting point to review is:

```text
PolyForm Noncommercial 1.0.0
```

However, this may not automatically permit Bank of Ireland to take the code forward for internal business use, because internal corporate use is not necessarily non-commercial.

Therefore the likely model is:

```text
Public users
→ standard source-available non-commercial licence

Bank of Ireland / authorised colleagues
→ separate internal-use licence/grant

Commercial third parties
→ separate commercial licence
```

The project should include:

```text
LICENSE
COMMERCIAL-LICENSING.md
NOTICE.md
```

Potentially also:

```text
INTERNAL-USE-GRANT.md
```

but only after legal review.

---

# 14. Ownership review before publication

This step is mandatory.

Before the repository is made public, establish who owns the relevant IP.

Questions include:

- Was the project created as part of employment duties?
- Was Bank equipment/time/information used?
- Does the employment contract assign inventions/software to the employer?
- Does Bank of Ireland own any code, copy, design, schemas or assets in the repository?
- Are third-party components compatible with the intended licence?
- Can the `Baz` name/branding be distributed?
- Can Bank product journey definitions be redistributed publicly?

Do not assume the author has unilateral licensing rights.

Get the appropriate Legal/IP approval before publication.

---

# 15. Contribution model

Add `CONTRIBUTING.md`.

Keep it welcoming and lightweight.

Include:

```text
How to run the project
How to choose an issue
Branch naming
Code style
Tests expected
Documentation expected
Pull request checklist
How to propose architecture changes
```

Recommended PR checklist:

```text
[ ] app builds
[ ] typecheck passes
[ ] lint passes
[ ] tests pass
[ ] no secrets or real customer data
[ ] docs updated where behaviour changed
[ ] new architecture decisions documented where material
[ ] demo mode still works
```

---

# 16. Security

Add `SECURITY.md`.

Include:

- supported versions;
- how to report a vulnerability privately;
- do not create public issues containing credentials/customer data;
- POC status;
- known non-production limitations.

Also create:

```text
docs/security/threat-model.md
```

The public repository should default to safe behaviour.

---

# 17. Synthetic data policy

All included examples must be synthetic.

Add:

```text
docs/security/synthetic-data.md
```

Rules:

- no real names unless intentionally fictional/public;
- no real account identifiers;
- no real PPSNs;
- no real phone numbers;
- no real customer documents;
- no reusable auth tokens;
- no production signed hashes.

Fixtures should make their synthetic nature obvious.

---

# 18. Archive the existing documentation safely

Do not simply delete the current feature-definition dump.

Process:

1. inventory every existing doc;
2. classify it as:
   - current;
   - source material;
   - historical;
   - superseded;
   - duplicate;
3. extract current facts into the new documentation structure;
4. move valuable superseded material into:
   ```text
   docs/archive/superseded/
   ```
5. delete only true duplicates/noise after verification.

This preserves the project story without forcing developers to navigate stale definitions.

---

# 19. Documentation index

`docs/README.md` should act as a map.

Example:

```md
# Baz documentation

## Start here
If this is your first time in the repository:
1. What is Baz?
2. Quick start
3. Architecture overview
4. Development principles

## Build
Development docs

## Understand
Architecture docs

## Change
Feature docs

## Follow a banking flow
Journey docs

## Understand why
ADRs and learnings

## Operate safely
Security and operations
```

This should make the docs feel curated rather than accumulated.

---

# 20. Verification pass

After restructuring, run a developer handoff test.

Ask a developer who has not worked on Baz to perform:

```text
1. Clone repository
2. Run demo mode
3. Find where prompts are defined
4. Find where a tool is authorised
5. Find how customer plans work
6. Find the SuperSaver journey definition
7. Add a trivial feature
8. Run tests
9. Reset demo data
```

Record where they get stuck.

Fix documentation or structure based on those failures.

The final quality measure is developer comprehension, not folder aesthetics.

---

# 21. Suggested implementation phases

## Phase 0 — Safety snapshot

- confirm working build;
- capture current behaviour;
- create cleanup branch;
- run secret scan;
- inventory source/docs;
- identify ownership/publication blockers.

## Phase 1 — Structural cleanup

- agree target tree;
- move code incrementally;
- remove confirmed dead code;
- normalise imports;
- centralise configuration;
- clean dependency list;
- preserve behaviour.

## Phase 2 — Documentation reconstruction

- build docs taxonomy;
- migrate facts from old docs;
- inspect code for undocumented behaviour;
- write architecture/features/journeys;
- add ADRs;
- archive superseded docs.

## Phase 3 — Developer experience

- demo mode;
- `.env.example`;
- provider abstraction;
- Supabase bootstrap;
- seed data;
- standard scripts;
- quick-start docs;
- setup doctor.

## Phase 4 — Public repository hardening

- synthetic data pass;
- credential/history scan;
- asset/IP review;
- disclaimers;
- contribution/security files;
- dependency/licence audit.

## Phase 5 — Licensing / publication approval

- establish IP ownership;
- choose source-available licence;
- define BOI internal-use rights if required;
- define commercial licensing path;
- obtain approval.

## Phase 6 — Handoff release

- tag first public/source-available release;
- publish release notes;
- validate clean clone;
- validate demo mode;
- run external developer handoff test.

---

# 22. Acceptance criteria

## Repository

- [ ] Source structure is logical and documented.
- [ ] No material feature behaviour changed unintentionally.
- [ ] Dead/duplicate code is removed or explicitly retained.
- [ ] Imports and module boundaries are understandable.
- [ ] Configuration is centralised.
- [ ] `npm run check` passes.

## Documentation

- [ ] `docs/README.md` provides a clear reading path.
- [ ] `start-here`, `dev`, `architecture`, `design`, `features`, `journeys`, `decisions`, `learnings`, `security`, and `operations` exist where relevant.
- [ ] Documentation describes project facts rather than imagined implementation.
- [ ] POC and production-direction content are labelled.
- [ ] Superseded definitions are archived or removed.
- [ ] Major architectural decisions have ADRs.
- [ ] Digital Forms 1833 and 1940 journeys are documented.

## Developer experience

- [ ] A clean clone can run in demo mode.
- [ ] `.env.example` is complete and contains no secrets.
- [ ] A developer can connect their own supported AI API account.
- [ ] A developer can create/connect their own Supabase project.
- [ ] Supabase migrations and synthetic seed data are included.
- [ ] Setup and troubleshooting docs exist.
- [ ] No Bank production dependency is required to explore the project.

## Public/source-available safety

- [ ] No credentials are present in current tree or distributable history.
- [ ] No real customer data exists.
- [ ] No real uploaded customer documents exist.
- [ ] Public assets have redistribution approval.
- [ ] Bank/proprietary content has been reviewed.
- [ ] Security reporting instructions exist.
- [ ] Contribution instructions exist.
- [ ] Project status/disclaimer is visible.

## Licensing

- [ ] IP ownership is confirmed before publication.
- [ ] Licence text has been reviewed by the appropriate legal/IP owner.
- [ ] The repository does not falsely call a commercially restricted licence “Open Source”.
- [ ] Public-use rights are clear.
- [ ] BOI colleague/internal-use rights are clear.
- [ ] Commercial licensing/contact route is clear.

## Handoff

- [ ] A developer unfamiliar with Baz can understand the architecture.
- [ ] They can locate a feature and its docs quickly.
- [ ] They can run and modify the POC without author assistance.
- [ ] The repo communicates not only how Baz works, but why key decisions were made.

---

# 23. Definition of success

The repository should feel intentional.

A new developer should open it and immediately understand:

```text
What Baz is
Why it exists
How it works
Where things live
How to run it
How to change it
Which parts are experiments
Which parts are deterministic
What we learned
What not to break
How to contribute
```

The best outcome is not simply that the code is public.

It is that the project becomes **transferable**.

> The original author should no longer be a required runtime dependency.
