---
title: What is Baz?
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - README.md
  - src/app/routes.ts
  - docs/white-paper.md
---

# What is Baz?

Baz is a conversational orchestration layer over simulated Bank of Ireland product journeys.

The customer says what they are trying to do. Baz works out what that implies, the customer chooses which products to pursue, facts are collected once and reused across every application that needs them, and the case survives sessions, devices, a second applicant and time away.

## The problem it is answering

Digital banking digitised the bank's processes faithfully, including the part where the customer has to understand how the bank is organised. If you want a mortgage you find Mortgages; if you need a loan you find Loans. Someone who has just had a baby, got married and is trying to buy a first home presents to the bank as several unrelated product journeys, each asking for the same income figure.

Baz inverts that. The unit of work is the customer's intent, not the product form.

## What it does, concretely

- **Discovers the wider need.** Someone arriving about a mortgage is asked about the life event
  behind it, and the products that follow are offered with a reason tied to what they said.
- **Runs applications concurrently.** Several applications progress at once, each with its own
  state, and each knowing what it still needs.
- **Collects a fact once.** An income figure given for the mortgage satisfies the loan's income
  requirement too, and the reuse is recorded as an event so the saving is countable.
- **Keeps the case.** Close the tab, come back on a phone, sign in — the conversation continues
  rather than restarting.
- **Brings in a second applicant.** A partner joins on their own link, sees only their own
  tasks, and one answer from them advances every application they are party to.
- **Survives time away.** The bank moves an application while the customer is gone, a push
  notification arrives, and on return Baz says exactly what changed.

## What it is not

- Not a production banking service, and not connected to any real Bank of Ireland system.
- Not using real customer data. Every customer, document and figure is synthetic
  ([synthetic data policy](../security/synthetic-data.md)).
- Not transmitting anything. The digital forms engine builds a real submission packet and
  deliberately never POSTs it ([submission generation](../architecture/submission-generation.md)).
- Not a chat wrapper. The model proposes; the database decides. See
  [the AI boundary](../architecture/ai-boundary.md), which is the single most load-bearing idea
  in the project.

## Where to go next

| You want to | Read |
|---|---|
| Run it | [Quick start](quick-start.md) |
| Know what is built | [Project status](project-status.md) |
| Understand the words | [Glossary](glossary.md) |
| Understand the shape | [Architecture overview](../architecture/overview.md) |
| Read the argument | [White paper](../white-paper.md) |
