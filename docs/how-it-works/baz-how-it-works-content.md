# How Baz works

> **A personal banker for everyone.**
>
> A look under the hood at how Baz works, what the AI is actually doing, how the product evolved, what we learned building it, and what it could mean for the future of banking.

---

## The opportunity

# Digital banking made banking faster. It did not make it more personal.

Most digital banking experiences are organised around the bank.

Accounts. Mortgages. Loans. Savings. Cards. Insurance.

Customers do not think that way.

They think:

> “We’ve had a baby.”

> “We want to buy our first home.”

> “I’ve got money sitting in my current account and I’m not sure what I should do with it.”

> “I’m finding things tight every month.”

> “I want to retire earlier.”

The customer has a life. The bank has products.

For decades, the best answer to that gap was a relationship manager: somebody who knew the customer, understood what they were trying to achieve, remembered what had happened before, and could connect different parts of the bank around them.

That service is valuable.

It has also traditionally been expensive and difficult to provide at retail scale.

Baz is an experiment in changing that.

# What if every customer could have the continuity, context and proactive support normally associated with private banking?

Not by adding another chatbot to the corner of a website.

By making conversation the front door to the bank.

Baz is a conversational banking assistant designed around three promises:

### Understand me

Know what I am trying to achieve, understand enough of my circumstances to be useful, and avoid making me repeat information the bank already knows.

### Help me get things done

Move beyond answers into useful actions: calculations, applications, document collection, product journeys, updates and hand-offs.

### Stay with me

Remember the goal after the transaction is over.

A mortgage application is not the customer’s objective.

Buying the home is.

A savings account is not the objective.

Building the deposit is.

A loan is not the objective.

The car, renovation, education or life event is.

That leads to a different organising principle:

> **Products are tools. Customer goals are the organising principle.**

---

## The experience

# Start with the customer, not the menu.

A traditional digital journey asks the customer to choose where to go.

Baz starts with a much simpler question:

> **What are you trying to do?**

Consider a customer who says:

> **Customer:** My wife and I want to buy our first home next year.

A conventional banking interface needs the customer to find mortgages, determine whether they are ready, understand deposits, calculate affordability and work out what information will eventually be required.

Baz can begin with the goal.

> **Baz:** I can help with that. The useful place to start is working out roughly what you could borrow, what deposit you may need, and whether there are any gaps we should close before you apply.
>
> I already know some of the basics from your profile, so I will not ask you to repeat them. Can I ask you two things: roughly where are you hoping to buy, and what have you already saved?

That interaction looks simple.

Underneath it, several things have already happened:

- a banking intent has been recognised;
- a first-home goal has been identified;
- known customer facts have been reused;
- missing information has been identified;
- the next useful action has been selected;
- the conversation has remained centred on the customer’s objective rather than a product catalogue.

The experience should feel lightweight.

The system underneath it should not be.

---

## The architecture

# The interesting part is not the chat.

A good conversational interface can feel effortless precisely because the complexity is hidden.

Baz is not one giant model prompt with permission to do anything.

The system is deliberately split into responsibilities.

```text
Customer
   ↓
Conversation
   ↓
Reasoning
   ↓
Deterministic banking services
   ↓
Existing bank capabilities
```

The boundary matters.

## AI is useful where ambiguity is useful.

Baz can use AI to:

- understand natural language;
- identify likely intent;
- interpret what the customer is trying to achieve;
- decide how to explain something clearly;
- ask naturally for missing information;
- choose between approved capabilities;
- summarise context;
- maintain a coherent conversation.

## Software is required where certainty is required.

Deterministic services should own:

- application state;
- required fields;
- validation;
- product rules;
- calculations;
- eligibility outcomes;
- submission structures;
- document state;
- consent state;
- authentication;
- audit events.

The architectural principle is simple:

> **Use AI where ambiguity is valuable. Use software where certainty is required.**

That distinction is central to Baz.

The AI can decide how to ask.

It should not decide what a valid sort code looks like.

The AI can explain an affordability result.

It should not invent the result.

The AI can help a customer complete a journey.

It should not bypass the journey.

---

## What the model is allowed to know

# Context should make the conversation better, not make the system reckless.

Baz works best when it has enough context to avoid treating every interaction like a first meeting.

That can include:

- current conversation state;
- previously supplied information;
- customer goals;
- active plans;
- known Bank of Ireland relationships;
- approved product information;
- relevant application state;
- documents already provided;
- previous choices that remain valid.

But context is not permission.

The model should only receive information that is relevant to the current task, and access to customer or banking data should remain mediated by tools and deterministic services.

The intended pattern is:

```text
Model proposes
      ↓
Tool validates
      ↓
System acts
      ↓
Everything important is recorded
```

---

## The gate

# Not every message should reach the most capable model.

One of the early architectural decisions was to put a small classification layer in front of the main conversational model.

Its job is deliberately narrow.

It determines things such as:

- is this a banking request?
- is the request within Baz’s allowed domain?
- does the message require specialist handling?
- can it be answered cheaply?
- should a tool be made available?
- should the request be blocked or redirected?

This keeps the expensive model focused on work that actually needs it.

It also creates an important safety boundary.

A customer saying:

> “I’m struggling every month and I’m starting to miss payments.”

is a banking request.

But it should not trigger the same commercial behaviour as:

> “I have €50,000 sitting in my current account.”

The first may require support, tone suppression, credit cross-sell suppression and possibly human hand-off.

The second may lead to a conversation about time horizon, liquidity, savings or investing.

The model can interpret the language.

The gate and policy layer decide which behaviours are permitted.

---

## What the model is actually sent

# The prompt is a product surface.

A production AI system is not just a model and a message.

Every turn can include:

- core behaviour instructions;
- persona rules;
- safety rules;
- customer context;
- product knowledge;
- goal state;
- policy constraints;
- conversation history;
- tool definitions;
- tool schemas;
- application state.

That means prompt design is not copywriting.

It is architecture.

A large prompt can become expensive.

A poorly structured prompt can become brittle.

A volatile block placed inside an otherwise cacheable prefix can invalidate caching.

A tool schema nobody ever uses can still cost tokens on every turn.

The build forced us to treat prompt construction the same way we would treat any other runtime dependency:

- inspect it;
- measure it;
- version it;
- minimise it;
- understand which parts are stable;
- understand which parts change;
- test what happens when assumptions fail.

---

## Tools

# The model should not be able to do anything directly.

Baz can be given a set of narrowly defined tools.

Examples might include:

```text
get_customer_context
get_goal_state
create_goal
update_goal
search_product_knowledge
calculate_mortgage_range
load_form_definition
validate_application_state
store_document_reference
generate_submission_package
handoff_to_human
```

The model can decide that a capability is useful.

The tool decides what is actually allowed.

That is an important distinction.

A tool can:

- validate inputs;
- enforce authentication;
- apply policy;
- write audit events;
- reject impossible requests;
- return structured errors;
- restrict what the model is capable of changing.

The goal is not to make the model powerful.

The goal is to make the overall system useful.

---

## The discovery

# Then we discovered the bank already spoke machine.

One of the most important technical discoveries in the Baz POC came from looking closely at Bank of Ireland’s existing Digital Forms platform.

The SuperSaver journey is available to customers at:

```text
https://digital.bankofireland.com/personal-banking/supersaver/
```

When that page loads, the existing web application retrieves a machine-readable journey definition:

```http
GET /api/forms/1833
```

That response describes the form.

It includes things such as:

- fields;
- field types;
- labels;
- required flags;
- allowed choices;
- conditional logic;
- validation rules;
- hidden defaults;
- document requirements;
- consent fields;
- backend mappings;
- page/stage information;
- runtime metadata.

When the customer completes the journey, the existing site submits the completed state back to:

```http
POST /api/forms/1833
```

using the structure the platform expects.

For the branch we examined, the final SuperSaver submission contained 64 FormData entries.

That was useful.

Then we looked at a materially more complex journey.

The Personal Loan application is form:

```http
GET /api/forms/1940
```

Its definition does more than describe questions.

It also contains components representing:

- repayment simulation;
- quick quote calculations;
- affordability inputs;
- full quote calculations;
- eligibility state;
- compound values;
- document upload requirements;
- explicit consent;
- conditional routes for different loan purposes.

The completed branch we inspected produced:

```http
POST /api/forms/1940
```

with 74 FormData entries.

That changed the architecture conversation.

The question was no longer:

> “How do we recreate all of these application journeys for an AI assistant?”

It became:

> **“How much of the journey already exists in a machine-readable form that Baz can reuse?”**

That is a very different problem.

---

## One digital journey, multiple channels

The implication is straightforward.

The bank already has a structured journey definition.

The web channel renders it visually.

A mobile app can render it in an app experience.

Baz can potentially render the same underlying requirements conversationally.

```text
                   Digital Forms
                        │
          ┌─────────────┼─────────────┐
          │             │             │
        Web           Mobile          Baz
      renderer       renderer     conversational
                                  renderer
```

Baz does not need to become a replacement for the Digital Forms platform.

It can become another way of accessing it.

That gives us one of the strongest technical statements in the POC:

> **Baz does not replace the digital platform. It changes how customers access it.**

And another:

> **The bank may already own much more of the architecture required for conversational banking than it first appears.**

For the POC, we are deliberately proving this with known product journeys rather than attempting to build a fully generic production runtime.

That distinction matters.

The POC proves the pattern.

A production platform would take the idea much further.

---

## A worked example

# Conversation → journey definition → existing submission contract

Imagine a customer tells Baz:

> **Customer:** I need €20,000 for a car.

Baz can interpret two useful facts immediately:

```text
loan amount    → €20,000
loan purpose   → Car purchase
```

In the Personal Loan form definition, those concepts map to existing fields.

For example:

```json
{
  "id": 500,
  "type": "conditionalSelect",
  "label": "What is the purpose of your loan?",
  "isRequired": true,
  "toscana": "Purpose_Of_Loan"
}
```

and the relevant amount field maps to the requested loan amount.

The final existing submission contract includes values such as:

```text
input_500 = "Car purchase"
input_179 = "20000"
input_255 = "20000"
```

The customer does not need to know any of that.

They said:

> “I need €20,000 for a car.”

The existing bank journey still remains authoritative underneath.

That is what a conversational renderer should do.

---

## The build

# Baz was not designed this way. We found our way here.

The final architecture looks deliberate.

The route to it was not.

Baz was built as a POC, and the product changed materially while it was being built.

That is one of the most useful parts of the story.

---

## Pivot 1 — Applications → needs

The first instinct was conventional:

> Build an assistant that helps customers complete applications.

It was useful.

It was also too narrow.

The customer still had to arrive knowing which application they needed.

That is exactly the problem Baz was supposed to remove.

So the product moved from:

> **What would you like to apply for?**

to:

> **What are you trying to do?**

That sounds like a copy change.

It is actually a product model change.

The customer no longer needs to understand the bank before starting the conversation.

---

## Pivot 2 — Needs → goals

Needs were better.

But they were still point-in-time.

A customer who says:

> “I need a mortgage.”

does not really have a mortgage goal.

They have a home-buying goal.

The mortgage is one tool.

That introduced the idea of persistent customer plans:

```text
Goal
Buy first home

Current state
Deposit building

Milestones
Mortgage readiness
Approval in principle
Property search
Application
Drawdown

Next useful action
Check deposit progress
```

Applications can belong to a plan.

The plan survives the application.

That is closer to how a human relationship manager thinks.

---

## Pivot 3 — Dashboard → conversation

At one point the product began growing a traditional interface around the conversation.

Navigation.

Product areas.

Cards.

Plans.

Application views.

Dashboards.

The result looked more like a banking app.

That was the problem.

Every extra interface element had to justify why it was better than simply talking to Baz.

Most could not.

The consumer experience was stripped back.

Conversation became primary again.

Rich interface elements still appear when they are genuinely useful:

- a calculation;
- a plan;
- a milestone;
- a document request;
- an application progress state;
- a product option.

But they appear inside the relationship rather than replacing it.

> **Removing product can be product development.**

---

## Pivot 4 — AI everywhere → AI where it is useful

The early temptation with an AI product is to let the model do more.

That is often the wrong direction.

Over time, more responsibilities moved out of the model and into deterministic services.

The final pattern became:

### AI

- understand;
- explain;
- plan;
- ask;
- summarise;
- choose among approved capabilities.

### Deterministic software

- validate;
- calculate;
- persist;
- enforce;
- submit;
- audit.

The system became safer and easier to reason about as the model became less powerful.

---

## Pivot 5 — Build journeys → reuse bank capability

The Digital Forms discovery changed the technical direction again.

Instead of asking how Baz should recreate a product application, we could inspect how the existing digital platform already represented it.

That introduced a much more attractive integration pattern:

```text
Existing bank capability
          +
Conversation
          =
New customer experience
```

For the POC, SuperSaver and Personal Loan are explicit examples.

For a production platform, the longer-term question is whether this pattern could become substantially more generic.

That idea is deliberately parked outside the POC scope.

---

## Building software with AI

# AI changed the product. It also changed how the product was built.

Baz was developed using AI-assisted engineering throughout.

That does not mean handing product development to a model.

It means increasing the leverage of engineering judgement.

The useful division of responsibility looked more like this:

| Human owns | AI accelerates |
|---|---|
| Product thesis | Implementation |
| Architecture | Boilerplate |
| Constraints | Refactoring |
| Risk boundaries | Test generation |
| Acceptance criteria | Documentation |
| Product taste | UI iteration |
| What should exist | Ways to build it |

That distinction matters.

AI can make bad architecture faster too.

The valuable part is not generating more code.

It is shortening the loop between:

```text
idea
→ architecture
→ implementation
→ test
→ failure
→ learning
→ revision
```

The Baz POC went through multiple material changes in a short build window because that loop was cheap enough to run repeatedly.

The point is not:

> “AI wrote the product.”

The point is:

> **AI increases the leverage of good engineering judgement.**

---

## The development model

The POC uses a deliberately lightweight modern stack.

Typical components include:

```text
Vite
React
TypeScript
Supabase
GitHub
browser-native inspection
synthetic fixtures
small deployable increments
```

The important part is not the logos.

It is the development discipline.

Features were defined before they were built.

Technical boundaries were written down.

Real network behaviour was inspected rather than guessed.

Synthetic customer data was used for demos.

Submission calls were intercepted rather than sent.

Architecture was revised when the evidence contradicted the assumption.

The POC was allowed to change.

That is exactly what a POC is for.

---

## What we got wrong

# The useful mistakes were the ones we measured.

A prototype is not valuable because it gets everything right.

It is valuable because it makes incorrect assumptions cheap enough to discover.

Several of the most useful lessons came from things that initially looked correct.

---

## We optimised the wrong thing

The product catalogue looked like an obvious prompt-cost problem.

It was large.

So the instinct was to reduce it.

Measurement showed the saving was less important than expected.

The lesson:

> **Instrument before optimising.**

The thing that looks large is not necessarily the thing that costs the most.

---

## We cached the prompt, not the conversation

Early caching work focused on the stable system prompt.

It helped.

But real customers do not have isolated single-turn interactions.

They have conversations.

A better caching strategy had to reflect the lifecycle of the conversation rather than just the layout of the prompt.

The lesson:

> **Architecture should follow user behaviour, not just API mechanics.**

---

## A timeout is not cancellation

A request timing out in the interface does not necessarily mean the underlying work stopped.

That sounds obvious after you find it.

It was not obvious before measuring it.

The system had to distinguish:

```text
UI stopped waiting
```

from:

```text
execution was actually cancelled
```

The lesson:

> **Interface state and execution state are not the same thing.**

---

## Tool schemas are part of the prompt

A tool can cost tokens even when it is never called.

Tool names, descriptions and schemas are still context supplied to the model.

That meant unused or overly verbose tools were not free.

The lesson:

> **Count what is actually sent, not what your own code happens to display.**

---

## Some cache instructions silently did nothing

A configuration can look correct and still not produce the behaviour you think it does.

There was no dramatic error.

The saving simply did not appear.

Measurement exposed it.

The lesson:

> **Caching fails open and silently. If you have not measured a non-zero cache read, you do not know that it is cached.**

---

## We built too much interface

This was a product mistake rather than an infrastructure mistake.

The product began accumulating interface because interface is easy to build.

The result became less distinctive.

The breakthrough came from deleting.

The lesson:

> **A conversational product should not become a conventional app merely because conventional UI is familiar.**

---

## The economics

# Relationship-grade service only matters if it can scale.

The economics of a conversational product are different from a traditional interface.

Every meaningful turn has a marginal inference cost.

That makes cost visible in a way that many conventional digital experiences hide.

The POC therefore measured:

- tokens read;
- tokens written;
- cache reads;
- tool schemas;
- conversation growth;
- model routing;
- failed calls;
- timeouts;
- repeated context;
- the cost of richer model behaviour.

The exact numbers are less important than the discipline.

The important questions are:

> How much does a useful conversation cost?

> What makes it expensive?

> Which optimisations preserve quality?

> Which optimisations make the product worse?

The POC found that significant savings were possible through architecture rather than simply selecting a cheaper model.

That included:

- caching stable context;
- routing cheaper decisions to smaller components;
- avoiding unnecessary repeated context;
- reducing unused prompt content;
- ensuring volatile information did not invalidate stable cache prefixes;
- designing tool interfaces carefully.

The wrong optimisation would be:

> “Use the cheapest model everywhere.”

That can make the product cheaper by making it worse.

The right objective is:

> **Deliver the required customer experience at the lowest sensible cost.**

---

## What we deliberately did not do

# A POC should prove the risky idea, not quietly become production.

Baz deliberately stops short of several things.

It does not:

- submit real product applications;
- make real lending decisions;
- replace Bank of Ireland authentication;
- recreate core banking;
- bypass deterministic product rules;
- use real customer data as demo fixtures;
- claim every Digital Forms journey is generically supported;
- turn the AI into an unrestricted bank operator.

Where the POC generates a product submission package, the status is:

> **GENERATED — NOT SENT**

That boundary is intentional.

The POC is proving:

1. customers can interact differently;
2. AI can orchestrate useful banking conversations;
3. deterministic services can retain control;
4. existing bank capability can be reused;
5. the resulting experience can feel materially better.

It is not trying to prove every production dependency at once.

---

## What Baz turned out to be

Baz began as:

> **A conversational assistant for banking applications.**

It evolved into something more interesting:

> **A possible interaction layer across the bank.**

That changes the frame.

| Earlier idea | Baz now |
|---|---|
| Help complete applications | Understand what the customer is trying to achieve |
| Product-led | Goal-led |
| Conversation as UI | Conversation as relationship |
| AI does most of the work | AI + deterministic services |
| Build new journeys | Reuse existing bank capability |
| Finish at submission | Continue across the customer journey |

The most important change is the last one.

A bank interaction does not need to end when a form ends.

---

## What this could mean for Bank of Ireland

# The opportunity is not a better chatbot.

It is a better digital relationship.

Bank of Ireland already has digital channels.

It already has product platforms.

It already has customer data.

It already has product knowledge.

It already has structured journeys.

AI introduces the possibility of a new layer across those capabilities:

```text
Customer
   ↓
Goal / need / life event
   ↓
Conversation
   ↓
Existing bank capabilities
```

That could create an experience in which customers no longer need to understand how the bank is organised before the bank can help them.

It also creates a strategic opportunity.

Many banks can add a generative chat interface.

The harder thing is combining:

- customer context;
- continuity;
- product knowledge;
- safe orchestration;
- existing digital journeys;
- deterministic execution;
- proactive follow-up;
- a genuinely useful conversational experience.

If those pieces are brought together well, conversational banking can become more than another channel.

It can become a differentiator.

---

# A personal banker for everyone.

The long-term idea behind Baz is simple:

Give ordinary retail customers more of the continuity, context and care traditionally associated with relationship banking.

Use AI to make that service scalable.

Use existing bank capability to make it practical.

Use deterministic software to make it trustworthy.

And organise the experience around the customer rather than the bank.

> **The chatbot is not the product.**
>
> **The relationship is the product.**

If that relationship can be delivered at digital scale, Bank of Ireland does not simply get a more sophisticated assistant.

It gets the opportunity to redefine what digital banking feels like.
