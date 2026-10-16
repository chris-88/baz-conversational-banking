---
title: Threat model
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/migrations/20260930210000_init.sql
  - supabase/functions/_shared/llm/gate.ts
  - supabase/functions/partner/index.ts
---

# Threat model

What this prototype defends against, what it does not, and what would change if it were ever
real.

Scope: a public, synthetic-data prototype with no real banking integration. That scope does most
of the work — several categories below are *not applicable* rather than *handled*.

## What there is to protect

| Asset | Exposure if lost |
|---|---|
| `ANTHROPIC_API_KEY` | Direct financial loss. The most valuable thing here |
| `SUPABASE_SERVICE_ROLE_KEY` | Full read and write on every case |
| `VAPID_PRIVATE_D` | Ability to send push to subscribed devices |
| `PRESENTER_KEY` | Read every conversation through the switcher |
| Conversation content | Synthetic, but a visitor's typed input is theirs |
| The bank's reputation | A prototype that looks official, or appears to submit to real systems |

No real customer data, no real credentials and no money movement. That is the whole reason this
threat model is short.

## Handled

**Credential exposure in the bundle.** `VITE_` is the entire boundary, and
`npm run check:bundle` fails the build on five credential shapes plus the exact values of every
non-`VITE_` variable in `.env`. CI runs it. See
[secrets and configuration](secrets-and-config.md).

**Client-side writes.** There is not a single insert, update or delete policy in the schema. The
browser physically cannot write to `cases`, `applications` or `facts`.

**Cross-case reads.** RLS gates every case table through `can_read_case()`: admin, or a
participant on that case with role `primary`. Four tables — `customers`,
`participant_sessions`, `tokens`, `admin_users` — have no read policy **and** their SELECT grant
revoked, so a policy added by mistake later still would not expose them.

**Partner over-reach.** The partner never touches a table. The `partner` function returns scoped
DTOs: their own tasks, their own facts, the names and states of applications they are party to.
Never the primary's conversation or facts.

**Token leakage through URLs.** Every access-granting link carries a 128-bit random token, stored
only as a SHA-256 hash. Handoff codes and notification links have a short TTL and are consumed on
redemption. The partner invite has neither: a leaked invite grants the partner's scoped view of a
synthetic case for as long as it is the latest one, and inviting again voids it. Expired, voided
and unknown return the same message, so a caller learns nothing about which part was wrong.

**Prompt injection and scope escape.** Deterministic pre-checks then a classifier, in front of
the model. A blocked turn produces a canned string, so there is no path by which the model could
be induced to answer and append a disclaimer. Injection patterns are flagged *and* still
classified. 54 adversarial eval cases.

**Runaway output cost.** `max_tokens` is bounded, the gate refuses long-output requests before the
model sees them, and the audience cap limits how many cases can be created in a rolling 24 hours.

**Sensitive inference.** `record_facts` refuses any catalogue key marked `extractable: false`, so
health data cannot arrive by inference — only through an explicit consented form. Persona cannot
override it.

**Model-driven state change.** There is no tool that changes anything. See
[the AI boundary](../architecture/ai-boundary.md).

**Misleading the user about what they are using.** Every surface carries a prototype disclosure,
and the smoke test asserts it. Baz always discloses it is AI.

**Stale builds serving old behaviour.** Detected and reloaded; the Supabase domain is
`NetworkOnly` so an API response is never cached.

## Not handled, and known

| Gap | Note |
|---|---|
| **No server-side error reporting** | Edge Function failures surface only as logs and `events` rows. An attack in progress would be hard to see |
| **No rate limiting per participant** | The audience cap limits *case creation*, not turns. `AUDIENCE_MAX_TURNS` is declared and read nowhere, so one visitor can spend without bound |
| **No output re-classification** | The gate protects the input; nothing re-reads the model's reply |
| **No audit of admin actions beyond events** | Events record what happened, but there is no separate tamper-evident log |
| **Anonymous sign-up is open** | Rate limits are Supabase's defaults, raised at M0 |
| **`PRESENTER_KEY` is a shared secret** | One value, no rotation story, no per-device identity |
| **No formal accessibility or penetration test** | Neither has been done |

## Not applicable at this scope

Payment fraud, money movement, real-customer data breach, KYC/AML evasion, and real credit
decisioning. None of these systems are connected, and the submission packet is
[never sent](../architecture/submission-generation.md).

## What would have to change for production

Not a hardening pass — a different system:

1. Real authentication and authorisation, with the service-role-in-a-function pattern replaced.
2. Server-side observability, alerting and an audit log.
3. Per-identity rate limiting and spend control.
4. A data protection assessment, retention policy and deletion path for real conversation content.
5. Output classification, and a human review path for anything consequential.
6. An eligibility decision that is a real decision, with the governance that implies.
7. A penetration test and an accessibility audit.

## The live exposure right now

The repository is public with no licence, and two internal source documents remain retrievable
from its git history. That is the one open item in this document with a real-world consequence
today: [public repository review](public-repository-review.md).
