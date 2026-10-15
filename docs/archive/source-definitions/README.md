---
title: Source definitions
status: historical
scope: poc
last_verified: 2026-10-15
---

# Source definitions

Feature definitions written to drive implementation. Each was written **before** the work, in the
future tense, and describes intentions rather than the state of the code.

**Do not read these as current-state documentation.** For what the project actually does, see
[`docs/architecture/`](../../architecture/overview.md) and
[`docs/features/`](../../features/conversation.md).

| Document | Status | What it became |
|---|---|---|
| [`customer-plans.md`](customer-plans.md) | Delivered | [Customer plans](../../features/customer-plans.md), [ADR-0008](../../decisions/ADR-0008-plans-outlive-applications.md) |
| [`personal-loan-1940.md`](personal-loan-1940.md) | Delivered | [Form 1940](../../journeys/personal-loan-1940.md), the forms engine |
| [`admin-console-redesign.md`](admin-console-redesign.md) | Delivered | [Admin console](../../features/admin-console.md) |
| [`admin-console-redesign-plan.md`](admin-console-redesign-plan.md) | Delivered | The slicing for the above |
| [`how-it-works-page.md`](how-it-works-page.md) | Delivered | [The explainer](../../features/how-it-works-site.md) |
| [`how-it-works-content.md`](how-it-works-content.md) | Delivered | `src/content/how-it-works/` |
| [`needs-engine.md`](needs-engine.md) | Delivered | [Goals and needs](../../features/goals-and-needs.md) |
| [`opening-transition.md`](opening-transition.md) | Delivered | [Motion](../../design/motion.md). Code comments cite its sections by number |
| [`repository-hardening.md`](repository-hardening.md) | **Partly delivered** | [Repository cleanup](../../learnings/repository-cleanup.md) |

## Two of these are still referenced by name

- **`opening-transition.md`** — `src/index.css` and `src/baz/BazAvatar.tsx` cite "opening-transition
  spec §3" and "§6". This is the document they mean.
- **`repository-hardening.md`** — the definition this documentation taxonomy was built from. Its
  source restructure was deliberately not carried out, and its pre-publication gates are
  superseded by [the public repository review](../../security/public-repository-review.md), because
  the repository is already public.

## The catalogues these documents describe are not archived

The needs and goal catalogues are live data, read by the domain code by path, and remain at
`docs/needs-engine/` and `docs/goal-catalogue/`.
