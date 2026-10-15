---
title: ADR-0001 — The conversation is the only customer surface
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - docs/decisions.md
  - src/app/routes.ts
---

# ADR-0001 — The conversation is the only customer surface

## Status

Accepted, 2026-10-06. Reconstructed from `docs/decisions.md` and commit `9569094`.

## Context

The project was originally built with five surfaces: a replica of the public bank website, an
authenticated mobile banking shell behind a simulated login, a handoff code that carried a
conversation from one to the other, a separate audience entry, and the presenter console.

By 2026-10-05 all of it worked. It was also, in the words of the commit that removed it,
"scaffolding around the only part worth showing."

Two specific failures made the case. The replica surfaces had **dead controls** — product cards
that looked tappable and were inert text, a microphone button with no speech input behind it, a
"View all" that looked like a link. And the authenticated track implied something false: that
there was a signed-in version of Baz that knew more about you, when in fact every visitor is
anonymous and tells Baz what it needs to know.

## Decision

Three customer surfaces: a landing page that makes one claim and offers two ways to act on it;
Baz, which is the same screen in a browser tab and on a home screen; and the partner link.

The console stays where it is, reachable only by typing the address.

`/app/*` and `/try` redirect to `/baz`, so an installed PWA pinned to the old path, or a QR code
printed on a slide, still lands somewhere.

## Alternatives considered

**Keep the shell and finish the dead controls.** Rejected: it is a week of work to make
scaffolding convincing, and the priority order puts orchestration far above visual completeness.
Weak orchestration with perfect visuals is a failed proof of concept.

**Keep the shell as a filming backdrop.** Rejected: a surface that exists only to be filmed
behind is a surface that has to keep working, and it was already producing bugs.

**Keep the authenticated track for the continuity story.** Rejected, and this was the real
argument. Continuity is better demonstrated *without* a signed-in shell: the conversation carrying
across a sign-in is the point, and a separate authenticated app made it look like a navigation
change rather than a continuity guarantee.

## Consequences

- Eleven components deleted. The login, the handoff code and its token, and the "Continue in the
  app" card went with them.
- The notification link goes to Baz directly rather than through a login that no longer exists.
  The token still travels, still opaque, still single-use.
- Installed as a PWA, it opens straight into the conversation.
- `src/app/routes.ts` documents the pivot where a reader will actually find it.
- `CLAUDE.md` described the five-surface architecture for nine days after this was true, which is
  why that file is now checked against the code rather than trusted.

## Revisit when

A specific demonstration requires showing Baz embedded in a bank's own chrome. That is a different
claim — about integration rather than about conversation — and would need its own surface rather
than the return of this one.
