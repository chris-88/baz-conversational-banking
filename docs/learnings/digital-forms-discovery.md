---
title: Digital forms discovery
status: current
scope: shared
last_verified: 2026-10-15
sources:
  - supabase/functions/_shared/domain/forms/
  - docs/decisions.md
---

# Digital forms discovery

What two published form definitions taught, in the order they taught it. The architecture is in
[architecture/digital-forms](../architecture/digital-forms.md); this is what was surprising.

## One sample is not a grammar

SuperSaver's 540 rules use `is` and `isnot` and nothing else. The operator enum was closed around
those two, with a comment saying so — "counted rather than assumed", which was true of the sample
in hand.

Then form 1940 arrived with eleven `>` and two `<`, and **the loan definition did not parse at
all.** Thirteen numeric rules rejected the whole document.

> **Count the real thing, and then ask what the next real thing might contain.** A closed enum
> derived from one sample is an assumption wearing a measurement's clothes.

## The branching is on the page, not the field

The intuitive model of a long form is per-field conditions. The actual mechanism that matters is
that **a page break gates every field carrying its `pageNumber`.**

Getting this wrong means either asking questions that do not apply or skipping questions that do,
and both are worse than cosmetic: a required field that is not active must not block the journey,
and an active field must not be skipped.

## Circularity appears only when something calculates

Which fields apply depends on the total amount. The total is calculated from the loan amount.
Which loan-amount field counts depends on which fields apply.

SuperSaver never showed this, because it calculates nothing. The loan form puts it on the **first
page**.

The answer is to settle rather than compute: work out what applies, calculate from what applies,
work out what applies again, stop when it stops moving. Two passes is the normal case; the bound
exists for the pathological one.

> **A feature that looks finished against one input may not have met its real shape yet.**

## The dangerous part is the part that decides

The loan definition does not only describe questions. It describes four controls that calculate,
and one of them decides whether an application can proceed at all.

> A conversational assistant that invents an eligibility result is not a demonstration of
> anything anybody would ship.

So each control declares its fidelity — `source_faithful`, `fixture` or `unsupported` — and
eligibility is **always** a fixture. The model can never set one, and the console shows which
fidelity produced every number on screen.

The general form of this: when a system you are imitating makes a consequential decision, either
reproduce the decision faithfully from its own declared inputs, or declare that you are not
reproducing it. There is no acceptable third option, and "it is only a demo" is not one.

## Fidelity has to be visible in the product, not just in a document

Declaring eligibility a fixture in a markdown file protects nobody in a room. It is declared in
the type, surfaced in the console beside every number, and recorded per entry in the submission
packet.

## The real packet is stranger than the documentation

Two examples, both of which had to be handled rather than tidied away:

- `input_1189[]` appears **twice** in the real SuperSaver packet, once for the number and once
  for the country. A JSON object would have silently lost one, which is why the packet is an
  ordered array.
- A quote control's parameters object serialises in a real browser to the literal string
  `"[object Object]"`, and that is genuinely what the captured submission carries. The platform
  evidently recomputes from the rest.

The second is the only place Baz deliberately diverges from the wire format, and it is recorded
in the decisions log rather than left to be discovered by somebody diffing the two.

> **Capture the real artefact before building anything that claims to reproduce it.**

## Names are not unique, within a form or across forms

The two forms share **two** toscana names out of 120 and 154 — so a shared adapter table would
have been almost entirely wrong. And a name is not unique *within* a form either, so a
destination resolves against the live branch, and where several fields share a name the required
ones win.

Plus one rule with no exceptions: **never prefill a `hidden` field.**
