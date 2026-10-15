---
title: Document upload
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - supabase/functions/upload/index.ts
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

The model cannot request an upload freely: `request_upload` must point at an **existing open
`application_request`**. It cannot invent a document to ask for.

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
