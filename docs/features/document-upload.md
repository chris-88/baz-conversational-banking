---
title: Document upload
status: current
scope: poc
last_verified: 2026-10-16
sources:
  - supabase/functions/upload/index.ts
  - supabase/functions/_shared/domain/bank-requests.ts
  - supabase/functions/admin/index.ts
  - src/baz/cards/UploadRequestCard.tsx
  - src/baz/cards/FormUploadCard.tsx
---

# Document upload

## From the customer's side

Baz asks for a document when an application needs one. A card appears with what is wanted; the
customer picks a file; it uploads and the requirement clears.

Two cards do this:

- `UploadRequestCard` — a document the bank has asked for against an application.
- `FormUploadCard` — the next document one of the bank's own published forms wants, **with that
  control's own size and type limits**, not limits invented here.

## `upload` is the only way in

One Edge Function, and nothing else writes a document.

| Property | Why |
|---|---|
| **Multipart, not JSON** | So the bytes are never base64 in a request body |
| **Private bucket, service role** | Nothing is readable from a browser |
| **The request row authorises the write** | A customer can only upload against a document the bank has actually asked for, and only on a case they are a participant in |
| **Size checked before reading** | The limit matches the bucket, so an oversized file is refused before it is read into memory |

The model cannot request an upload freely: `request_upload` serves only a document the
application is actually waiting for, one of its journey's outstanding `document` requirements or
a request the bank has opened, and the card always points at an **open `application_request`
row**. It cannot invent a document to ask for.

## A bank request is an upload target

After submission the bank can ask for more. The console's **Ask for more information** (§41)
moves the application to `info_required` and opens an `application_requests` row: `kind`
`document`, `requested_of` the primary applicant, `detail` the wording ("one more payslip" unless
the presenter types something else), and `requirement_id` `bank:<slug of the wording>`, a prefix
no journey uses. Asking for the same thing again reuses the open row.

`withBankRequests` in `_shared/domain/bank-requests.ts` adds every open bank request to the
application's evaluation as an outstanding, blocking document for the customer, labelled with the
wording and typed `bank_request`. `evaluateFor` and the digest both apply it, so the status card's
steps, the outstanding counts, the handoff note and the console all show it, and Baz is told what
the bank asked for and to offer the upload rather than guess what else is wanted.

`request_upload` serves it first, whatever document type the model names: the card is rendered
against the existing request row, never a second one. The upload records the file as
`bank_request`, marks the request fulfilled and, when the application is `info_required` with no
request left open, moves it to `under_review` through the state machine's `information_supplied`
and writes `document_received` with the uploader as actor. The presenter's **Information
supplied** button closes any open bank requests for the same reason.

Before this, the simulation wrote the event and the state change and nothing else: Baz read the
event, said the team had asked for one more payslip, offered the upload, and the handler answered
that nothing was outstanding. There was never anything to upload to.

## What is recorded

A row in `documents`, and an event. The requirement recomputes and clears.

A fact extracted from a document is recorded with source `document_extracted`, or
`document_verified` once verified — provenance is part of the fact, so the console can show
whether a figure was stated or evidenced.

## In a form packet: a reference, never a signature

This is the part to be careful about.

The genuine journey uploads to a service that issues `x-file-hash` and `x-signed-file-hash`. Baz
leaves both **null**.

A fabricated signature is a forged credential, however synthetic the file it describes. What goes
into the submission packet is a reference — enough to show which file answered which control, and
nothing that could pass for the real upload service's receipt.

That is the one thing in this whole feature that must not be invented, and it is written down in
three places for that reason.

## In the console

Documents appear in the case inspector with their provenance, and `verify_documents` is a
presenter action — a simulated verification step through the state machine, not a real check of
anything.
