---
title: Decisions
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - docs/decisions.md
---

# Decisions

Two things live here, and they do different jobs.

## The running log — [`../decisions.md`](../decisions.md)

Every choice made where the specification was silent, dated, with the section it serves. About
1,400 lines, from 2026-09-30 to now.

It is append-only and it is the most useful document in this repository. When you choose something
the spec does not cover, add a line: the date, the decision, the `§`.

**Read it before proposing a change to anything load-bearing.** Most surprising decisions in this
codebase have an entry explaining what went wrong first.

## Architecture Decision Records — this directory

Eight ADRs, reconstructed from the log for the choices that shape the whole system rather than one
file.

| ADR | Decision |
|---|---|
| [0001](ADR-0001-conversation-first-ui.md) | The conversation is the only customer surface |
| [0002](ADR-0002-ai-deterministic-boundary.md) | The model proposes, the engine decides |
| [0003](ADR-0003-supabase-as-persistence.md) | Supabase as the whole backend |
| [0004](ADR-0004-synthetic-data-only.md) | Synthetic data only, with no real-data path |
| [0005](ADR-0005-digital-forms-reuse.md) | Read the bank's published form definitions |
| [0006](ADR-0006-submissions-never-sent.md) | Build the submission packet and never send it |
| [0007](ADR-0007-progressive-authentication.md) | Anonymous first, identity attached later |
| [0008](ADR-0008-plans-outlive-applications.md) | Plans outlive applications |

## Writing one

Use this template. Keep it short — an ADR that needs a page of context is usually two decisions.

```md
# ADR-XXXX — Decision title

## Status
Accepted | Superseded by ADR-YYYY

## Context

## Decision

## Alternatives considered

## Consequences

## Revisit when
```

Two rules:

- **Do not fabricate a date.** If the log does not say when something was decided, say the date is
  not recorded. Several of these ADRs are reconstructions and say so.
- **An ADR is for a structural choice.** Which lint rule to use is a log line. Where the boundary
  between the model and the engine sits is an ADR.
