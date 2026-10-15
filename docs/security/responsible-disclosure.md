---
title: Responsible disclosure
status: current
scope: poc
last_verified: 2026-10-15
---

# Responsible disclosure

## What this project is

A public proof of concept, with synthetic data, no real banking integration and no real customer
information. It is **not** a production banking service and is not operated by Bank of Ireland.

If you have found something, thank you — please read the scope below first, because several
things that look like vulnerabilities are documented properties of a prototype.

## How to report

Open a **private** report through GitHub's security advisory flow on the repository, or contact
the maintainer directly.

**Do not open a public issue containing a credential, a token, or anything that looks like
customer data.** If you have already done so, say that in the report so it can be dealt with
first.

Please include what you did, what you expected, what happened, and whether you needed anything
beyond an ordinary browser.

## In scope

- Credential exposure: anything secret reachable from the published bundle, a URL, or the
  repository's history.
- Cross-case data access: reading a case you are not a participant on.
- Partner isolation failures: a second applicant reaching the primary's conversation or facts.
- Guardrail bypass: getting the model to answer outside the permitted domain, or to act as
  something other than Baz.
- State integrity: causing an application to change state without the customer's confirmation.
- Token weaknesses: reuse, prediction, or access after expiry or redemption.
- Anything that causes the prototype to transmit data to a real Bank of Ireland system. **Nothing
  should.**

## Documented, not vulnerabilities

These are stated in [the threat model](threat-model.md) and are known:

- There is no server-side error reporting on the Edge Functions.
- There is no per-participant turn or spend limit.
- There is no re-classification of model output.
- The sign-in accepts any address and tells you it is a prototype.
- Eligibility outcomes are labelled fixtures and are not real decisions.
- The submission packet is built and never sent; the recorded endpoint is metadata.
- `PRESENTER_KEY` is a single shared secret.
- The repository is public with no licence, and two internal documents are in its history. Known,
  and tracked in [the public repository review](public-repository-review.md).

Reports on these are still welcome if you have found something *beyond* what is written there.

## Out of scope

- Findings against `digital.bankofireland.com` or any other Bank of Ireland system. **Please do
  not test against them.** This project only reads published form definitions, and it never
  writes anywhere.
- Automated scanner output with no demonstrated impact.
- Missing hardening headers on a static GitHub Pages site.
- Denial of service through volume.
- Social engineering.

## What to expect

Acknowledgement as soon as it is seen. This is a prototype maintained by one person, so there is
no service level — but anything involving a real credential, real data, or a path to a real
banking system will be treated as urgent, and a credential that may have been exposed will be
rotated without first establishing whether exposure was likely.
