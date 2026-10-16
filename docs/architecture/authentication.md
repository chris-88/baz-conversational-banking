---
title: Authentication
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - src/lib/identity.ts
  - src/lib/session.ts
  - supabase/functions/session/index.ts
  - supabase/migrations/20260930210000_init.sql
---

# Authentication

Email address, then a code. That is the whole of signing in to Baz. No Google, no simulated bank
login, no password.

## Every visitor is already a user

A visitor gets a Supabase **anonymous** user on arrival, and a case with it. They can hold a whole
conversation, start applications and record facts without ever identifying themselves.

`participant_sessions` maps an auth user to a participant, and it is **many-to-one by design**.
One person, several auth users, one conversation. That is not a workaround — Safari and an
installed PWA have separate storage on iOS, so the same human arrives as two auth users and must
reach the same case.

## Signing in attaches, or falls through

The good path **attaches** an email identity to the anonymous user that is already there.
`auth.uid()` does not change, so the case, the conversation, the applications and every fact
carry over with nothing to move and nothing to reconcile.

It was once believed that was the only path. It is not. **Attaching fails whenever the address
already belongs to a user** — a second device, or anybody signing in twice — and the fall-through
signs them into that existing account instead: different `auth.uid()`, no mapping, and a
conversation that has disappeared at the precise moment it was meant to be made safe. A live case
was orphaned exactly this way.

So both paths note who this browser was before they begin, and both claim the participant
afterwards. `participant_sessions` being many-to-one is the same fact wearing a different hat.

The code for this is `src/lib/identity.ts`, and its comment is the authoritative version.

## Recognised by address, never by cookie

A returning customer is matched on their email address. Not a cookie, not local storage, not a
device fingerprint — those identify a browser, and the whole premise is that the case follows the
person across browsers.

## One sign-in form

`src/baz/SignInForm.tsx` is shared by the card Baz offers mid-conversation and by the menu,
because they are the same two steps and a second copy is a second thing to get wrong: the length
of the code, the order of the code and the link, and what happens on success all have to match.
The last time two sign-in paths drifted apart, one of them stopped working for a week.

## What was removed

The repository's history contains a simulated Bank of Ireland login and a public-to-app handoff
code flow: a 128-bit code, hashed, ten-minute TTL, consumed on redemption, that moved a
conversation from the public website to the authenticated app shell.

Both the public website replica and the app shell were deleted. Google sign-in was removed
entirely rather than hidden. `handoff` still appears in the codebase, but it now means **the
briefing note a person reads before phoning a customer** — built from the case, never written by
the model — which is a different thing with the same word.

## Admins

Real Supabase email auth plus a row in `admin_users`. Checked client-side for routing and
**server-side on every `admin` call** — the client-side check is for navigation, not security.

`is_admin()` is a security-definer SQL function used by the RLS policies.

## The presenter key

Separate from authentication. `PRESENTER_KEY` unlocks the all-conversations switcher on whichever
device holds it. Leave it unset and nobody can open it.

## Tokens

Any link that grants access carries an opaque token: 128-bit random, stored only as a hash.
Handoff codes and notification links have a short TTL and are consumed on redemption. Expired,
voided and unknown all return the same message, so a caller learns nothing about which part was
wrong.

The partner invite is the exception. It neither expires nor is used up: the second applicant
opens it when they get to it, and from whichever phone they have, and each opening attaches that
browser's anonymous user to the same partner participant. What keeps it honest is that only the
latest one works for anyone new: inviting again voids every earlier link for any browser that
has not already joined, which is also how the customer revokes one. A browser that has joined
keeps its link, because the link in the partner's messages is their only way back in.

Nothing sensitive is ever in a URL.

## Synthetic only

No real credentials and no real bank authentication. The synthetic customer records in
`customers` are loaded server-side once a case is linked, and they are invented.
