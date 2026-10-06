# Admin console redesign — review and build plan

**Reviews:** `baz-admin-console-redesign-feature-request.md` (1,783 lines) and the seven mockups.
**Settings (§10) deliberately not covered** — parked pending a decision on what it should configure.

---

## 1. The shape of the job

The spec reads as a UI redesign. About half of it is.

The other half needs data the system does not currently produce. That distinction matters more
than the screen order, because the UI half can be built in a few days and the data half cannot.

| | Screens | Reality |
|---|---|---|
| **Mostly layout** | Guardrails, Persona, Goals & needs (read view) | The data already exists and is already on screen. Rearranging it is a week of work at most. |
| **Layout plus modest backend** | Cases | Three panes, four tabs, search, status filter. Needs message timestamps, a case-status concept and a few new contract fields. |
| **Backend first** | Analytics | Almost nothing behind it exists. Four of its nine panels have no data source at all. |
| **Mostly fiction** | Profile | Roles, 2FA, sessions, notification preferences, timezone, language. One real field: the email address. |

The redesign is worth doing. The risk is spending the time on the parts that photograph well
rather than the parts that make the console useful, and the spec's own Phase 1 is the right
instinct — Cases is where the value is.

---

## 2. Screen by screen

### 2.1 Cases (§5)

**Required:** three resizable panes; KPI row with deltas and sparklines; search; status tabs
(All / In progress / Needs review / Completed / Blocked); list rows showing the latest message and
last-active time; conversation pane with four tabs; customer/context pane with four tabs; View in
CRM; Export; New test conversation.

**Have:** a case table, a case page with four tabs (Handover / Conversation / Act as the bank /
How Baz worked it out), the handover note, the hand-moves, the event log, goal and need reasoning.

**Gaps:**

| Gap | Size | Note |
|---|---|---|
| Three-pane master/detail | M | Needs `Resizable`. Today it is list page → detail page. The spec's layout is better for this workflow. |
| **Case status taxonomy** | M | "In progress / Needs review / Completed / Blocked" does not exist. This is a domain decision, not a badge: what makes a case *need review*? |
| Message timestamps | S | The `messages` table has `created_at`; the admin contract drops it. One-line fix. |
| Latest message preview in the list | S | Contract addition. |
| Search | S | Client-side over the loaded list is enough at this scale. |
| KPI deltas and sparklines | **L** | Needs time-bucketed metrics and a period comparison. See §3.1. |
| Events tab (Time / Event / Source / Object / Result) | M | The `events` table already has type, actor, payload, `application_id` and `created_at`. Needs a contract and a describer that resolves *object* and *result*. |
| Summary tab (AI-generated, labelled) | M | New. A model call, cached per case. |
| View in CRM | — | **There is no CRM.** Drop it or make it an obvious stub. |
| Export | S–M | CSV of the case list, or of one conversation. |
| New test conversation | S | Admin creates a case and opens it. |
| Admin typing into a test conversation | M | The spec hedges on this. It means posting as the customer, which needs a deliberate server path. |

### 2.2 Goals & needs (§6)

**Required:** master/detail; search, sort and filter; seven detail cards; lifecycle metadata
(status, created, last updated, ID, version); editing via `Sheet`; enable/disable.

**Have:** tabs and an accordion, read-only, every value compiled in from `domain/goals/` and
`domain/needs/`.

**Gaps:**

| Gap | Size | Note |
|---|---|---|
| Master/detail instead of accordion | M | Pure UI. The spec's layout is better. |
| Lifecycle metadata | M | Created, updated, version and status do not exist. Constants in a TypeScript file have no history. Real values need a table. |
| Sort by priority | S | Needs have a priority; goals do not. |
| Per-goal icons | S | Not in the data. |
| **Editing** | **L–XL** | The one I flagged when the screen was built. See §3.2. |

### 2.3 Guardrails (§7)

The closest to done. The current screen already shows the categories, the examples, the exact
refusal wording, the in/out-of-scope lists and the blocked log.

**Gaps:**

| Gap | Size | Note |
|---|---|---|
| Expandable category rows, master/detail polish | S | Layout. |
| **Recently blocked shows the request text** | S + **a decision** | The `request_blocked` event records the category, the reason and the injection flag — **not the message**. The mockup shows "Write me a poem about cats". Storing blocked input is a deliberate choice, not an oversight. |
| **Test a request** | M | New. Runs the real gate with no case attached. High demo value — it proves enforcement sits in front of the model — and it is genuinely small. |

### 2.4 Persona (§8)

**Have:** presets, six sliders, save. The spec's "do not auto-save on slider movement" is already
how it behaves — presets apply on click, sliders have an explicit button.

**Gaps:**

| Gap | Size | Note |
|---|---|---|
| Live preview | M | A model call with the *draft* persona, before it is saved. New admin action. |
| Slider descriptions, value chips, Reset | S | Copy and layout. |
| "Apply to the next message" | — | Already true: persona is read fresh every turn. A labelling change. |

### 2.5 Analytics (§9)

Entirely new, and the honest answer is that **four of its nine panels have nothing behind them.**

| Panel | Data source | Verdict |
|---|---|---|
| Conversations, applications, goals, blocked | `events` | **Real** — needs date bucketing |
| Conversation volume over time | `events` | **Real** — needs date bucketing |
| Application funnel | `events` + application states | **Real** |
| Top discovered goals | Needs a `goal_identified` event | **Real once that event is written** |
| Guardrail triggers by type | `request_blocked.payload.category` | **Real today** |
| New vs returning users | — | **No such concept.** No accounts, no identity across sessions |
| Channel mix | — | **No channel field.** Everything is web |
| Average completion time | — | "Completion" is undefined. Derivable if we define it |
| Conversations by outcome | Derivable from events | **Real once outcomes are defined** |

The spec says *"Do not fabricate metrics merely to make the dashboard look populated."* Taken at
its word, two panels should be dropped and two need definitions before they can be built.

Also: **shadcn's `Chart` is a Recharts wrapper, and Recharts is not installed.** See §4.

### 2.6 Profile (§11)

Role and permissions, 2FA, active sessions across devices, notification preferences, timezone,
language, theme, density.

**Of that list, one field is real: the email address.** Everything else is either unimplemented
(2FA, notifications, sessions) or unused (timezone, language, density). Building it means building
a screen of switches that do nothing, on a tool with one user.

My recommendation: **cut it.** If you want somewhere to sign out and see who you are, that is the
sidebar footer, which already does both. Revisit if the console ever has more than one operator.

---

## 3. The three things that are actually hard

### 3.1 Time-bucketed metrics

Metrics today are `count(*) group by type` over all events, for all time. Every KPI card in the
spec wants a value, a comparison against the previous period, and a daily series.

That is one well-shaped Postgres function — `metrics_by_day(from, to)` returning a row per day per
event type — plus a period selector threaded through the admin contract. Not conceptually hard,
but it touches every screen with a date range on it, so it wants doing once, early.

### 3.2 Editing the goal catalogue

Goals and needs are TypeScript. Their conditions are **predicates over facts**, not text:

```ts
when: (context) => savings(context) < monthlyEssentials(context) * 3
```

A form cannot edit that. Three honest options:

| Option | Effort | What you get |
|---|---|---|
| **A. Read-only, properly presented** | S | The spec's layout, the lifecycle card showing "defined in code", no edit affordance. Honest, and the screen still does its job of proving the engine is deterministic. |
| **B. Edit the prose, not the logic** | M | Name, description, framing, check-in agendas, milestone labels, enable/disable, priority — moved to a DB table that overlays the code catalogue. Conditions stay in code and are shown read-only. Covers most of what a demo needs to tune live. |
| **C. Full catalogue in the database** | **XL** | A rules representation, an editor for it, migration of all 26 goals and 9 needs, and a new class of runtime failure when a rule is malformed. Days, and it puts the sharpest part of the system behind a form. |

**I would do B.** It makes "update as needed" true without pretending the conditions are editable,
and the lifecycle metadata (created, updated, version, active) comes along for free because there
is finally a row to put it on.

### 3.3 Case status

"In progress / Needs review / Completed / Blocked" is the spine of the Cases screen and it does not
exist. It needs defining before it can be built. My proposal:

```
Blocked        a request_blocked event in this case
Needs review   an application in info_required, or a check-in due,
               or a partner task outstanding
Completed      every application completed or declined, and no active plan
In progress    anything else with at least one customer message
```

Derived, never stored — same rule as everything else. Worth you sanity-checking, because this is
the thing the list sorts and filters by.

---

## 4. Decisions I need from you

1. **Recharts.** shadcn `Chart` wraps it; there is no charting without it (~100 KB gzipped).
   CLAUDE.md says ask before adding a dependency. **Yes/no?** No Recharts means no sparklines and
   no Analytics as specified.
2. **Goal editing: A, B or C** (§3.2). I recommend B.
3. **Analytics honesty.** Drop channel mix and new-vs-returning, or add the tracking to make them
   real? Dropping is one line; making them real means identity across sessions.
4. **CRM link and Export.** Stub them for the screenshot, or leave them out? There is no CRM.
5. **Profile.** Cut, or build it knowing most of it is decorative?

---

## 5. The chunks

Each ends deployed and useful on its own. Sized against a day being a solid working day.

### Chunk 1 — shell and shared parts · ~1 day
`PageHeader`, `MetricCard`, `KeyValueList`, `EventRow`, `ConversationMessage`, `DefinitionListItem`,
`ConfirmAction`. Install `Resizable`, `Popover`, `Calendar`, `Command`, `ToggleGroup`, `Progress`.
Period selector in the header, threaded into the admin contract.
*No visible change beyond the header. Everything after this is faster.*

### Chunk 2 — Cases, the three-pane workspace · ~2 days
Resizable panes; case list with search and status tabs; conversation pane keeping the four existing
tabs. **Depends on §3.3 being settled.**
*The single biggest improvement. Phase 1 of the spec.*

### Chunk 3 — Cases, the context pane · ~1.5 days
Customer / Summary / Goals / Applications tabs. Message timestamps, latest-message preview, the
Events tab table. The Summary tab's model call.
*Completes Cases as specified, minus CRM/Export.*

### Chunk 4 — Guardrails · ~0.5 day
Master/detail polish, expandable categories, **Test a request**.
*Smallest chunk, best demo-value-per-hour in the document.*

### Chunk 5 — Persona · ~0.5 day
Slider descriptions and value chips, Reset, live preview.

### Chunk 6 — Goals & needs, read view · ~1 day
Master/detail replacing the accordion, the seven cards, search/sort/filter.

### Chunk 7 — Goals & needs, editing · ~1.5 days *(if option B)*
Overlay table, `Sheet` editor, enable/disable, lifecycle metadata.

### Chunk 8 — Metrics backend · ~1 day
`metrics_by_day`, period comparison, the `goal_identified` event, outcome classification.
*Nothing visible. Everything in Chunk 9 depends on it.*

### Chunk 9 — Analytics · ~2 days *(needs Recharts)*
KPI sparklines, volume chart, funnel, top goals, guardrail triggers, insights panel.
*Built only from panels with real data behind them.*

**Roughly 11 days of focused work** for everything except Settings and Profile. Chunks 1–5 are
about half of it and cover Phase 1 and Phase 2 of the spec — which is the part that makes the
console better to use and better to show.

---

## 6. What I would cut

- **Profile** (§11) — one real field.
- **View in CRM** — there is no CRM.
- **Channel mix** and **new vs returning** — no data, and the spec forbids fabricating it.
- **Admin typing into a customer conversation** — plausible-looking but it means posting as the
  customer, and that transcript is the record a human reads before phoning them. We have just
  finished taking fabricated customer speech *out* of it.
