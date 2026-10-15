---
title: Deployment runbook
status: current
scope: poc
last_verified: 2026-10-15
sources:
  - .github/workflows/
---

# Deployment runbook

The architecture is in [architecture/deployment](../architecture/deployment.md). This is the
operational version.

## Normal deploy

Merge to `main`. Two workflows run independently:

| Workflow | Fires | Takes |
|---|---|---|
| `deploy-pages.yml` | Every push to `main` | ~1 min |
| `deploy-supabase.yml` | Pushes touching `supabase/**` | ~1 min |

`ci.yml` runs on the pull request before either.

## Before you merge

```bash
npm run check
```

Typecheck, lint, seed check, 779 tests, build, bundle secret scan. If you touched
`supabase/functions/`, also:

```bash
npm run typecheck:functions    # needs Deno installed
```

CI runs this with its own action, but finding out locally is faster than finding out from a failed
build.

## The ordering hazard

The two deploys are independent, so **a schema change and a frontend change that depend on each
other will be live at slightly different moments.**

Make the migration backward compatible, as you would anywhere else: add before you read, and
remove in a later change once nothing reads it.

## Migrations

Forward-only. `deploy-supabase.yml` runs `supabase db push`, which applies anything new.

There is no down migration and no rollback. To undo, write a forward migration that reverses it.

After a schema change lands:

```bash
npm run db:types     # regenerates from the LINKED project
```

Commit the regenerated types. It is generated — never hand-edit it.

## Verifying a deploy

```bash
E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e
```

Every surface mounts, renders its own content and carries the prototype disclosure; each beat of
the film sequence is reachable and carries the control the presenter reaches for.

Then, by hand, one thing the tests cannot check: send one message and confirm a reply streams.
That is the only path a route test does not cover, because there is no fixture provider.

## Before a presentation

In order:

1. `npm run eval:guardrails` — **100% on both sets.** It costs money; budget for it.
2. Reset the canonical case from the console. Confirm it restored, including the sign-ins.
3. Purge audience cases.
4. Check `AUDIENCE_MAX_CASES` has headroom for the room. Audience cases created in the last 24
   hours count; cases tagged `test` do not.
5. Confirm push works on the actual phone being filmed. VAPID keys must match between `.env` and
   the function secrets, or the subscription is rejected silently.
6. Set `PRESENTER_KEY` on the presenting device only.
7. Walk the film sequence once on the real device, on the real network.

## Rolling back

The Pages deploy is a static artifact: re-run the previous successful `deploy-pages.yml` to put
the old bundle back.

Functions and schema do not roll back. A function is redeployed from a revert commit; a migration
is reversed by a new migration.

A client with an old service worker will reload itself — `staleDeploy.ts` handles that — but do
not rely on it during a presentation. Hard-reload the device yourself after a deploy.

## Secrets

Edge Function secrets are set on the Supabase project, not in the repository.

GitHub needs `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` as
secrets, and the `VITE_*` values as repository variables.

The Supabase access token exists in two places that must rotate together: the GitHub secret, and
wherever it is held locally.
