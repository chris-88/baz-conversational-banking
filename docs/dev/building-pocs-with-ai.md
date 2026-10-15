---
title: Building POCs with AI
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - CLAUDE.md
  - docs/decisions.md
---

# Building proofs of concept with AI

This project was built by one person with an AI coding agent, in roughly two weeks, to the scale
recorded in [the inventory](repository-inventory.md). This is the method, including the parts
that went wrong.

It is written for a developer or an agent picking the work up. `CLAUDE.md` at the repository root
is the operational version of it — the file an agent reads on every session.

## Who owns what

**The human owns** the problem definition, the product thesis, the system boundaries, the
architecture, security and risk, the acceptance criteria, taste, and every final decision.

**The AI accelerates** code generation, scaffolding, refactoring, test generation, review,
documentation, fixture creation, analysis and UI iteration.

The split is not about capability, it is about accountability. An agent will build whatever
boundary you describe, including a bad one, and will do it fast enough that a bad boundary is
expensive before you notice.

## The loop

1. Understand the existing state. Read before writing.
2. Write or confirm the feature definition.
3. Identify the boundaries it touches.
4. Implement the smallest coherent slice.
5. Run typecheck, lint, tests, build.
6. Inspect the actual behaviour.
7. Record new facts and learnings.
8. Update the documents the change invalidated.
9. Commit, citing the requirements section.

Step 6 is the one that gets skipped and the one that matters. Four bugs in this project passed
every automated check and were found by a person using the thing.

## What made this work

**One source of truth, cited by number.** Every commit message, code comment and decision log
entry cites a section of the requirements document as `§N`. An agent asked to implement §33 reads
§33. Disagreements resolve against a document rather than a memory.

**A written operating file.** `CLAUDE.md` holds the stack, the invariants, the domain model, the
standards and the build order. It is read every session, which means a convention written there
is a convention that holds across weeks of work. It also means **a stale line in it propagates**,
which is why it is now checked against the code rather than trusted.

**Invariants, enforced by machines.** "The model proposes, the UI commits" is a sentence; the
reason it held is that the model has no tool that commits anything, and the reason portability
held is an ESLint rule. Anything stated only in a prompt is advice. Anything stated in a type, a
lint rule or a schema is enforcement.

**Deterministic where it matters.** Requirements, state transitions, advisories, form logic,
calculations and eligibility are pure functions with tests. The model is asked how to phrase
things, never what is true. This is the single highest-leverage decision in the project.

**Tests first for domain logic.** Pure TypeScript with no platform APIs, so the test is cheap
and the loop is seconds.

**A decisions log.** One line per choice: date, decision, section. Fourteen hundred lines now.
It is what makes the project legible after the fact, and it is where an ADR comes from.

## What went wrong

Each of these is in the decisions log with its date, and each is now a rule.

**Writes that failed silently.** Supabase returns `{ error }` rather than rejecting, so
thirty-nine unchecked writes looked fine. One broke a rule for a week with no symptom. Now any
write that matters goes through `mustWrite`, which throws.

**Code that was never typechecked.** The Edge Functions are Deno; `tsc` could not see them. A
call to a function that did not exist typechecked clean and deployed. Now CI runs
`deno check` as its own step.

**Facts recorded against the wrong person.** The primary's income satisfying the partner's
requirement is a one-line bug with a demo-breaking effect. Subject matching is now tested
explicitly.

**A frontend that looked finished and did nothing.** Product cards and navigation that were
inert text, a microphone button with no speech input behind it. An agent will happily build the
appearance of a feature. A dead button is worse than no button.

**Bugs that only a person could find.** The output ceiling, the data notice, the product
collapse. All of them shipped because **nothing can drive a conversation in a test without
paying the real model** — the gap described in [testing](testing.md).

**A live model used as a preview tool.** Twenty-five replays consumed a day's visitor allowance.
Layout, card ordering and copy placement are not things a model call tells you.

## Rules for an agent working here

- Inspect before editing. Never assume a file name or an interface.
- Preserve working behaviour. A restructure that changes behaviour is two changes.
- Use the existing pattern where it is good; simplify where the complexity is accidental.
- Prefer deterministic code for anything that is a rule or a validation.
- Never expose a secret. Never use real customer data. Never call a real banking write endpoint.
- Update the documents a change invalidates, in the same change.
- Record a material architectural choice in `docs/decisions.md`, and an ADR if it is structural.
- Do not present an intention as an implementation. If it is not built, say so.

That last one is the whole of it. A document that describes what the project is going to do, in
the present tense, is worse than no document — it costs the next person the time they spend
looking for something that was never there.
