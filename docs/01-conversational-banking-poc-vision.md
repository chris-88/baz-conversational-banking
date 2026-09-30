# Conversational Banking
## Proof of Concept Vision

### 1. Executive Summary

Digital banking has traditionally digitised the bank’s existing processes rather than fundamentally changing the way customers interact with the bank.

A customer who wants a mortgage completes a mortgage journey. A customer who wants a joint account completes a joint-account journey. Credit cards, personal loans and life assurance each have their own journeys, questions, forms and processes.

From the bank’s perspective these are separate products.

From the customer’s perspective they are often all consequences of the same thing:

**their life has changed.**

Conversational Banking explores a different interaction model.

Instead of requiring customers to understand the bank’s products, structures and application journeys, the customer simply tells the bank what they are trying to do.

The bank asks intelligent, curious questions to understand their circumstances, identifies relevant needs, presents appropriate options for the customer to choose from, gathers the required information once, and orchestrates the existing product-application journeys in the background.

The fundamental proposition is:

> **Tell us what you’re trying to do. We’ll help you get it done.**

Conversational Banking does not replace existing banking platforms, product processes, decision engines, underwriting processes or application systems.

It creates a new interaction layer across them.

**AI becomes the adaptive interviewer and orchestrator. Existing banking processes remain the execution engine.**

---

# 2. The Problem

Banking is a utility.

Customers generally do not visit a bank’s website because they want to spend time engaging with their bank. They arrive because something has happened and they need to accomplish something.

They want to:

- buy a home;
- borrow money;
- open an account;
- protect their family;
- replace a card;
- save for something;
- change their circumstances.

Traditional digital banking asks the customer to translate that need into the bank’s organisational model.

A customer buying their first home may separately encounter:

**Mortgage**

**Joint Account**

**Credit Card**

**Personal Loan**

**Life Assurance / Protection**

Each journey may independently ask about the same person, household, employment, income and financial circumstances.

The customer repeatedly supplies information that either the bank already holds or that they have already provided elsewhere.

The bank understands individual transactions and individual applications.

It rarely understands the complete customer objective connecting them.

Conversational Banking attempts to reverse that relationship.

---

# 3. Product Vision

Conversational Banking creates an ongoing conversation between a customer and Bank of Ireland through which the customer can:

**Explain what they are trying to accomplish.**

**Allow the bank to understand the wider context surrounding that need.**

**Explore relevant products and services without needing to know which products to search for.**

**Choose which options they wish to pursue.**

**Provide information conversationally rather than navigating multiple independent forms.**

**Reuse previously supplied and appropriately verified information across applications.**

**Submit applications into existing BOI journeys and processes.**

**Return later and immediately understand what is happening across all applications.**

**Respond conversationally when further information is required.**

**Receive notifications when something changes and return directly to the relevant conversation.**

The objective is not to increase engagement with banking.

The objective is to dramatically reduce the effort required when banking matters.

---

# 4. POC Hypothesis

The proof of concept will test the following hypothesis:

> **A conversational AI layer can materially improve complex multi-product customer journeys by understanding customer intent, collecting information once, reusing context intelligently, and orchestrating existing product applications without requiring fundamental changes to existing banking processes.**

The POC should demonstrate four distinct capabilities.

### Discover

Understand the customer’s objective and broader circumstances through natural conversation.

### Advise and inform

Surface relevant options and explain their implications clearly while allowing the customer to decide which products they wish to pursue.

### Apply

Collect the information required by existing applications and map that information into existing product journeys.

### Continue

Maintain customer and application context over time so that subsequent interactions begin from where the customer left off rather than starting again.

---

# 5. POC Customer

The proof of concept will deliberately use one customer scenario.

The customer:

- is an existing Bank of Ireland customer;
- has only a personal current account with BOI;
- has recently married;
- has recently become a parent;
- is preparing to purchase their first home with their spouse.

The customer initially approaches BOI because they believe they need a mortgage.

They do not arrive looking for five financial products.

Through conversation, BOI gradually develops an understanding of the wider life event surrounding the mortgage.

This creates potential needs relating to:

**Mortgage**

**Joint Current Account**

**Life Assurance / Family Protection**

**Credit Card**

**Personal Loan**

The customer remains responsible for deciding which products they wish to explore or apply for.

Conversational Banking discovers needs and explains options.

**It does not manufacture demand or make decisions on behalf of the customer.**

---

# 6. POC Product Scope

The proof of concept will support five existing product journeys.

### Mortgage

The mortgage acts as the anchor journey.

It requires the richest understanding of the customer’s household, employment, income, expenditure, savings, liabilities and intended property purchase.

Information gathered here should demonstrate significant reuse across other journeys.

### Joint Current Account

The joint account demonstrates:

- household discovery;
- multi-party applications;
- invitation of a second applicant;
- continuation of a process involving another person.

### Credit Card

The credit-card journey demonstrates the orchestration of a comparatively straightforward consumer-credit application using information already known about an existing customer.

### Personal Loan

The personal-loan journey demonstrates contextual decision support.

For example, where the customer is simultaneously applying for a mortgage, Conversational Banking should explain that taking additional borrowing may affect their wider financial position rather than simply attempting to maximise product uptake.

### Life Assurance / Protection

Protection demonstrates a materially different application journey.

It introduces information that may be more sensitive, may require additional explanation and consent, and should not automatically be inferred simply because adjacent financial information is available.

---

# 7. Conversation Philosophy

The POC should not attempt to collect the maximum possible number of facts.

It should attempt to develop the **maximum useful understanding with the minimum unnecessary effort**.

Every question should exist for a reason.

Questions should broadly fall into one of four categories:

**Understand the objective**

> What are you hoping to do?

**Understand the circumstances**

> Are you buying alone or with somebody else?

**Understand an emerging need**

> Now that you’re married, do you manage most household finances together or separately?

**Complete a requirement**

> What is your annual basic salary before tax?

The conversation should feel curious rather than procedural.

An answer should be capable of changing the next question.

The experience should therefore not simply render an existing form one field at a time through chat bubbles.

---

# 8. Customer Agency

Conversational Banking should distinguish between:

**understanding a need**

and

**recommending or applying for a product.**

If the customer explains that they have recently married, had a child and are buying a home, the system may reasonably explain that BOI can also help with combining household finances or family protection.

It should then allow the customer to choose.

For example:

> Based on what you’ve told me, there are a few other things I can help with while we’re here.
>
> You mentioned that you and your wife still manage your money separately, so we can look at opening a joint account.
>
> You’ve also recently had a baby and are buying your first home, so I can show you the protection options available.
>
> And if you expect significant costs when you move in, we can explore borrowing options too.
>
> **What would you like to look at?**

The customer decides what happens next.

---

# 9. Shared Customer Context

The central platform concept behind Conversational Banking is not conversation history.

It is **structured customer context**.

The service maintains a customer case containing information such as:

**Identity**

**Household**

**Employment**

**Income**

**Expenditure**

**Assets**

**Liabilities**

**Goals**

**Life events**

**Existing BOI products**

**Documents and evidence**

**Consent**

**Product interests**

**Applications**

Each piece of reusable information should contain metadata describing where it came from and whether it has been verified.

For example:

`annualIncome = €92,000`

may initially have:

`source = CUSTOMER_STATED`

and later become:

`source = PAYSLIP_VERIFIED`

This allows downstream journeys to distinguish between information that has merely been provided and information that has been evidenced or verified.

The value of this approach is simple:

> **Ask once. Use many times where appropriate.**

Where regulation, product rules or customer consent require information to be reconfirmed, the system reconfirms it.

---

# 10. Existing Journeys Remain Intact

A core principle of the POC is:

> **Do not rebuild the bank to demonstrate the proposition.**

Each existing product application continues to define:

- required fields;
- validation;
- eligibility;
- credit policy;
- declarations;
- consent;
- product rules;
- decisioning;
- underwriting;
- fulfilment.

Conversational Banking creates an abstraction layer above those journeys.

The AI collects information naturally.

A structured orchestration service transforms that information into the fields required by the relevant existing journey.

The downstream system remains the system of record.

This allows the POC to demonstrate a radically different customer experience without requiring radical change to existing product platforms.

---

# 11. AI Responsibilities

AI should be used where AI provides genuine value.

It may:

- understand natural-language customer intent;
- ask adaptive follow-up questions;
- extract structured information from conversation;
- explain products and processes in accessible language;
- summarise what has already been established;
- recognise potential needs;
- interpret documents where appropriate;
- determine which known information may satisfy another journey requirement;
- explain application status information;
- decide how best to ask for missing information.

AI should not independently:

- approve credit;
- calculate regulated decisions outside approved services;
- alter product eligibility rules;
- invent application status;
- infer sensitive information that requires explicit collection;
- submit legally significant declarations without affirmative customer action.

The intelligence sits around the process.

The process remains deterministic.

---

# 12. Identity and Cross-Channel Continuity

Customers should be able to begin anonymously on the public BOI website and continue securely inside an authenticated BOI environment.

A customer may therefore:

**Start on Safari → visit BOI.ie → begin a conversation → authenticate → continue in the mobile app → leave → receive an update → return the following day.**

The customer should experience this as one continuous conversation.

Customer context should reside securely server-side.

Authentication tokens should provide an authenticated identity and authorisation context rather than carrying the entire customer case.

An anonymous conversation can therefore be associated with an authenticated customer after the customer chooses to sign in.

The conversation then gains access, subject to appropriate controls, to relevant existing-customer information.

---

# 13. The Conversational Banking Agent

For the POC, the customer-facing agent will be called:

# **Baz**

The persona should be useful, concise, curious and occasionally playful without becoming gimmicky.

The opening interaction could deliberately acknowledge customer scepticism about bank chatbots:

> **Baz:** Hi. I’m Baz — BOI’s AI banking assistant.
>
> Before you ask: no, I’m not another bot whose greatest achievement is finding the Contact Us page.
>
> Tell me what you’re trying to do and I’ll see if I can actually help.
>
> And no — I’m not *that* Baz.
>
> Probably.

The humour should establish personality but the customer must remain clearly informed that they are interacting with AI.

Any external use of the Baz persona would naturally require the appropriate brand, legal and talent approvals.

---

# 14. Persistent Application Relationship

Conversational Banking does not end when an application is submitted.

The same conversational layer becomes the customer's interface into their applications.

A returning customer may ask:

> Where are we with everything?

Baz can respond:

> Your joint-account application has been submitted and Sarah has completed her section.
>
> Your mortgage is being assessed.
>
> The mortgage team has requested one additional payslip.
>
> Your credit-card application has been approved.
>
> We paused the personal-loan application as you requested.
>
> Your protection application still needs a few questions completed.
>
> **What would you like to deal with first?**

The customer does not have to locate five tracking systems.

The conversation provides the consolidated view.

---

# 15. Proactive Re-engagement

Customers may opt into notifications when application state changes.

For the POC, SMS will demonstrate this capability.

Messages should contain minimal information and return the customer into an authenticated environment.

For example:

> **Bank of Ireland:** Baz has an update about something you're working on with us. Open the BOI app to continue securely.

Following authentication:

> Your mortgage application has moved forward, but the team needs one additional document from Sarah.
>
> I can help you provide it now.

This creates a complete lifecycle:

**Discover → Understand → Choose → Apply → Leave → Update → Return → Continue**

---

# 16. POC Success Measures

The POC should not be judged primarily by chatbot engagement.

It should demonstrate measurable improvements in customer effort and journey orchestration.

Measures should include:

**Questions avoided through reuse**

How many questions would the customer have encountered across the five independent journeys compared with Conversational Banking?

**Unique information collected**

How effectively was customer information reused?

**Journey completion effort**

How many interactions were required to progress the selected applications?

**Needs discovered**

Did the conversation identify legitimate customer needs that were not contained in the initial request?

**Applications progressed**

Could the system successfully create and progress multiple existing applications?

**Context retention**

Could the customer leave one channel and return through another without repeating themselves?

**Re-engagement**

Could a change in application state trigger a meaningful customer interaction?

**Transparency**

Could the customer understand what the AI was doing, what information was being reused and when an application was being submitted?

---

# 17. POC Non-Goals

The POC is not intended to:

- replace core banking systems;
- replace existing application platforms;
- create a new credit-decisioning engine;
- redesign individual products;
- prove production-scale infrastructure;
- automate every exception;
- demonstrate every possible customer journey;
- provide unrestricted autonomous financial advice.

The purpose is narrower:

> **Prove that an intelligent conversational orchestration layer can sit above existing banking journeys and fundamentally improve how customers interact with them.**

---

# 18. Vision Beyond the POC

The eventual opportunity extends beyond applications.

Once the bank possesses a secure, persistent conversational relationship with the customer, the same interaction model could extend into servicing.

A customer should ultimately be able to say:

> I'm buying my first home.
>
> We've had a baby.
>
> I've lost my card.
>
> I'm going abroad.
>
> I need €10,000 for a car.
>
> We're separating our finances.
>
> My salary has stopped coming in.

The customer's responsibility should not be to understand which department, product page, form or process handles the problem.

The bank should understand the intent and orchestrate the services required to resolve it.

That is the longer-term vision for Conversational Banking.

## **Customers don't want to engage with their bank. They want their bank to understand what they're trying to do and help them get it done.**
