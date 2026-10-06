# Baz Goal Engine

**Version:** 1.0  
**Machine-readable catalogue:** `baz-goal-catalogue.json`

## 1. What this feature is

The Goal Engine is the layer that lets Baz understand **where a customer is trying to get to**, not just which banking product they are currently asking about.

Traditional digital banking tends to organise customers around products:

- current account;
- savings;
- mortgage;
- loan;
- insurance;
- pension.

Baz should organise the relationship around **customer goals**.

Examples:

- Buy our first home
- Build an emergency fund
- Prepare for a baby
- Save for a child
- Buy a car
- Renovate our home
- Start investing
- Retire at 60

Products, applications and services sit underneath those goals.

> **Life circumstance → Goal → Milestones → Needs → Actions → Products / Services → Applications**

---

## 2. Why this exists

A single life circumstance often creates several legitimate financial goals.

Example:

> “We just had our first baby.”

That may create or strengthen:

- prepare household finances for the baby;
- review emergency savings;
- protect family income;
- save for the child;
- combine household finances;
- possibly move home.

Baz should not reduce that statement to:

> `baby → life insurance`

The catalogue exists so Baz can understand the wider financial trajectory and decide what to clarify, activate, defer or suppress.

---

## 3. Goal vs Need vs Product

These concepts must remain separate.

### Goal

The customer outcome.

> Buy our first home.

### Need

A financial requirement or problem that emerges within the goal.

> Need a mortgage.  
> Need somewhere for shared household finances.  
> Need protection before drawdown.

### Product / service

A bank capability that may help satisfy a need.

> Mortgage.  
> Joint current account.  
> Mortgage protection.

### Application

The operational process created after the customer decides to pursue a product.

The hierarchy is:

```text
Goal
  ↓
Need
  ↓
Product / service
  ↓
Application
```

---

## 4. Catalogue contents

Version 1.0 contains **26 goal blueprints** and **10 life-event clusters**.

Goal categories include:

- financial foundations;
- saving;
- housing;
- family;
- education;
- major purchases;
- life transitions;
- wealth;
- retirement;
- international money.

Each goal blueprint contains:

- `id`
- `name`
- `category`
- `description`
- `discovery_signals`
- `information_needed`
- `milestones`
- `relationships`
- `linked_needs`
- `default_checkins`
- `completion_criteria`
- `suppressions`

---

## 5. Discovery signals

Signals are not intended to be dumb keywords.

They describe customer language or circumstances that may indicate a goal.

Three strengths are used.

### Explicit — 1.0

Customer states the goal directly.

> “I want to buy my first home.”

### Strong inferred — 0.7

Customer circumstances strongly suggest it.

> “We’re renting, have €50k saved and have started viewing houses.”

### Soft inferred — 0.35

Useful background context, but not enough by itself.

> “We got married last month.”

The conversational layer can use these signals to decide whether to:

- ask a clarifying question;
- propose a goal;
- add evidence to an existing goal;
- do nothing yet.

---

## 6. Goal activation

Discovery is not activation.

Baz may internally identify a candidate goal, but it should normally ask before creating a persistent plan.

Example:

> “You’re around six months away from the deposit you need. If you want, I can keep this as a home-buying plan, track the milestones with you and check back when there’s something useful to do.”

Only after customer confirmation should the goal become an active plan.

Suggested runtime states:

```text
DRAFT
ACTIVE
PAUSED
COMPLETED
ABANDONED
ARCHIVED
```

---

## 7. Goal relationships

Goals are not independent.

Each blueprint can define:

### Related goals

Commonly occur alongside the goal.

Example:

`BUY_FIRST_HOME`

may relate to:

- `SHARED_HOUSEHOLD_FINANCES`
- `BUILD_EMERGENCY_FUND`
- `FAMILY_PROTECTION`

### Prerequisites

Conditions normally resolved first.

Example:

Long-term investing may require sufficient near-term liquidity.

### Follow-on goals

Goals that commonly become relevant after completion.

Example:

`BUY_FIRST_HOME`

may lead to:

- `REBUILD_SAVINGS_AFTER_HOME_PURCHASE`
- `RENOVATE_HOME`

### Conflicts

Goals/actions that may work against another active objective.

Example:

New unsecured borrowing may conflict with an active mortgage affordability assessment.

---

## 8. Milestones

The catalogue uses three milestone types.

### Financial

Measured in money or another financial threshold.

Examples:

- €60,000 deposit reached;
- emergency fund reaches three months of expenses;
- priority debt cleared.

### Life

Changes in the customer’s real-world situation.

Examples:

- baby born;
- home purchased;
- course started;
- retirement reached.

### Process

Banking or administrative progress.

Examples:

- mortgage submitted;
- partner completes their section;
- protection review completed;
- funding route selected.

Milestone status should be controlled separately from conversation history.

Suggested states:

```text
NOT_STARTED
IN_PROGRESS
ACHIEVED
MISSED
NO_LONGER_RELEVANT
```

---

## 9. Shared facts and overlapping goals

One customer fact can affect several goals.

Example:

> Accessible savings = €15,000.

That may affect:

- `BUILD_EMERGENCY_FUND`
- `START_INVESTING`
- `PREPARE_FOR_BABY`
- `BUY_FIRST_HOME`

Similarly:

> Household income verified.

may progress:

- mortgage readiness;
- protection;
- household budgeting;
- retirement planning.

The Goal Engine should therefore reference canonical customer context rather than create duplicate versions of the same fact inside every plan.

---

## 10. Avoid double counting

The same financial resource must not be silently allocated to conflicting goals.

Example:

Customer has €40,000.

Goals:

- first-home deposit;
- long-term investment.

Baz must not treat the same €40,000 as fully available to both.

Where goals compete for:

- savings;
- monthly surplus;
- borrowing capacity;
- time;
- household income;

the engine should raise a conflict and ask the customer to clarify priority/allocation.

---

## 11. Life-event clusters

`life_event_clusters` represent common circumstances that can create several overlapping goals.

Included in v1.0:

1. Recently married / combining households
2. New baby / growing family
3. First-home life stage
4. Growing family needing more space
5. Graduation and first job
6. Major income increase
7. Income shock
8. Relationship breakdown
9. Lump sum received
10. Approaching retirement

A life event is not necessarily a plan itself.

It is a reason to consider several possible goals.

---

## 12. Example: first-home life stage

Customer says:

> “My wife and I don’t have a joint account. We’re about six months away from the deposit for a €600,000 house.”

Possible graph:

```text
Life circumstances
├── Married
├── Renting
├── First-time buyers
└── Saving deposit

Primary goal
└── BUY_FIRST_HOME

Related goals
├── SHARED_HOUSEHOLD_FINANCES
├── BUILD_EMERGENCY_FUND
└── FAMILY_PROTECTION

Follow-on
├── REBUILD_SAVINGS_AFTER_HOME_PURCHASE
└── RENOVATE_HOME

Conflict
└── NEW_UNSECURED_BORROWING_BEFORE_MORTGAGE_COMPLETE
```

Baz should not surface everything at once.

A sensible sequence may be:

1. activate the home-buying plan;
2. clarify whether shared finances are wanted;
3. track the deposit;
4. defer renovation borrowing;
5. surface protection at the appropriate mortgage milestone.

---

## 13. Example: new baby

Customer says:

> “We just had our first baby.”

The cluster may suggest:

```text
PREPARE_FOR_BABY
├── BUILD_EMERGENCY_FUND
├── FAMILY_PROTECTION
├── INCOME_RESILIENCE
├── SAVE_FOR_CHILD
├── SHARED_HOUSEHOLD_FINANCES
└── MOVE_HOME
```

Baz should not activate all six.

It should ask what actually matters.

Example:

> “That changes quite a few things financially. Is there something specific you want to sort out first, or would you like me to help you work through what might be worth reviewing?”

---

## 14. Timing and deferral

A goal can be relevant but wrong to act on now.

Example:

Customer wants:

- first-home mortgage;
- €15,000 renovation finance.

If mortgage affordability is still being assessed:

```text
RENOVATE_HOME
status: ACTIVE

financing_need
status: DEFERRED

revisit_condition:
MORTGAGE_COMPLETED
```

Baz remembers the goal and returns to it later.

That is central to the concierge model.

---

## 15. Check-ins

Some blueprints include default check-in patterns.

Examples:

- monthly savings-progress review;
- annual pension review;
- event-driven mortgage readiness when deposit target is reached;
- post-baby household review after three months.

These are defaults only.

The actual customer plan should be personalised and customer-controlled.

Do not schedule pointless interactions merely to increase engagement.

---

## 16. Events

Goal progress can change because of events.

Examples:

```text
SAVINGS_THRESHOLD_REACHED
APPLICATION_STATE_CHANGED
PARTNER_ACTION_COMPLETED
INCOME_CHANGED
TARGET_DATE_APPROACHING
HOME_PURCHASE_COMPLETED
```

An event may:

- complete a milestone;
- create an action;
- recalculate a projection;
- reactivate a deferred need or goal;
- trigger a check-in;
- require no customer contact.

---

## 17. Relationship with the Needs Engine

The Goal Engine and Needs Engine are complementary.

Example:

```text
Goal
BUY_FIRST_HOME

Needs
├── first_home
├── first_home_deposit
├── mortgage_protection_need
└── home_protection
```

A goal describes **where the customer is going**.

A need describes **what is required along the way**.

The Needs Engine maps those needs to approved products/services.

The Application Orchestrator then progresses the products the customer chooses.

---

## 18. Runtime plan vs blueprint

The catalogue contains reusable goal blueprints.

A customer-specific runtime plan should be stored separately.

Example:

```json
{
  "planId": "plan_123",
  "goalId": "BUY_FIRST_HOME",
  "status": "ACTIVE",
  "customerId": "customer_456",
  "facts": {
    "targetPropertyPrice": 600000,
    "depositTarget": 60000,
    "currentSavings": 52000,
    "monthlySavings": 2200
  },
  "milestones": [
    {
      "id": "DEPOSIT_TARGET_REACHED",
      "status": "IN_PROGRESS",
      "target": 60000,
      "current": 52000
    }
  ],
  "linkedNeeds": [],
  "linkedApplications": [],
  "nextCheckIn": "2026-11-12"
}
```

Blueprint and runtime state should not be the same object.

---

## 19. Separation of responsibilities

### Conversational AI

Responsible for:

- understanding customer language;
- extracting candidate circumstances;
- asking natural clarifying questions;
- explaining goals and next steps;
- asking for customer consent.

### Goal Engine

Responsible for:

- blueprint lookup;
- goal relationships;
- milestones;
- conflicts;
- lifecycle/timing;
- check-in/event logic.

### Needs Engine

Responsible for:

- translating goals/context into financial needs;
- deciding whether needs are ready, deferred or suppressed;
- mapping needs to approved product families.

### Application Orchestrator

Responsible for:

- application creation;
- application requirements;
- application state;
- submission;
- downstream events.

---

## 20. POC priority goals

For the existing Baz demonstration, prioritise:

1. `BUY_FIRST_HOME`
2. `SHARED_HOUSEHOLD_FINANCES`
3. `PREPARE_FOR_BABY`
4. `FAMILY_PROTECTION`
5. `BUILD_EMERGENCY_FUND`
6. `RENOVATE_HOME`
7. `REBUILD_SAVINGS_AFTER_HOME_PURCHASE`

These are enough to demonstrate:

- overlapping goals;
- sequencing;
- shared customer facts;
- deferred needs;
- milestones;
- scheduled/event-driven check-ins;
- follow-on goals.

---

## 21. Acceptance test

Given a customer who says:

> “My wife and I have a new baby, we keep our money separate, and we’re around six months away from the deposit for our first home.”

the engine should be capable of identifying:

```text
Primary candidate
BUY_FIRST_HOME

Strong related candidates
SHARED_HOUSEHOLD_FINANCES
PREPARE_FOR_BABY

Secondary candidates
FAMILY_PROTECTION
BUILD_EMERGENCY_FUND
SAVE_FOR_CHILD

Likely follow-on / deferred
REBUILD_SAVINGS_AFTER_HOME_PURCHASE
RENOVATE_HOME
```

It must **not** automatically activate all of them.

Baz should establish what the customer wants to work on, activate the appropriate plan(s), create milestones and keep the rest as context.

---

## 22. Guiding principle

> **Life circumstances create goals. Goals create milestones. Products are tools used to achieve them.**

Baz should not optimise for the number of products sold.

It should optimise for:

> **the customer making meaningful progress towards the things they told the bank they want to achieve.**
