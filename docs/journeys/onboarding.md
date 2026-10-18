---
title: Onboarding a new customer
status: current
scope: poc
last_verified: 2026-10-18
sources:
  - supabase/functions/_shared/domain/needs/catalogue.ts
  - supabase/functions/_shared/tenants/boi/current-accounts.ts
  - supabase/functions/_shared/domain/journeys/current-account.ts
  - supabase/functions/_shared/db/welcome.ts
  - supabase/functions/admin/index.ts
  - src/baz/useGhostPrompt.ts
---

# Onboarding a new customer

The use case the bank most wants: somebody it has never met opens their first account, in one
conversation, on their own phone, and is a customer with a working account by the time the bank
has moved. Acquisition is the conversation; onboarding is the conversation continuing.

Everything below runs on what the prototype already does. The parts built for it on 18 October
are listed at the end, with what is still simulated.

## The customer

Ciara Byrne, 23, synthetic. Graduated in 2026, starting as an analyst in Dublin on 2 November
on €38,000, renting in Rathmines, savings of €1,400 with another bank, no Bank of Ireland
relationship of any kind. She has seen a QR code on a poster, or tapped an ad, or typed the
address.

## The conversation, beat by beat

| | Channel | What happens | What decides it |
|---|---|---|---|
| 1 | Web, anonymous | The composer types the opener for her: *"I'm starting a new job and need a bank account…"*. She sends it. Baz reacts in a line, says what starting work actually involves (an account for the salary, a buffer, a pension later, not now), and asks: a plan for the first year, or just the account today. | The gate. The Goal Engine identifies `start_career` from what she said; the needs engine raises `everyday_banking` (explicit: she asked; strong: she is starting work). The stage machine holds `opening`, so no product and no questions yet. |
| 2 | Web | "The account, but a plan sounds useful." Baz asks two things at a time: when she starts and roughly what she will earn; whether she is renting and what she has saved; when she graduated. | `discovering`. Each answer is a fact in the catalogue (`employment.startDate`, `income.annualBasic`, `housing.currentTenure`, `assets.savingsBalance`, `education.graduatedYear`), recorded by the tool, never remembered by the model. |
| 3 | Web | A plan card: *Start out after college*, with its milestones (salary banking ready, first month budgeted, emergency saving started, pension position understood) and a check-in a month after her first payday. She taps **Keep this plan**. | The plan engine, from the goal. The tap commits (Invariant 1). |
| 4 | Web | The product card shows the **Graduate Current Account**, not the Personal one, with the reason: graduated within three years, no maintenance fee for two years. Beside it, SuperSaver for the emergency fund. She taps both. | Suitability is decided by `suitableCurrentAccount`, a rule over her facts and the published catalogue: 66 and over, student, graduate, basic, personal, in that order. The model phrases it and cannot swap it: if it offers `current.personal` the server replaces it. |
| 5 | Web | Two applications start. The reuse card lists what she was never asked again (employment status for the account; the monthly saving for SuperSaver). Then the sign-in offer: keep this, pick it up on your phone, hear when something moves. She signs in with the code sent to her email. | `context_reused` events, counted (§53). Sign-in attaches the browser to the same participant. |
| 6 | Web → app | "Keep Baz on your home screen." Two taps. She opens the installed app, it offers to pick up where she left off, the same conversation is there. | Separate storage on iOS, one participant underneath (§28). |
| 7 | App | Identity, once: name, date of birth, address, PPS number, mobile, in three exchanges. Baz says it will use them across both accounts. | The journey's requirements; the catalogue's reuse policies. |
| 8 | App | "Two documents and you're done." An upload card for photo ID; she takes the photo. Then proof of address. The status card shows both done. | `request_upload`, the `upload` function, `documents` rows. |
| 9 | App | The review card for the Graduate Current Account: everything she gave, the terms to accept, one tap to submit. Then the SuperSaver review, with address and PPS number carried over for confirmation. Both submitted. | `ready → submitted` needs her confirmation from the card (§13). |
| 10 | Console | The bank moves: received, **documents checked and accepted**, approved, **complete**. Then a notification, sent deliberately, saying only that something has moved. | Each move is a state-machine transition pressed on the console; "documents checked" flips `documents.verified`. Push over Web Push. |
| 11 | Lock screen → app | She taps the notification. "Welcome back, Ciara. Your Graduate Current Account is open; your documents were checked and accepted." Above it, the welcome card: the account's name, an illustrative IBAN with a copy button, "your debit card is on its way to Rathmines", and what to do next: give your employer the IBAN, set up the standing order into SuperSaver. | The return trigger: the digest carries the events since she was last seen, the model phrases them, and the welcome card is built on the server from the database (Invariant 2). |
| 12 | App | "Shall I set the salary to land here?" The plan's first check-in is already in the diary for a month after her first payday. | `banking.salaryPaidTo`; the plan engine's `checkin_due`. |

Twelve beats, one conversation, two devices, no form.

## What the room should notice

- **The right account, not the default one.** A person at a counter would know a graduate gets
  the fee-free account. Baz knows because a rule over her facts says so, and the model cannot
  talk it into the €6-a-month one.
- **Identity once.** Six identity facts, given once, satisfy two applications and are confirmed
  rather than re-typed on the second review.
- **The bank moves and the customer finds out.** Nothing she has to check. The push says only
  that something moved; the conversation says what.
- **It ends with a working account**, or as close as a prototype can honestly get: an IBAN that
  validates, a card on its way, and the next two things already proposed.

## For the presenter

1. Open Baz in Safari on the phone, on the big screen. Send the second typed opener.
2. Answer in Ciara's words (above). Keep the plan. Tap both products. Sign in with the code.
3. Add to the home screen; open from there; pick up the conversation.
4. Give the identity details; upload two photos; submit both reviews. Tap **Tell me when
   something changes** on the status card.
5. On the console, for the current account: *Received by the bank*, *Documents checked*,
   *Approve*, *Complete*. Then *Notify*.
6. Tap the notification on the lock screen.

Reset between takes with `delete_case` on the console. Warm the cache first
(`docs/operations/runbooks.md`).

## Entry points for acquisition

- The QR code on anything printed leads to `/#/try`, which is Baz with a fresh case.
- The landing page's "Try in browser".
- The composer's typed openers, of which the second is this one.

Nothing is gated behind a login. The account is opened by somebody the bank has never met,
and the sign-in exists to keep the conversation, not to start it.

## What is real and what is simulated

| Real | Simulated |
|---|---|
| The conversation, the facts, the two applications, the reuse count | Identity verification: documents are uploaded and stored; "checked" is a console button, not a KYC provider |
| Sign-in by email code, the installed app, Web Push to the phone | Account opening: the state machine, not core banking |
| The published catalogue's eligibility and fees, as the suitability rule reads them | The IBAN: valid by the mod-97 rule, bank code `BAZZ`, so it can never be a real account |
| The status card and welcome card, from the database | The bank form behind a current account is not snapshotted (SuperSaver's 1833 is) |

## Built for this, 18 October 2026

- The `everyday_banking` need, leading to `current_account`, with its signals and framing.
- Two facts: `education.graduatedYear` and `banking.holdsIrishPaymentAccount`.
- `suitableCurrentAccount` in the tenant layer, applied to the digest and enforced in
  `show_product_options`.
- The console's *Documents checked* move, `documents_verified` narrated on return, and
  "(checked)" on the status card.
- The welcome card, `account_opened`, built on the server when an account completes.
- The opener in the composer.

Still to do: a fixture script transcribed from the first live run-through, so the Playwright
suite and the film fallback can play it without the model, and the story chapter on the
explainer.
