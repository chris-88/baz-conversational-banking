# Baz Admin Console — shadcn/ui Redesign
## Feature Request / Development Handoff

**Status:** Proposed  
**Scope:** Admin console UI/UX redesign  
**Product:** Baz  
**Audience:** Engineering, Product, Design  
**Objective:** Rebuild the existing Baz admin experience into a coherent, information-dense, modern internal tool using shadcn/ui primitives, while preserving the existing functionality and backend behaviours.

---

# 1. Summary

The current Baz admin console contains most of the information and controls needed for the POC, but the presentation is fragmented:

- too much information is presented as isolated cards;
- important context is separated across screens;
- there is little visual hierarchy between monitoring, configuration and action;
- case inspection requires too much navigation;
- large areas of the viewport are underused;
- controls do not consistently distinguish configuration from runtime state;
- the experience feels like a collection of prototype screens rather than one admin product.

The redesign should make the admin console feel like a polished shadcn-style internal tool.

The core principle is:

> **Dense where information benefits from density; quiet everywhere else.**

This is an internal operational tool. It should not inherit the consumer-facing Baz visual treatment beyond brand colour, logo and typography.

---

# 2. Design principles

## 2.1 Use shadcn primitives, not bespoke component chrome

Prefer standard shadcn/ui components wherever possible.

Custom components should primarily be compositions of:

- `Sidebar`
- `Card`
- `Tabs`
- `Table`
- `Badge`
- `Button`
- `Input`
- `Select`
- `DropdownMenu`
- `Accordion`
- `Collapsible`
- `Resizable`
- `ScrollArea`
- `Alert`
- `Avatar`
- `Slider`
- `Switch`
- `Tooltip`
- `Popover`
- `Dialog`
- `Sheet`
- `Separator`
- `Breadcrumb`
- `Chart`
- `Skeleton`
- `Toast`
- `Command`

Avoid inventing new panel/button/input styles unless a banking-specific behaviour requires one.

## 2.2 Desktop-first

The admin console is primarily a desktop tool.

Target:

- ideal: 1440px and above;
- usable: 1280px;
- minimum: 1024px;
- below 1024px: collapse sidebar and progressively stack panels.

No mobile-first admin redesign is required for the POC.

## 2.3 Information density is intentional

The admin console should fit substantially more useful information into a viewport than the current implementation.

Do not achieve this by reducing text to illegibility.

Instead use:

- compact row heights;
- muted supporting text;
- strong section headings;
- badges for states;
- master/detail patterns;
- scrollable panes;
- fewer full-width cards.

## 2.4 Monitoring, configuration and action must look different

Three broad interaction types exist:

**Monitoring**
- metrics;
- activity;
- conversations;
- analytics.

**Configuration**
- goals;
- needs;
- guardrail definitions;
- persona;
- settings.

**Actions**
- act as the bank;
- trigger test events;
- send notifications;
- reset/rebuild sample data.

The UI should make these distinctions obvious.

## 2.5 No destructive action without explicit confirmation

Examples:

- purge conversations;
- rebuild/reset sample customer;
- disable Baz;
- delete goal;
- delete need;
- revoke access;
- clear environment data.

Use `AlertDialog` for destructive or consequential actions.

---

# 3. Global application shell

## Route structure

Suggested routes:

```text
/admin/cases
/admin/cases/:caseId
/admin/goals
/admin/guardrails
/admin/persona
/admin/analytics
/admin/settings
/admin/profile
```

Profile should primarily be accessed through the signed-in user control in the sidebar footer rather than appearing as a main navigation item.

## Main layout

Use:

- `SidebarProvider`
- `Sidebar`
- `SidebarHeader`
- `SidebarContent`
- `SidebarGroup`
- `SidebarGroupLabel`
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `SidebarFooter`
- `SidebarInset`
- `SidebarTrigger`

### Sidebar width

Approx:

```text
expanded: 232–248px
collapsed: icon rail
```

Main navigation:

```text
Cases
Goals & needs
Guardrails
Persona
Analytics
Settings
```

Footer:

```text
Avatar
Chris Quinn
Admin
chevron / user menu
```

Use `DropdownMenu` from the footer to expose:

- Profile
- Sign out

Do not place Profile as another permanent sidebar item.

## Page header

Each page gets a consistent header:

```text
Page title
Short explanatory sentence
                                        contextual actions
```

Use:

- `Breadcrumb` where deeper navigation exists;
- `Button`;
- `DropdownMenu`;
- `Select` or `Popover` + `Calendar` for date range;
- `Separator` only where hierarchy benefits from it.

Do not use giant hero-style page headers.

## Global feedback

Use:

- `Skeleton` for data loading;
- `Toast` for successful non-destructive actions;
- `Alert` for page-level warnings;
- `Tooltip` for icon-only controls;
- `Empty` for empty datasets;
- `Spinner` only for active actions that need explicit progress.

---

# 4. Shared design tokens

The admin console should stay visually restrained.

Suggested tokens:

```css
--background: #f8fafc;
--foreground: #0f172a;
--card: #ffffff;
--card-foreground: #0f172a;
--muted: #f1f5f9;
--muted-foreground: #64748b;
--border: #e2e8f0;

--primary: Baz / BOI blue;
--success: restrained green;
--warning: amber;
--destructive: red;
```

Use shadcn's token model rather than hard-coding colours inside feature components.

Radius:

```text
cards: 12–16px
controls: default shadcn radius
badges: pill where appropriate
```

Shadows should be subtle. Prefer borders over heavy elevation.

---

# 5. Screen: Cases

## Objective

Cases is the operational heart of the admin console.

It should answer:

- What conversations are happening?
- Which ones need attention?
- What has Baz understood?
- What applications/goals exist?
- What did Baz actually say?
- What state changes have occurred?
- Can the presenter/admin simulate the bank side of the journey?

The new screen should combine case discovery, conversation inspection and customer state into one workspace.

## Layout

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Page header + period + export + new test conversation       │
├────────────┬────────────┬────────────┬───────────────────────┤
│ KPI        │ KPI        │ KPI        │ KPI                   │
├───────────────┬─────────────────────────┬────────────────────┤
│ Case list     │ Selected case           │ Customer/context   │
│               │ conversation / actions  │ panel              │
│               │                         │                    │
└───────────────┴─────────────────────────┴────────────────────┘
```

Use a `ResizablePanelGroup` for the three lower panes.

Recommended proportions:

```text
case list: 25%
conversation: 45–50%
customer context: 25–30%
```

Allow sensible min/max widths.

## KPI row

Use four `Card` components:

- Total conversations
- Applications started
- Goals identified
- Blocked requests

Each card can contain:

- label;
- main metric;
- comparison/delta;
- subtle sparkline.

Use:

- `Card`
- `CardHeader`
- `CardContent`
- `Badge` for trend if needed;
- `ChartContainer` + Recharts for mini sparklines.

Do not make KPIs individually clickable unless a meaningful filter exists.

## Case list pane

Use:

- `Input` / `InputGroup` for search;
- `Tabs` or `ToggleGroup` for common statuses;
- `ScrollArea`;
- custom `CaseListItem` composed from `Button`, `Avatar`, `Badge`.

Suggested tabs:

```text
All
In progress
Needs review
Completed
Blocked
```

Each row:

```text
Avatar/initials
Customer/case name
one-line latest message
message count
last active
state badge
```

Selected row should use `data-state=selected` treatment rather than a large card.

For a much larger future dataset, move this pane to a `DataTable`, but the list pattern is better for the current conversation-oriented workflow.

## Conversation pane

Header:

```text
Unnamed · 3e0623c5
12 messages · last active 2m ago
[View in CRM] [...]
```

Use:

- `Avatar`;
- `Badge`;
- `Button`;
- `DropdownMenu`.

Below that use `Tabs`:

```text
Conversation
Act as the bank
Handover
Events
```

### Conversation tab

Use:

- `ScrollArea`;
- current shadcn `Message` / `Bubble` components if the project registry includes them;
- otherwise build lightweight message rows using `Avatar` + `div`.

Conversation should display:

- customer messages;
- Baz messages;
- timestamps;
- optional source/event chips;
- system events visually distinct from chat.

Do not render raw JSON in the main transcript.

The input at bottom is only present if admins are allowed to interact with a synthetic/test conversation.

Use:

- `Textarea` or `InputGroup`;
- `Button`;
- `Attachment` if document test upload exists.

### Act as the bank tab

This replaces the current large isolated action page.

Group deterministic state-machine transitions into sections:

```text
Applications
Events / milestones
Documents
Notifications
```

Use:

- `Card` or simple grouped sections;
- `Button`;
- `Tooltip`;
- `AlertDialog` where consequential.

Examples:

```text
Mortgage moved to assessment
Mortgage requests a document
Joint account approved
Credit card approved
Savings target reached
Bank checks documents
```

Disabled transitions should include a `Tooltip` explaining why they are unavailable.

After action:

- update UI optimistically only where safe;
- otherwise show spinner;
- receive new event;
- append it to Events tab;
- `Toast` success.

### Handover tab

Use:

- `Alert` for readiness;
- `Card` for handover summary;
- `Table` or definition list for known facts;
- `Button` for simulate/request handover.

Structure:

```text
Reason for handover
Customer goal
Known facts
Applications
Outstanding questions
Suggested adviser context
```

### Events tab

Use a compact `Table`.

Columns:

```text
Time
Event
Source
Object
Result
```

Use `Badge` for event type.

## Customer/context pane

Use `Tabs`:

```text
Customer
Summary
Goals
Applications
```

### Customer

Use small `Card` sections:

- identity / metadata;
- key facts extracted;
- channel;
- linked account;
- returning customer;
- first seen.

Use `Button variant="outline"` for View in CRM.

Facts should use a compact key/value component, not a table with heavy borders.

### Summary

Show an AI-generated but clearly labelled summary plus deterministic case state.

Use:

- `Card`;
- `Alert` if stale or not generated;
- `Button` to regenerate only if required for POC.

### Goals

Use goal rows with:

- name;
- confidence;
- state;
- evidence count;
- `Progress` if milestones apply.

### Applications

Use application rows:

```text
Mortgage        Waiting for customer
Joint account   Approved
Loan            Deferred
```

Use `Badge` variants and a small progress indicator if useful.

---

# 6. Screen: Goals & Needs

## Objective

This is the configuration workspace for the Goal Engine and Needs Engine.

It should make the machine-readable catalogues understandable to a human reviewer.

It should answer:

- What goals does Baz know?
- What evidence activates them?
- What information is required?
- Which milestones belong to a goal?
- Which goals overlap?
- Which needs map to each goal?
- What life events create goal clusters?

## Page-level components

Use:

- `Alert` for the explanation of evidence/confidence;
- `Tabs`:

```text
Goals (26)
Needs (n)
Life events (10)
```

- `Input` for search;
- `Popover`/`DropdownMenu` for filters;
- `Select` for category or sort.

## Main layout

Use two-pane master/detail:

```text
┌────────────────────┬──────────────────────────────────┐
│ catalogue list     │ selected definition              │
└────────────────────┴──────────────────────────────────┘
```

Use:

- `ResizablePanelGroup`;
- `ScrollArea`.

### Left pane

Rows should show:

```text
icon
goal name
short description
category badge
```

Use:

- `Button variant="ghost"` or custom selectable row;
- `Badge`;
- `Tooltip`.

No card around every row.

### Right pane: selected goal

Header:

```text
[icon] Buy our first home
Move from deposit preparation...
[housing] [family] [saving]
                                  [Active] [...]
```

Use:

- `Badge`;
- `DropdownMenu`;
- `Button`.

Content can use a responsive two-column card grid.

Recommended cards:

**Description**
- `Card`
- optional `Button` Edit.

**Evidence signals**
- `Card`
- `Badge` for signal strength;
- compact list.

**Information required**
- `Card`
- checklist/list;
- optional canonical field reference on hover via `Tooltip`.

**Lifecycle & status**
- `Card`
- key/value rows.

**Related goals**
- `Card`
- clickable list;
- category `Badge`.

**Milestones**
- `Card`
- ordered list;
- `Badge` or numbered circle;
- `DropdownMenu` per row.

**Linked needs**
- `Card`
- list with need state/type.

## Editing

For POC configuration:

Use `Sheet` for editing goal definitions rather than navigating away.

Inside:

- `Field`
- `Label`
- `Input`
- `Textarea`
- `Select`
- `Combobox`
- `Checkbox`
- `Button`.

Use `AlertDialog` for delete/deactivate.

Do not allow a free-form prompt editor to override deterministic goal rules.

---

# 7. Screen: Guardrails

## Objective

Make Baz's domain boundaries understandable and inspectable.

It should prove:

- every request is classified;
- some categories reach Baz;
- some are blocked before Baz;
- refusal behaviour is controlled;
- current scope is visible;
- blocked requests are auditable.

## Page header

Use `Alert` immediately under the page title:

> A classifier plus deterministic checks run in front of the model...

This is important enough to remain visible.

## Layout

Two columns:

```text
left 65%: category definitions
right 35%: scope + recent activity
```

## Classification definitions

Use `Accordion`.

Each `AccordionItem` should show:

```text
icon
category
description
status badge
chevron
```

Examples:

```text
Banking, in scope                reaches Baz
Ambiguous                        reaches Baz
General knowledge                blocked
Competitor query                 blocked
Off topic                        blocked
Abusive                          blocked / conditional
Prompt injection                 blocked
```

Expanded content:

```text
What it means
Examples
Response behaviour
Classifier/rule identifier
```

Use:

- `Accordion`;
- `Badge`;
- `Alert` or `Blockquote`-style container for refusal example;
- `Tooltip` for rule identifiers.

Do not use a different card for every class.

## In scope / Out of scope

Use two `Card`s.

In-scope can use a success icon/accent.

Out-of-scope can use destructive/muted accent.

Keep content as bullets.

## Recently blocked

Use:

- `Card`;
- compact `Table`;
- `Badge`.

Columns:

```text
Customer
Request
Classification
Time
```

Clicking a row can open `Sheet` with:

- raw customer request;
- classifier result;
- deterministic checks;
- returned refusal;
- trace ID.

Never expose hidden model reasoning.

## Test guardrail

Optional but useful for demo:

Add `Button`:

```text
Test a request
```

Open `Dialog`.

Use:

- `Textarea`;
- `Button`;
- resulting `Badge`;
- small result panel.

This should call the exact same classification/rule path as a normal customer request.

---

# 8. Screen: Persona

## Objective

Allow a presenter/admin to change how Baz sounds while making it extremely clear that these controls do not change scope, policy or capabilities.

This should feel playful but controlled.

## Page-level warning

Use `Alert`:

> These settings only affect tone and style...

## Layout

Two columns:

```text
left: controls
right: live preview
```

Use `ResizablePanelGroup` if useful, otherwise CSS grid.

## Presets

Use `ToggleGroup` or grouped `Button`s:

```text
Default
Concise
Friendly
Formal
Dry humour
Poetic
```

Only one active at a time.

If implementing with buttons, use `aria-pressed`.

## Tone controls

Use one `Slider` per dimension:

```text
Length
Humour
Sarcasm
Formality
Playfulness
Poetic
```

Each control should include:

- `Label`;
- explanatory muted text;
- current numeric value;
- `Slider`.

Use `Tooltip` where the meaning could be ambiguous.

## Actions

Bottom controls:

```text
Reset
Apply to next message
```

Use:

- `Button variant="outline"` Reset;
- `Button` primary for Apply.

Do not auto-save on slider movement for the POC; this makes presenter behaviour deterministic.

## Live preview

Use `Card` with:

- example customer message;
- Baz preview response;
- `Badge` "Preview";
- active settings chips below.

Use current shadcn `Message`/`Bubble` if available; otherwise the same message component used by Cases.

Preview should update either:

- locally using a mocked/stored response while sliders move; or
- after an explicit "Refresh preview" action.

Avoid spending model calls continuously while dragging sliders.

---

# 9. Screen: Analytics

## Objective

Analytics should demonstrate whether Baz is delivering meaningful customer and operational outcomes.

It should not be a vanity dashboard.

Primary questions:

- Are customers using it?
- Is Baz identifying goals?
- Are conversations progressing into applications?
- Is retained context reducing duplicate questions?
- Are users returning?
- Are guardrails working?
- How long do journeys take?
- Which goals are most common?

## Header

Actions:

- date range;
- export.

Use:

- `Select`, or `Popover` + `Calendar`;
- `Button`.

Do not include "New test conversation" here unless there is a global header action across the entire app.

## KPI row

Use `Card`:

- Conversations
- Applications started
- Goals identified
- Questions avoided / blocked requests

Each:

```text
metric
period delta
sparkline
```

Use shadcn `ChartContainer` and Recharts.

## Conversation volume

Large `Card`.

Use:

- `ChartContainer`;
- `BarChart`;
- `CartesianGrid`;
- `XAxis`;
- `ChartTooltip`;
- `ChartTooltipContent`;
- optional `ChartLegend`.

Series:

```text
New
Returning
```

## Application funnel

Use horizontal `BarChart` or purpose-built stacked bars inside `Card`.

Stages:

```text
Discussed option
Application started
Application completed
Approved
```

Avoid literal funnel graphics unless they improve comprehension.

## Top goals

Use `Card` + horizontal bars.

Examples:

```text
Buy first home
Organise finances
Build emergency fund
Prepare for retirement
```

## Guardrail triggers

Use `Card` + horizontal bar chart.

Colour may distinguish blocking classifications, but avoid a rainbow dashboard.

## Channel mix / outcomes

Use `ChartContainer` with `PieChart` / `RadialBarChart` only if it reads clearly.

Prefer tables/bars when the category count becomes large.

## Average completion time

Use `LineChart`.

## Insights & trends

Right rail `Card`.

This should be deterministic analytics copy, not an unconstrained LLM commentary feed.

Each insight:

```text
icon
headline
supporting metric/context
```

## Export

Use `DropdownMenu`:

```text
Export CSV
Export JSON
```

PDF export is unnecessary for the POC unless already implemented.

---

# 10. Screen: Settings

## Objective

Settings should contain prototype/environment configuration, integrations, notifications, feature flags and privacy controls.

It should not mix personal administrator preferences with project configuration.

## Layout

Use a settings sub-navigation within the page.

Desktop:

```text
settings nav       settings content
```

Use either:

- vertical `Tabs`, or
- a simple `Sidebar`-style local nav.

Suggested sections:

```text
General
Integrations
Notifications
Environment
Access
Data & privacy
```

For the POC, these may render on one long page while nav anchors scroll to sections.

## General

Use `Card` + `Field` components:

```text
Project name
Default domain
Project description
```

Components:

- `Label`
- `Input`
- `Textarea`
- `Button`.

## Integrations

Use list rows inside `Card`, not one card per integration.

Each row:

```text
icon
integration name
description
status badge
Configure / Connect
...
```

Use:

- `Badge`;
- `Button`;
- `DropdownMenu`;
- `Separator`.

Configuration opens `Dialog` or `Sheet`.

Never display secrets after initial creation.

Use `Input` with masked value for tokens.

## Environment

Use:

- `ToggleGroup` or `Tabs`:

```text
Development
Staging
Production
```

For the current POC, only environments that actually exist should be selectable.

Use `Alert` to explain the effect.

Fields:

```text
API base URL
Log level
```

Use `Input`, `Select`.

## Feature flags

Use rows with:

- name;
- description;
- `Switch`.

Example:

```text
Mortgage application flow
Document upload
Live handover
Experimental responses
```

Use `Tooltip` where flags require more explanation.

## Notifications

Use:

- `Switch`;
- `Table` or list rows;
- `Select`;
- `Button`.

## Data & privacy

Use:

- `Select` for retention period;
- `Switch` for anonymise test conversations;
- `AlertDialog` for purge actions.

Ensure POC/sample-data controls are visually labelled as prototype controls.

---

# 11. Screen: Profile

## Objective

Manage the signed-in administrator, their preferences and security.

This is user-level configuration and should remain separate from project Settings.

## Access

Open from:

```text
Sidebar footer
Chris Quinn
Admin
▼
```

via `DropdownMenu`.

## Header card

Use:

- `Avatar`;
- `AvatarFallback`;
- `Badge` for role;
- status dot;
- copy-email `Button`/`Tooltip`.

Show:

```text
Chris Quinn
Admin
email
last active
member since
```

## Personal details

Use `Card`.

Fields:

```text
Full name
Email address
Timezone
Language
```

Use:

- `Field`
- `Label`
- `Input`
- `Select`.

Read-only fields should visibly appear read-only and not merely disabled if copy is useful.

## Role & permissions

Use `Card`.

Current role shown with `Badge`.

Permissions shown with:

- icons/check marks;
- text.

For POC, avoid implementing a full RBAC editor unless backend support already exists.

If editable, use `Dialog` or `Sheet`.

## Security

Use `Card` with rows:

```text
Password
Two-factor authentication
Active sessions
```

Components:

- `Button`;
- `Badge`;
- `Separator`;
- `Dialog`;
- `AlertDialog`.

## Recent sessions

Use `Table`.

Columns:

```text
Device
Browser
Location
IP
Last active
Status
Actions
```

Do not invent exact location beyond what the auth system actually knows.

## Notification preferences

Use `Card` with `Switch` rows.

Keep admin preferences here, not project alert routing.

## Appearance

Use:

- `Select` for theme;
- `Select` for density.

Do not invest heavily in theming for the POC.

---

# 12. Shared custom compositions

These should be implemented once and reused.

## `PageHeader`

Props conceptually:

```ts
title
description
breadcrumbs?
actions?
```

Uses:

- `Breadcrumb`
- `Button`
- layout primitives.

## `MetricCard`

For:

- Cases;
- Analytics.

Props:

```ts
label
value
delta?
sparkline?
description?
```

Uses:

- `Card`
- `Badge`
- `ChartContainer`.

## `StatusBadge`

Centralise mapping from state to visual treatment.

Examples:

```text
active
completed
waiting
blocked
deferred
needs_review
approved
in_progress
```

Do not scatter badge colour decisions across screens.

## `KeyValueList`

For customer facts and metadata.

Better than using `Table` for two-column metadata.

## `EventRow`

Reusable in:

- Case events;
- Live activity;
- analytics recent activity.

## `ConversationMessage`

Reusable in:

- customer chat;
- Persona preview.

Use shadcn `Message` / `Bubble` where available, otherwise compose:

- `Avatar`
- content bubble
- timestamp.

## `DefinitionListItem`

Reusable in:

- goals;
- needs;
- guardrail definitions.

## `EmptyState`

Use shadcn `Empty`.

## `ConfirmAction`

Wrapper around `AlertDialog` for consequential actions.

---

# 13. shadcn components to install / standardise

The likely component set is:

```bash
npx shadcn@latest add \
  accordion \
  alert \
  alert-dialog \
  avatar \
  badge \
  breadcrumb \
  button \
  calendar \
  card \
  chart \
  checkbox \
  collapsible \
  command \
  dialog \
  dropdown-menu \
  empty \
  field \
  input \
  input-group \
  label \
  pagination \
  popover \
  progress \
  resizable \
  scroll-area \
  select \
  separator \
  sheet \
  sidebar \
  skeleton \
  slider \
  spinner \
  switch \
  table \
  tabs \
  textarea \
  toast \
  toggle-group \
  tooltip
```

Depending on the selected shadcn base/registry, also consider:

```text
Bubble
Message
Message Scroller
Attachment
```

for conversation surfaces.

Use Lucide for icons.

Use shadcn `Chart` composition with Recharts for visualisations.

Use TanStack Table only where true table behaviour is needed:

- sorting;
- filtering;
- pagination;
- row selection;
- column visibility.

Do not introduce TanStack Table for simple 5-row definition lists.

---

# 14. Responsive behaviour

## >= 1280px

Full sidebar + desktop layouts as described.

## 1024–1279px

- narrower sidebar;
- two-pane Cases layout;
- customer context moves into `Sheet` or right-side tab;
- analytics cards wrap;
- settings right rail stacks.

## < 1024px

Admin console remains usable but not optimised:

- collapsed sidebar;
- single-column panels;
- master/detail uses `Sheet`;
- charts stack;
- case list → selected case via navigation.

Do not spend POC effort making the admin console feel like a mobile consumer application.

---

# 15. Accessibility

Required:

- keyboard navigation through sidebar and tabs;
- visible focus rings;
- accessible names for icon-only actions;
- `Tooltip` is not the only source of critical information;
- charts have accessible labels/data summaries;
- status must not rely only on colour;
- slider values exposed correctly;
- destructive dialogs focus appropriately;
- row selection is keyboard accessible;
- message transcript has sensible reading order.

Target WCAG 2.2 AA.

---

# 16. Loading, empty and error states

Every screen should explicitly support these.

## Cases

Empty:

> No conversations yet. Start a test conversation to see it appear here.

## Goals & needs

Empty filter:

> No goals match those filters.

## Guardrails

Classifier unavailable:

Use `Alert variant="destructive"`.

Do not silently allow requests through if guardrail infrastructure is meant to fail closed.

## Persona

Preview failure:

Keep saved controls intact; show `Alert`.

## Analytics

No data:

Show `Empty`, not zero-filled fake charts.

## Settings

Integration error:

Show row-level status/error.

---

# 17. Permission / environment cues

The console is a prototype but should model production-quality discipline.

Always make visible:

- environment;
- user role;
- test/synthetic case status where relevant.

Avoid persistent giant banners.

Suggested:

```text
Development
```

as a small header/sidebar badge.

Synthetic cases should be labelled:

```text
Test case
```

or equivalent.

---

# 18. Acceptance criteria

The redesign is complete when:

1. All current admin functionality remains available.
2. The app uses a single consistent shadcn sidebar shell.
3. Cases supports a master/detail workflow without repeated page navigation.
4. Conversation, customer facts, goals and applications can be inspected together.
5. Existing presenter actions are available from the selected case.
6. Goals, needs and life events use a searchable master/detail catalogue.
7. Guardrails clearly show which categories reach Baz and which are blocked.
8. Persona has presets, sliders and a live preview on one screen.
9. Analytics shows meaningful journey/customer outcomes rather than only raw traffic.
10. Settings distinguishes project configuration from user Profile.
11. Profile is accessed from the signed-in user control.
12. All consequential actions have confirmation.
13. Empty/loading/error states exist for each screen.
14. Desktop layout works cleanly from 1280px upwards.
15. No admin redesign introduces new customer-facing behaviour or modifies banking rules.

---

# 19. Implementation priority

Recommended order:

### Phase 1 — shell and Cases

Build:

- global sidebar;
- page header;
- reusable status badges;
- Cases master/detail screen;
- case tabs;
- customer context panel.

This gives the biggest immediate improvement.

### Phase 2 — configuration

Build:

- Goals & needs;
- Guardrails;
- Persona.

These are important for the show-and-tell because they expose how Baz works.

### Phase 3 — analytics

Build analytics from real POC events.

Do not fabricate metrics merely to make the dashboard look populated.

Synthetic demo data is fine when explicitly in demo mode.

### Phase 4 — settings/profile

Polish:

- project settings;
- integrations;
- environment;
- profile/security/preferences.

---

# 20. Out of scope

Do not use this redesign as an excuse to build:

- a production CRM;
- full enterprise RBAC;
- complex team management;
- customer-facing dashboards;
- a separate design system;
- a workflow builder;
- a drag/drop goal editor;
- a visual rules engine;
- a general observability platform.

The admin console exists to operate and demonstrate Baz.

It should feel complete without becoming a second product.

---

# 21. Final UX principle

The consumer experience is intentionally almost invisible:

> open Baz → have a conversation.

The admin console can be richer because its job is different.

It should let an internal user immediately understand:

> **What is Baz doing? Why did it do that? What does it know? What state is the customer in? What can I safely change or simulate?**

That is the standard the redesign should optimise for.
