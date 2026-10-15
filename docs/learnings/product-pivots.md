---
title: Product pivots
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - docs/decisions.md
  - src/app/routes.ts
  - src/content/how-it-works/pivots.ts
---

# Product pivots

Things that were built, worked, and were deleted. Each one is in the decisions log with its date.

## Five surfaces became three

**Removed 2026-10-06.** A replica of the public bank website, an authenticated mobile banking
shell behind a simulated login, a handoff code carrying a conversation between them, and a
separate audience entry.

All of it worked. All of it was scaffolding around the only part worth showing.

Eleven components deleted. `/app/*` and `/try` now redirect to `/baz` so an installed PWA pinned
to the old path, or a QR code printed on a slide, still lands somewhere.

See [ADR-0001](../decisions/ADR-0001-conversation-first-ui.md). The deeper reason is the one worth
remembering: **continuity is better demonstrated without a signed-in shell.** A separate
authenticated app made the conversation carrying across a sign-in look like a navigation change
rather than a continuity guarantee.

## The authenticated track went with it

There is no signed-in version of Baz that knows more about you. Every visitor is anonymous and
tells Baz what it needs to know, the way they would tell a person.

## Google sign-in was removed entirely rather than hidden

**2026-10-15.** A disabled provider is a thing somebody re-enables, and there was no second
provider worth choosing between. Email address and a one-time code is the whole of signing in.

## Cookie recognition became address recognition

**2026-10-15.** A returning customer is recognised by address, never by cookie. A cookie
identifies a browser; the entire premise is that the case follows the person.

## A scripted greeting became a question

The zero state used to explain what Baz was before the customer had done anything. It now says
one thing and waits.

> The claim the product makes — that you do not have to know which product you need — is better
> made by asking the question than by asserting it.

## Suggestion chips became a typing composer

A row of tappable openers cost a tap less and **read as a menu**. A menu of five situations
quietly contradicts the one claim the product makes.

The openers now type themselves into the empty composer, one at a time, and stop the moment
anything is typed.

## Dead controls were removed, not finished

A microphone button with no speech input behind it. Product cards that looked tappable and were
inert text. A "View all" that looked like a link.

> **A dead button is worse than no button.**

An agent will happily build the appearance of a feature, and it is convincing enough that the
gap is only found by using the thing.

## The conversation's shape became computed

**2026-10-15**, and the last exception to the project's own rule.

Everything else followed "the engine decides what is true and the model decides how to say it".
The conversation itself did not: nothing knew whether a customer had been understood yet, so
nothing could say "not products, not yet", and a transcript could run eight questions deep and
then produce a product card with no goal, no plan, and no moment where anybody was asked what
they actually wanted.

Six stages, derived from the case, never stored. The tools a turn is offered are the tools that
stage allows.

## The fork comes before the discovery

**2026-10-15.** Discovery is the *plan* branch of an explicit fork, not the default path.
Somebody who wants to get straight to a product is not interrogated first — and discovery lifts
after four customer turns regardless, because a customer who will not answer questions must still
be able to get somewhere.

## One card owns the turn

**2026-10-15.** Baz was showing a comparison of two savings accounts and, underneath it, asking
what the customer paid in rent and whether they banked jointly. Three demands in one breath, and
whichever the customer answered the others were left hanging.

A card that waits for a tap **is** the question of that turn.

## Nine analytics panels became seven

Channel mix and new-versus-returning were dropped because there is no channel field and no
identity across sessions.

> Two empty panels would say less about the product than their absence does.

The general rule, and it is in the requirements explicitly: a dashboard should not be populated
with numbers that have nothing behind them.
