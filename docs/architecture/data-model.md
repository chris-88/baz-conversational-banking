---
title: Data model
status: current
scope: poc
last_verified: 2026-10-16
sources:
  - supabase/migrations/20260930210000_init.sql
  - supabase/migrations/20261001140000_revoke_internal_tables.sql
  - supabase/migrations/20261016171000_bank_request_documents.sql
  - supabase/migrations/20261016170000_application_display_name.sql
  - supabase/functions/_shared/domain/facts.ts
---

# Data model

26 tables, 23 forward-only migrations. Two rules shape every one of them.

**Clients read under RLS and never write.** There is not a single insert, update or delete
policy in the schema. Every mutation goes through an Edge Function holding the service role.

**Only the primary customer and an admin can read a case.** The partner never touches these
tables; the `partner` function returns scoped DTOs.

## The tables

### Core case

| Table | Holds |
|---|---|
| `cases` | The unit that persists. One customer's engagement |
| `participants` | A person on a case: `primary` or `partner`. Facts belong here, not to the case |
| `participant_sessions` | Auth user → participant. **Many-to-one by design**: one person, several auth users, one conversation |
| `customers` | Synthetic bank-held records, loaded server-side on authentication |
| `facts` | Typed values with provenance. The heart of the reuse story |
| `messages` | The conversation, with usage recorded per message |
| `events` | Everything significant, with an actor. Metrics derive from here |
| `consents` | Granted consents, with the wording shown at the time |
| `tokens` | Opaque link credentials, stored hashed. `expires_at` null means the link does not expire, which only the partner invite uses |

### Applications

| Table | Holds |
|---|---|
| `applications` | One customer's progress through one journey. `catalogue_id` says which product of that kind; `display_name` is what the customer saw it called when they started it (`SuperSaver`, not `Savings account`), written once at creation and read back by every card, summary and event. Null means the journey's name, which every row created before the column is called |
| `application_requests` | An open ask against an application: a journey document Baz has asked for, or something the bank asked for after submission (`requirement_id` prefixed `bank:`, see [document upload](../features/document-upload.md)) |
| `application_confirmations` | The customer's explicit confirmation from the review card |
| `documents` | Uploaded files, in Supabase Storage |
| `product_interests` | `offered`, `accepted`, `declined`, `deferred`. Declined means do not raise again |

### Plans and discovery

| Table | Holds |
|---|---|
| `plans` | A commitment that outlives any one application |
| `plan_milestones` | Its steps |
| `plan_checkins` | When to come back to it |
| `plan_watches` | A balance or condition the bank is watching for them |
| `need_decisions` | What the customer decided about a need that was raised |

### Digital forms

| Table | Holds |
|---|---|
| `form_applications` | An application against one of the bank's published forms. `answers` is the merge, facts last |
| `form_answers` | Answers that are not facts: form-specific questions, declarations with their wording, document references |

### Configuration and operations

| Table | Holds |
|---|---|
| `persona_config` | The slider values, read fresh every turn |
| `domain_config` | The permitted conversational domain |
| `catalogue_overrides` | Admin overrides on catalogue entries |
| `product_catalogue` | The product knowledge base as rows, one jsonb payload per product, once the console has loaded it. Empty means the functions read the compiled file |
| `mortgage_rates` | The mortgage rate table the same way. `updated_at` on an edited row moves the date every quote carries |
| `admin_users` | The admin roster |
| `push_subscriptions` | Web Push endpoints and keys |

## Row-level security

Reads are gated by two security-definer functions:

```sql
is_admin()                    -- auth.uid() is in admin_users
can_read_case(target_case_id) -- is_admin(), OR the caller's participant on that
                              -- case has role = 'primary'
```

`security definer` so the policy does not recurse through RLS on `participants`.

Every case table has exactly one policy, `<table>_read`, `for select using
(can_read_case(case_id))`. `persona_config`, `domain_config` and `catalogue_overrides` are
readable by everyone, because they are configuration the client needs to render correctly and
contain nothing private. `product_catalogue` and `mortgage_rates` are readable by admins only:
the functions read them on the service role, and the customer never needs the raw rows.

### Four tables with no read policy at all

`customers`, `participant_sessions`, `tokens` and `admin_users`.

RLS already denies every row on these, but the `SELECT` grant would remain, so PostgREST still
treats them as readable relations. The grant is revoked as well — so a policy added by mistake in
future still would not expose them, and the intent is visible at the grant level too.

Edge Functions reach them with the service role, which bypasses both.

## State literals are CHECK constraints

Not Postgres enums, so the specification can still move during the build without a migration to
alter a type. `state-literals.test.ts` fails if they drift from the TypeScript unions — which is
what makes the looser database constraint safe.

## Facts, in detail

```ts
type Fact = {
  key: FactKey;                 // from the catalogue, never free text
  subject: ParticipantId | 'household';
  value: unknown;               // validated by the catalogue schema for key
  source: 'customer_stated' | 'partner_stated' | 'bank_held'
        | 'document_extracted' | 'document_verified' | 'system_derived';
  verified: boolean;
  capturedFor: ApplicationId | null;  // drives questions-avoided
  supersededBy: FactId | null;
};
```

The catalogue in `domain/facts.ts` defines each key once — schema, subject type, reuse policy,
sensitivity, and whether the model may extract it:

```ts
'income.annualBasic': {
  schema: z.number().int().positive(),
  subject: 'person',
  reuse: 'confirm',
  sensitivity: 'standard',
  extractable: true,
},
```

`subject` is what keeps people apart: the primary's income never satisfies the partner's income
requirement. That has been a real bug, and it is explicitly tested.

What the primary says about their partner is a different fact again. `income.partnerAnnualStated`
is household-level hearsay: the salary the customer quoted for a partner who has not joined yet,
`reuse: 'never'`, read by no journey. The partner's own `income.annualBasic` is what an
application needs, and they state it themselves when they join.

Facts are never updated in place. A correction writes a new fact and sets `supersededBy` on the
old one, so the history of what someone said stays readable — which matters when the question is
"why did it ask me that again".

## Realtime

Enabled on the tables the UI watches. Handlers invalidate TanStack Query keys; they never write
to the cache. That is what makes a partner's answer appear in the primary's case without a
refresh.

## Adding a table

1. `npx supabase migration new <description>`.
2. Create the table, `alter table ... enable row level security`, and add exactly the read policy
   it needs — or none, and revoke the grant, if the browser should never see it.
3. `npx supabase db reset` locally, then `npm run db:types`.
4. If anything reads it in a turn, add it to the case loader and consider whether it belongs in
   the digest.

A table with RLS enabled and no policy is unreadable, which is the correct default.
