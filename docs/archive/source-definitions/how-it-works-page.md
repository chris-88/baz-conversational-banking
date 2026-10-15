---
title: How it works page (source definition)
status: historical
scope: poc
last_verified: 2026-10-15
note: >-
  Source material, written before the work and in the future tense. NOT a
  description of the current state. Delivered. See docs/features/how-it-works-site.md
---

# How Baz Works — Page Experience & Developer Specification

**Audience:** product, engineering, design and implementation  
**Page:** `/how-it-works`  
**Purpose:** turn the Baz story into an interactive product case study where the page itself demonstrates the qualities being described.

---

## 1. Product intent

The current How Baz Works material contains strong information but behaves like documentation.

The replacement page should feel like:

> **a product case study + technical narrative + interactive system walkthrough**

The reader should not only be told that Baz is:

- contextual;
- transparent;
- technically rigorous;
- dynamic;
- well architected;
- measured;
- thoughtfully designed.

The page should demonstrate those properties as they read.

A useful design test:

> If all of the prose disappeared, would the interactions still communicate that this is a sophisticated system?

If not, the interaction is decorative rather than useful.

---

## 2. Design principles

### 2.1 Editorial first

The page must remain highly readable.

Do not turn it into a dashboard.

Primary experience:

```text
story
→ evidence
→ story
→ evidence
```

The interaction should reinforce the narrative, not interrupt it.

### 2.2 Real system behaviour over spectacle

Avoid:

- 3D scenes;
- floating particles;
- fake terminal typing;
- gratuitous parallax;
- glowing “AI brain” visuals;
- excessive scroll-jacking.

Prefer:

- real state;
- real schemas;
- real mappings;
- real traces;
- real cost data;
- real before/after product decisions;
- lightweight meaningful motion.

### 2.3 Two depths of reading

Every section should work for a non-technical reader.

Technical readers should be able to go deeper without leaving the page.

Examples:

```text
View trace
Inspect schema
Show request
Show field mapping
See calculation
View implementation note
```

Default state remains clean.

### 2.4 Mobile remains first-class

The desktop page can use pinned/sticky evidence panels.

On mobile:

- no horizontal dependency;
- all evidence cards become inline;
- code blocks scroll horizontally;
- sticky controls collapse;
- interaction never requires hover;
- diagrams reflow vertically.

---

## 3. Overall page structure

Recommended chapter structure:

1. The opportunity
2. The experience
3. The architecture
4. The Digital Forms discovery
5. The build and pivots
6. Building with AI
7. What we got wrong
8. The economics
9. What Baz could become

Desktop navigation:

```text
The opportunity
The experience
The architecture
The discovery
The build
The economics
```

Use a compact sticky chapter nav once the hero scrolls away.

The active chapter updates based on scroll position.

URL hash should update without page reload:

```text
/how-it-works#opportunity
/how-it-works#experience
/how-it-works#architecture
/how-it-works#discovery
/how-it-works#build
/how-it-works#economics
/how-it-works#future
```

---

## 4. Hero

### Content

```text
How Baz works

A look under the hood at how Baz works, what the AI is actually doing,
how the product evolved, what we learned building it, and what it could
mean for the future of banking.
```

### Interactive proof card

Desktop: place beside the opening opportunity content.

Use one synthetic conversation:

```text
Customer
My wife and I want to buy our first home next year.

Baz
I can help with that...
```

Below the response, show three small system-state cells:

```text
UNDERSTOOD
First-home goal

REUSED
6 known facts

NEEDS
2 more details
```

These should animate in sequentially after the Baz message appears.

Do not fake live production data.

Label the card:

```text
Live proof
Synthetic example
```

Optional control:

```text
Try another example
```

This rotates through 2–3 curated scenarios only.

Recommended scenarios:

- first-home buyer;
- €50k cash / what should I do;
- struggling to meet payments.

The tone and system state should visibly change in the vulnerability scenario.

---

## 5. “Customer view / System view” toggle

This should be one of the page's strongest recurring interaction patterns.

Component:

```text
[ Customer view ] [ System view ]
```

Customer view displays the polished interaction.

System view reveals structured state:

```text
Intent
BANKING_GOAL

Goal
BUY_FIRST_HOME

Confidence
0.96

Known facts reused
6

Missing facts
2

Allowed next capabilities
mortgage_readiness
deposit_planning
goal_create
```

The exact data can be synthetic but should be plausible and internally consistent.

Avoid showing raw chain-of-thought.

Show system state and decisions, not private model reasoning.

---

## 6. Architecture replay

### Section

```text
The AI talks. The platform does the banking.
```

Render a five-stage horizontal architecture on desktop:

```text
Customer
→ Conversation
→ Reasoning
→ Deterministic banking services
→ Existing bank capabilities
```

Mobile: vertical.

### Replay interaction

Button:

```text
Replay this turn
```

A subtle pulse travels through each stage.

As each node activates, a detail panel updates.

Example:

#### Customer

```text
"My wife and I want to buy our first home next year."
```

#### Conversation

```text
Intent: first-home planning
Goal candidate: BUY_FIRST_HOME
```

#### Reasoning

```text
Known facts: 6
Missing: location, current savings
```

#### Deterministic services

```text
profile.read
goal.validate
plan.create
```

#### Bank capability

```text
Mortgage readiness
Deposit planning
```

Animation duration: ~3–4 seconds.

Allow user to scrub manually after first replay.

Respect `prefers-reduced-motion`.

---

## 7. AI vs deterministic boundary

Use two visually distinct columns:

```text
AI
Understand
Explain
Ask
Summarise
Choose approved capability

DETERMINISTIC
Validate
Calculate
Persist
Enforce
Submit
Audit
```

On hover/tap, examples appear.

Example:

```text
AI
"How should I ask for monthly income?"

Deterministic
"Is this value valid, and what does it do to eligibility?"
```

Anchor quote:

> Use AI where ambiguity is valuable. Use software where certainty is required.

This quote should be styled as a major architectural principle.

---

## 8. Digital Forms discovery

This is the technical centrepiece of the page.

Heading:

```text
Then we discovered the bank already spoke machine.
```

### Three-panel flow

Desktop:

```text
1 Conversation
2 Journey definition
3 Submission contract
```

Mobile: stacked.

#### Panel 1 — Conversation

```text
Customer:
I need €20,000 for a car.

Baz:
Got it. I can help with a personal loan...
```

#### Panel 2 — GET definition

Display an abbreviated real-shaped schema:

```json
{
  "id": 500,
  "type": "conditionalSelect",
  "label": "What is the purpose of your loan?",
  "isRequired": true,
  "toscana": "Purpose_Of_Loan"
}
```

#### Panel 3 — generated submission

```text
POST /api/forms/1940

input_500 = "Car purchase"
input_179 = "20000"
input_255 = "20000"
```

Animate a line/connector through all three.

### Hover/tap mapping

When the user highlights:

```text
Car purchase
```

also highlight:

```text
field 500
```

and:

```text
input_500
```

When `€20,000` is highlighted, map to:

```text
field 179
input_179
input_255
```

This interaction demonstrates the translation layer better than prose alone.

---

## 9. Product journey comparison

Use two large cards.

### SuperSaver — 1833

Show:

```text
64 captured POST entries
Conditional logic
Documents
Consents
```

### Personal Loan — 1940

Show:

```text
74 captured POST entries
Calculations
Affordability
Eligibility
Documents
Consents
```

Each card has:

```text
Inspect journey
```

Expanding it reveals a compact field map, not the entire raw definition.

Optional modal/drawer tabs:

```text
Overview
Example field
Submission shape
```

Do not display real customer values.

All fixtures synthetic/redacted.

---

## 10. “One digital journey, multiple channels” diagram

Static structure with light animation:

```text
               Digital Forms
                    │
      ┌─────────────┼─────────────┐
      │             │             │
     Web          Mobile          Baz
  renderer       renderer    conversational
                              renderer
```

On scroll into view:

1. Digital Forms appears;
2. branch line draws;
3. existing web/mobile channels appear;
4. Baz appears last.

Copy:

```text
Different experiences.
One underlying source of journey truth.
```

Do not overstate current production integration.

Use wording such as:

```text
POC architecture / production direction
```

where appropriate.

---

## 11. Pivot timeline

Heading:

```text
Baz wasn't designed this way.
We found our way here.
```

Use vertical timeline.

Five pivot cards:

```text
1 Applications → needs
2 Needs → goals
3 Dashboard → conversation
4 AI everywhere → AI + deterministic software
5 Build journeys → reuse bank capability
```

Each row contains:

```text
BEFORE
→
AFTER
```

### Interaction

The before UI physically transforms into the after UI.

Examples:

#### Applications → needs

Before:

```text
Mortgage
Loan
Savings
Credit Card
```

After:

```text
What are you trying to do?
```

#### Dashboard → conversation

Before:

```text
Products
Plans
Applications
Navigation
Cards
Chat
```

Items fade/remove until only the conversation remains.

Anchor line:

> Every interface element had to justify why it was better than a conversation. Most couldn't.

---

## 12. Build with AI section

Heading:

```text
Building software with AI changes the build too.
```

### Metric strip

Use accurate build metrics only.

Current placeholders:

```text
9 days
143 commits
3 major pivots
1 complete rethink
```

These must be pulled from maintained content/config, not buried in component code.

### Human / AI responsibilities

Two cards:

#### Human owns

- product thesis;
- architecture;
- technical design;
- constraints;
- guardrails;
- acceptance criteria;
- product taste;
- risk decisions.

#### AI accelerates

- implementation;
- repetitive code;
- refactoring;
- tests;
- test fixtures;
- documentation;
- UI iteration;
- analysis.

### Build-day explorer

Optional interaction:

```text
See a build day
```

Open a timeline:

```text
08:42 Problem identified
09:06 Architecture decision
09:34 Feature definition
10:18 First implementation
10:43 Failed
11:22 Architecture revised
12:14 Passing
14:40 UI iteration
17:12 Commit
```

This is illustrative unless backed by actual commit/working history.

Label clearly if reconstructed.

---

## 13. Code reveal

Use at most 1–2 code blocks on the main page.

They should demonstrate architecture, not show off syntax.

Example:

```ts
const decision = await classify(message);

if (!decision.allowed) {
  return handleBlockedIntent(decision);
}

const context = await loadCustomerContext(customerId);

return baz.respond({
  message,
  context,
  tools: allowedTools(decision)
});
```

Add small callouts:

```text
AI understands meaning
Software controls access
Tools constrain action
```

Do not include giant files.

Do not include secrets, live endpoints requiring auth, or credentials.

---

## 14. “What we got wrong”

Do not show six equal documentation boxes by default.

Use four major lessons.

Recommended:

1. We optimised the wrong thing
2. We cached the prompt, not the conversation
3. A timeout is not cancellation
4. We built too much interface

Each card has:

```text
ASSUMPTION
WHAT HAPPENED
WHAT CHANGED
LESSON
```

Technical readers can expand:

```text
See measurement
```

for details such as token counts or cache behaviour.

Additional technical lessons can live in a secondary expandable section:

```text
More engineering lessons
```

including:

- tool schemas count toward context;
- volatile content invalidates cache prefix;
- cache instructions can silently have no effect.

---

## 15. Cost visualisation

Heading:

```text
Relationship-grade service only matters if it can scale.
```

### Summary metrics

Use verified POC numbers only.

Example structure:

```text
€X.XX
12-turn conversation before optimisation

€Y.YY
after optimisation

NN,NNN
cached-prefix tokens

ZZ%
reduction / relevant metric
```

### Turn-cost visual

Show 3 representative turns:

```text
Turn 1
large context + first response

Turn 2
cached context + tool call

Turn 3
cached context + shorter response
```

Render token bars.

### Optional simulator

Inputs:

```text
Monthly customers
Conversations per customer
Average turns
```

Outputs:

```text
Monthly conversations
Estimated turns
Indicative model cost
```

This must be labelled:

```text
Illustrative estimate
```

and use a local calculator based on configured assumptions.

Do not make live commercial claims.

---

## 16. Replay the whole journey

Near the end, include:

```text
See what happened in 12 seconds
```

On activation, show an accelerated replay:

```text
Customer
"I need €20,000 for a car."

↓
Intent recognised

↓
Known customer facts reused

↓
Personal Loan definition loaded

↓
Missing details gathered

↓
Affordability / eligibility state resolved

↓
Document attached

↓
Explicit confirmations captured

↓
74-field submission package generated

↓
POC boundary

GENERATED — NOT SENT
```

Final frame:

```text
One conversation.
An entire banking journey underneath.
```

This should be a major visual payoff.

---

## 17. Closing section

Return to a simple editorial layout.

Heading:

```text
A personal banker for everyone.
```

Copy should end with:

> The chatbot is not the product.
>
> **The relationship is the product.**

Then one CTA:

```text
← Back to Baz
```

Optional secondary:

```text
Try the demo
```

No extra architecture after the emotional close.

---

## 18. Page state model

Recommended state shape:

```ts
type HowItWorksState = {
  chapter:
    | "opportunity"
    | "experience"
    | "architecture"
    | "discovery"
    | "build"
    | "economics"
    | "future";

  viewMode: "customer" | "system";

  activeScenario: "home" | "cash" | "difficulty";

  architectureReplay:
    | "idle"
    | "customer"
    | "conversation"
    | "reasoning"
    | "services"
    | "bank";

  discoveryProduct: 1833 | 1940;

  discoveryHighlight:
    | null
    | "purpose"
    | "amount";

  expandedPivot: number | null;

  technicalDepth: boolean;

  fullReplay: "idle" | "playing" | "complete";
};
```

Use component-local state where possible.

Only promote state that needs to coordinate multiple page areas.

---

## 19. Suggested component tree

```text
HowItWorksPage
├── SiteHeader
├── Hero
├── ChapterNav
├── OpportunitySection
│   ├── EditorialCopy
│   └── LiveProofConversation
├── ExperienceSection
│   └── CustomerSystemToggle
├── ArchitectureSection
│   ├── ArchitectureReplay
│   ├── AiVsDeterministic
│   └── ToolBoundary
├── DiscoverySection
│   ├── ConversationDefinitionSubmission
│   ├── ProductJourneyCards
│   └── MultiChannelDiagram
├── BuildSection
│   ├── PivotTimeline
│   ├── HumanAiBoundary
│   ├── BuildMetrics
│   └── CodeReveal
├── LessonsSection
│   └── LessonCards
├── EconomicsSection
│   ├── CostMetrics
│   ├── TurnCostChart
│   └── OptionalCostSimulator
├── FullReplay
└── ClosingVision
```

---

## 20. Data/config separation

Do not hard-code narrative data deeply inside JSX.

Recommended:

```text
src/content/how-it-works/
  copy.ts
  scenarios.ts
  architecture.ts
  forms.ts
  pivots.ts
  lessons.ts
  economics.ts
```

Example:

```ts
export const forms = {
  1833: {
    name: "SuperSaver",
    postEntryCount: 64,
    capabilities: [
      "Conditional logic",
      "Documents",
      "Consents"
    ]
  },

  1940: {
    name: "Personal Loan",
    postEntryCount: 74,
    capabilities: [
      "Calculations",
      "Affordability",
      "Eligibility",
      "Documents",
      "Consents"
    ]
  }
};
```

That makes future content edits straightforward.

---

## 21. Motion

Use `motion/react`.

Recommended motion characteristics:

- 160–300 ms for UI state changes;
- 500–900 ms for diagram transitions;
- spring transitions only where they remain subtle;
- opacity + translate for editorial reveals;
- SVG stroke animation for architecture lines;
- shared-layout transition for before/after pivot UI where useful.

Never block scrolling while an animation plays.

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduced-motion mode should show final states immediately.

---

## 22. Desktop behaviour

Primary content width:

```text
max-width: ~1180–1240px
```

Editorial prose:

```text
max-width: ~640–720px
```

For proof sections, allow wider canvas.

Suggested desktop layout for major paired sections:

```text
40–50% editorial
50–60% interactive evidence
```

Sticky evidence panel can be used for:

- opportunity;
- architecture;
- discovery.

Do not use sticky panels for the entire page.

---

## 23. Mobile behaviour

Mobile should read as a high-quality article.

Order:

```text
heading
copy
interactive evidence
copy
interactive evidence
```

Rules:

- no pinned side rail;
- no hover-only information;
- tabs horizontally scroll if needed;
- code max-height is capped;
- long JSON uses syntax-highlighted scroll panel;
- architecture becomes vertical;
- comparison tables can transform into stacked cards;
- full replay remains available.

---

## 24. Accessibility

Target WCAG 2.2 AA.

Requirements:

- all interactions keyboard accessible;
- focus visible;
- replay controls usable without pointer;
- code blocks have accessible labels;
- animated diagrams have equivalent textual status;
- no information encoded by colour alone;
- tab roles implemented properly;
- live animated state should not spam screen readers;
- reduced-motion honoured;
- minimum tap target ~44px;
- contrast tested.

---

## 25. Performance

The page should still feel extremely fast.

Targets:

- no heavyweight 3D libraries;
- no large video hero;
- lazy-load below-the-fold syntax highlighting;
- code-split cost simulator if necessary;
- use SVG/CSS for diagrams;
- avoid canvas unless justified;
- minimise client state;
- preload only above-the-fold assets.

Aim:

```text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

on a realistic mobile connection where practical.

---

## 26. Content integrity

The page should distinguish clearly between:

### Demonstrated in the POC

Examples:

- SuperSaver definition `1833`;
- SuperSaver submission shape;
- Personal Loan definition `1940`;
- Personal Loan submission shape;
- intercepted `GENERATED — NOT SENT` behaviour;
- current POC architecture;
- actual measured cost/build metrics.

### Production direction

Examples:

- generic dynamic Digital Forms runtime;
- live production submission;
- production customer identity integration;
- full goal persistence across all products;
- proactive production orchestration.

Use labels such as:

```text
POC
Production direction
Illustrative
Synthetic example
```

when the distinction matters.

---

## 27. Tone

The page should sound:

- confident;
- intellectually curious;
- technically literate;
- transparent;
- ambitious;
- not self-congratulatory.

The reader should infer strong product/engineering leadership from the quality of the decisions and evidence.

Do not explicitly write:

```text
This demonstrates strong architecture.
This shows excellent engineering.
This is innovative leadership.
```

Show it instead.

---

## 28. Acceptance criteria

The page is ready when:

- [ ] A non-technical reader can understand the proposition without opening any technical detail.
- [ ] A technical reader can inspect architecture, schema and mapping evidence inline.
- [ ] The opening interaction demonstrates context rather than merely describing it.
- [ ] Customer/System view works.
- [ ] Architecture replay is functional.
- [ ] Digital Forms conversation → definition → POST mapping is interactive.
- [ ] Both 1833 and 1940 are represented.
- [ ] No live/sensitive customer data appears.
- [ ] Pivot timeline clearly explains how the product changed.
- [ ] Build-with-AI section distinguishes human judgement from AI acceleration.
- [ ] “What we got wrong” is a narrative, not a dump of notes.
- [ ] Cost data is clearly measured vs illustrative.
- [ ] Full replay works.
- [ ] POC vs production direction is consistently labelled.
- [ ] Mobile experience remains coherent.
- [ ] Reduced-motion mode works.
- [ ] Page feels fast.
- [ ] The final emotional takeaway remains the relationship-banking proposition rather than the implementation.

---

## 29. Final design test

When somebody reaches the bottom of the page, they should have experienced the following progression:

```text
This is a nice banking assistant.

        ↓

Actually, this understands customer intent.

        ↓

There is a serious architecture underneath it.

        ↓

It is connected to real existing bank capability.

        ↓

The product evolved through evidence rather than presentation.

        ↓

The economics have been considered.

        ↓

This could become a genuinely different digital banking model.
```

If the page achieves that sequence, it is doing its job.

The strongest version of this page does not merely explain Baz.

> **It behaves like proof that Baz was thoughtfully built.**
