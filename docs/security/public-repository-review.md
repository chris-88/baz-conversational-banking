---
title: Public repository review
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - .gitignore
  - git history
---

# Public repository review

**This repository is already public.** `github.com/chris-88/baz-conversational-banking`, and the
site is live at `baz.chrisquinn.ie`.

That matters for how to read this document: the pre-publication checklist in the archived
hardening definition is written as a set of gates before going public. Those gates are behind us.
What follows is therefore **outstanding exposure to remediate**, not a plan to work through
before a release.

## Open item 1 — there is no licence

The repository has no `LICENSE` file, which means all rights reserved by default. That is the
**opposite** of the stated intention: nobody may legally fork, modify or experiment, while
GitHub's terms still allow anyone to view and fork it.

The intended position is *source-available*: public source, non-commercial experimentation and
modification allowed, commercialisation by separate agreement. That is **not** OSI open source,
because an OSI-compliant licence must permit commercial use — so it must not be described as open
source.

A reasonable starting point to review is **PolyForm Noncommercial 1.0.0**. Note that it may not
permit Bank of Ireland to take the work forward for internal business use, since internal
corporate use is not necessarily non-commercial. The likely shape is three tiers:

```text
Public users          → source-available, non-commercial
Bank of Ireland       → a separate internal-use grant
Commercial third party → a separate commercial licence
```

**Nothing should be published as a licence until ownership is established** — see open item 3.

## Open item 2 — two internal documents are in the public history

`.gitignore` says the two source documents are "held locally, deliberately not published". They
are gitignored from the working tree. They are **not** absent from the history.

| Document | Lines | Added | Removed |
|---|---|---|---|
| `docs/03-…-requirements.md` | 1,567 | `0f0988f`, 2026-09-30 | `865ed2c`, 2026-10-01 |
| `docs/01-…-vision.md` | 587 | `0f0988f`, 2026-09-30 | `865ed2c`, 2026-10-01 |

Both are retrievable from the public repository today:

```bash
git show 0f0988f:docs/03-baz-conversational-banking-poc-requirements.md
```

Removing a file from the current tree does not remove it from history. Resolving this needs either
a history rewrite or a clean public repository, and either has consequences for anyone who has
cloned or forked. Until it is resolved, the honest position is that these documents are public —
and `.gitignore`'s comment should not claim otherwise.

This is also the project's own §10 warning, found in its own history.

## Open item 3 — IP ownership is not established

This is prerequisite to any licence, and it is not a formality.

- Was the project created as part of employment duties?
- Was employer equipment, time or information used?
- Does the employment contract assign inventions or software to the employer?
- Does Bank of Ireland own any code, copy, design, schema or asset in the repository?
- Can the name and branding be distributed?
- Can the bank's product journey definitions be redistributed publicly?

Do not assume unilateral licensing rights. Legal and IP approval comes before a licence file.

## Open item 4 — Bank of Ireland content in the repository

| Item | What it is |
|---|---|
| `docs/baz-boi-mortgage-rates.zip` | Captured published rate tables. Generator input |
| `docs/baz-boi-retail-product-kb.zip` | 61 objects read from the bank's public site. Generator input |
| `tenants/boi/forms/form-1833.json`, `form-1940.json` | The bank's published form definitions, 707KB and 444KB |
| `src/assets/logos/boi-*-placeholder.*` | Generated placeholders, named as such |

All of it is from public sources, and none of it is customer data. It is still the bank's content,
and redistributing it in a public repository is a question for the bank rather than for this
project. The form definitions are the most significant: they are the bank's own journey
specifications, snapshotted in full.

Options, if approval is not forthcoming: keep the adapters and remove the protected material,
replacing it with synthetic definitions of the same shape.

## What is clean

Verified on 2026-10-15:

- **No credential has ever been committed.** No `.env`, no `client_secret*.json`, no
  `.admin-credentials`, no `.presenter-key` appears in the history.
- No real customer data, no real PPS numbers, account numbers or IBANs — see
  [synthetic data](synthetic-data.md).
- No real uploaded customer documents.
- No signed file hashes; those fields are deliberately null.
- `npm run check:bundle` passes, and CI fails the build if a secret reaches `dist/`.
- Every surface carries a prototype disclosure, asserted by the smoke test.

## Recommended order

1. Fix `.gitignore`'s claim, or the history. Pick one — today. The current state asserts something
   untrue.
2. Establish IP ownership.
3. Then choose a licence, and describe it accurately as source-available.
4. Get a view on the Bank of Ireland content, especially the two form definitions.
5. Add `SECURITY.md` pointing at [responsible disclosure](responsible-disclosure.md), and a
   `CONTRIBUTING.md`, once the licence exists.

Items 1 and 2 are independent of each other and both independent of the demonstration deadline.
