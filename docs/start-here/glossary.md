---
title: Glossary
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/
  - supabase/migrations/
---

# Glossary

The words that mean something specific here. Most map to a type or a table, and the ones that
do say which.

## The case

| Term | Meaning |
|---|---|
| **Case** | Everything about one customer's engagement: participants, facts, applications, plans, conversation. The unit that persists. Table: `cases` |
| **Participant** | A person on a case — the primary customer, or a partner. Facts belong to a participant, not to a case. Table: `participants` |
| **Participant session** | The mapping from a Supabase auth user to a participant. Many-to-one by design: one person, several auth users (a browser tab and an installed PWA have separate storage), one conversation. Table: `participant_sessions` |
| **Customer** | The synthetic bank-held record a case can be linked to. Table: `customers` |
| **Case digest** | The controlled summary of a case, built from the database, that goes into the model's prompt. Every status Baz states must appear here first |

## Facts and requirements

| Term | Meaning |
|---|---|
| **Fact** | A typed value about a subject, with provenance: key, subject, value, source, verified, `capturedFor`, `supersededBy`. Table: `facts`; catalogue in `domain/facts.ts` |
| **Fact key** | An entry in the catalogue, never free text — `income.annualBasic`, `identity.address`. The catalogue defines the schema, subject type, reuse policy, sensitivity and whether the model may extract it |
| **Subject** | Who a fact is about: a participant id, or `household`. The primary's income never satisfies the partner's income requirement |
| **Reuse policy** | What happens when a fact already exists: `auto`, `confirm`, `fresh` or `never`. Set per catalogue key, overridable per requirement |
| **Outstanding** | What an application still needs, **computed** from the journey and the current facts by `outstanding(journey, facts)`. Never remembered, never the model's opinion |
| **Requirement** | One thing a journey needs: a fact key, or a declaration, document or confirmation |
| **Questions avoided** | The count of requirements satisfied by a fact that was bank-held or captured for a different application. Each one writes a `context_reused` event |

## Applications

| Term | Meaning |
|---|---|
| **Journey** | One product's requirements, translated from the bank's own process. One file per product in `domain/journeys/` |
| **Application** | A customer's progress through one journey. Table: `applications` |
| **State machine** | The transition table in `domain/state-machine.ts`. 12 states, and `transition(app, event)` is the only path between them |
| **Advisory** | A deterministic rule that fires on a combination of state, not a model judgement. `loan_vs_mortgage` is the required one |
| **Product interest** | `offered`, `accepted`, `declined` or `deferred`. A declined product is listed in the digest as "do not raise again" |
| **Application request** | An open ask against an application — typically a document. The only thing `request_upload` may point at |

## The conversation

| Term | Meaning |
|---|---|
| **Turn** | One customer message and Baz's reply, including any tool calls. Handled end to end by the `baz-turn` function |
| **Gate** | The classifier plus deterministic checks in front of the model. Domain restriction is enforcement, not a prompt instruction |
| **Card** | A UI component Baz renders to offer an action. The model proposes a card; the customer's tap is what commits |
| **Persona** | Six style sliders composed into a labelled block in the prompt. Style only — it cannot change scope, tools, rules or protections |
| **Trigger** | Why a turn is running. A `return` trigger makes the digest include events since `last_seen_at` |

## Plans

| Term | Meaning |
|---|---|
| **Plan** | A customer commitment that outlives any single application — a savings target, a house deposit. Tables: `plans`, `plan_milestones`, `plan_checkins`, `plan_watches` |
| **Need** | Something the customer's situation implies, from the needs catalogue. 49 defined |
| **Goal** | What the customer is trying to achieve, from the goal catalogue. Decisions recorded in `need_decisions` |

## Digital forms

| Term | Meaning |
|---|---|
| **Form definition** | The bank's own published form JSON, snapshotted. Baz is another renderer of it, not a reimplementation. `1833` SuperSaver (499 fields), `1940` personal loan (418) |
| **Page break** | The gate that matters. Most branching is on the page, not the field: a page break gates every field carrying its `pageNumber` |
| **Settling** | Defaults, then calculations, then active fields, repeated until stable. Stale answers on abandoned branches are dropped |
| **NDI** | The form's calculating controls. Each declares its fidelity: `source_faithful`, `fixture` or `unsupported`. Eligibility is always a fixture, and the model can never set it |
| **Form answer** | An answer that is not a fact — a form-specific question, a declaration, a document reference. Table: `form_answers` |
| **Submission packet** | The ordered FormData the form would be submitted with. Built, recorded, and never sent |

## Operational

| Term | Meaning |
|---|---|
| **Event** | A row in `events` with an actor: `customer`, `partner`, `model`, `admin` or `system`. Everything significant writes one, and metrics are derived from them |
| **Token** | A 128-bit random single-use link credential, stored hashed, short TTL, consumed on redemption. Nothing sensitive ever goes in a URL. Table: `tokens` |
| **Presenter key** | The secret that unlocks the all-conversations switcher on one device. Unset means nobody can open it |
| **Canonical case** | The seeded presenter case that a reset restores, from `domain/seed/canonical.ts` |
| **Kill switch** | The global flag that makes the gate return "demo paused" |
