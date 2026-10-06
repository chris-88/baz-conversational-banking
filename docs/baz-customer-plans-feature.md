# Baz — Customer Plans & Continuous Financial Orchestration
## Feature Specification

**Version:** 1.0  
**Status:** Developer handoff  
**Product:** Baz  
**Capability:** Persistent customer goals, plans, milestones, check-ins and event-driven orchestration  
**Primary POC context:** Bank of Ireland

---

# 1. Feature Summary

Baz currently helps a customer understand their needs, discover relevant Bank of Ireland products and progress applications.

This feature extends Baz beyond individual conversations and applications.

The objective is to allow Baz to maintain an ongoing understanding of:

- what the customer is trying to achieve;
- where they are today;
- what milestones sit between today and that goal;
- what actions the customer or bank should take next;
- what should be deferred;
- when Baz should check back in;
- what changes should trigger proactive re-engagement.

The core proposition becomes:

> **Understand me. Help me get things done. Stay with me until I get where I’m going.**

This feature should turn Baz from an application assistant into a persistent financial orchestrator.

---

# 2. Problem

Traditional digital banking is organised around products and transactions.

A customer may have:

- a current account;
- a savings account;
- a mortgage application;
- a credit card;
- insurance;
- a loan.

But the bank often lacks a single persistent representation of **why those products exist together**.

For example:

> “My wife and I want to buy our first home in around six months.”

That goal may involve:

- building a deposit;
- choosing where to hold savings;
- opening a joint account;
- preparing mortgage documentation;
- starting a mortgage application;
- arranging mortgage protection;
- arranging home insurance;
- deferring a personal loan until after mortgage assessment;
- revisiting renovation finance after completion.

These are not independent product needs.

They are steps inside one longer customer objective.

The POC should demonstrate that Baz can understand and maintain that objective over time.

---

# 3. Feature Concept

Introduce a new persistent concept:

# **Customer Plan**

A Customer Plan represents a meaningful customer goal and the journey towards achieving it.

Examples:

- Buy our first home
- Build an emergency fund
- Prepare for a baby
- Save for a child
- Buy a car
- Renovate our home
- Retire at 60
- Move to Ireland
- Become debt free

Applications may belong to a plan.

Products may support a plan.

Needs may be discovered within a plan.

The plan itself should outlive any single application.

---

# 4. Core Model

Conceptually:

```text
Customer
  │
  ├── Customer Context
  │
  ├── Needs
  │
  └── Plans
       │
       ├── Goal
       ├── Target / target date
       ├── Milestones
       ├── Actions
       ├── Check-ins
       ├── Events
       ├── Linked needs
       ├── Linked applications
       └── Status
```

A plan should answer:

> Where is the customer trying to get to?

> Where are they now?

> What needs to happen next?

> What should Baz wait for?

> What should Baz remind the customer about?

---

# 5. POC Example

Customer says:

> “My wife and I don’t have a joint account and our savings aren’t with Bank of Ireland. We’re probably six months away from having the deposit for a €600,000 house.”

Baz should be capable of creating a plan similar to:

```text
Plan
Buy our first home

Target home price
€600,000

Target deposit
€60,000

Current savings
€46,000

Monthly saving rate
€2,500

Estimated deposit target
~6 months

Status
PREPARING
```

Potential plan milestones:

```text
€50,000 deposit reached
€60,000 deposit reached
Mortgage readiness review
Mortgage application started
Mortgage submitted
Mortgage approved
Property selected
Mortgage protection arranged
Home insurance arranged
Home purchase completed
```

Potential plan actions:

```text
Review where deposit savings are held
Explore joint account
Prepare proof of income
Prepare account statements
Review mortgage readiness
Start mortgage application
Invite partner
Review protection
Review home insurance
Revisit renovation borrowing after mortgage
```

---

# 6. Goals

The feature must allow Baz to:

1. Create a plan from natural conversation.
2. Maintain the plan over time.
3. Track progress towards measurable goals.
4. Schedule future check-ins.
5. React to meaningful events.
6. Defer needs until the right time.
7. Recalculate the plan when customer circumstances change.
8. Connect multiple products/applications to one customer objective.
9. Explain clearly why Baz is getting back in touch.
10. Let the customer change, pause or abandon the plan.

---

# 7. Non-Goals

The POC does not need to:

- provide regulated financial planning;
- produce legally defined financial plans;
- automate every banking decision;
- manage every life event;
- guarantee financial outcomes;
- predict future market conditions;
- make investment recommendations;
- autonomously submit applications;
- create unlimited proactive notifications.

The feature is intended to demonstrate persistent orchestration, not a complete financial-advice platform.

---

# 8. Terminology

## Goal

The customer outcome.

Example:

> Buy first home.

## Plan

The structured representation of how the customer will progress towards the goal.

## Milestone

A meaningful state or threshold on the route to the goal.

Example:

> Deposit reaches €60,000.

## Action

Something the customer, partner, Baz or the bank needs to do.

Example:

> Upload latest payslip.

## Check-in

A planned future interaction between Baz and the customer.

Example:

> Mortgage readiness review on 15 January.

## Event

A change that may cause the plan to update or Baz to act.

Example:

> Savings target reached.

## Need

A financial need identified through the Needs Engine.

Example:

> Shared household finances.

## Application

A product journey created after the customer chooses to proceed.

---

# 9. Plan Lifecycle

Suggested states:

```text
DRAFT
ACTIVE
PAUSED
COMPLETED
ABANDONED
ARCHIVED
```

### DRAFT

Baz has enough context to propose a plan but the customer has not confirmed it.

### ACTIVE

Customer has chosen to use the plan.

### PAUSED

Customer has temporarily stopped working towards the goal.

### COMPLETED

The goal has been achieved.

### ABANDONED

Customer no longer intends to pursue the goal.

### ARCHIVED

Historical plan retained for context.

Exact implementation is left to the team.

---

# 10. Plan Creation

Baz should be able to identify a potential long-lived goal during conversation.

Examples:

> “We want to buy our first house.”

> “I want to retire at 60.”

> “I need to save €20,000 for a wedding next year.”

Baz should not silently create a persistent plan.

It should explain the value and ask the customer.

Example:

> “You’re about six months away from your deposit target. If you want, I can keep this as a plan, track the milestones with you and check back in when there’s something useful to do.”

Actions:

- Create plan
- Not now

---

# 11. Plan Data

A plan should support, where relevant:

```text
Plan ID
Customer ID
Goal type
Goal description
Status

Target amount
Target date
Current amount
Progress percentage

Customer-defined success criteria

Participants

Linked needs
Linked products
Linked applications

Milestones
Actions
Check-ins
Events

Created date
Last updated
Last customer confirmation
```

The exact data model is an implementation decision.

---

# 12. Plan Facts and Provenance

Plan inputs should retain provenance where useful.

Example:

```text
targetHomePrice
€600,000
source: CUSTOMER_STATED

currentSavings
€46,000
source: CUSTOMER_STATED

monthlySavings
€2,500
source: CUSTOMER_STATED
```

If later connected to verified account data:

```text
currentSavings
€51,200
source: BANK_ACCOUNT_VERIFIED
```

Baz should know the difference.

---

# 13. Milestones

Milestones should support several types.

## Numeric milestone

Example:

> Savings reach €60,000.

## Date milestone

Example:

> 3 months before planned home purchase.

## Application milestone

Example:

> Mortgage application approved.

## Customer milestone

Example:

> Partner completes joint application section.

## External milestone

Example:

> Fixed mortgage rate expires in 90 days.

The POC only needs enough types to demonstrate the principle.

---

# 14. Milestone State

Suggested:

```text
NOT_STARTED
IN_PROGRESS
ACHIEVED
MISSED
NO_LONGER_RELEVANT
```

A milestone should have:

- definition;
- status;
- target;
- actual;
- expected date;
- achieved date where relevant.

---

# 15. Plan Actions

Actions should be explicit and attributable.

Example:

```text
Action
Gather latest payslip

Owner
CUSTOMER

Due
January

Status
OPEN
```

Owners may include:

```text
CUSTOMER
PARTNER
BAZ
BANK
```

Possible action states:

```text
OPEN
WAITING
COMPLETED
DEFERRED
CANCELLED
```

---

# 16. Plan Progress

Baz should be able to explain progress in human language.

Example:

> You’re at €52,000 of your €60,000 deposit target.

> At the saving rate you gave me, you’re currently on track to reach it around February.

The deterministic system should perform calculations.

The AI should explain them.

---

# 17. Recalculation

A plan should recalculate when relevant information changes.

Examples:

- savings balance changes;
- monthly contribution changes;
- target property price changes;
- desired purchase date changes;
- income changes;
- application status changes;
- customer adds a new goal;
- partner joins;
- customer changes their mind.

Baz should explain meaningful changes rather than silently altering the plan.

Example:

> “You’ve increased your target house price from €550,000 to €600,000, so the deposit target in this plan has changed too.”

---

# 18. Check-ins

Baz should support future planned conversations.

A check-in is not necessarily a human appointment.

It is a scheduled reason for Baz and the customer to review progress.

Examples:

```text
Deposit progress review
Mortgage readiness review
Pension progress check
Emergency fund review
Post-mortgage renovation finance review
```

---

# 19. Check-in Requirements

A check-in should include:

```text
Plan
Purpose
Target date/time or approximate date
Agenda
Trigger type
Status
Notification preference
```

Suggested states:

```text
SCHEDULED
DUE
COMPLETED
SKIPPED
CANCELLED
RESCHEDULED
```

---

# 20. Check-in Agenda

Every check-in must have a reason.

Example:

## Mortgage readiness — 15 January

Agenda:

1. Check deposit progress.
2. Confirm household income has not materially changed.
3. Check whether the customer has begun viewing properties.
4. Review outstanding mortgage documents.
5. Decide whether to start the mortgage application.
6. Review any previously deferred needs.

If there is nothing useful to discuss, Baz should not manufacture engagement.

Example:

> “You’re still on track and I don’t need anything from you right now. I’ll check again next month unless something changes.”

---

# 21. Scheduled Check-ins

Customers should be able to say:

> “Check back with me in January.”

or:

> “Let’s look at this again in three months.”

The system should create a future check-in.

The customer should be able to:

- see it;
- change it;
- cancel it;
- trigger it early.

---

# 22. Event-Driven Check-ins

A check-in may be triggered by an event rather than a date.

Examples:

```text
Deposit target reached
Partner completes application
Mortgage moves to assessment
Document requested
Credit decision received
Mortgage completes
Fixed rate nearing expiry
Savings product matures
```

Example:

> “You’ve reached the €60,000 deposit target we set. When we last spoke, we agreed this would be the point to review your mortgage readiness. Want to do that now?”

This should feel like continuity, not marketing.

---

# 23. Event Engine

The platform should support meaningful events that can affect plans.

Conceptually:

```text
Event occurs
      ↓
Which plans are affected?
      ↓
Does this change plan state?
      ↓
Does it create/complete a milestone?
      ↓
Does it create an action?
      ↓
Should Baz contact the customer?
      ↓
Notify / wait / update silently
```

Examples:

```text
SAVINGS_THRESHOLD_REACHED
APPLICATION_STATE_CHANGED
PARTNER_ACTION_COMPLETED
DOCUMENT_REQUIRED
TARGET_DATE_APPROACHING
PRODUCT_MATURITY_APPROACHING
CUSTOMER_CONTEXT_CHANGED
```

Exact event infrastructure is an implementation choice.

---

# 24. Proactive Contact Rules

Baz should not notify customers about every state change.

A proactive interaction should meet at least one of these conditions:

1. The customer explicitly asked to be notified.
2. The event changes the next action.
3. A milestone has been achieved.
4. Customer action is required.
5. A time-sensitive deadline is approaching.
6. A deferred need has become relevant.
7. The plan is materially off track.

Avoid notifications such as:

> “Nothing has changed.”

---

# 25. Notification Content

Notifications should be short and privacy-conscious.

Example:

> Bank of Ireland: Baz has an update on a plan you’re working on. Open the app securely to continue.

After authentication:

> You’ve reached the deposit target we set.

or:

> Your mortgage has moved to assessment and one document is needed.

Sensitive details should remain behind authentication.

---

# 26. Needs Engine Integration

Needs should be able to exist inside plans.

Example:

```text
Plan: Buy first home

Need:
Mortgage
State: ACCEPTED
Timing: NOW

Need:
Joint account
State: READY_TO_SURFACE
Timing: NOW

Need:
Family protection
State: CLARIFY
Timing: LATER

Need:
Personal loan
State: DEFERRED
Timing: AFTER_MORTGAGE
```

This allows Baz to remember relevant needs without constantly resurfacing them.

---

# 27. Deferred Needs

Deferred needs are a core feature.

Example:

Customer wants €15,000 for renovation work.

Mortgage application is still active.

Baz:

> “We can look at the renovation borrowing, but because you’re currently progressing a mortgage, I’d leave that until the mortgage is complete unless you want to look at it now.”

Customer:

> “Leave it.”

System:

```text
Need
Home renovation finance

State
DEFERRED

Revisit condition
MORTGAGE_COMPLETED
```

Later:

> “When we were preparing your mortgage, you mentioned around €15,000 of work on the house. Now that the mortgage is complete, do you still want to look at that?”

---

# 28. Applications Inside Plans

Applications should be linked to the goal they support.

Example:

```text
Plan
Buy our first home

Applications
- Mortgage
- Joint Current Account
- Mortgage Protection
- Home Insurance
```

A customer should be able to ask:

> “How are we doing with the house?”

and receive both:

- plan progress;
- application progress.

---

# 29. Multi-Plan Customers

The model should allow multiple plans.

Example:

```text
Buy first home
ACTIVE

Build emergency fund
ACTIVE

Retire at 60
ACTIVE
```

The POC does not need sophisticated prioritisation across dozens of plans.

It should avoid assuming the customer can only have one goal.

---

# 30. Conflicting Goals

Baz should recognise where one plan affects another.

Example:

```text
Goal A
Buy home in 6 months

Goal B
Invest €40,000 for long-term growth
```

If the same €40,000 is intended for the deposit, these plans conflict.

Baz should clarify rather than silently assigning the same money twice.

---

# 31. Plan Home Experience

The authenticated app should introduce:

# **Your plans**

Example:

### Buy our first home
€52,000 / €60,000 saved  
On track for February

Next:
Mortgage readiness check-in  
12 November

### Family finances
Joint account application in progress

The banking app still shows accounts and balances.

Plans add the reason those balances and applications exist.

---

# 32. Plan Detail Screen

Suggested structure:

## Header

**Buy our first home**

Status:
Preparing

## Progress

€52,000 / €60,000 deposit

Projected:
February

## Next action

Prepare latest payslips

## Next check-in

12 November

## Milestones

✓ Deposit €50k  
○ Deposit €60k  
○ Mortgage ready  
○ Application submitted  
○ Approval  
○ Completion

## Related applications

Joint Account — In progress  
Mortgage — Not started  
Personal Loan — Deferred

---

# 33. Baz Conversation Behaviour

Baz should be able to reference plan history naturally.

Example:

> “Last time we spoke, you had €47,500 saved and were putting away roughly €2,200 per month. How are things looking now?”

Baz should not pretend to remember information that is not present in structured plan/customer context.

---

# 34. Customer Changes Goal

Customers can change the plan.

Example:

> “We’re actually looking at €700k houses now.”

Baz should:

1. recognise the change;
2. update the relevant plan assumption;
3. recalculate affected milestones;
4. explain what changed;
5. ask for confirmation where appropriate.

---

# 35. Customer Pauses Goal

Example:

> “We’ve decided not to buy this year.”

Baz:

> “No problem. I can pause the home-buying plan and stop the check-ins. Do you want me to keep the progress we’ve built so we can pick it up later?”

Customer chooses.

No further proactive plan notifications while paused unless explicitly requested.

---

# 36. Plan Completion

When the customer achieves the goal:

> “Your mortgage has completed and the home purchase is done.”

Plan becomes:

```text
COMPLETED
```

Baz may then offer to close related deferred items.

Example:

> “That completes the home-buying plan. You also asked me to come back to the renovation financing once the mortgage was finished. Do you still want to look at that?”

---

# 37. Customer Control

The customer must be able to:

- create a plan;
- reject a proposed plan;
- change a target;
- change a date;
- change notification preferences;
- skip a check-in;
- reschedule;
- pause the plan;
- end the plan;
- remove/defer individual actions.

Baz should not make the customer feel trapped inside an automated programme.

---

# 38. Admin / Presenter Controls

For the POC, the admin console should support plans.

Required views/actions:

### Plan

- inspect plan;
- change status;
- edit synthetic current amount;
- change target;
- force recalculation.

### Milestones

- mark achieved;
- mark missed;
- create event.

### Check-ins

- create;
- reschedule;
- mark due;
- trigger immediately.

### Events

- savings target reached;
- partner completed;
- mortgage changed state;
- document requested;
- mortgage completed.

### Demo reset

Restore canonical home-buying plan.

---

# 39. POC Script Addition

The original Baz demo should now include the plan layer.

Suggested flow:

1. Customer arrives looking for a mortgage.
2. Baz discovers they are six months away from deposit target.
3. Baz explains that starting the mortgage today may not be the most useful next step.
4. Baz proposes a home-buying plan.
5. Customer accepts.
6. Baz creates:
   - deposit target;
   - expected date;
   - next check-in;
   - preparation actions;
   - related needs.
7. Baz progresses joint account now.
8. Baz defers mortgage application until readiness point.
9. Baz defers personal loan until after mortgage.
10. Customer leaves.
11. Admin simulates savings reaching target.
12. Customer receives notification.
13. Customer returns.
14. Baz says:
    > “You’ve reached the deposit target we set. Ready to do the mortgage-readiness review?”
15. Baz then begins the mortgage application using context already collected.

This demonstrates continuity substantially better than beginning all five applications immediately.

---

# 40. Financial Calculations

Where the plan requires arithmetic, calculations should be deterministic.

Examples:

```text
Savings gap
Target date projection
Monthly contribution required
Progress percentage
Time remaining
```

AI may explain outputs.

AI should not be the authoritative calculation engine.

---

# 41. Rules and Product Facts

Plan logic may depend on external banking rules.

Example:

> Deposit requirement.

The plan should use an approved rule/product service.

Do not embed changing financial rules solely inside prompts.

If the rule changes, plan recalculation should use the current authorised value where appropriate.

---

# 42. Sensitive Context

Some goals involve sensitive information.

Examples:

- serious illness;
- bereavement;
- relationship breakdown;
- financial distress.

The plan engine should not automatically convert these into commercial opportunities.

Persona humour should be suppressed.

Proactive contact should be conservative.

---

# 43. Advice Boundary

The product should avoid describing the Customer Plan as regulated financial advice unless it actually operates inside an authorised advice process.

Preferred language:

- plan;
- goal;
- next steps;
- progress;
- options;
- things to consider.

Avoid implying:

> “This is your personalised regulated financial plan”

unless that is legally and operationally true.

---

# 44. Data Freshness

Plan fields should support freshness.

Example:

```text
Annual income
Last confirmed: 8 months ago
```

Before using stale information for a new application:

> “Last time we spoke you said your salary was €92,000. Is that still right?”

The plan can retain historic information without treating it as perpetually current.

---

# 45. Auditability

Important plan events should be auditable.

Examples:

```text
PLAN_PROPOSED
PLAN_CREATED
PLAN_UPDATED
PLAN_PAUSED
PLAN_COMPLETED

MILESTONE_CREATED
MILESTONE_ACHIEVED

ACTION_CREATED
ACTION_COMPLETED
ACTION_DEFERRED

CHECKIN_SCHEDULED
CHECKIN_RESCHEDULED
CHECKIN_COMPLETED

EVENT_RECEIVED
CUSTOMER_NOTIFIED

NEED_DEFERRED
NEED_REACTIVATED
```

Exact event naming is flexible.

---

# 46. Metrics

Useful POC metrics include:

- plans created;
- active plans;
- milestones achieved;
- scheduled check-ins;
- event-driven check-ins;
- check-ins completed;
- applications initiated from plans;
- deferred needs later reactivated;
- questions avoided through retained context;
- plan-driven return sessions;
- customer actions completed.

Do not optimise for raw conversation volume.

---

# 47. Success Criteria

The feature is successful when the POC can demonstrate:

### Persistent goal
Baz remembers the customer’s objective across sessions.

### Structured plan
The goal has milestones, actions and timing.

### Progress tracking
A measurable target can change over time.

### Scheduled check-in
Baz can plan a useful future conversation.

### Event-driven return
A milestone can trigger re-engagement.

### Deferred need
A relevant product can be deliberately parked and later resurfaced.

### Application linkage
Applications can belong to the plan.

### Recalculation
Changing customer circumstances updates the plan.

### Customer control
The customer can pause, change or abandon the plan.

### Explainability
Baz can explain why it is contacting the customer and what the next useful action is.

---

# 48. Core Acceptance Test

The POC should support this end-to-end scenario:

> A customer says they want to buy a €600,000 first home but are around six months away from the deposit.

Baz:

- understands the goal;
- establishes current savings and monthly saving rate;
- creates a home-buying plan after customer confirmation;
- calculates a target and projected date;
- creates a savings milestone;
- creates a future mortgage-readiness check-in;
- identifies joint-account and protection needs;
- progresses the joint account if chosen;
- deliberately defers the personal loan;
- does not start the mortgage prematurely if the customer is not ready;
- remembers all of this after the customer leaves.

Later:

- savings reach the target;
- the event updates the milestone;
- Baz notifies the customer;
- customer returns;
- Baz references the original plan;
- Baz performs the mortgage-readiness check;
- Baz begins the mortgage journey using retained context.

If that story works, the feature has succeeded.

---

# 49. Product Principle

Traditional banking records:

> **transactions**

Digital banking added:

> **products**

Baz adds:

> **intent**

Customer Plans add:

> **trajectory**

The bank should increasingly be able to answer:

> Where is this customer trying to get to?

> Where are they now?

> What is the next useful thing we can do?

> When should we speak again?

That is the purpose of this feature.

# **Baz should not just help customers apply for things. It should stay with them until they achieve the thing they came to the bank to do.**
