---
title: Authentication (the customer's view)
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/baz/SignInForm.tsx
  - src/baz/SignInCard.tsx
  - src/lib/identity.ts
---

# Authentication

Address, then a code. That is the whole of it. The mechanism is in
[architecture/authentication](../architecture/authentication.md); this is what the customer meets.

## You do not have to sign in

A visitor can hold a complete conversation, start applications and give facts without ever
identifying themselves. They get an anonymous account on arrival and never see it.

This matters to the demonstration: the public conversation starts anonymous, which is what makes
the sign-in moment worth watching. An earlier version joined the seeded customer directly, which
skipped the whole continuity story and faked the thing the demo is built on.

## When Baz asks

Baz offers a sign-in card when there is something worth signing in for — when the conversation has
produced something a customer would not want to lose, or when bank-held information would save
them answering questions they have already answered elsewhere.

It is an offer, not a gate. The card is how they accept.

The same two steps are also in the conversation menu, and **both use the same component**, because
the length of the code, the order of the code and the link, and what happens on success all have
to match. The last time two sign-in paths drifted apart, one of them stopped working for a week.

## What signing in does

The conversation carries over — same case, same transcript, same applications, same facts — and
bank-held facts arrive. Requirements that were about to be asked are satisfied without being
asked, unless the journey says to confirm or re-ask them.

That is the moment the demonstration turns on.

## Across devices

Sign in on a phone having started in a browser and it is the same conversation. Not a cookie, not
local storage, not a device fingerprint: a returning customer is recognised **by address**,
because those other things identify a browser and the whole premise is that the case follows the
person.

One person can have several underlying accounts — Safari and an installed PWA have separate
storage on iOS — and still have one conversation.

## No passwords, no Google, no bank login

Email and a one-time code, and nothing else. There is no provider to choose between.

Google sign-in existed and was removed entirely rather than hidden. The simulated Bank of Ireland
login, and the public-website-to-app handoff that went with it, were removed when the app shell
was.

## Nothing real

No real credentials and no real bank authentication. The customer records that arrive on sign-in
are synthetic and invented.
