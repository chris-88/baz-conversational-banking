# The Return of Relationship Banking

**How AI can make a personal banker available to every retail customer**

| | |
|---|---|
| **Author** | Christopher Quinn |
| **Date** | October 2026 |
| **Version** | 1.0 |
| **Status** | Draft for discussion |
| **Length** | Approximately 57,000 words |

> **A note on terminology.** Six terms recur throughout and are not interchangeable.
>
> - **Relationship layer** — the governed orchestration layer which connects customer intent to the bank's existing capabilities. It is not a channel, not a replacement core and not the language model.
> - **Relationship state** — the durable, provenance-tracked record of facts, goals, decisions and agreed actions which the relationship layer maintains. It sits outside the model.
> - **Plan** — the persistent representation of a single customer objective: its status, milestones, dependencies, outstanding actions and review conditions.
> - **Orchestrator** — the component within the relationship layer which determines what should happen next and which authorised capability to invoke.
> - **Relationship agent** — the conversational AI the customer actually interacts with. It operates inside the relationship layer and holds no independent authority.
> - **Relationship model** — used throughout for the *service and operating model* this paper proposes, not for any piece of software.

## Contents

- [1. Introduction](#1-introduction)
- [2. From relationship banking to digital self-service](#2-from-relationship-banking-to-digital-self-service)
- [3. The economics of relationship management](#3-the-economics-of-relationship-management)
  - [Soft information and the limits of scale](#soft-information-and-the-limits-of-scale)
  - [The capacity constraint](#the-capacity-constraint)
  - [Why mass retail banking favoured standardisation](#why-mass-retail-banking-favoured-standardisation)
  - [The seven functions of relationship management](#the-seven-functions-of-relationship-management)
  - [Unbundling the functions](#unbundling-the-functions)
  - [The marginal cost of continuity](#the-marginal-cost-of-continuity)
- [4. From generative AI to agentic systems](#4-from-generative-ai-to-agentic-systems)
- [5. From product-led digital banking to goal-led relationship banking](#5-from-product-led-digital-banking-to-goal-led-relationship-banking)
- [6. Trust, customer control and the governance of memory](#6-trust-customer-control-and-the-governance-of-memory)
- [7. The role of the human banker: judgement, escalation and accountability](#7-the-role-of-the-human-banker-judgement-escalation-and-accountability)
  - [Designing around escalation thresholds](#designing-around-escalation-thresholds)
  - [Escalation 1: Regulatory](#escalation-1-regulatory)
  - [Escalation 2: Decision](#escalation-2-decision)
  - [Escalation 3: Uncertainty](#escalation-3-uncertainty)
  - [Escalation 4: Vulnerability](#escalation-4-vulnerability)
  - [Escalation 5: Emotional](#escalation-5-emotional)
  - [Escalation 6: Customer choice](#escalation-6-customer-choice)
  - [Handover without restart](#handover-without-restart)
  - [Expertise, scale and the value of human time](#expertise-scale-and-the-value-of-human-time)
  - [Automation bias and effective oversight](#automation-bias-and-effective-oversight)
  - [Where accountability sits](#where-accountability-sits)
  - [Trust, disclosure and institutional voice](#trust-disclosure-and-institutional-voice)
  - [Organisational and workforce implications](#organisational-and-workforce-implications)
- [8. Operating model and architecture: from product silos to relationship orchestration](#8-operating-model-and-architecture-from-product-silos-to-relationship-orchestration)
- [9. Measuring value: from interaction metrics to customer progression](#9-measuring-value-from-interaction-metrics-to-customer-progression)
  - [Why conventional chatbot metrics mislead](#why-conventional-chatbot-metrics-mislead)
  - [A measurement hierarchy](#a-measurement-hierarchy)
  - [Why sales funnels are insufficient](#why-sales-funnels-are-insufficient)
  - [Category 1: Customer progression](#category-1-customer-progression)
  - [Category 2: Customer effort](#category-2-customer-effort)
  - [Category 3: Appropriateness and timing](#category-3-appropriateness-and-timing)
  - [Category 4: Human-capacity effectiveness](#category-4-human-capacity-effectiveness)
  - [Category 5: Continuity](#category-5-continuity)
  - [Category 6: Control effectiveness](#category-6-control-effectiveness)
  - [A balanced scorecard](#a-balanced-scorecard)
  - [Making the thesis falsifiable](#making-the-thesis-falsifiable)
- [10. The strategic choice: serving customers, serving agents, or both](#10-the-strategic-choice-serving-customers-serving-agents-or-both)
  - [Model 1: Bank as product and capability provider](#model-1-bank-as-product-and-capability-provider)
  - [Model 2: Bank as primary relationship layer](#model-2-bank-as-primary-relationship-layer)
  - [Model 3: Hybrid model](#model-3-hybrid-model)
- [11. A reference architecture for persistent relationship banking](#11-a-reference-architecture-for-persistent-relationship-banking)
  - [Component 1: The conversational interface](#component-1-the-conversational-interface)
  - [Component 2: Relationship state](#component-2-relationship-state)
  - [Component 3: The goal and plan layer](#component-3-the-goal-and-plan-layer)
  - [Component 4: The needs interpretation layer](#component-4-the-needs-interpretation-layer)
  - [Component 5: The relationship orchestrator](#component-5-the-relationship-orchestrator)
  - [Component 6: The capability control layer](#component-6-the-capability-control-layer)
  - [Component 7: The authoritative banking layer](#component-7-the-authoritative-banking-layer)
  - [Component 8: The event architecture](#component-8-the-event-architecture)
  - [Component 9: Human orchestration](#component-9-human-orchestration)
  - [Component 10: Identity, permission and delegated authority](#component-10-identity-permission-and-delegated-authority)
  - [Component 11: The policy and guardrail layer](#component-11-the-policy-and-guardrail-layer)
  - [Component 12: Observability and auditability](#component-12-observability-and-auditability)
  - [Component 13: Model independence and operational resilience](#component-13-model-independence-and-operational-resilience)
- [12. Worked application: a first-home journey as a persistent banking relationship](#12-worked-application-a-first-home-journey-as-a-persistent-banking-relationship)
  - [Stage 1: Discovery](#stage-1-discovery)
  - [Stage 2: Establishing the current position](#stage-2-establishing-the-current-position)
  - [Stage 3: A shortfall and a revised milestone](#stage-3-a-shortfall-and-a-revised-milestone)
  - [Stage 4: Which needs arise, and when](#stage-4-which-needs-arise-and-when)
  - [Stage 5: Waiting intelligently](#stage-5-waiting-intelligently)
  - [Stage 6: Moving to mortgage readiness](#stage-6-moving-to-mortgage-readiness)
  - [Stage 7: Escalation to a human specialist](#stage-7-escalation-to-a-human-specialist)
  - [Stage 8: Approval in Principle](#stage-8-approval-in-principle)
  - [Stage 9: Sale agreed](#stage-9-sale-agreed)
  - [Stage 10: Protection and insurance become timely](#stage-10-protection-and-insurance-become-timely)
  - [Stage 11: Choosing between rate options](#stage-11-choosing-between-rate-options)
  - [Stage 12: Completion of the mortgage](#stage-12-completion-of-the-mortgage)
  - [Stage 13: Closing the goal, and what follows](#stage-13-closing-the-goal-and-what-follows)
  - [Comparing the three service models](#comparing-the-three-service-models)
  - [Designing a bounded pilot](#designing-a-bounded-pilot)
- [13. Discussion: what the evidence supports, and what remains uncertain](#13-discussion-what-the-evidence-supports-and-what-remains-uncertain)
- [14. Conclusion: the return of relationship banking](#14-conclusion-the-return-of-relationship-banking)

## Abstract

Retail banking has spent several decades optimising for digital self-service. This transition has delivered substantial gains in convenience, availability and cost efficiency, but it has also shifted more responsibility onto customers to identify their own needs, navigate product structures and coordinate activity across fragmented journeys. At the same time, the highest levels of continuity and contextual service have remained concentrated in relationship-led segments where the economics justify sustained human attention.

This paper examines whether recent advances in generative and agentic artificial intelligence materially alter that constraint. It considers whether functions historically associated with relationship management — including context retention, interpretation of customer objectives, coordination across products and processes, administrative follow-through and timely re-engagement — can now be separated from the human relationship manager and delivered at materially lower marginal cost, while preserving human judgement where it remains necessary.

The paper argues that the relevant technological development is not conversational fluency in isolation, but the emergence of AI systems capable of interpreting unstructured intent, maintaining persistent external state, invoking bounded tools and coordinating activity across multiple stages of a process. In a banking context, these capabilities make it possible to envisage a persistent relationship layer in which customer goals, rather than individual products, provide the organising structure for continuity. Deterministic systems remain authoritative for calculations, eligibility, transactional state and regulated decisions, while human employees retain responsibility for judgement, advice, exceptions, vulnerability and accountability.

The analysis further considers the strategic implications of third-party AI agents. As external agents become increasingly capable of interpreting financial intent, comparing providers and potentially acting on behalf of customers, traditional banks face a choice which may otherwise be made implicitly: whether to remain primarily providers of regulated products and execution capabilities, or to retain a direct role in understanding and progressing customer financial intent. These positions are not mutually exclusive, but they imply materially different forms of relationship ownership.

The paper concludes that the evidence does not support unrestricted autonomous banking, nor does it establish that customers will universally prefer persistent AI-mediated relationships. It does, however, suggest that the historical trade-off between digital scale and relationship continuity may be weakening. For incumbent retail banks, the appropriate response is therefore not wholesale transformation, but controlled experimentation: testing whether persistent, governed AI can reduce customer effort, improve continuity, better coordinate human and digital capability, and make elements of relationship banking economically viable at mass-market scale.

## 1. Introduction

Retail banking has undergone a substantial change in its distribution model over the past two decades. Activities which previously required interaction with a branch or member of staff have progressively moved to online and mobile channels, while the range of services capable of being completed without human intervention has continued to expand. In Ireland, this transition is now sufficiently mature that digital banking is better understood as the normal means of accessing everyday financial services rather than as an alternative channel. The Central Statistics Office reported that 94 per cent of internet users used some form of internet or mobile banking in 2025, up from 87 per cent in 2024. The measure is broader than the use of conventional bank applications, as it also includes services such as Revolut, PayPal and Apple Pay, but it nevertheless indicates the extent to which digitally mediated financial activity has become embedded in everyday behaviour. Notably, more than seven in ten internet users aged 75 years and over reported using internet banking in the same survey.[^1]

The development has produced clear benefits for customers and financial institutions. Digital channels have reduced the time and cost associated with routine servicing, made financial services available outside branch opening hours, and enabled customers to perform many common transactions without intermediary assistance. They have also lowered some of the barriers to entry for new providers. The European Central Bank identified approximately 60 digital-only banks operating in the euro area at the end of 2024, with their share of total banking assets increasing from 3.1 per cent in 2019 to 3.9 per cent in 2024. While that remains a relatively small proportion of euro-area banking assets, it is evidence that digital distribution has become not merely a servicing channel but a basis on which banking business models can themselves be constructed.[^2]

This transformation has not, however, altered every aspect of the relationship between a retail bank and its customers to the same degree. Much of digital banking has been concerned with making an existing banking activity available through a more efficient interface. An account can be viewed online; a transfer can be instructed through an application; a credit product can be applied for through a web form; documentation can be uploaded rather than posted or presented in a branch. These are important improvements, but the underlying service model generally remains recognisable. The customer identifies the product or service required and then navigates to the corresponding process within the institution.

That model is particularly effective where customer intent is already well formed. A customer who wishes to transfer money, replace a card, make a repayment or view a balance can generally express the required action directly. There is relatively little ambiguity between the customer's objective and the banking process needed to achieve it. The model is less complete where the customer arrives with a circumstance or objective rather than a defined product requirement. Buying a first home, preparing for the birth of a child, combining finances after marriage, responding to a material change in income or preparing for retirement can each create a number of connected financial considerations. The customer experiences these as a single change in circumstance; the bank may encounter them through several different products, processes and organisational units.

This distinction matters because the architecture of digital banking has largely been organised around the products and processes of the institution rather than around the persistence of a customer's objective. A mortgage, current account, savings product, protection policy and personal loan may each have its own application journey and its own operational state. The customer may be required to navigate each separately, notwithstanding that several may arise from the same underlying objective. Digitalisation has therefore been highly successful in reducing the friction involved in individual banking transactions without necessarily creating an equivalent digital substitute for the continuity historically provided through a human banking relationship.

It would be too strong to suggest that this continuity has disappeared entirely, or that the branch-based model which preceded digital banking consistently provided it. The quality and depth of customer relationships have always varied significantly by institution, channel and customer segment. Nor should the cost and inconvenience associated with many branch-based processes be romanticised. The narrower proposition considered in this paper is that some functions traditionally associated with relationship management — retaining context, understanding an objective across more than one interaction, coordinating activity across products, identifying when further action becomes useful and avoiding unnecessary repetition — have proved more difficult to reproduce through conventional digital self-service.

This is partly an economic problem. Meaningful relationship management is labour-intensive. A member of staff can serve only a finite number of customers while maintaining sufficiently detailed knowledge of their objectives and circumstances. Consequently, the highest levels of continuity and proactive service have generally been easier to justify economically where customer relationships are of sufficiently high value. Retail banking at scale has instead relied increasingly on standardised journeys, centralised servicing and customer self-service. This trade-off is rational: the economics of providing a dedicated or quasi-dedicated relationship manager to a mass retail customer base have historically been unattractive.

Developments in artificial intelligence raise the question of whether that constraint remains as fixed as it previously appeared. The significance of recent generative and agentic systems is not limited to their ability to produce natural-language responses. They can interpret unstructured customer language, extract information into structured representations, maintain context across interactions, decompose objectives into component tasks, interact with software tools and respond to changes in external state. In an April 2025 speech on AI, fintechs and banks, the Bank for International Settlements observed that generative AI systems can break complex tasks into component parts, distribute those tasks between agents and assist customers in making informed decisions. That description points towards an application of AI which is broader than the automation of customer-service responses.[^3]

The use of AI within banking is already substantial, although its maturity varies considerably by use case. ECB Banking Supervision reported in 2026 that more than 85 per cent of large banks under European supervision were already using AI in some form, with adoption extending beyond traditional areas such as fraud detection and credit risk into legal analysis, operational activity, customer support and relationship management. Separate ECB analysis reported that close to 90 per cent of significant euro-area banks were using AI technologies in 2025; around 40 per cent were using AI in chatbots. These figures should not be interpreted as evidence that agentic relationship banking has already been achieved. They do, however, demonstrate that AI is moving from experimental activity towards the operating fabric of banking institutions.[^4]

The regulatory environment reflects the same transition. The Central Bank of Ireland reported that one third of firms engaging with its Innovation Hub during 2025 were using AI as an enabling technology. Its 2026 Regulatory and Supervisory Outlook also identifies AI as an area of increasing supervisory significance, particularly where systems influence access to financial services or make decisions relating to creditworthiness, life insurance or health insurance. The relevant implication is not that customer-facing AI is prohibited or inherently high risk, but that the scope and governance of an AI system matter. A system which communicates with a customer, one which assists the customer in progressing an established banking process, and one which itself determines creditworthiness are materially different propositions and should not be treated as a single category of technology.[^5]

The development of general-purpose AI agents introduces a further strategic consideration for retail banks. Historically, the institution which held a customer's account was also usually the principal digital interface through which that customer interacted with the account and considered the products offered by that institution. Agentic systems create the possibility that these functions become partially separated. A customer may increasingly be able to describe a financial objective to an external agent, allow that agent to evaluate alternatives, and interact with financial institutions only when an underlying product, permission or regulated execution capability is required.

This possibility has already been recognised in regulatory and industry analysis. In its 2024 work on the financial-stability implications of AI, the ECB noted that customers themselves could use third-party AI advisers to identify cheaper products across different financial providers. The ECB observed that greater transparency of this kind could improve efficiency for customers while also reducing margins for banks. The importance of the observation extends beyond price comparison. Once an external system becomes the place in which the customer first expresses the objective, retains previous context and evaluates what should happen next, the bank may continue to provide the product while another party increasingly mediates the relationship around it.[^6]

Evidence on the likely pace and scale of such a shift remains preliminary. Industry survey evidence nevertheless suggests that it is sufficiently plausible to warrant strategic consideration. McKinsey's 2025 Global Banking Annual Review survey, covering approximately 30,000 respondents, reported that 23 per cent were already using generative AI for financial tasks at least monthly. Among respondents, 62 per cent identified their primary bank as the institution they would most trust to provide generative-AI financial services, compared with 19 per cent who identified a major technology company. At the same time, 57 per cent stated that they would consider using a third-party generative-AI financial agent if their bank did not provide such a service. These are survey responses rather than observed long-term customer behaviour and should therefore be treated as indicative rather than predictive. They nonetheless illustrate an important tension: incumbent banks may possess a significant trust advantage, while that advantage does not necessarily guarantee ownership of the future customer interface.[^7]

The strategic choice facing traditional banks is consequently more nuanced than whether or not to adopt artificial intelligence. Banks are likely to interact with both customers and external agents in the future, just as they currently interact through a mixture of proprietary and third-party channels. The more consequential question is the role the bank intends to occupy within that environment. At one end of the spectrum, the bank can remain primarily a provider of regulated products, balance-sheet capacity and execution services which may increasingly be discovered and accessed through interfaces controlled elsewhere. At the other, it can seek to extend its existing customer relationship into an intelligent, persistent service layer through which customers themselves continue to express their objectives and coordinate financial activity. Intermediate models are also possible, including models in which a bank maintains its own relationship interface while making products and services accessible to authorised third-party agents.

In practice, this choice may not be made through a single explicit strategic decision. It may emerge incrementally. If investment remains focused on improving individual product journeys while general-purpose agents become increasingly capable of understanding customer circumstances across institutions, the point at which customer intent is first expressed may gradually move outside the bank. The institution may retain the account, product and regulatory obligations while becoming less central to the customer's process of deciding what should happen. Conversely, banks possess characteristics which may make them unusually well placed to provide the relationship layer themselves: authenticated customer identity, access to existing financial information and product state, established execution capabilities, regulatory infrastructure and a pre-existing position of trust. The emergence of third-party agents therefore represents both a potential source of disintermediation and an opportunity for incumbent banks to strengthen the role they play in customers' financial decision-making.

The distinction between product ownership and relationship ownership is useful in this context. Product ownership concerns the provision and servicing of the underlying financial instrument. Relationship ownership, as the term is used in this paper, concerns the continuing understanding of what the customer is attempting to achieve, the retention of relevant context and the coordination of actions over time. The two have traditionally been closely connected. Agentic interfaces create the possibility that they need not remain so.

This paper examines whether contemporary AI capabilities make it possible to reproduce, for a mass retail customer base, some of the functions historically associated with relationship banking without reproducing its historical cost model. It does not assume that AI can or should replace human judgement, nor that every financial interaction benefits from an ongoing relationship. Rather, it asks whether persistent, governed AI systems can add a service layer between conventional digital self-service and human relationship management: one capable of understanding customer objectives, maintaining structured context, coordinating existing banking capabilities and returning to the customer when further action becomes relevant.

The principal research question is therefore:

> To what extent can contemporary artificial intelligence enable retail banks to provide persistent, relationship-based service at digital scale, and what are the strategic implications if customer intent is increasingly mediated by third-party agents?

The paper approaches this question from both a customer-service and an operating-model perspective. It considers the evolution from relationship-based banking towards digital self-service; the functions which may have been lost or weakened in that transition; the capabilities and limitations of contemporary AI; the possibility of organising banking activity around persistent customer goals rather than individual product journeys; and the governance, regulatory and human-service considerations which follow. A later worked example is used to test what such a model might look like in practice. The intention is not to argue that a particular product implementation is inevitable, but to examine whether the underlying service model has become technically and economically plausible, and what that might mean for a traditional retail bank.

## 2. From relationship banking to digital self-service

The transition from branch-led banking to digital self-service is often described principally as a change in distribution. That description is accurate, but incomplete. Digital channels did not simply provide customers with a new way of accessing an otherwise unchanged service model. Over time, they also altered the division of work between the customer and the bank. Activities previously performed, interpreted or coordinated by an employee increasingly became activities which the customer initiated and completed independently. This was an important source of efficiency and convenience, and in most routine circumstances represented a substantial improvement in customer experience. It also changed some of the mechanisms through which banks historically accumulated and applied knowledge about their customers.

The term relationship banking requires some care in this context. Within the academic literature it has most commonly been studied in relation to lending, particularly lending to businesses for which publicly observable financial information may be incomplete. Boot's influential definition describes relationship banking as the provision of financial services by an intermediary which invests in obtaining customer-specific, often proprietary, information and evaluates the value of that investment through repeated interactions with the same customer over time or across products. The emphasis is therefore not primarily on interpersonal familiarity. It is on the accumulation and reuse of information through a continuing relationship.[^8]

Much of the empirical literature developed around commercial and small-business lending rather than mass-market consumer banking. It would therefore be inappropriate simply to transfer every conclusion from that literature to the retail customer relationship. The underlying mechanism is nevertheless relevant. A relationship allows information created in one interaction to influence a later one. It allows an institution to distinguish a customer whom it has observed over time from an otherwise equivalent customer about whom it knows only what is presented in the current transaction. The relationship acquires economic value because information can be accumulated, interpreted and reused rather than reconstructed at each point of contact.

There is evidence that this mechanism also operates in retail banking. Agarwal, Chomsisengphet, Liu, Song and Souleles (2018), using approximately 100,000 credit-card accounts linked to other relationships held by the same customers, found that information from those wider banking relationships provided predictive value beyond the information available from the credit-card account itself. Customers with broader relationships exhibited lower probabilities of default and attrition and higher card utilisation. Importantly, changes in behaviour across other accounts also contained information relevant to the performance of the credit relationship. Earlier work using more than one million loans from German banks similarly found that prior transaction-account relationships provided information associated with lower subsequent loan default.[^9]

Those findings concern credit risk rather than customer service, but they illustrate a broader characteristic of banking relationships: information created through repeated activity can have value outside the activity in which it was originally created. A current account is not merely a current account if the institution can legitimately and appropriately use the relationship surrounding it to understand a later lending interaction. The same principle can extend beyond risk assessment. Information about a customer's household, objectives, preferences, existing products or previous decisions can reduce the amount that must be rediscovered when the customer returns with a related requirement.

Historically, part of this continuity could also reside with people. A branch employee, adviser or relationship manager could remember that a customer was preparing to purchase a property, had recently changed employment or had previously discussed a particular concern. The information available to that employee was neither complete nor necessarily recorded systematically. Continuity could be lost when an employee changed role, when the customer attended another branch or when a conversation was not documented. There is consequently little basis for treating historical branch banking as an idealised period of comprehensive customer understanding. Nevertheless, the human interaction provided a mechanism through which context that did not fit neatly within a product record could sometimes persist between transactions.

This distinction is important because the development of digital banking did not occur principally as an attempt to digitise that mechanism. Its early economic value lay elsewhere. Automated teller machines, telephone banking, internet banking and subsequently mobile applications progressively allowed customers to execute transactions without requiring the simultaneous involvement of bank staff. More recently, digital onboarding, electronic identification, digital document submission and straight-through processing have extended self-service much further into product acquisition and servicing. The objective has generally been to make an existing banking process faster, more available and less dependent on physical distribution.

The scale of this transition is evident in the physical structure of European banking. ECB data show that the number of bank offices in the euro area fell from approximately 186,000 in 2008 to around 106,000 in 2023, while the number of banking employees also declined over the same period. The ECB identifies technological change and the increasing use of online and mobile banking as an important factor in this reduction. The trend has continued: the number of bank offices across the European Union declined by a further 3.4 per cent during 2024 and 2.6 per cent during 2025.[^10]

Ireland has experienced the same broad migration in customer behaviour, albeit within the particular structure of its own banking market. The Department of Finance's 2022 Retail Banking Review described increased remote access through applications and online banking as a structural trend expected to continue, alongside reduced use of cash and pressure on traditional branch and ATM networks. The nationally representative consumer survey carried out for that review found that digital channels were already the main method of contact with their principal bank for 70 per cent of respondents, compared with 23 per cent for whom the branch remained their main form of contact.[^11]

The shift has produced significant benefits and should not be interpreted principally as a loss. A customer who previously had to travel to a branch during business hours can now perform many tasks at any time and from almost any location. Routine servicing no longer consumes staff capacity in the same way. Remote account opening can reduce both customer effort and provider cost. The European Banking Authority has specifically noted that digitalisation has made it possible in many jurisdictions to open payment accounts remotely through faster and less expensive procedures.[^12]

For many activities, removing the human intermediary is precisely the desired outcome. A customer checking whether a salary has arrived does not require a relationship manager. Nor does a customer freezing a lost card, changing a standing order or transferring money between accounts necessarily benefit from a conversation. Digital banking is powerful because it permits these interactions to be reduced to their essential action.

The difficulty arises when the same interaction model is applied to circumstances in which the required action has not yet been determined.

Conventional self-service generally assumes that the customer can identify the banking task before entering the journey. The customer selects mortgages, loans, savings, cards or insurance and is then presented with the corresponding information or application process. Navigation, search and increasingly conversational support can make that process easier, but the organising unit remains predominantly the banking product or servicing task.

This is not inherently a design failure. Products are the units through which financial institutions contract, price, regulate, account for and manage risk. A mortgage application must ultimately become a mortgage application. A payment instruction must ultimately become a payment instruction. Digital systems therefore need structured product and process boundaries.

The problem is that the customer's starting point is not always similarly structured.

A household considering its first home may simultaneously be building a deposit, assessing affordability, deciding whether to combine finances, considering the effect of childcare costs, understanding mortgage eligibility and deciding how much liquidity to retain after purchase. A customer approaching retirement may be considering debt repayment, cash reserves, pension income, investment risk and future expenditure as parts of one decision. The product architecture is necessary for execution, but it may be a poor representation of the problem through which the customer originally arrived.

In a human relationship, the translation from circumstance to product can be performed by the banker. In a self-service model, more of that translation is performed by the customer.

This represents a subtle but important transfer of responsibility. The bank becomes highly efficient at servicing an identified need, while the customer increasingly assumes responsibility for identifying the need correctly, determining which part of the institution is relevant and understanding the sequence in which several related actions should occur.

That model works particularly well for financially capable customers dealing with familiar activities. It is less certain that it works equally well for customers confronting complex, unfamiliar or infrequent financial decisions. Buying a home, dealing with bereavement, restructuring household finances after separation or making decisions approaching retirement are not repeated often enough for most consumers to develop the same procedural familiarity that they have with everyday payments.

Research into digital financial services has consequently identified a tension between convenience and support. The OECD's 2026 Consumer Finance Risk Monitor notes that digitalisation can improve accessibility while also weakening support where consumers have low digital or financial capability, particularly when branch closures reduce the availability of alternative channels. It separately identifies the possibility that increasingly digital interfaces may create opacity or make it more difficult for consumers to question decisions or obtain assistance. The EBA has similarly reported concerns from national authorities that branch and ATM closures can hinder access for particular groups, including older and rural consumers.[^13]

These findings are often discussed in the context of financial inclusion, and rightly so. They also expose a more general design question. Human support has historically performed at least two different functions in retail banking. One is execution: an employee performs a task which the customer could, in principle, perform themselves. Digitalisation can often remove this requirement entirely. The other is interpretation: the employee helps determine what the task should be. These functions should not be assumed to disappear at the same rate.

Indeed, the development of digital banking may have increased the distinction between them. Execution has become progressively easier. Interpretation remains comparatively difficult to encode where the customer's circumstances span several products or unfold over time.

The result is not that banks know less about customers in a literal data sense. The opposite is likely to be true. Contemporary banks hold substantially more structured information about transactions, balances, product usage, applications, interactions and behavioural patterns than a branch employee could historically have retained personally. Advances in analytics have also made that information economically useful at scale. The academic evidence on retail relationships demonstrates that cross-product data can contain information relevant to decisions elsewhere in the bank.[^9]

The more precise limitation is that data about a customer and an understanding of the customer's current objective are not necessarily the same thing.

A bank may be able to observe income, expenditure, savings balances, mortgage repayments and card activity without knowing that the customer intends to move house next year. It may know that deposits are increasing without knowing what the customer believes the money is for. It may know that two customers share an address without knowing that they now want to organise their finances jointly. Transactional data can support inference, but inference is not equivalent to an objective explicitly expressed and agreed with the customer.

This distinction becomes particularly important where action has a timing dimension. A potentially relevant product is not necessarily relevant now. A customer saving for a mortgage deposit may eventually require home insurance, but presenting home insurance while the customer remains months from purchasing a property would add little value. The same customer might mention future renovation borrowing during an early mortgage discussion, yet taking on new unsecured debt before mortgage assessment may conflict with the more immediate objective. Understanding a customer therefore requires more than identifying potential needs. It requires relating those needs to an objective, establishing dependencies between them and determining when — or whether — action is appropriate.

Traditional customer-relationship management systems only partially solve this problem. They are capable of recording contact history, opportunities, preferences and customer attributes, and they can give employees a consolidated view of the relationship. Their primary user has generally been the institution or its employees. They do not by themselves create an ongoing service which interprets a customer's changing circumstances, agrees a plan with the customer and maintains that plan between interactions. Nor does the existence of a unified customer data platform necessarily mean that the customer experiences the bank as a unified service.

This is one reason why the move from branch to digital should not be described simply as replacing a relationship with an application. The reality is more complex. Digital banking preserved some elements of the relationship, removed others, and created entirely new ones. It improved the institution's ability to observe customer behaviour at scale while reducing the requirement for interpersonal contact in routine servicing. It made products easier to access while requiring customers to perform more of the navigation between them. It created significant volumes of hard, structured information while reducing some opportunities for unstructured context to be accumulated through conversation.

It also changed customer expectations. Once everyday banking can be completed immediately, delays and repetition in less frequent journeys become more visible. A customer who can make an international payment from a mobile telephone in seconds may reasonably find it difficult to understand why information already supplied to one part of the same institution must be supplied again elsewhere. The issue is not simply convenience. Repetition can signal to the customer that the institution does not behave as a single relationship even where the customer experiences their dealings with it as one.

There are legitimate reasons why information cannot always be reused. Data collected for one purpose may not lawfully or appropriately be applied to another. Information may have become stale. A declaration may need to be made again because its accuracy matters at a specific point in an application. Joint customers may have different permissions. Sensitive information may require particularly restrictive treatment. The objective should therefore not be to create an institution in which every piece of information is automatically available for every future purpose. The more defensible principle is narrower: where information can legitimately be reused, the customer should not be required to recreate context simply because the institution has divided the relevant activities between different systems or products.

The value historically associated with a banking relationship can consequently be decomposed into functions rather than channels. It includes the ability to accumulate relevant information across interactions, retain continuity between those interactions, understand how separate financial needs relate to a broader objective and coordinate action across time. None of those functions intrinsically requires a branch. Equally, none is automatically created by placing a product journey on a mobile telephone.

This distinction also avoids a false choice between human and digital banking. The question is not whether banks should reverse digitalisation or restore routine transactions to staffed channels. The efficiency gains from self-service are real, and customer behaviour demonstrates a clear preference for digital access for many everyday activities. Rather, the relevant question is whether the part of the traditional relationship that involved context and coordination can be separated from the part that involved manual execution.

There is evidence that customers continue to place particular value on human involvement when the financial decision itself is consequential. Northey et al. (2022), in two experimental studies of retail investment advice, found that participants exhibited greater belief in advice supplied by a human adviser than by a robo-adviser where customer involvement was high. Perceived customer focus and belief in the information helped explain the resulting effect on investment intention. The study concerned investment advice rather than general banking and predates the current generation of large language models, so it should not be treated as evidence that customers will necessarily prefer human advice to contemporary AI systems. It does, however, provide a useful caution: efficiency and technological capability do not remove the significance of trust, perceived understanding and human judgement in higher-involvement financial decisions.[^14]

The likely future model should therefore not be assumed to involve replacing one channel with another. Branches did not disappear when internet banking emerged; telephone servicing did not disappear when mobile applications became widespread. Instead, the role of each channel changed as activities migrated towards the mechanism best suited to them. A similar distinction may now be required between transactions which are efficiently self-served, circumstances which can be interpreted and coordinated through intelligent digital systems, and decisions which require or benefit materially from human judgement.

This provides the foundation for the question considered in the remainder of this paper. Digital banking has largely solved the problem of making an identified banking action available at scale. The unresolved issue is whether digital banking can also support a persistent understanding of why the customer is taking the action and how it relates to what they may need to do next.

The progression is important. The historical branch model allowed context to exist, but did so inconsistently and at relatively high marginal cost. Conventional digital banking reduced that cost substantially by transferring routine execution to the customer, but generally organised the resulting experience around individual transactions and products. Contemporary banking systems possess far more data than their predecessors, yet the customer's explicitly stated objective can remain transient — understood during one interaction without necessarily becoming a durable organising feature of the relationship.

If that objective could instead persist in a governed and usable form, the economics and design of digital banking could change again.

The next question is therefore not whether digital self-service has succeeded. On most relevant measures, it plainly has. The question is what remains costly or difficult after self-service has done everything it is naturally good at.

That requires examining the economics of relationship management itself: what a human relationship manager actually does, which parts of that work derive value from human judgement, which derive value principally from information and continuity, and why the service has historically been economically concentrated among higher-value customer relationships.

That is the subject of the next section.

## 3. The economics of relationship management

The preceding discussion suggests that some of the value historically associated with a banking relationship can be understood as an information and coordination problem rather than simply as a preference for interpersonal service. This distinction is important because it shifts the economic question. If relationship banking were valuable principally because customers preferred to speak to another person, then its extension to a mass retail population would remain fundamentally constrained by the availability and cost of suitably trained staff. If, however, a substantial part of its value arises from the accumulation of information, continuity between interactions, interpretation of circumstances and coordination of actions over time, it becomes possible to ask which of those functions genuinely require a human relationship manager and which have historically been human because no other practical mechanism existed.

### Soft information and the limits of scale

The academic literature on relationship banking has generally approached this problem through the economics of information. Boot (2000) describes relationship banking as involving investment by the intermediary in obtaining customer-specific information, often information which is proprietary and accumulated through multiple interactions over time or across products. The bank incurs a cost in producing that information because it expects the relationship to have sufficient duration and economic value for the investment to be recovered. Petersen and Rajan (1994) found that stronger relationships between small firms and financial institutions were associated particularly with greater availability of credit, while Berger and Udell (1995) found that longer banking relationships were associated with lower interest rates and reduced collateral requirements. These studies relate to small-business lending rather than consumer banking, but their relevance to the present argument lies in the mechanism: information collected through an ongoing relationship can improve later decisions because the institution does not begin each transaction with no knowledge of the customer.[^8]

The information involved in such relationships is not necessarily equivalent to the structured data ordinarily held within a banking system. Liberti and Petersen (2019) distinguish between hard information, which is quantitative, readily stored and capable of being transmitted impersonally, and soft information, which can depend more heavily on the circumstances in which it was collected and may be difficult to communicate without loss. This distinction is useful beyond lending. A salary payment, account balance or missed repayment is relatively hard information. A customer's explanation that they expect childcare costs to fall materially in eighteen months, that they are prepared to delay a house purchase rather than reduce their emergency savings, or that they intend to support an elderly parent may be highly relevant to a financial conversation while being considerably less natural to represent within conventional product systems.[^15]

The difficulty of processing soft information at scale is well established. Stein's (2002) model of information production within organisations argues that decentralised structures have advantages where decisions depend heavily on information that is difficult to verify or transmit through a hierarchy, whereas larger hierarchical organisations have advantages where information can be hardened and communicated without substantial loss. Berger, Miller, Petersen, Rajan and Stein (2005) subsequently found empirical evidence consistent with this proposition in banking: smaller banks were more willing to lend to informationally difficult small businesses, interacted more personally with borrowers and maintained longer and more exclusive relationships. The findings should again not be transferred mechanically from small-business credit into retail customer service. They nevertheless identify an organisational problem which is directly relevant to a large universal bank. Information that is easy to standardise travels well through systems and organisations. Information whose value depends upon context is more difficult to scale.[^16]

### The capacity constraint

Historically, a relationship manager has acted as one solution to this problem. The individual provides a local point at which information can be accumulated and interpreted. Rather than attempting to encode every circumstance into a central system, the organisation permits the relationship manager to retain some context and apply judgement when the customer returns. In more sophisticated models, that individual also coordinates access to specialist capabilities elsewhere in the organisation. The relationship manager therefore performs several economically distinct activities at once: information collection, interpretation, navigation, coordination and, in some circumstances, advice.

These activities consume time.

The capacity constraint is most apparent in wealth management and private banking, where the relationship model remains explicit. Contemporary public propositions describe dedicated relationship management as a differentiated service rather than as a universal feature of banking. Lloyds, for example, describes its private banking proposition as providing a dedicated relationship manager who proactively manages day-to-day needs and introduces specialist partners where appropriate. Eligibility for that service is tied to a minimum of £250,000 in savings or investments or a mortgage of at least £750,000; its higher-tier Mayfair service requires £2 million in savings or investments or annual income of at least £500,000. HSBC's UK private banking proposition currently requires savings or investments of at least £1.5 million. The precise thresholds differ by institution and business model, but their existence is economically informative. High-intensity relationship service is ordinarily concentrated where the institution expects the financial value and complexity of the relationship to justify the cost of providing it.[^17]

This should not be interpreted to mean that customers below such thresholds have no relationship with their bank or receive no human support. Retail banks provide advisers, mortgage specialists, branch staff, contact-centre staff and other forms of assistance across a much broader customer base. The distinction is one of continuity and capacity. A customer may have access to a mortgage adviser for the duration of a mortgage process without having a persistent individual responsible for understanding their wider financial objectives over a period of years. A service capable of maintaining that depth of context for every customer would require a considerably larger labour input than one organised around discrete servicing and product events.

Available evidence from financial-advice markets illustrates the nature of this constraint. Natixis Investment Managers' 2024 global survey of financial advisers reported that respondents spent 23 per cent of their time meeting clients and a further 20 per cent managing existing clients, while administrative tasks and compliance reporting accounted for 18 per cent. Investment management, research, prospecting, marketing and other activities consumed the remainder. In a separate analysis of the US wealth-management market, McKinsey estimates that changes to adviser operating models, including better use of teams, process improvement and generative AI, could increase overall adviser capacity by 10 to 20 per cent over the coming decade. These estimates are industry research rather than controlled academic findings, and wealth advice differs materially from ordinary retail banking. They are nevertheless useful in demonstrating that the cost of a human relationship is not limited to the time spent speaking with the customer. Significant capacity is consumed preparing for conversations, documenting them, meeting regulatory requirements, coordinating work and following through on agreed actions.[^18]

This is particularly important when considering what it would mean to provide "a personal banker for everyone". The phrase can imply that the principal cost is the conversation itself. In practice, the conversation may represent only one part of the service. A meaningful banking relationship requires the institution to know what has previously been discussed, retrieve relevant customer information, identify what has changed, determine which specialist or process is relevant, document the interaction, initiate or progress the required action and ensure that unresolved matters are returned to later. Replicating the service model by simply increasing the number of people available to speak to customers would therefore reproduce much of the existing cost structure.

It would also reproduce some of its inconsistency. Human memory is useful but imperfect. Relationship managers differ in experience and judgement. Information may remain in personal notes or be recorded differently between employees. A handover may result in loss of context. A customer may receive a different interpretation depending on the member of staff encountered. Regulatory and conduct frameworks exist in part because discretion, while valuable, also produces risk. The economic problem is therefore not simply that high-quality human service is expensive. It is that a service model built principally around individual human cognition can be difficult to standardise while preserving the qualities which make the relationship valuable.

The benefits of relationship banking should also not be assumed to accrue entirely to the customer. The same informational advantage that permits a bank to make a better decision can create dependence upon the incumbent institution. Boot's review of the relationship-banking literature identifies two principal theoretical costs: a soft-budget constraint, where proximity between lender and borrower can reduce the lender's willingness to enforce discipline, and a hold-up problem, where proprietary information accumulated by the bank gives it an advantage over competitors and may permit it to charge non-competitive terms. Subsequent literature similarly identifies the possibility that customers become locked into an institution because alternative providers cannot observe the private information accumulated through the existing relationship.[^8]

These concerns are particularly relevant to any attempt to recreate relationship banking through technology. A persistent digital relationship which reduces customer effort could simultaneously increase switching costs if the customer's accumulated context cannot travel with them. A system which anticipates customer needs could be experienced as useful or intrusive depending upon how the information was collected, how transparently it is used and whether the customer can control the resulting interaction. Greater continuity is not automatically equivalent to greater customer welfare. The design of the relationship, including data governance, permission and customer agency, therefore matters as much as the technical ability to maintain context.

### Why mass retail banking favoured standardisation

The relationship model can consequently be considered as an exchange. The institution incurs the cost of understanding the customer more deeply than a single transaction requires. In return, it may benefit from greater retention, a broader relationship, better risk information and increased opportunity to meet additional needs. The customer may benefit from reduced repetition, more appropriate decisions, greater flexibility and assistance navigating complex circumstances. The relationship is sustainable where the combined value created is sufficient to compensate for the cost of producing and maintaining it.

For mass retail banking, that calculation has historically favoured standardisation.

Standardised product processes replace repeated human interpretation with predefined eligibility rules, forms, workflows and controls. Hard information can be collected once in a structured format and processed consistently. A customer can be routed to the appropriate operation without a member of staff first having to understand the entirety of their financial position. Economies of scale are substantial because the marginal cost of serving an additional customer through a digital process is far lower than the marginal cost of assigning additional human capacity.

The consequence is that conventional digital banking has largely scaled the execution of banking rather than the relationship-management process surrounding it.

### The seven functions of relationship management

This difference can be made more precise by separating the work of a relationship manager into several functional components. The first is discovery: establishing the customer's circumstances, objectives and constraints. The second is context retention: remembering relevant information from previous interactions and recognising when that information has changed. The third is interpretation: determining the significance of the information, including situations in which two apparent objectives may conflict. The fourth is coordination: identifying which products, specialists, processes or actions are required and in what order.

The fifth is administration: collecting documents, completing records, updating systems, scheduling follow-up and ensuring that agreed actions occur.

The sixth is judgement and accountability: making or explaining decisions where professional judgement, regulated advice, discretion, empathy or responsibility is materially important.

The seventh is trust: the customer's belief that the person or institution understands their interests sufficiently for the customer to act upon what is being said.

These functions are often bundled together because historically they have been performed by the same person. Economically, however, they are not identical.

Administration is relatively process-oriented. Context retention is principally an information problem. Coordination is partly an information and workflow problem. Discovery requires interaction but not necessarily professional judgement at every stage. Interpretation exists on a spectrum: some situations can be resolved through deterministic rules, while others require genuine discretion. Trust may arise partly from interpersonal relationships but also from institutional reputation, reliability, transparency and the customer's experience of previous interactions. Judgement and accountability are the areas in which the case for human involvement is strongest, particularly where the consequences of a decision are material or regulatory requirements prescribe the involvement of an appropriately qualified person.

### Unbundling the functions

This decomposition is important because the historical cost of relationship banking has been based on the cost of the bundle. If one individual must perform all seven functions, service capacity is necessarily scarce. If some functions can be performed reliably by technology while others remain with qualified employees, the economics may change without requiring the institution to conclude that technology should replace the human relationship in its entirety.

Developments in wealth management already provide early evidence of this unbundling. UBS, for example, reports that its STAAT Insights platform supplies more than 5,000 US financial advisers with personalised client intelligence based on internal and external signals. The bank states that almost 90 per cent of adviser teams actively use the platform and that it saves an estimated 1,200 hours of meeting preparation each week. The important feature of this example is not that AI has replaced the adviser. It has reduced the cost of preparing the adviser to exercise the relationship function.[^19]

The same principle appears in research concerning commercial-banking relationship managers. McKinsey reported in 2025 that relationship managers in many commercial banks spent only approximately 25 to 30 per cent of their time in direct client dialogue, with substantial time consumed by documentation, internal coordination and other activities. Its estimate that agentic systems could return ten to twelve hours per week to bankers should be treated as an industry estimate rather than an established productivity result. Nevertheless, it points to the same underlying economic opportunity: technologies which reduce the non-relationship work surrounding a relationship may increase the number of customers to whom meaningful relationship service can economically be provided.[^20]

There is a meaningful difference, however, between increasing the productivity of an existing adviser and extending elements of relationship management directly to customers who do not currently have one. The first preserves the conventional model and uses technology to increase the capacity of the human professional. The second proposes that some of the functions previously performed only through a person might themselves become available as a persistent digital service.

That distinction is central to the argument developed in this paper.

### The marginal cost of continuity

The relevant economic proposition is not that artificial intelligence makes human bankers unnecessary. Nor is it that the service delivered to a private-banking customer can simply be reproduced digitally and offered without cost to an entire retail customer base. High-value relationships often involve complex tax, investment, estate, corporate and family circumstances requiring expertise which sits well outside ordinary retail banking and for which qualified human advice remains appropriate.

The narrower proposition is that the marginal cost of continuity may be capable of falling materially.

Once a system can retain customer context, recognise a previously agreed objective, observe progress against it and coordinate an existing banking process without requiring a person to reconstruct the situation at every interaction, the institution may be able to provide a degree of relationship continuity to customers for whom a dedicated human relationship manager would never have been economically justified.

This is a different economic model from traditional private banking.

It does not allocate a lower-cost human relationship manager to a larger number of customers. It separates the functions of the relationship and attempts to apply human capacity only where human capacity creates the greatest value.

A mortgage specialist, for example, may add considerable value when explaining a material lending decision, considering unusual circumstances or guiding a customer through a difficult part of an application. The same specialist adds relatively little value by asking a customer for information which the institution already legitimately possesses, manually checking whether a document has arrived, restating an application status available elsewhere in the bank, or remembering that the customer intended to revisit a related matter three months later. If those activities can be performed elsewhere in the system, a scarce human resource can be concentrated more heavily on the parts of the interaction which depend upon expertise and judgement.

There is also a distributional implication. Under the conventional model, service intensity generally increases with the expected economic value of the customer relationship. This is rational from the institution's perspective but means that the customers who receive the greatest continuity are frequently those who have the greatest financial resources. If technology materially reduces the cost of providing continuity, the threshold at which that form of service becomes economically viable can fall.

The appropriate comparison is therefore not between a human relationship manager and an AI relationship manager as mutually exclusive substitutes. It is between two operating models.

In the first, relationship management is a labour-intensive bundle. It is consequently rationed, explicitly or implicitly, according to customer value, product complexity or immediate need.

In the second, information retention, routine coordination and administration are provided at digital scale, while human employees remain available where judgement, regulated advice, discretion or emotional complexity warrants their involvement.

Whether contemporary artificial intelligence is sufficiently reliable, governable and capable to support the second model remains an empirical and architectural question. It cannot be established merely from the fact that language models can conduct convincing conversations. The value of the proposed model depends upon considerably more demanding capabilities: persistent state, accurate extraction of customer information, controlled access to bank systems, deterministic execution, appropriate handling of uncertainty, reliable escalation, explainability and governance.

There is therefore a risk in framing the opportunity principally as conversational AI. Conversation may be the most visible element to the customer, but it is not the principal source of the economic change. A more natural conversation can improve usability while leaving the underlying cost structure substantially unchanged if employees must still reconstruct context, coordinate processes manually and intervene in routine administration behind the interface.

The economic opportunity arises only if the system can perform meaningful parts of the relationship-management workload itself.

This leads to the technological question which follows.

Recent developments in artificial intelligence differ from earlier generations of banking automation not merely because the quality of generated language has improved, but because systems are becoming capable of maintaining context, using tools, decomposing tasks and operating across multiple stages of a process. These capabilities are commonly described under the increasingly broad term agentic AI.

The next section therefore examines what contemporary generative and agentic AI systems can actually do, where the boundaries of those capabilities remain, and whether the technology is sufficiently different from earlier chatbot and automation approaches to alter the economics described above.

## 4. From generative AI to agentic systems

The economic argument set out in the previous section depends upon a technological distinction which is easily obscured by the language currently used to describe artificial intelligence. The terms generative AI, large language model, copilot, assistant and agent are often used interchangeably, despite describing materially different system architectures and levels of autonomy. For the purposes of this paper, the distinction matters because a language model capable of producing an articulate response does not by itself solve the problem of continuity, coordination or execution identified in the preceding sections. Those functions require a wider system in which the model is connected to memory, data, rules, tools and external processes.

Large language models have demonstrated a significant improvement in machines' ability to interpret and generate natural language. Their usefulness arises partly from the fact that they can work with information which has not first been reduced to a rigid schema. A customer can describe an objective conversationally, including relevant details, qualifications and uncertainty, and the model can identify relationships within that information which would be difficult to capture through a conventional menu or form. This is particularly relevant to financial services because many customer circumstances are initially expressed in precisely that form: not as complete data structures, but as narratives about what has changed, what the customer is attempting to achieve and what they are concerned about.

That capability should not be confused with factual authority. A large language model generates outputs probabilistically and can produce statements which are fluent, plausible and incorrect. The National Institute of Standards and Technology's Generative AI Profile, published as a companion to its AI Risk Management Framework, treats risks associated with generative systems as requiring specific management beyond conventional software controls. Financial authorities have raised similar concerns. The Bank for International Settlements identifies hallucination, data confidentiality, operational risk and reputational risk among the issues requiring governance as AI is introduced into sensitive institutional processes. These limitations are particularly important in banking, where a convincing but incorrect statement concerning eligibility, a repayment amount, an application status or a regulatory requirement may produce consequences materially different from an incorrect answer in a low-risk informational setting.[^21]

The implication is that the useful unit of analysis is not the language model in isolation but the system constructed around it.

This is the principal difference between conversational generative AI and what is increasingly described as agentic AI. The term does not yet have a single settled technical definition. NIST's work on agent systems describes the prevailing architecture as one in which a general-purpose AI model is embedded within software capable of perceiving information about an environment and taking actions through external tools. Its taxonomy identifies planning, memory and resource management as reasoning capabilities, alongside tools for authentication, software interaction, code execution, APIs, human interaction and communication with other agents. Academic surveys of large-language-model agents similarly identify memory, planning and tool use as recurring architectural components.[^22]

Agency is therefore better understood as a spectrum than as a binary property.

At one end is a language model which receives a prompt and returns text. It has no durable knowledge of the customer, no ability to query the customer's accounts and no authority to take any action.

A more capable system may retrieve verified information from a bank's knowledge base before answering a question. Retrieval-augmented generation can reduce dependence on information encoded within the model itself by allowing responses to be grounded in controlled sources. The Bank for International Settlements' work on generative AI in central banking notes the increasing use of retrieval techniques to improve reliability by drawing on verified and specialised information.[^23]

A further stage allows the system to call deterministic tools. Rather than calculating a mortgage repayment through probabilistic text generation, for example, the model can identify that a calculation is required and pass validated inputs to an existing calculation service. Rather than inventing an application status, it can query the relevant system of record. Rather than summarising a product from its training data, it can retrieve the current product definition.

The model performs interpretation and orchestration. The underlying banking system remains responsible for authoritative state.

This distinction is fundamental to any credible implementation in financial services.

A customer may ask:

> Can I afford a €500,000 house?

The conversational layer can determine what the question means, identify which information is missing and explain the result in accessible language. It should not, however, be required to invent the bank's lending policy, estimate a regulated affordability outcome from memory or reproduce a calculation which already exists within a controlled banking system.

The appropriate architecture is therefore one in which probabilistic and deterministic components perform different functions.

The probabilistic system is well suited to understanding language, extracting intent, identifying relevant context, deciding which authorised capability should be invoked and translating structured outputs into natural conversation.

The deterministic system is better suited to calculation, eligibility, validation, identity, product rules, application state, payments, declarations and other activities for which an identical set of inputs should ordinarily produce a controlled and reproducible outcome.

This separation does not eliminate model risk. The AI system can still misunderstand the customer's intention, select an inappropriate tool or provide a poor explanation of a correct result. It does, however, substantially change the nature of the risk. Instead of relying upon the model to be the banking system, the model becomes an interface and coordinator operating within boundaries established by the banking system.

The distinction can be expressed schematically:

```text
Customer expression
        ↓
Language understanding
        ↓
Structured context
        ↓
Intent / goal interpretation
        ↓
Permitted tool selection
        ↓
Deterministic banking capability
        ↓
Authoritative result
        ↓
Natural-language explanation
```

Such an architecture is materially different from adding a chatbot to a website.

The importance of tool use is that it allows the conversational system to progress work rather than merely describe how work could be progressed. A conventional chatbot may tell a customer where to locate a mortgage application. An agentic system can, subject to appropriate permission and control, obtain the relevant application requirements, determine which information the customer has already supplied, request only what remains outstanding, populate the existing journey and return the resulting application state to the conversation.

This does not require the banking process itself to become probabilistic.

Indeed, the ability to preserve existing processes may be one of the most practically significant properties of an agentic architecture. Large financial institutions contain substantial investments in product engines, workflow systems, identity controls, underwriting platforms and servicing processes. A relationship layer does not necessarily require those systems to be replaced. It may instead provide a common interpretative and orchestration layer across them.

This is particularly relevant to the economics discussed in Section 3. If every new AI interaction requires the underlying banking estate to be rebuilt, the cost advantage of the model weakens considerably. If, by contrast, an agent can invoke existing capabilities through controlled interfaces, the institution can change the customer interaction model while preserving much of the regulated execution infrastructure beneath it.

The concept of memory requires similar precision.

A conversational model's ability to retain information within an individual exchange should not be equated with a persistent customer record. Research into large-language-model agents treats memory as a distinct system component because long-running interactions require information to be stored, retrieved and managed beyond an individual model context.[^24]

For a bank, this distinction is essential.

If a customer says that they intend to purchase a home next year, the useful outcome is not merely that the model can refer to that statement ten messages later. The institution may need to represent it as a structured and governed object capable of surviving the end of the conversation.

That object might record that:

- the customer has expressed an intention to purchase a first home;
- the intention has been confirmed by the customer rather than inferred only by the model;
- there is an indicative target date;
- particular information was supplied in support of that objective;
- certain actions have been agreed;
- some information should expire or be reconfirmed before reuse;
- the customer has chosen whether the objective should remain active.

The model can help create and interpret this information, but the persistent state itself should exist independently of the model. This allows a useful distinction between conversation memory and relationship state. Conversation memory helps an AI system remain coherent during an interaction. Relationship state represents durable information about the customer's objectives, circumstances, decisions and agreed next steps. The latter is considerably more important to the service model considered in this paper.

It also introduces governance requirements which ordinary conversational memory does not. An institution must be able to determine where information originated, whether it was stated or inferred, when it was last confirmed, why it is being retained and under what circumstances it may be reused. The system should not silently convert every conversational statement into a permanent attribute of the customer.

A statement such as “I might buy a house someday” is not equivalent to a customer establishing an active home-purchase objective.

Nor is an inferred need equivalent to consent to pursue it.

The ability of the technology to retain information therefore creates a requirement for greater, rather than lesser, discipline concerning the distinction between observation, inference and customer-approved state.

Planning represents the next relevant capability.

Research into LLM-based agents identifies task decomposition as one of the core mechanisms by which models can operate on more complex objectives. A system can take a relatively high-level instruction, divide it into component activities, determine dependencies between them and select subsequent actions according to the results returned from earlier stages. The academic literature remains an active research field and planning performance varies substantially by task, model and architecture; it would be premature to assume that general-purpose agents can reliably manage arbitrary long-horizon financial activity without supervision. Nevertheless, task decomposition is sufficiently established to support bounded workflows in which the available actions and state transitions are controlled.[^25]

The concept of boundedness is particularly important in banking.

Popular descriptions of agentic AI often emphasise autonomy: a system receives an objective and independently determines how to achieve it. For regulated financial services, maximum autonomy is unlikely to be an appropriate design objective.

A more useful concept is bounded agency.

The system can decide how to progress an interaction within a defined set of permitted actions, while the institution determines which actions exist, what data they can access, which conditions must be satisfied and when customer or human approval is required.

For example, an AI relationship layer may be permitted to:

- retrieve a customer's existing application status;
- determine which information required by an application remains missing;
- ask the customer for that information;
- populate permitted fields;
- schedule a future check-in;
- surface a relevant product for consideration;
- explain an authoritative calculation;
- prepare a handover summary for a human adviser.

The same system may not be permitted independently to:

- approve credit;
- alter an underwriting decision;
- make an investment recommendation outside an authorised advice process;
- transfer funds without the required authentication and confirmation;
- change a customer's contractual terms;
- use sensitive information outside the purpose for which it is permitted.

The purpose of agentic capability is therefore not to remove controls. It is to allow the system to operate productively inside them.

Early research provides some evidence that such systems can perform useful bounded tasks. A 2025 BIS working paper tested a generative-AI agent in simulated real-time gross settlement cash management. In those experiments, the agent reproduced several prudential liquidity-management behaviours, including maintaining buffers and prioritising payments under constraint. The authors conclude that some routine cash-management activity may be amenable to automation, while also emphasising the regulatory and policy safeguards that would be required before such systems were relied upon operationally. The study relates to wholesale payment operations rather than retail banking and uses simulated conditions; it should not be interpreted as evidence that autonomous financial agents are generally reliable. Its significance lies in demonstrating that the relevant research question has moved beyond whether a model can generate financial language to whether an agent can select actions under explicit operational constraints.[^26]

The boundaries remain substantial.

BIS research testing computer-using agents on comparatively simple tasks has found that autonomous performance can deteriorate where systems must interpret changing visual environments and use feedback over multiple steps. This is an important counterweight to claims that contemporary agents can simply replace human operators across complex processes.[^27]

A banking system cannot assume that because an agent successfully completes a task most of the time, occasional failure is economically or conduct-wise acceptable. Reliability requirements depend upon the consequence of the action. A poorly phrased explanatory sentence and an incorrectly initiated financial transaction do not belong in the same risk category.

This suggests that the appropriate level of autonomy should vary according to the action being performed.

Low-consequence activities may tolerate greater agent discretion. Higher-consequence activities should move progressively towards deterministic controls, explicit confirmation and human oversight.

The architecture can therefore be understood as a series of authority boundaries.

The model may be given broad freedom over how to phrase a response but almost none over the interest rate returned by a pricing engine.

It may have discretion to decide which clarifying question is most useful but not to invent which legal declarations an application requires.

It may determine that a mortgage specialist is needed but not impersonate the specialist's regulated judgement.

It may prepare an application using information already supplied but should not submit that application where customer confirmation is legally or operationally required.

This is not an incidental implementation detail. It is central to whether agentic systems are suitable for financial services.

The Central Bank of Ireland's 2026 supervisory work reflects this risk-based distinction. Its Regulatory and Supervisory Outlook identifies increasing AI adoption as relevant both to consumer protection and operational resilience and emphasises that the implications depend on the nature and materiality of the use case. ECB Banking Supervision has similarly indicated that its attention is moving towards generative-AI applications with prudential significance rather than treating all AI uses as equivalent.[^5]

The European Banking Authority reports that adoption of AI across EU and EEA banking is already broad, while interest in general-purpose and generative AI has increased rapidly. Its monitoring distinguishes traditional machine-learning applications from general-purpose AI and identifies customer-facing support among the areas in which the technology is being explored. This is important because it suggests that the institutional question is no longer primarily whether banks will use AI, but how responsibilities will be divided between probabilistic systems, deterministic processes and human staff as AI becomes more deeply embedded in operations.[^28]

The distinction between a copilot and an agent is useful in considering that division.

A copilot assists a human employee who remains the principal operator. It may retrieve information, summarise documents, draft communications or recommend a next step. Responsibility for initiating and completing the action remains primarily with the employee.

An agent can perform parts of the workflow itself, within its authorised environment.

The BIS has used this distinction in considering future central-bank work, describing one scenario in which AI copilots augment employees and another in which agents automate specific tasks, while emphasising that human oversight remains necessary.[^29]

For retail banking, both models are likely to have enduring value.

A mortgage adviser may use a copilot to prepare for a customer meeting.

The customer may interact directly with an agent which collects information and progresses routine elements of the mortgage process.

When the case becomes unusual or requires professional judgement, that same agent may hand the relationship to the adviser together with the relevant context.

The customer need not know which internal technology pattern is operating at every stage. What matters is that the relationship remains coherent.

This produces a model in which human and artificial capability are not arranged as alternatives but as layers. The agent absorbs activities for which language understanding, information retrieval, persistence and workflow coordination are sufficient. Deterministic systems perform authoritative banking operations. Human employees become increasingly concentrated at points requiring judgement, accountability, specialist expertise, exception handling or interpersonal support.

Such an architecture has the potential to alter the capacity constraint identified in Section 3 without requiring the bank to assume that every aspect of relationship management can be automated.

It also changes what should be measured.

A conventional chatbot is often evaluated through containment: how many enquiries can be resolved without involving a member of staff. That is a sensible operational metric for a customer-service automation system.

It is less suitable for an AI relationship layer.

A well-functioning relationship agent may deliberately involve a human because doing so is the correct outcome. It may spend several interactions helping a customer clarify an objective before any product is discussed. It may identify that the appropriate action is to do nothing for several months. It may preserve context which only becomes valuable later.

The relevant measure is not simply whether the interaction was automated. It is whether the system progressed the customer's objective while using the appropriate combination of digital and human capability.

The distinction is important because it reduces the temptation to design an agent around the removal of human contact as an end in itself. The economic value described previously arises from reducing the cost of continuity and coordination, not necessarily from minimising every conversation with an employee.

The same reasoning applies to multi-agent architectures. It is technically possible to divide work between several specialised agents: one may identify intent, another retrieve product information, another evaluate documentation and another coordinate application state. Research literature demonstrates substantial experimentation with such systems.[^30]

Whether a bank should expose that complexity is a separate question.

From a customer perspective, multiple internal agents may still need to appear as one coherent institutional relationship. Reproducing the bank's organisational fragmentation in artificial form would solve relatively little. The customer should not have to understand which agent owns savings, which owns mortgages and which owns protection any more than they should be required to understand the bank's internal reporting lines.

This again suggests that the important innovation is not the agent itself but the relationship layer constructed using agentic capabilities.

Its purpose is to maintain a coherent representation of what the customer is attempting to achieve while invoking more specialised systems beneath it.

That requires at least four technical properties.

First, the system must be able to interpret customer language sufficiently well to establish what the customer is attempting to do without requiring the customer to begin from the bank's product taxonomy.

Second, it must be capable of maintaining persistent, structured and governed state outside the model itself.

Third, it must be connected to authoritative banking capabilities through constrained tools rather than relying upon generated text for facts and actions which already have a system of record.

Fourth, it must be able to recognise the limits of its authority and transfer control to deterministic systems or human staff without losing the context accumulated before that transfer.

None of these properties is fully solved merely by selecting a more capable foundation model.

They are architectural properties of the banking service built around the model.

This is one reason why rapid improvements in frontier AI models should not lead institutions to postpone architectural decisions until the technology has "settled". Model capability will continue to change. The more durable questions concern data boundaries, permission, customer state, tool design, auditability, human escalation and the division of responsibility between probabilistic and deterministic systems.

A bank which answers those questions can potentially substitute improved models over time without redesigning the relationship itself.

A bank which treats the model as the architecture risks allowing a rapidly changing external technology to determine the structure of a regulated customer service.

The evidence available at present therefore supports neither extreme position.

It does not support the proposition that contemporary AI agents are sufficiently reliable to operate autonomously across unrestricted retail banking activity.

Nor does it support the proposition that generative AI is merely a better chatbot with no implications for banking operating models.

The capability which matters lies between those positions: systems can increasingly interpret unstructured objectives, retain external state, select from authorised tools and coordinate bounded processes, while authoritative calculations, regulated decisions and consequential actions remain subject to deterministic control and, where appropriate, human judgement.

That capability is sufficient to raise a further question.

If an AI system can understand a customer objective before the relevant banking product has been selected, and can maintain that objective across multiple interactions, then the product no longer needs to be the first organising unit of the digital relationship.

The bank can begin instead with what the customer is trying to achieve.

That represents a more significant change than the introduction of a conversational interface. It changes the sequence through which needs are discovered, how products are introduced and what information persists after an individual transaction is complete.

The next section therefore moves from the technology itself to the service model it may make possible: the transition from product-led digital banking towards banking organised around persistent customer goals.

## 5. From product-led digital banking to goal-led relationship banking

If the technological capability described in the previous section is accepted in principle, a further question arises concerning what the system should organise itself around. Conventional digital banking is predominantly organised around products and servicing tasks. An account, mortgage, card, savings product or insurance policy provides a clear unit through which eligibility, pricing, contractual terms, operational state and regulatory obligations can be managed. This structure is appropriate to the execution of banking. It is less obvious that it is the appropriate starting point for understanding what a customer is attempting to achieve.

The distinction between the two is already present, to some extent, within financial regulation. The Central Bank of Ireland's Consumer Protection Code 2025, which took effect in March 2026, requires regulated firms to assess customers' needs and circumstances and, where suitability requirements apply, to gather sufficient information concerning their needs, objectives, personal circumstances and financial situation. The Code states that firms should act in ways which support customers in making choices consistent with their needs and financial objectives, and requires relevant firms to assess whether a financial service meets those needs and objectives before determining suitability. In regulatory terms, therefore, the objective of the customer is not peripheral to the provision of financial services. It is already part of the framework through which an appropriate product or service is identified.[^31]

The European Banking Authority's product-governance framework reflects a related principle at product level. Its guidance requires manufacturers and distributors of retail banking products to consider the interests, objectives and characteristics of the consumers for whom products are intended. The EBA has previously found that firms had generally implemented product-oversight processes without always giving sufficient emphasis to whether consumer needs were actually being met. The regulatory architecture therefore already recognises a distinction between the financial product itself and the underlying customer need which the product is intended to serve.[^32]

What remains largely transactional is the point at which this assessment occurs.

Needs and objectives are commonly gathered because a particular product or regulated service is being considered. The customer enters a mortgage, investment, insurance or credit process and the institution then establishes information relevant to determining whether that product is appropriate, suitable or affordable. The objective is important, but it is generally captured within the product journey.

The model considered in this paper reverses the sequence.

Rather than beginning with a product and asking whether it is appropriate to the customer's objective, the institution begins by understanding the objective and then determines which, if any, products or services become relevant as that objective develops.

This can be described as a transition from product-led to goal-led banking.

The distinction should not be overstated. Financial institutions will continue to manufacture, contract, account for and regulate products. A mortgage does not cease to be a mortgage because the customer describes the desired outcome as buying a home. Nor does organising the relationship around a customer's goal remove the need for product-specific disclosures, affordability assessment, suitability requirements, underwriting or contractual consent.

The proposed change is instead one of service architecture.

The product remains the unit of execution.

The goal becomes a possible unit of continuity.

That distinction is important because the duration of a customer objective and the duration of an individual banking transaction are not necessarily the same.

A first-home purchase may begin with a period of saving which lasts several years. It may then move through affordability assessment, mortgage preparation, property search, application, approval, conveyancing, drawdown and subsequent home ownership. Different banking products may become relevant at different stages. Some apparent needs may disappear entirely. Others should deliberately be deferred.

An application has a defined beginning and end.

The customer's objective can exist before the application begins and continue after it has completed.

A banking system which persists only the application state therefore retains only part of the relationship.

The concept of organising financial decisions around goals is not new. It is well established within financial planning and wealth management, although the literature has focused primarily on savings and investment decisions rather than retail banking as a whole. Goal-based financial planning begins from the proposition that household financial resources are ultimately used in pursuit of particular objectives and that those objectives may compete for finite resources. Blanchett's analysis of goals-based planning, for example, models the problem not simply as one of selecting investments but of determining which household goals should be funded, to what extent and in what order. In a hypothetical household, the optimal strategy involved trade-offs between debt repayment, retirement and education funding rather than maximising any single product or account in isolation.[^33]

The behavioural-finance literature provides a related perspective. Thaler's work on mental accounting describes the processes through which individuals and households categorise, evaluate and keep track of financial activity rather than treating all wealth as perfectly interchangeable. Subsequent empirical research has found an association between explicit savings goals and household portfolio behaviour. Changwony, Campbell and Tabner, using UK household data, found that having savings goals was associated with longer-term saving activity, with the relationship particularly evident among individuals with lower numerical ability. Their study does not establish that banks should organise themselves around customer goals, but it provides evidence that goals are not merely descriptive labels: they can be relevant to how households organise and act upon financial resources.[^34]

The concept also aligns with emerging definitions of financial well-being. The OECD's 2026 work on financial consumer protection adopts the G20 definition of financial well-being as a state in which individuals can manage financial needs and obligations, withstand negative shocks, pursue aspirations and goals, capture opportunities and feel confident about their financial lives. The US Consumer Financial Protection Bureau similarly includes being on track to meet financial goals as one of four central dimensions of financial well-being, alongside day-to-day control, resilience to financial shocks and freedom of financial choice. These definitions are broader than banking and should not be interpreted as establishing a particular service model. They do, however, locate the achievement of objectives, rather than ownership of financial products, closer to the eventual outcome which financial services are intended to support.[^35]

A goal-led banking model takes this distinction seriously.

It assumes that when a customer approaches a bank, several different conceptual objects may be present and that they should not be treated as interchangeable.

A life circumstance is something about the customer's situation which may affect their financial needs: marriage, parenthood, moving home, a change in employment, retirement, bereavement or separation.

A goal is an outcome which the customer is attempting to achieve: purchase a first home, create a financial reserve, reorganise household finances, prepare for retirement or repay expensive debt.

A milestone is an intermediate state which contributes to achievement of the goal: accumulate a deposit, obtain a mortgage decision in principle, gather required documentation or reach a particular savings level.

A need is a financial requirement which arises from the customer's circumstances or goal: liquidity, borrowing, protection, payment capability or a mechanism for saving.

A product is one of the regulated or contractual instruments through which the bank can address that need.

An application is the controlled process through which the customer obtains the product.

The relationship can therefore be represented as:

```text
Life circumstance
        ↓
Customer goal
        ↓
Milestones
        ↓
Financial needs
        ↓
Actions
        ↓
Products and services
        ↓
Applications
```

This sequence is deliberately directional. A product can help satisfy a need. It should not, in the proposed model, create the need merely because the product is available. That is an important conduct distinction.

The commercial logic of retail financial services has always required institutions to identify customers for whom additional products may be relevant. There is nothing inherently problematic about doing so. A customer who needs a mortgage may benefit from being made aware of a relevant mortgage product; a homeowner may genuinely need appropriate insurance; a household without sufficient financial resilience may benefit from a suitable savings mechanism.

The problem arises when product relevance is inferred independently of the customer's wider objective and timing.

A customer can simultaneously be a plausible candidate for several products while it remains inappropriate to pursue all of them.

Consider a household preparing to purchase its first home. The bank might identify that the customers could potentially use a joint current account, a savings product, a mortgage, mortgage protection, life insurance, home insurance, a credit card and, eventually, an unsecured loan for home improvements.

From a product-propensity perspective, each may represent an opportunity.

From the perspective of the household's objective, their relevance differs substantially by time.

Before the deposit is complete, the principal requirement may be to accumulate sufficient liquid savings while maintaining an appropriate emergency reserve.

During mortgage assessment, additional unsecured borrowing may be undesirable even where the customer would otherwise meet the lending criteria. Mortgage protection becomes necessary in connection with the mortgage process. Home insurance becomes relevant when a property is being acquired. A renovation loan may be entirely reasonable after completion and inappropriate immediately before underwriting. The information is the same. The ordering changes the outcome. This illustrates why relevance and relevance now are different concepts.

The distinction is difficult to represent through a product-by-product architecture because each product can independently appear suitable when examined in isolation. A goal provides an additional frame within which products can be sequenced, deferred or suppressed according to their relationship with the broader objective.

This may also create a more disciplined approach to cross-selling.

The term cross-sell is often used neutrally to describe the provision of additional products to an existing customer. In practice it can encompass a wide range of behaviour, from identifying a genuinely valuable adjacent need to pursuing additional product penetration with little regard to the customer's immediate objective.

A goal-led model would not eliminate cross-selling. It would impose a stronger causal chain between customer circumstance, identified need and product.

The relevant internal question changes from:

> Which additional products is this customer likely to purchase?

to:

> What is this customer attempting to achieve, what needs arise from that objective, and is there an action the bank can usefully take now?

This is a materially different optimisation problem.

The first is primarily predictive.

The second is partly sequential.

Research into life-event prediction demonstrates why this distinction is becoming technically important. Financial-services firms have long attempted to identify events likely to change customer preferences and product requirements. A 2024 study in Decision Support Systems, using real financial-services data, describes life-event prediction as an established CRM problem precisely because changes in life circumstances alter demand for financial products and services. The study focuses on prediction rather than customer-led relationship management, but it highlights the growing ability of institutions to infer when customer circumstances may have changed.[^36]

An agentic relationship model introduces a different possibility: the customer can state the circumstance directly.

This distinction between inferred intent and declared intent deserves particular attention.

A bank may observe behavioural signals suggesting that a customer is considering buying a home. Regular transfers into savings, browsing mortgage pages or changes in rent payments may support that inference. Such information can be valuable for analytics and, subject to appropriate governance, for service design.

But an inference should not automatically become the customer's goal.

The customer may be saving for another reason. They may be researching on behalf of someone else. They may have abandoned the plan.

A persistent relationship layer should therefore maintain provenance.

It should be capable of distinguishing:

- Observed fact
- Customer-stated circumstance
- System inference
- Candidate goal
- Customer-confirmed goal

These states should have different consequences.

A model may use a weak signal to ask a useful question.

It should require substantially stronger justification before changing persistent customer state or initiating activity.

This has direct implications for AI system design. One of the risks of a highly capable conversational model is that it can make plausible connections which the customer never intended. A statement that a couple has recently had a child might make family protection, emergency savings and future education funding potentially relevant. It does not establish that the customer wants to discuss any of them.

The role of the system is therefore not simply to identify as many possible needs as possible. It is to distinguish discovery from activation. A possible need can exist without being surfaced. A potential goal can be recognised without becoming a persistent plan. A customer can decline an otherwise relevant topic without the system repeatedly attempting to reintroduce it. The goal belongs to the customer, not to the model.

This principle is important both for trust and for regulatory alignment. The Central Bank's modernised Consumer Protection Code places explicit emphasis on securing customers' interests and supporting decisions consistent with their needs, objectives and circumstances. It also requires firms to avoid exploiting behavioural biases in ways which could lead to poor outcomes. A goal-led system which optimised solely for product conversion while presenting itself as a customer relationship service would sit uncomfortably with that principle.[^31]

The proposed model is therefore not one in which the institution defines success for the customer. The customer establishes the objective. The bank may help clarify whether it is achievable, identify constraints, explain trade-offs and provide capabilities which support it. That difference becomes particularly important where goals conflict.

Households operate under finite resources. The same euro cannot simultaneously fund an emergency reserve, repay unsecured debt, form part of a home deposit and be invested for retirement. Goals can therefore have dependencies, conflicts and different time horizons.

The financial-planning literature makes this problem explicit. Goals-based approaches are concerned not only with whether individual objectives are desirable but with allocating resources between several objectives of differing importance and timing. Blanchett's model illustrates that the optimal funding of one goal can depend upon progress towards another. More recent computational work similarly treats goal-based wealth management as a sequential decision problem rather than a series of independent investment choices. The applicability of those models to everyday retail banking is limited, but the underlying observation is general: financial objectives interact.[^37]

For a bank, this means that the relationship layer requires an understanding not simply of goals but of their relationships. A goal may be a prerequisite for another. A goal may compete for the same resources. A goal may become relevant only after another is complete. A goal may be paused because circumstances have changed. A goal may cease to be appropriate entirely.

A first-home purchase can therefore exist alongside an emergency-fund objective without assuming that all available savings should be transferred into the deposit. A retirement objective can remain valid while a nearer-term debt-repayment goal temporarily receives greater priority.

The appropriate response cannot always be determined by a general-purpose AI model. Some trade-offs involve regulated financial advice, material credit decisions or personal preferences which the institution should not infer. The role of the persistent system can be narrower: make the competing objectives visible, avoid silently allocating the same resource twice, provide controlled information and calculation, and involve an appropriately authorised human where judgement or advice is required.

This creates a useful concept of a customer plan.

The term does not imply a regulated financial plan in the professional-advice sense. It describes a persistent digital representation of an objective which the customer has agreed to pursue with the bank.

At minimum, such a plan could represent:

- the agreed goal;
- the customer's current position;
- an indicative target or timeframe where one exists;
- relevant milestones;
- actions already completed;
- actions outstanding;
- known dependencies;
- services or applications linked to the goal;
- matters deliberately deferred;
- the conditions under which the bank should return to the customer.

The plan therefore provides continuity above the individual application.

An application answers:

> What state is this mortgage in?

A plan answers:

> Where is the customer in the process of buying their first home?

Those questions overlap but are not equivalent. A mortgage application may be complete while the wider home-purchase objective remains unfinished. Conversely, a customer's home-purchase plan may remain active for months before a mortgage application exists. This distinction allows banking activity which would otherwise appear episodic to become longitudinal. It also changes the role of time.

Conventional digital banking is predominantly reactive. The customer opens the application or website when they wish to perform an activity. Marketing and CRM systems can, of course, initiate outbound communication, but these are generally distinct from the servicing experience.

A persistent goal creates the possibility of purposeful re-engagement.

If a customer establishes that they are saving towards a €60,000 deposit and asks the bank to help monitor that objective, the system can recognise when the threshold is reached.

If a mortgage application subsequently requires a document, the system can return for that reason.

If the customer and bank agree that mortgage readiness should be reviewed in three months, the conversation can resume at that point without requiring the customer to recreate the previous context.

The important condition is that proactive contact should have a defined relationship to the plan.

This creates a different standard from engagement for engagement's sake.

The appropriate question is not:

> Can the bank create another interaction?

It is:

> Has something changed which makes another interaction useful?

Possible triggers include completion of a milestone, a change in application state, an approaching target date, an action required from the customer or a previously deferred need becoming relevant.

Where none of those conditions exists, the correct action may be silence.

This matters because financial institutions operate in an environment in which excessive, poorly timed or opportunistic communication can rapidly erode trust. A relationship layer which continually manufactures reasons to contact the customer would recreate conventional marketing automation through a more convincing interface rather than establish a genuinely different service model.

The concept of goals also provides a potential alternative to conventional measures of digital engagement.

Consumer technology businesses frequently treat increased frequency and duration of interaction as evidence of value. That assumption is poorly suited to many banking activities. A customer should not need to spend more time managing a mortgage application if the same outcome can be achieved with less effort. Nor should a bank seek to increase conversation volume merely because conversational AI makes interaction less expensive.

A goal-led system suggests a different unit of performance: progress towards the customer's stated objective.

That concept requires careful measurement. The bank cannot assume responsibility for outcomes outside its control; a customer may fail to purchase a home because no suitable property becomes available, not because the banking service failed. Nor can all goals be reduced to a single quantitative score.

Nevertheless, useful operational measures become possible.

- Did the customer move from an undefined intention to an agreed objective?
- Was information requested once or repeatedly?
- Were required actions completed?
- Was a relevant application successfully initiated?
- Was the customer directed to human support when necessary?
- Did the institution surface a product because it contributed to the objective or merely because the customer qualified for it?
- Was an otherwise attractive commercial action appropriately deferred because it conflicted with the customer's more immediate goal?

These questions measure something different from clicks, chat containment or product penetration.

They measure the quality of orchestration.

The model also creates a different relationship between customer data and customer agency.

Under a conventional CRM approach, information about the customer is principally an institutional asset used to improve servicing, risk management and commercial activity. In a goal-led relationship, part of that information can become visible and manageable by the customer themselves.

The customer should be able to say:

> This is no longer my goal.

The target date has changed. Do not remind me about this. I want to revisit this later. I do not want that information reused for this purpose.

That level of control is not simply a user-experience feature. It helps distinguish a transparent relationship from an opaque profiling system.

The distinction will become increasingly important as AI makes inference more powerful.

A system capable of combining transaction data, conversation, application history and behavioural signals may be able to infer circumstances which the customer has not chosen to disclose explicitly. The fact that an inference is technically possible does not establish that using it is appropriate. Data protection, consumer protection and broader expectations of fairness impose separate constraints, which are considered later in this paper.

For the present argument, the relevant design principle is simpler:

> customer-confirmed goals should be more authoritative than model-inferred intentions.

The customer relationship should be constructed around what has been agreed, not around whatever the model believes it has detected.

A goal-led model therefore requires several separations which conventional conversational systems can obscure.

Circumstances are not goals.

A customer becoming a parent may alter their financial position without creating an automatic goal to purchase insurance or save for education.

Goals are not needs.

A first-home objective can create several financial needs, but the customer should not be required to pursue every one of them.

Needs are not products.

A need for liquidity, protection or borrowing may be capable of being addressed through several products, or perhaps through no new product at all.

Product eligibility is not suitability. The fact that a customer qualifies for a product does not mean it advances their objective. Suitability is not timing. A suitable product can still be wrong to introduce at a particular stage of the customer's plan.

These distinctions become especially important if AI systems are used commercially. A model trained or incentivised primarily to maximise conversion could collapse each stage of the chain until a customer circumstance became an immediate product opportunity.

A relationship-oriented architecture should do the opposite: retain the intermediate reasoning objects so that the institution can demonstrate why a product was surfaced and why it was surfaced at that time.

This has potential governance value.

If the system records that a customer established a first-home objective, that a deposit shortfall remained, that unsecured borrowing had been deferred until completion and that the mortgage application had subsequently concluded, the institution can inspect the chain through which a later lending discussion became relevant.

The rationale is considerably more interpretable than a model-generated statement that a customer had a 73 per cent propensity to buy a personal loan.

This does not necessarily make the decision correct.

It does make the service logic easier to examine.

The model can consequently be summarised as a hierarchy:

```text
CUSTOMER
    │
    ├── Current circumstances
    │
    ├── Existing financial relationship
    │
    └── Confirmed goals
            │
            ├── Milestones
            ├── Dependencies
            ├── Needs
            ├── Actions
            ├── Applications
            └── Future review points
```

The purpose of this hierarchy is not to build a more elaborate CRM taxonomy.

It is to provide the persistent state required for the relationship described in the preceding sections.

The practical significance becomes clearest by comparing two journeys.

In a conventional product-led model, a customer wishing to purchase a home may move through savings, mortgage and insurance journeys at different points in time. Each journey can be excellent independently. The customer may nevertheless experience them as separate episodes.

In a goal-led model, those same journeys remain, but they sit beneath a persistent home-purchase objective. The institution knows why the savings activity exists, when the mortgage process becomes relevant and why protection or home insurance should be discussed later.

Nothing about the underlying mortgage needs to become less controlled.

The difference is that the relationship survives between the products.

This proposition should not be interpreted as an argument that every retail customer requires a formalised goal or plan. Many interactions are appropriately transactional. A customer paying a bill or replacing a card should not be required to establish a financial objective. Attempting to turn every interaction into an ongoing relationship would create friction rather than remove it.

The model is therefore conditional.

Where the customer presents a discrete task, the bank should complete the task efficiently.

Where the customer presents an objective which extends over time or across several financial activities, the bank should be capable of retaining that objective and supporting its progression.

The challenge is determining which mode applies without making the customer understand the distinction themselves. Conversational interaction may be particularly useful here because the customer can begin with ordinary language. I need a new card. is recognisably a task. My partner and I want to get ourselves in a position to buy a house next year. is recognisably an objective. The system can treat them differently.

This is a subtle but important departure from conventional digital information architecture. The customer no longer necessarily needs to determine whether their starting point belongs under Savings, Mortgages or Current Accounts. The bank can make that translation after understanding what the customer is attempting to achieve.

This returns to the strategic issue introduced in Section 1.

The institution which understands the objective before the product is selected occupies a different position in the customer relationship from the institution which is approached only after the selection has been made elsewhere.

If a third-party agent establishes the customer's goal, understands their resources, sequences the relevant decisions and subsequently approaches banks only to obtain prices and execute products, the bank can remain economically important while becoming less important to the formation of the customer's financial decisions.

A bank-owned goal layer offers an alternative.

It allows the bank itself to become the place in which the customer expresses, maintains and progresses financial intent.

The competitive significance of that proposition does not depend upon preventing access by external agents. Banks will likely need to operate in an ecosystem in which both proprietary and third-party agents are present. The more fundamental issue is whether the bank develops sufficient capability to understand its customers in the same terms.

The strategic asset is therefore not simply the conversational interface. It is the persistent representation of customer intent and the capability to act appropriately upon it. A chatbot can be replaced. A model provider can be changed. Individual products can be repriced.

A trusted relationship in which the institution understands what the customer is trying to achieve, retains that context with permission and reliably coordinates the actions required to progress it is potentially more durable.

Whether customers will want banks to occupy that role cannot be assumed. Some may prefer independent third-party agents precisely because those agents can compare institutions without the commercial incentives inherent in a product provider. Others may place greater value on the bank's authenticated data, execution capability and regulated accountability. It is entirely possible that both models will coexist.

The important point is that the choice is becoming technically possible.

Traditional digital banking has largely required customers to bring a product intention to the institution.

Agentic systems create the possibility that the institution can participate earlier, when the customer has an objective but has not yet translated it into a banking product.

That moves the bank closer to the point at which financial intent is formed.

It also creates significant questions concerning incentives, trust and governance.

A system that knows what the customer is trying to achieve may be able to provide substantially better service. The same system could also become a highly effective mechanism for steering customers towards the commercial interests of the institution.

The distinction will not be resolved by the sophistication of the AI model.

It depends upon how the relationship is governed.

The next section therefore considers one of the central requirements of a persistent AI relationship: trust, customer control and the governance of memory. It examines what it means for a bank to remember information across conversations, when information should be reused, how inference should be distinguished from fact, and why the ability to retain customer context creates obligations which are substantially greater than those associated with a conventional chatbot.

## 6. Trust, customer control and the governance of memory

The service model described in the previous section depends upon persistence. A system cannot provide meaningful continuity if each conversation begins without knowledge of what occurred previously. It cannot maintain a customer goal if the goal disappears when a session ends, and it cannot coordinate activity over time if information gathered during one interaction is unavailable when the customer returns.

Memory is therefore not an ancillary feature of an AI relationship layer. It is one of its defining capabilities.

It is also one of its principal risks.

A conventional transactional interface requires relatively little interpretation of what should persist. A payment instruction must be recorded because the payment occurred. An application must retain the information necessary to process the application. An account balance forms part of the customer's banking record. The relationship between the information and the purpose for which it is retained is generally clear.

A persistent conversational relationship is different. Customers may discuss employment, family circumstances, future plans, anxieties, spending priorities, health, relationships and other aspects of their lives because those matters provide useful context to a financial decision. A technically capable system could extract and retain much of that information. The fact that it can do so does not establish that it should.

This creates a fundamental distinction between remembering usefully and retaining comprehensively.

The objective of relationship memory should not be to construct the most complete possible representation of the customer. It should be to retain the minimum amount of reliable context required to provide the service which the customer reasonably understands the institution to be providing.

That principle follows directly from existing data-protection law. The Irish Data Protection Commission summarises the GDPR principles of purpose limitation and data minimisation as requiring personal data to be collected for specified, explicit and legitimate purposes, and to be adequate, relevant and limited to what is necessary for those purposes. The associated principles of accuracy, storage limitation, security and accountability further require information to be kept accurate where necessary, retained no longer than appropriate and processed in a manner for which the controller can account.[^38]

A relationship layer therefore cannot sensibly treat "memory" as an undifferentiated transcript archive.

The more useful architectural question is what kind of information is being remembered, why, and with what authority.

A conversation may contain several different forms of information.

Some statements are observable facts. A customer may provide their income, identify an existing loan or state the amount currently held in savings.

Some statements describe circumstances. The customer may say that they have recently married, are expecting a child or intend to move home.

Some statements express preferences. They may say that they wish to retain a particular level of emergency savings or would prefer not to extend borrowing beyond a given term.

Some statements express objectives. The customer may confirm that they intend to purchase their first home within approximately twelve months.

Other information is not stated at all. It is inferred by the system from what the customer has said or from other information available to the bank.

These categories should not be treated as equivalent.

A system which infers that a customer may be preparing to move home has less authority than one in which the customer has explicitly established moving home as an active objective. A previous salary figure may remain factually accurate for some purposes while being too old to rely upon for an affordability assessment. A customer's comment that they are worried about money may be useful conversational context without being an appropriate permanent attribute of their banking profile.

The persistent representation of a relationship should therefore preserve provenance.

At a minimum, the institution should be capable of determining whether a piece of information was:

- Observed from an authoritative bank system
- Provided directly by the customer
- Derived from a previous application
- Inferred by an AI system
- Confirmed subsequently by the customer
- Generated by the bank as an action or decision

The distinction is not primarily technical. It determines how much reliance the institution should place upon the information.

This becomes particularly important as AI systems become better at inference. The European Data Protection Board treats profiling broadly as automated processing used to evaluate or predict aspects of an individual's behaviour, preferences or circumstances. The Irish Data Protection Commission similarly defines profiling as automated processing which analyses or predicts behaviour, habits or interests. An increasingly capable AI relationship layer may therefore produce useful information which was never explicitly supplied by the customer, but this does not remove the requirement to consider whether the processing is lawful, fair, transparent and reasonably expected.[^39]

The EDPB's 2024 opinion on personal data and AI models is relevant in this respect. In considering legitimate interest as a possible legal basis for the development or deployment of AI systems, the Board identifies the relationship between the individual and the controller, the nature of the service, the context in which information was collected, its source, potential further uses and the reasonable expectations of the individual as factors relevant to the assessment. It specifically recognises that a conversational agent assisting users can provide a legitimate benefit, while emphasising that necessity and the balance of individuals' rights still require case-by-case assessment.[^40]

This has a practical consequence for the "ask once" principle which is often presented as an obvious benefit of intelligent banking.

The principle is attractive. Customers reasonably become frustrated when information already supplied to an institution must be provided again because two internal processes do not share state.

But ask once cannot mean use forever and for everything.

Information may have been collected for a particular purpose. Its reuse may not be compatible with that purpose. It may have become inaccurate. A declaration may need to be made at the point at which a regulated decision is taken. A customer may be entitled to understand that information is being reused in a materially different context. The institution may require a different lawful basis for the later processing.

A more defensible service principle is therefore:

> Do not ask the customer to recreate information unnecessarily where the institution can lawfully, appropriately and reliably reuse what it already knows.

That formulation is less absolute, but it is considerably more important in practice.

It also changes how the system should interact with stale information.

A human relationship manager does not ordinarily assume that every fact remembered from an earlier meeting remains true indefinitely. They may recall that a customer was self-employed, but confirm whether that remains the case before relying upon it. A digital relationship layer requires an equivalent concept of temporal validity.

Some information changes rarely. A date of birth is ordinarily stable. Other information changes frequently. Income, expenditure, household composition, liabilities, employment status, savings and property values may all change materially over relatively short periods.

An intelligent system should therefore know not only what it knows, but when it was established, where it came from, and whether the current activity requires reconfirmation.

This suggests that persistent relationship state should include metadata rather than only values.

Conceptually:

- Fact
- Source
- Date obtained
- Confidence
- Customer-confirmed / inferred
- Permitted purposes
- Reconfirmation requirement
- Last verified

The purpose is not to make customer interaction bureaucratic. It is to make the persistence beneath the interaction reliable enough that the customer does not have to be.

If the bank already knows that a customer was earning €75,000 six months earlier, the system should not necessarily ask the customer to type €75,000 again. It may instead say that it has an annual income of €75,000 recorded from a previous interaction and ask whether this remains correct where confirmation is required.

The experience is simpler for the customer while the underlying control becomes stronger.

The same principle should apply to goals.

A customer goal should not remain active indefinitely because it once appeared in a conversation. Goals have states. A customer may be considering an objective, actively pursuing it, pausing it, completing it or abandoning it. The relationship layer should be capable of representing those changes explicitly.

A home-purchase objective established in January may remain active in June. It may also have been abandoned because the customer's circumstances changed in February. Without explicit state management, "memory" can become a mechanism for repeatedly resurfacing intentions the customer no longer has. That would be experienced not as relationship banking but as institutional persistence. Customer control therefore needs to extend beyond conventional privacy notices.

If goals are intended to organise the service relationship, customers should be able to exercise practical control over them. They should be able to correct the target, change the timing, pause the plan, decline an associated need, alter communication preferences or end the plan entirely.

These controls do not necessarily represent legal consent in the technical GDPR sense. The lawful basis for different forms of processing must be determined according to the processing activity concerned. It would be misleading to describe every customer control as a consent mechanism where another lawful basis actually applies.

The point is instead one of service agency.

A customer should be capable of understanding and influencing the persistent state which is shaping how the institution interacts with them.

This is particularly important because a goal-led system could otherwise become unusually effective at behavioural steering.

The Central Bank of Ireland's Consumer Protection Code 2025 places explicit requirements on digital financial services. Digital platforms must be designed so that consumers can use and navigate them without specialist knowledge; relevant algorithms must be documented and tested to produce objective and consistent outcomes; and firms must ensure that digital engagement does not unfairly exploit customers' behaviours, habits, preferences or biases in a manner which could cause detriment. The Central Bank has also made clear that the wider obligation to secure customers' interests applies irrespective of the technology through which the service is delivered.[^31]

This matters more in a persistent relationship than in a conventional product page.

A website might attempt to influence one transaction.

A relationship agent may know the customer's objectives, financial constraints, previous objections and preferred communication style. Used appropriately, that information can make the service substantially more useful. Used primarily to optimise product conversion, the same information could create a considerably more effective form of commercial persuasion.

The appropriate governance question is therefore not merely whether the recommendation or product presented was technically permissible.

It is whether the institution used its accumulated understanding of the customer in a manner consistent with the customer's interests and reasonable expectations.

This is one reason why the intermediate objects described in the previous section — goal, milestone, need and action — are useful from a governance perspective as well as a product perspective.

They create a visible chain between the customer's objective and the bank's action.

If the system surfaces a mortgage product, the institution should be capable of establishing that the customer has an active home-purchase goal, that mortgage readiness has become relevant, and that the product is being discussed in that context.

If the system suppresses unsecured borrowing during mortgage preparation, the institution should likewise be able to establish why. The alternative is to rely on an opaque inference that a customer is "likely to buy" a product. The first model is not automatically fair or correct. It is, however, considerably easier to inspect. The distinction becomes still more important where persistent customer context could influence decisions concerning access to financial services.

Under the EU AI Act, AI systems intended to evaluate the creditworthiness of natural persons or establish their credit score are included among the high-risk use cases in Annex III, subject to the Act's detailed provisions and exclusions. The classification reflects the potentially significant effect of such systems on access to financial resources and essential services. The Act also provides that systems within Annex III which perform profiling of natural persons are treated as high-risk.[^41]

This creates a strong architectural reason to distinguish the relationship layer from the decisioning layer.

Information gathered conversationally because it helps the bank understand a customer's objective should not silently become an input to credit assessment merely because the system technically possesses it.

A customer may tell a relationship agent that they are anxious about returning to work following parental leave.

That statement may be relevant to the conversation.

It does not follow that it should become an underwriting variable.

Similarly, the relationship layer might know that a customer had temporarily abandoned a previous financial goal. That knowledge may improve continuity without being an appropriate factor in a later lending decision.

Maintaining separate purposes, data domains and authority boundaries therefore becomes central to trustworthy design.

The same issue arises with particularly sensitive information.

Financial conversations are capable of revealing information which falls within the GDPR's special categories of personal data, including information concerning health, religious beliefs, political opinions or sexual orientation. Article 9 of the GDPR provides these data with additional protection, and the Data Protection Commission emphasises that processing is generally prohibited unless one of the specified exceptions applies.[^42]

Conversational systems make accidental collection particularly plausible.

A customer applying for a financial product through a conventional form is asked predefined questions.

A customer speaking naturally may volunteer far more.

They may explain that household income has fallen because they are undergoing medical treatment. They may mention the health of a child when discussing reduced working hours. They may refer to a bereavement, separation or other deeply personal circumstance because it explains why a financial objective has changed.

The system needs to understand enough of that information to respond appropriately. It does not follow that every detail should be extracted into durable customer memory. This suggests that a relationship architecture needs the equivalent of selective forgetting. Certain information may be required only to understand the immediate conversation. Other information may need to be retained in a tightly controlled product process because regulation or underwriting requires it. A much smaller subset may be appropriate to retain in the general relationship state.

The technologically simplest architecture — retain the full conversation and make all of it available to the model in future — is therefore likely to be one of the least attractive from a governance perspective.

A more disciplined design separates at least three layers.

The first is the interaction record: what was actually said and done, retained according to the institution's applicable legal, operational and record-keeping requirements.

The second is structured relationship state: a deliberately limited collection of facts, goals, preferences and agreed actions which the bank has determined may appropriately persist for the relationship purpose.

The third is decision state: authoritative information used within regulated product, risk or servicing processes.

There may be overlap between these layers.

They should not collapse into one another.

Such separation also improves security. The impact of inappropriate access increases as a system combines more aspects of an individual's life into a single representation. Data minimisation is therefore not only a privacy principle but an architectural means of reducing the consequences of compromise.

The EDPB's opinion on AI models reinforces the importance of this distinction. It notes that whether an AI model can itself be regarded as anonymous requires a case-specific assessment, including whether individuals whose information contributed to the model can be identified or whether their information can be extracted through queries. The existence of an AI model therefore does not create a general exemption from conventional data-protection requirements.[^40]

The underlying foundation model should in any event not become the system of record for the customer relationship. This follows from both operational and governance considerations. Model providers can change. Models can be replaced. Context windows are temporary. Generated outputs are probabilistic. A banking institution requires customer state to be inspectable independently of whichever model is currently being used to interpret it. The durable relationship should therefore belong to the institution's governed data architecture, not to the conversational model. This has an additional strategic consequence.

If the relationship is represented explicitly outside the model, the bank is less dependent on a particular AI supplier. A newer or more appropriate model can be substituted while the customer's confirmed goals, relevant context, permissions and banking state remain intact.

The model becomes a component.

The relationship remains an institutional asset and responsibility.

Auditability follows the same principle.

There is an understandable tendency in discussions of AI governance to equate explainability with an ability to inspect the model's internal reasoning. For many banking use cases, a more useful requirement is decision provenance.

The institution should be able to reconstruct:

- what information was available;
- which information was relied upon;
- whether it was customer-provided, system-derived or inferred;
- which deterministic rule or banking capability was invoked;
- what authoritative result that system returned;
- what action the AI subsequently took;
- and whether customer or human confirmation was required.

This does not require the institution to expose or store an unrestricted model chain-of-thought. It requires the banking service to produce an auditable record of material inputs, rules, tools and outcomes. That is considerably closer to the form of explainability financial institutions already know how to govern. It also supports error correction. A persistent system will sometimes misunderstand customers.

A customer may say "my wife earns about sixty" and the system may incorrectly interpret the figure as €60,000 per annum.

An inference may be plausible and wrong.

A goal may be identified incorrectly.

The appropriate response is not to pretend that sufficiently advanced AI will eliminate those errors. It is to design state so that consequential interpretations can be corrected before they propagate.

This implies different confirmation thresholds according to consequence. A low-risk conversational inference may be used immediately to ask a clarifying question. A persistent goal should generally require stronger evidence or customer confirmation. A factual attribute used across future journeys should have clear provenance. A variable which will affect credit, pricing or another consequential decision should remain subject to the relevant controlled process. The greater the consequence, the less acceptable it becomes for an unconfirmed conversational inference to act as authoritative state.

This principle can be expressed relatively simply:

> AI may infer freely for the purpose of understanding; it should act on inference only to the extent that the consequence justifies the uncertainty.

The wording is conceptual rather than regulatory, but the distinction is useful.

It allows the system to retain the exploratory quality which makes conversation valuable without treating every interpretation as fact.

Trust in such a system is therefore unlikely to arise primarily from anthropomorphism.

A friendly name, human conversational style or visual identity may make the interface more approachable. None can substitute for predictable institutional behaviour.

Trust is more likely to depend upon whether the system remembers the right things, forgets or compartmentalises the things it should not retain, tells the customer when information needs reconfirmation, makes clear when an outcome comes from a regulated bank process, allows the customer to correct its understanding and involves a human when the boundary of automated authority has been reached.

In this sense, memory should be visible through its consequences rather than through repeated claims that the system "knows" the customer.

The customer should notice that information need not be unnecessarily repeated.

They should notice that a conversation resumes from the appropriate point.

They should notice that a previously deferred issue reappears when it becomes relevant rather than because a campaign has been triggered.

They should notice that the bank can explain why it is asking a question. Those behaviours provide evidence of continuity. They are also more valuable than creating an artificial impression that the system has human memory or personal concern. This becomes particularly important where the system and customer disagree. A persistent relationship must allow the customer to remain authoritative about their own objectives.

The institution may legitimately retain factual records which the customer cannot simply alter, such as a completed transaction or an underwriting decision.

An inferred goal is different.

If the bank believes the customer is saving for a home and the customer states that they are not, the correct response is not to defend the model's inference.

The goal should cease to organise the relationship. That asymmetry is important. The bank remains authoritative about its products, records, contractual obligations and regulatory decisions. The customer remains authoritative about what they are trying to achieve. The AI exists between those two forms of authority. A well-governed relationship layer should therefore avoid the assumption that more memory necessarily creates a better relationship. The optimal amount of memory is the amount which produces useful continuity while remaining lawful, relevant, accurate, controllable and proportionate.

This may mean retaining less information than technically possible. It may mean asking a customer to reconfirm something which the bank already has. It may mean deliberately preventing an AI system from accessing data held elsewhere in the institution. Those choices can appear inefficient when viewed solely through the objective of friction reduction. They become rational when the objective is a sustainable banking relationship. There is also a broader strategic issue.

Section 1 distinguished between ownership of the financial product and ownership of the customer relationship. Persistent context is likely to become an important part of that distinction. The agent which retains the customer's goals, previous decisions, preferences and unresolved tasks acquires an informational advantage over an agent which encounters the customer for the first time.

That can increase service quality.

It can also create lock-in.

The relationship architecture should therefore not depend for its value upon making accumulated context impossible for the customer to leave behind or recreate elsewhere. If banks argue that trusted customer relationships differentiate them from general-purpose agents, the credibility of that argument will depend partly upon whether customers experience persistence as a service they control or as an institutional mechanism which makes switching more difficult.

This question may become increasingly important as third-party financial agents develop. A customer may eventually expect an external agent to interact with several banks on their behalf. Standards concerning identity, authorisation, data portability and agent-to-agent interaction are still developing and sit beyond the immediate scope of this paper. The strategic principle can nevertheless be identified now: a bank should seek to own the relationship because customers choose to maintain it, not because the information required to reproduce it has been made artificially immobile.

The governance of memory therefore sits at the centre of the proposed model rather than at its edge. Without memory, there is little persistent relationship. Without control over memory, persistence can become surveillance. Without provenance, inference can become fact. Without purpose limitation, context can become an indiscriminate input to every institutional decision. Without customer agency, a goal-led service can become an unusually sophisticated sales mechanism. These are not arguments against persistent AI relationship banking. They are conditions under which it becomes credible.

The challenge is consequently to build a relationship layer which knows enough to create continuity while preserving clear boundaries concerning what the bank knows, why it knows it, how long that knowledge remains relevant and what it is permitted to do with it.

That still leaves an important question unresolved.

Even if context can be retained safely, and even if routine coordination can be automated, there will remain circumstances in which the customer's needs cannot or should not be resolved by an AI system. Some involve regulated advice. Some involve exceptions which fall outside established rules. Some involve vulnerability, distress or circumstances in which interpersonal judgement has value in its own right. Others involve decisions for which a named individual or accountable function within the bank must remain responsible.

The economic model developed in Section 3 therefore depends not only on identifying what AI can do, but on designing deliberately for the points at which it should stop.

The next section considers the role of the human banker within an AI-mediated relationship: escalation, judgement and accountability, and whether AI changes the value of human interaction by changing when it is used.

## 7. The role of the human banker: judgement, escalation and accountability

The proposition developed so far is not that artificial intelligence should replace the human banking relationship. It is that a substantial part of the work surrounding that relationship may no longer require continuous human participation. Discovery, retrieval, routine administration, context retention and coordination can increasingly be supported or performed by digital systems. If that is correct, the role of the human banker changes not because human involvement becomes less important in every interaction, but because it can become more concentrated in the interactions for which human involvement adds the greatest value.

This distinction matters. Much of the debate concerning artificial intelligence and employment is framed around substitution: whether a technology can perform a task previously performed by a person. That framing is useful at the level of individual activities but less useful when considering a service such as banking, in which different parts of the same customer interaction carry very different levels of complexity, consequence and regulatory responsibility. The more relevant question is not whether a customer journey is human or automated, but which parts of that journey should be performed by which form of capability.

The emerging regulatory approach is consistent with this distinction. The EU Artificial Intelligence Act does not treat human oversight as a generic requirement to place a person nominally somewhere within an automated process. Article 14 requires high-risk AI systems to be designed so that natural persons can effectively oversee them, understand their capabilities and limitations, identify abnormal behaviour, interpret outputs appropriately, remain alert to automation bias and, where necessary, disregard, override or interrupt the system. The degree of oversight is expressly required to be proportionate to the risk, autonomy and context of use. The regulation therefore treats human involvement as a control function with substantive authority rather than as a procedural formality.[^41]

A similar principle already exists in European data-protection law. Article 22 of the GDPR provides, subject to specified exceptions, a right not to be subject to decisions based solely on automated processing where those decisions produce legal or similarly significant effects. Where certain exceptions apply, safeguards include at least the right to obtain human intervention, express a point of view and contest the decision. Again, the relevant concept is not simply that a human exists somewhere in the organisation. The intervention must be capable of affecting the outcome.[^43]

These requirements are especially relevant to banking because the consequences of an interaction vary considerably. A system explaining how a standing order works and a system influencing whether a customer receives credit should not be governed identically. Nor should a query concerning a routine application status be treated in the same manner as a conversation with a customer experiencing bereavement, financial abuse or serious financial difficulty.

This suggests that the role of the human banker should be designed around escalation thresholds, rather than around the assumption that every customer must either remain entirely within an automated journey or leave it completely.

### Designing around escalation thresholds

Several different forms of escalation can be distinguished.

### Escalation 1: Regulatory

The first is regulatory escalation. Certain activities may require the involvement of appropriately competent or authorised individuals because the activity constitutes regulated advice, requires professional judgement or falls within an established competency framework. In Ireland, the Central Bank's Minimum Competency Code and associated Regulations establish minimum professional standards for individuals providing advice, information and related services concerning specified retail financial products. The existence of an AI interface does not remove those obligations. Where an activity requires competent human involvement under the applicable framework, the architecture should recognise that boundary explicitly rather than attempt to reproduce the appearance of advice through conversational fluency.[^31]

### Escalation 2: Decision

The second is decision escalation. A deterministic policy engine may be capable of producing an authoritative result while the surrounding circumstances still merit human review. An application may fall outside ordinary parameters. Information supplied by the customer may be contradictory. A case may require an exception, an exercise of discretion or consideration of circumstances which the automated process was not designed to resolve.

In these cases, the role of AI is not to eliminate the exception but to identify it accurately and prepare it well.

### Escalation 3: Uncertainty

The third is uncertainty escalation. A model may understand the broad nature of the customer's objective while remaining uncertain about an important fact or interpretation. The appropriate response is not necessarily to force the system to reach a conclusion. It may be to ask a clarifying question. Where uncertainty remains material, the appropriate next step may be human involvement.

This is particularly important because large language models can make uncertainty difficult to perceive. A weakly supported interpretation may be expressed with the same grammatical confidence as a well-supported one. A banking implementation should therefore treat confidence and evidence as system properties rather than relying upon linguistic hesitancy as the principal indicator of uncertainty.

### Escalation 4: Vulnerability

The fourth is vulnerability escalation.

The Central Bank of Ireland's Consumer Protection Code 2025 defines vulnerable circumstances broadly and recognises that vulnerability may be permanent or temporary and can arise through events such as bereavement, job loss, relationship breakdown, ill health or reduced capability. Where a regulated entity identifies that a consumer is in vulnerable circumstances, it is required to provide ongoing reasonable assistance where necessary and to have appropriately trained staff available. The Code further requires relevant information concerning the customer's vulnerable circumstances to be accessible, where appropriate and lawful, to staff providing that ongoing assistance.[^31]

This has important implications for an AI-mediated relationship.

AI may be useful in identifying signals that a customer could require additional support. Natural-language interaction may, in some circumstances, make it easier for a customer to describe a difficulty than a conventional form or menu. The system might recognise references to bereavement, financial abuse, reduced capacity or sudden financial hardship and adapt the interaction appropriately.

But the ability to detect vulnerability does not establish that the AI system should independently manage the resulting relationship.

A system may help route the customer to the correct support, preserve context so that the customer does not have to repeatedly describe distressing circumstances and ensure that relevant information reaches an appropriately trained employee. That is different from treating a model as a substitute for the judgement, sensitivity and responsibility expected of staff supporting a vulnerable consumer.

### Escalation 5: Emotional

The fifth is emotional escalation.

Not every high-emotion financial interaction is a regulated vulnerability case. A first-home purchase, retirement decision or significant borrowing commitment can be emotionally consequential even where the customer is financially capable and no additional regulatory support is required. The customer may understand the facts and still want to speak to another person before committing.

There is evidence from automated financial advice that this preference cannot simply be assumed to disappear as systems become more capable. Studies of robo-advisory adoption have repeatedly identified trust and preference for human advisers as material factors in consumers' willingness to rely on automated financial services. A 2024 study of 445 investors found trust, anxiety, performance expectations and preference for human advisers all contributed to adoption intentions. More recent experimental work found that financial advice presented through human-AI collaboration could be accepted more readily than equivalent advice presented as coming from AI alone, with affective and cognitive trust both contributing to the result. These studies relate primarily to investment advice and should not be generalised directly to routine retail banking. They nevertheless suggest that the perceived source of judgement remains relevant in consequential financial decisions.[^44]

### Escalation 6: Customer choice

The sixth is customer-choice escalation.

Even where the institution is satisfied that an activity can be completed safely through an AI system, the customer may prefer not to use it.

This preference should not be regarded simply as a failure of digital adoption.

The Central Bank's digitalisation requirements provide that guidance, support and assistance must be available when consumers use digital platforms for financial products or services. The broader objective is not to maximise digital containment but to secure appropriate customer outcomes regardless of the technology through which the service is delivered.[^31]

A relationship model which requires customers to remain with an AI assistant against their preference would therefore misunderstand the role of the technology.

The appropriate service principle is that the customer should not need to choose between continuity and human contact.

They should be able to move from one to the other without losing the context already established.

### Handover without restart

This is where many current handover models are weak.

In conventional digital servicing, escalation often means leaving the existing journey. A customer may move from a chatbot to live chat, from an application to a telephone call, or from an online process to a branch. The new channel then asks the customer to identify themselves, describe the problem and repeat information already provided elsewhere.

Operationally, this is a handover.

From the customer's perspective, it is frequently a restart.

A persistent relationship architecture should allow a different model.

When a human banker enters the interaction, they should receive a concise and governed representation of the relevant context:

- the customer's stated objective;
- what has already been discussed;
- the facts which have been confirmed;
- the actions which have already occurred;
- the relevant application or product state;
- the reason for escalation;
- the unresolved question;
- and any information which should not be relied upon without reconfirmation.

The adviser should therefore begin at the point where the automated interaction stopped rather than at the point where the customer's relationship with the bank originally began.

This changes the economics of human involvement.

A significant part of an employee's time in a complex interaction can be consumed reconstructing context before exercising any specialist judgement. If the system performs that reconstruction reliably in advance, the human interaction can become shorter while potentially becoming more valuable.

The employee spends less time locating information and more time interpreting it.

This is consistent with the broader development of AI copilots within financial institutions. The Bank for International Settlements distinguishes between AI systems which augment employees and more agentic systems which automate defined tasks, while concluding that human oversight is likely to remain important under either model. It also identifies workforce reskilling and the development of new capabilities as necessary consequences of increased AI adoption.[^29]

The likely future role of a relationship manager may therefore involve working with the relationship layer rather than working around it.

Before speaking to a customer, the banker can be presented with the customer's relevant goal, progress against it, previous interactions and outstanding matters.

During the interaction, the system can retrieve product information, record confirmed facts, prepare calculations and document agreed actions.

After the interaction, routine follow-up can return to the digital relationship layer.

The human conversation becomes an intervention within a continuous relationship rather than a separate service episode.

### Expertise, scale and the value of human time

This also creates a different relationship between expertise and scale.

Under the traditional operating model, providing access to an experienced specialist can be expensive because the specialist's time is consumed by both high-value judgement and lower-value administrative activity. If the administrative and contextual workload is reduced, the same expert capacity can potentially serve a larger population.

The consequence may therefore be the opposite of the simple substitution narrative.

AI could make access to human expertise more, rather than less, broadly available if it reduces the amount of expert time required to deliver each meaningful intervention.

This possibility should not be overstated. Productivity improvements do not automatically result in broader service access. Institutions may choose instead to reduce cost, increase volumes or reallocate staff elsewhere. The point is that a reduction in the non-specialist workload changes the economic constraint which previously limited access.

It also suggests that the value of human interaction may rise as its frequency falls.

Where every routine servicing activity requires human intervention, much human capacity is devoted to transactions which contain relatively little judgement.

Where routine activities are handled elsewhere, a customer's interaction with a person is more likely to occur because there is a substantive reason for it.

The human banker becomes less of a transaction processor and more of an exception handler, adviser, interpreter and accountable decision participant.

That role is potentially more demanding, not less.

It requires staff to understand the boundaries of automated systems, recognise when AI-generated information should be challenged, manage exceptions efficiently and interpret a customer context which may have been assembled partly by machines.

### Automation bias and effective oversight

This introduces the problem of automation bias.

Human oversight is not effective merely because an employee is shown an AI-generated recommendation and given the technical ability to reject it. People may defer excessively to automated outputs, particularly where the system is usually accurate or where questioning it creates additional effort.

The AI Act explicitly recognises this risk. Article 14 requires human overseers of high-risk AI systems to remain aware of the tendency to rely or over-rely automatically on AI outputs.[^41]

Experimental research reinforces the concern. Klingbeil, Grützner and Schreck found in a 2024 behavioural experiment that participants could over-rely on AI advice in financially risky decisions, including when the advice conflicted with other available contextual information and was contrary to the participant's interest. The study was not conducted within a retail bank and should not be interpreted as a direct estimate of banker behaviour. It nevertheless demonstrates why human-in-the-loop arrangements should not be assumed to resolve AI risk automatically.[^45]

Effective oversight therefore requires more than a handover button.

Employees need to understand:

- what the system has done;
- which information is authoritative;
- which information has been inferred;
- what the system's permitted authority is;
- why escalation occurred;
- and what decisions remain genuinely open to human judgement.

The interface should support challenge rather than encourage passive acceptance.

This may mean showing evidence and provenance rather than simply presenting the model's conclusion.

For example, rather than telling a mortgage adviser:

> Customer appears suitable for Product A.

the system can present:

- the customer has confirmed a particular home-purchase objective;
- relevant financial facts have been retrieved from specified systems;
- a deterministic eligibility service has returned a particular outcome;
- two pieces of information remain unconfirmed;
- and the customer has asked to discuss a trade-off between repayment certainty and flexibility.

The adviser is then given material on which to exercise judgement rather than a recommendation whose reasoning is difficult to interrogate.

### Where accountability sits

This distinction also supports accountability.

If a human employee is responsible for a regulated decision, the architecture should not allow accountability to become ambiguous because an AI system contributed to the process.

The employee or accountable function must remain capable of understanding the basis upon which the decision is being made and of rejecting the system's contribution where appropriate.

Conversely, not every system action should require a human employee to become nominally accountable for routine automation. Requiring manual approval of every low-risk action would recreate the cost structure the system is intended to improve without necessarily adding meaningful protection.

The design problem is therefore to place human authority at consequential boundaries, rather than indiscriminately throughout the workflow.

This can be represented as a continuum.

At one end are activities such as retrieving current product information, locating an application status or reminding a customer about an agreed action. These can often be highly automated.

Further along are activities such as interpreting an objective, identifying a potentially relevant need or preparing an application. These may be automated within defined constraints but require confirmation before consequential action.

Further again are activities involving exceptions, vulnerability, regulated advice, material discretion or decisions significantly affecting the customer. These create stronger reasons for competent human participation.

The boundary should be determined by the nature of the activity and its consequence, not by whether the customer happens to have arrived through a digital channel.

This is consistent with the Central Bank's treatment of vulnerability. The Consumer Protection Code requires appropriately trained persons to be available and requires reasonable assistance to continue where needed. A customer should not become less entitled to competent human support because an AI system successfully managed the first part of the interaction.[^31]

The inverse is also true.

The presence of vulnerability does not necessarily mean that every element of the customer's banking activity must become manual.

A customer experiencing bereavement might benefit from a system which prevents them from repeatedly explaining the same circumstances, identifies which administrative tasks have already been completed, coordinates documents across relevant processes and ensures that agreed follow-up occurs.

Human support and automation can therefore be complementary even in sensitive circumstances.

The important question is which function each performs.

This complementarity is beginning to appear within academic work on AI and relationship lending. A 2025 BIS working paper examining banks' adoption of AI in credit scoring concludes that AI-based processing of hard information can coexist with relationship lending based on softer information acquired through close interaction. The study concerns lending to firms and should not be treated as evidence for the retail service model proposed here. Its broader implication is nevertheless relevant: improved machine processing of codifiable information need not eliminate the value of human relationships where those relationships contribute different information or judgement.[^46]

A similar division may emerge in retail banking. The artificial system can be particularly strong where continuity depends on retrieving, structuring and coordinating information at scale. The human can be particularly strong where the situation is exceptional, ambiguous, emotionally significant or requires accountable professional judgement. The two capabilities need not compete for the same work.

### Trust, disclosure and institutional voice

There is also a customer-trust dimension to this design.

Trust in AI-mediated financial services is not simply a function of model accuracy. Research into robo-advice consistently identifies perceived competence, transparency, privacy and institutional reputation as contributors to adoption. A 2024 study published in the International Review of Economics & Finance found that perceived performance, ease of use, privacy protection and corporate reputation contributed to trust and willingness to use robo-advisory services. Qualitative research with users of an operational bank robo-adviser has similarly identified lack of transparency and incomprehensible information as sources of distrust.[^47]

For a traditional bank, this creates an important advantage and an obligation.

The bank does not introduce an AI relationship layer into a trust vacuum. It already possesses a regulated institutional identity, existing customer relationships and established mechanisms for complaint, accountability and redress.

The AI should extend those characteristics, not attempt to create a separate personality which competes with them. A customer should understand that they are dealing with the bank. They should understand when an answer comes from a controlled bank system. They should understand when a human has become responsible for the interaction. They should know how to challenge an outcome.

The existence of a named AI assistant can make the service approachable, but the ultimate source of trust must remain institutional.

This is particularly important if an error occurs.

A third-party general-purpose agent may describe itself as providing information rather than acting as the customer's regulated financial institution. A bank-owned agent operates within a different relationship. Customers may reasonably attribute statements and actions made through the bank's official interface to the bank itself.

The institution therefore cannot distance itself from poor outcomes by treating the agent as an independent actor.

Accountability remains with the bank.

This should influence language as well as architecture.

The system should avoid presenting itself as possessing personal authority it does not have. Statements such as “I have approved your mortgage” are inappropriate where the decision has been made by an underwriting system or authorised employee.

A more accurate interaction would identify the institutional action:

> Your mortgage application has now been approved.

Similarly, the agent should distinguish between explanation, recommendation and decision.

It can say:

> Based on the information you've given me, these are the three fixed-rate options available for us to discuss.

That is different from implying that the model itself has independently determined which mortgage the customer should choose. The distinction may appear semantic. In regulated financial services, it is not. It preserves the boundary between the conversational interface and the accountable banking capability beneath it. The same principle should govern handover.

A poor handover says:

> I can't help with that. Please call us.

A better handover says:

> This needs one of our mortgage specialists. I already have the information we've discussed and your application details, so you will not need to start again. I can bring them into the conversation or arrange a time that suits you.

The difference is not simply customer experience.

The second model treats the human as part of the same relationship architecture.

### Organisational and workforce implications

This gives rise to a broader organisational implication.

If AI assumes a larger role in routine customer interaction, human banking roles may become less numerous in some activities while becoming more specialised in others. The knowledge required of employees may also change. Staff will need not only product and regulatory competence but an understanding of how AI-generated context is produced, when it can be trusted, when it requires verification and how to correct it.

The BIS has identified retraining and upskilling as central to AI-intensive operating models even where AI is primarily used as a copilot rather than as an autonomous agent.[^48]

Banks may therefore need to regard AI literacy as part of operational competence rather than as a specialist technology skill. This does not mean every mortgage adviser needs to understand transformer architecture. It means employees should understand the practical limits of the systems with which they work. They should know that an extracted fact may have been inferred rather than confirmed. They should recognise when an AI-generated summary omits a material nuance. They should understand how to correct persistent customer state.

They should know when a system output is authoritative because it came from a deterministic bank capability and when it is merely interpretative.

Without that distinction, a more sophisticated interface can paradoxically reduce rather than improve professional judgement by making machine-generated information appear more certain than it is.

The operating model should consequently be designed around human-machine complementarity, but without assuming that complementarity emerges automatically. It has to be engineered. Appropriate activities must be allocated to each form of capability. Authority boundaries must be explicit. Escalation conditions must be testable. Employees must have sufficient context and authority to intervene. Customers must be able to request a person. And the transition between automated and human service must preserve continuity. The objective is not to maximise automation. Nor is it to preserve human involvement for its own sake.

It is to minimise the amount of scarce human capacity consumed by work which does not require human capability, while ensuring that human capability remains readily available where it materially improves the outcome.

That produces a different interpretation of the phrase personal banker for everyone.

It does not mean allocating a named employee to every customer.

It means giving every customer access to some of the functions historically associated with a personal banking relationship — continuity, context, coordination and progression — while making human expertise available at the points where a person adds material value.

In this model, AI is not the replacement for the banker. It is partly the mechanism which makes the banker economically available when the banker is actually needed. That is potentially a more significant service change than either complete automation or preservation of the existing model. It also returns the analysis to the strategic question raised at the beginning of this paper.

If traditional banks can combine persistent digital relationships with their existing human expertise, regulated processes, product manufacturing and execution capabilities, they possess a set of assets which general-purpose third-party agents do not automatically have.

The relationship layer can understand the objective. The bank can execute against it. The human banker can intervene where judgement is required. The customer does not have to reconstruct the relationship when moving between those modes. That combination may represent one of the principal advantages available to incumbent banks in an agentic financial system. But it also raises a further question.

If the operating model is no longer organised principally around individual product journeys, and if customer relationships increasingly span AI systems, deterministic banking capabilities and human intervention, then the institution itself must be able to operate across the organisational boundaries which currently separate those functions.

The challenge therefore moves from customer experience to bank operating model and architecture.

A persistent relationship layer cannot deliver a coherent experience if the underlying institution remains unable to share state, invoke capabilities across product domains or assign accountability when activity crosses organisational boundaries.

The next section considers that problem: what persistent AI relationship banking would require from the operating model of a traditional retail bank, and whether the principal barriers are technological, organisational or both.

## 8. Operating model and architecture: from product silos to relationship orchestration

The service model described in the preceding sections depends on more than an improvement in the customer interface. A persistent relationship layer cannot create a coherent experience if the underlying institution remains unable to access relevant state across products, invoke existing capabilities consistently or determine who is accountable when activity crosses organisational boundaries.

This is one of the reasons why artificial intelligence programmes in banking can appear more advanced from the outside than they are operationally. A conversational system may be able to understand the customer's intention with considerable sophistication while the bank beneath it remains organised around separate product systems, data stores, workflow engines, teams and control structures. The model can therefore know what should happen next without necessarily being able to make it happen.

The principal barrier in this case is not the intelligence of the model.

It is the architecture of the institution.

Traditional retail banks have accumulated technology estates over long periods and for legitimate reasons. Core banking systems, card platforms, mortgage engines, payment infrastructure, fraud systems, identity services, customer relationship management platforms and document repositories have each evolved in response to different regulatory, operational and commercial requirements. Many are reliable precisely because their responsibilities are tightly defined. The difficulty arises when a customer objective requires several of these systems to operate as though they form part of one continuing relationship.

A customer attempting to purchase a first home may interact with savings systems before a mortgage application exists, a mortgage platform once the application begins, separate identity and document services during onboarding, protection systems before drawdown and servicing systems after completion. Each may be well engineered in isolation. The fragmentation appears only when viewed from the perspective of the customer's objective.

This creates a distinction between system integrity and relationship coherence.

A bank may possess highly reliable product systems while still requiring the customer, or an employee acting on their behalf, to coordinate between them.

The role of the proposed relationship layer is not to remove those product boundaries. They continue to serve important contractual, accounting and control functions. It is to create sufficient interoperability above them that the customer does not need to reproduce the bank's internal organisation in order to progress an objective.

This has implications for both architecture and operating model.

From an architectural perspective, the relationship layer requires a mechanism through which capabilities distributed throughout the institution can be exposed in controlled form. Contemporary banking technology strategies frequently describe this in terms of modular architecture, APIs and event-driven systems. McKinsey's recent analysis of core banking modernisation characterises the emerging model as moving away from monolithic systems towards more modular financial engines in which capabilities can be shared through secure APIs and events. Although this represents an industry perspective rather than a regulatory requirement, the architectural direction is relevant: a relationship agent can only coordinate across the institution if the institution's capabilities can be invoked independently of the channel in which they were originally built.[^49]

This does not imply that every legacy platform must first be replaced.

Indeed, a requirement to modernise the entire banking estate before developing a relationship layer would significantly weaken the practicality of the model. Large financial institutions cannot generally replace core systems through a single transformation without introducing material operational risk. Progressive approaches, in which existing systems are surrounded by controlled interfaces and capabilities are migrated incrementally, are consequently more realistic. McKinsey describes this pattern as a form of progressive renewal, including "strangler" architectures in which modern interfaces progressively isolate and replace parts of older systems without requiring a single cutover.[^49]

For the relationship model proposed here, the important architectural unit is therefore not the underlying application but the banking capability.

A mortgage platform may contain dozens of internal processes. The relationship layer may only need controlled access to a small number of capabilities:

- retrieve current application state;
- identify outstanding information;
- obtain eligible product options;
- submit confirmed customer information;
- request documentation;
- book or initiate specialist support;
- record a customer decision;
- receive notification when the application state changes.

Similarly, a savings system need not expose its entire internal architecture. It may provide capabilities to retrieve a balance, identify progress towards a customer-authorised target or create an instruction subject to the normal authentication and consent controls.

This approach changes the relationship between channels and banking systems.

Historically, a digital channel has often contained substantial product-specific logic. A mortgage website knows how to conduct a mortgage journey. A mobile application knows how to initiate certain servicing actions. A branch employee may use an entirely different internal interface to access the same underlying product.

A persistent relationship layer instead benefits from a model in which channel-specific interfaces call reusable institutional capabilities.

The same authoritative service which returns an application state to a mobile application can return that state to an AI relationship agent.

The same affordability engine which supports a structured mortgage journey can be invoked when a customer asks an equivalent question conversationally.

The same identity service can establish authentication irrespective of whether the customer arrived through a menu, an adviser or an agent.

In this model, the agent is not granted unrestricted access to core banking systems.

It is granted access to a catalogue of bounded tools.

Each tool has a defined purpose, input schema, permission model and output. The banking system, rather than the language model, remains responsible for enforcing the conditions under which the underlying capability can be used.

This is an important control point.

A system in which a language model is permitted to generate arbitrary instructions against internal infrastructure would be difficult to reconcile with the reliability and security requirements of a bank. A more defensible pattern is one in which the model can select among explicitly authorised actions and supply validated inputs, while access control, authentication, policy enforcement and transactional integrity remain outside the model.

The relationship layer can therefore be conceptualised as an orchestration architecture:

```text
Customer
    ↓
Conversation / digital interface
    ↓
Relationship layer
    ├── customer context
    ├── confirmed goals
    ├── plan and milestone state
    ├── need interpretation
    ├── permissions and provenance
    └── orchestration logic
              ↓
        Controlled capability layer
              ↓
    ┌─────────┼──────────────┬──────────────┐
    │         │              │              │
Identity   Payments      Lending         Savings
    │         │              │              │
    └─────────┴──────────────┴──────────────┘
              ↓
       Systems of record
```

The value of this structure lies partly in separation of responsibilities.

The relationship layer answers:

> What is the customer trying to achieve, and which authorised capability is relevant next?

The capability layer answers:

> Can this action be performed, under what conditions, and what is the authoritative result?

The systems of record answer:

> What is the actual institutional state?

Those questions should not be collapsed into a single AI component. The distinction also allows the bank to preserve existing controls while changing the experience around them. A mortgage decision can continue to be made by the same controlled underwriting systems. A payment can continue to require the same authentication. A document requirement can continue to originate from the existing application process. The AI layer changes how those capabilities are discovered, coordinated and explained.

This is one reason why the phrase AI transformation can be misleading. The customer-facing change may be substantial while the most important design principle beneath it is conservative: do not replace deterministic capabilities which already perform their function reliably merely because a new conversational interface has become available.

The architecture must also be event-driven.

A relationship which persists over time cannot depend entirely on the customer returning and asking for an update. The system needs to know when relevant state has changed.

An application has moved to assessment. A required document has been received. A savings threshold has been reached. A target date is approaching. A previously incomplete action has been completed by another participant. These are not conversational events. They originate in operational systems.

The relationship layer therefore requires a controlled mechanism through which significant events elsewhere in the bank can update customer state and, where appropriate, cause the plan to be reconsidered.

Again, the event should not automatically generate customer contact.

It should alter state.

A separate decision determines whether customer contact is justified.

This distinction preserves the principle developed earlier that a persistent relationship should not become a mechanism for generating engagement for its own sake.

The flow is:

```text
Banking event
      ↓
Relationship state updated
      ↓
Plan evaluated
      ↓
Does this materially change the next useful action?
      ↓
Yes → contact / action / escalation
No  → retain state
```

This is operationally different from campaign management.

The trigger is derived from progress within a customer-approved objective rather than from an independent marketing schedule.

The requirement for interoperability extends to data as well as actions.

A relationship layer requires enough information to establish context, but the preceding section argued against building a single unrestricted customer memory containing every fact available to the institution. The architecture therefore needs a mechanism for retrieving information from authoritative sources without indiscriminately replicating it.

This suggests a federated model of context.

Some information belongs in the persistent relationship state because the relationship itself depends upon it: confirmed goals, agreed milestones, selected preferences and relevant future actions.

Other information should remain within its system of record and be retrieved only when necessary.

A current-account balance does not necessarily need to be copied permanently into relationship memory if an authorised balance service can provide it when required.

A mortgage status should remain authoritative within the mortgage system.

A sensitive health disclosure required for a particular insurance process should not need to migrate into a general-purpose relationship profile.

The relationship layer therefore needs to know where information can be obtained as well as what information it should itself retain.

This separation has operational benefits as well as privacy benefits. Copying the same data into several AI-specific stores creates problems of reconciliation, accuracy and lineage. Referencing authoritative sources reduces the likelihood that the system relies on stale replicas.

The broader objective is to produce a context fabric, rather than a second customer database.

The fabric provides the relationship layer with controlled access to relevant customer and product information while preserving clear ownership of the underlying records.

This raises a related issue concerning identity.

A persistent AI relationship cannot be more authoritative than the identity context within which it operates.

A public website conversation with an unauthenticated visitor is fundamentally different from an authenticated conversation within mobile banking. The system may be capable of preserving conversational continuity across both environments, but the actions and information available should change when the customer's identity changes.

Authentication therefore needs to be treated as a dynamic property of the relationship rather than as a once-off login event. Before authentication, the system may discuss general banking information, explore a customer objective and explain requirements. After authentication, it may retrieve personal information and application state. Before a consequential instruction, stronger authentication or explicit transaction confirmation may still be required. The conversational experience can remain continuous even as authority changes underneath it.

Conceptually:

```text
Anonymous
    ↓
Recognised / returning
    ↓
Authenticated
    ↓
Strongly authenticated for consequential action
```

The relationship agent should always know which level applies. The customer should not need to understand the technical distinction, but the system must. The operating model implications are at least as significant as the technical ones. A persistent customer goal frequently cuts across product ownership.

The customer seeking to buy a home does not necessarily distinguish the part of the bank responsible for savings from the part responsible for mortgage lending or protection. Internally, however, those capabilities may have separate commercial targets, technology backlogs, governance forums and executive ownership.

The relationship layer introduces a new organisational object which sits horizontally across those structures.

This can create tension.

If each product area optimises independently for conversion, the overall customer plan may not be optimal.

If the mortgage business is measured on mortgage conversion, savings on savings growth and personal lending on lending volumes, no single product owner is naturally accountable for the decision that the best outcome for the customer is to defer borrowing and continue saving.

A goal-led model therefore requires at least some metrics and decision rights which operate above individual products. This is not an argument for abolishing product accountability. Products remain economically and regulatorily distinct. It is an argument for recognising that customer outcomes can span them.

The development of platform operating models within banking is relevant in this regard. Industry work on AI-enabled banking increasingly advocates cross-functional platforms which combine business, technology, data and control capabilities around customer or enterprise outcomes rather than maintaining a strict separation between business demand and technology delivery. McKinsey's platform model, for example, describes teams which combine funding, technology and business accountability around reusable capabilities rather than treating technology as a service supplied independently to product units.[^49]

The precise organisational form will differ materially between institutions, and there is no reason to assume that a platform model is the only viable answer. The broader principle is more important: a relationship service spanning several products needs persistent ownership across the same boundaries.

Someone must own:

- the relationship-state model;
- the catalogue of goals and needs;
- the rules determining which capabilities can be invoked;
- the cross-product customer experience;
- the escalation model;
- and the governance of how customer context is reused.

If ownership is distributed entirely among product teams, the relationship layer risks becoming another channel through which existing silos are exposed.

A related issue concerns incentives.

A system which is instructed at product level to maximise conversion can behave very differently from one governed at relationship level to progress a customer objective.

This is not simply a prompt-design problem.

It reflects organisational priorities.

If a customer would benefit from delaying a product decision, the system must be permitted to produce that outcome even if a product team would prefer immediate conversion.

The relationship architecture therefore requires a clear hierarchy of objectives. Customer protection and regulatory obligations sit above commercial optimisation. Customer-approved goals and constraints inform the service strategy. Product conversion becomes one possible outcome within that framework, rather than the objective through which every interaction is evaluated.

The existence of such a hierarchy is important because artificial systems are capable of applying institutional incentives with considerably greater consistency and scale than individual employees.

A poorly aligned incentive embedded in software can be replicated across millions of interactions.

The organisational design around the agent is therefore part of its conduct-risk framework.

The relationship layer also creates a new form of model and service governance.

Traditional model governance often assumes a relatively well-defined model performing a relatively well-defined function: a credit score, fraud model or pricing model. A general-purpose foundation model can contribute to many different activities while being supplied by an external provider and updated independently of the bank's release cycle.

The Bank of England and Financial Conduct Authority's 2024 survey of AI use across financial services illustrates the scale of this governance problem. Seventy-five per cent of responding firms reported already using AI, with a further 10 per cent planning to do so within three years. One third of reported AI use cases involved third-party implementations, and the top three model providers accounted for 44 per cent of all model providers named by respondents. Firms identified third-party dependency, model complexity and embedded or hidden models among the risks expected to increase most over the following three years.[^50]

The survey also provides an important counterweight to assumptions about autonomy. Fifty-five per cent of reported AI use cases contained some degree of automated decision-making, but only 2 per cent were described as fully autonomous. Twenty-four per cent of those involving automation were semi-autonomous, with humans deliberately retained for critical or ambiguous decisions.[^50]

This supports the architectural direction developed in previous sections: the near-term banking model is more plausibly one of bounded automation than unrestricted agency.

Third-party concentration becomes especially important where the relationship layer is central to customer servicing.

A bank which relies upon external foundation-model providers does not transfer accountability for the banking service to those providers.

It must remain capable of understanding the service sufficiently to govern it, monitor performance, manage failure and substitute providers where necessary.

This is now closely connected to operational-resilience regulation.

The EU Digital Operational Resilience Act has applied since January 2025 and establishes harmonised requirements concerning ICT risk management, incident reporting, resilience testing and the management of ICT third-party risk across financial entities. It also creates an EU oversight framework for ICT providers designated as critical to the financial sector.[^51]

In November 2025, the European Supervisory Authorities designated the first critical ICT third-party providers under that framework following an assessment of their systemic importance, the functions they support and the substitutability of their services.[^51]

The relevance to AI is increasingly direct. In July 2026 the European Supervisory Authorities issued a joint statement specifically calling for robust governance and risk-management arrangements in relation to frontier AI models, including cyber and operational-resilience risks associated with their use.[^51]

The implication for a bank building a persistent AI relationship layer is that model portability and graceful degradation become architectural requirements, not merely procurement preferences.

If a particular foundation model becomes unavailable, the customer should not lose access to their bank.

If a model provider changes materially, the bank should be capable of evaluating the change before exposing it across consequential use cases.

If a sophisticated reasoning model is unavailable, the institution may need to fall back to a narrower service rather than fail entirely.

The relationship state should therefore be independent of the foundation model, as argued previously. Tools should have stable contracts. Controls should sit outside the model. A fallback model or conventional user interface should be capable of accessing the same authoritative bank state. This can be described as model-agnostic service architecture.

The objective is not to pretend that models are interchangeable; their capabilities differ materially. It is to ensure that the bank remains the owner of the customer service even where important components are supplied externally.

Operational resilience also requires consideration of failure modes within individual interactions. An AI agent may be unavailable. A tool may time out. An underlying product service may return inconsistent information. An event may be delayed. The orchestration layer therefore needs explicit failure behaviour. Where a balance cannot be retrieved, the agent should not estimate it from an earlier conversation. Where an application system is unavailable, the system should say so rather than infer status.

Where a customer action cannot safely be completed, the system should retain the context and offer an alternative route. The conversational quality of the interface should not obscure the operational state beneath it.

This is another respect in which agentic systems differ from conventional web interfaces. A disabled button makes failure visible. A conversational model can continue speaking fluently even when an underlying service is unavailable.

The architecture must therefore constrain the model from substituting plausibility for unavailable state.

A related requirement is observability.

A complex agentic service can involve model calls, tool calls, rules, identity decisions, policy checks and events from multiple underlying systems within a single customer interaction.

The bank must be capable of reconstructing what occurred.

Operational telemetry should therefore capture, as appropriate:

- customer/session identifier;
- authentication state;
- model and version;
- tools requested;
- tools permitted or denied;
- authoritative outputs returned;
- rules applied;
- material state changes;
- human handovers;
- errors and fallbacks;
- customer confirmations;
- final actions taken.

This is not equivalent to storing unrestricted internal model reasoning. It is service observability. Without it, customer complaints, operational incidents, model evaluation and regulatory review become materially more difficult. The relationship architecture also requires evaluation which extends beyond conventional model benchmarks.

A foundation model may score highly on generic reasoning tests while performing poorly in the institutional environment in which it will operate.

The relevant questions include:

- Does it extract customer facts accurately?
- Does it distinguish stated information from inference?
- Does it select the correct authorised capability?
- Does it recognise when a tool has failed?
- Does it avoid presenting unavailable information as fact?
- Does it respect the boundary between explanation and advice?
- Does it preserve customer context correctly after handover?
- Does it identify situations requiring escalation?
- Does it recover safely when the customer changes objective mid-conversation?

These behaviours must be tested end-to-end. They belong partly to model evaluation and partly to software testing. The separation between those disciplines becomes less useful as the model becomes an embedded component of an operational service. This reinforces the need for cross-functional ownership. A production relationship agent cannot be governed effectively by a technology team alone. Nor can it be governed solely through conventional product management.

It requires involvement from engineering, product, operations, legal, compliance, data protection, information security, model risk, conduct risk and relevant business owners.

This could easily result in governance so extensive that the system becomes impossible to change.

The objective should therefore be to establish reusable control patterns rather than convene a new bespoke governance process for every conversation type.

For example, banking capabilities can be classified by consequence. Low-risk read-only tools may operate within one approval pattern. Tools which alter non-financial customer state may require another. Tools which create contractual or financial consequences may require explicit customer confirmation and stronger controls. Activities requiring regulated advice or discretionary decisions may require human involvement. Once those classes have been defined, new capabilities can be assessed against an established framework. The operating model therefore needs to become capability-governed, not prompt-governed. This distinction is significant.

A prompt can instruct a model not to perform an action. A capability architecture can make the action impossible unless the relevant control conditions are satisfied. Banks should prefer the second wherever the consequence is material. The same principle applies to competition between proprietary and third-party agents.

If external agents increasingly act on behalf of customers, banks will need to determine which capabilities those agents can access, under what authorisation and with what evidence that they are acting within the customer's authority.

The technical mechanics of agent identity and delegation are still developing and are likely to evolve materially. The strategic requirement is clearer.

A bank capable of exposing its services through controlled, machine-readable interfaces is better positioned under either strategic outcome identified in Section 1.

If the bank owns the customer relationship, those capabilities support its own agent.

If a third-party agent owns or shares the interface, the same capabilities allow the bank to participate as a provider rather than being inaccessible to machine-mediated distribution.

This means the architectural investments required for a bank-owned relationship agent and those required for agent-compatible distribution are partly complementary.

Both benefit from:

- machine-readable product information;
- controlled APIs;
- clear authentication and delegation;
- event-driven state;
- consistent product rules;
- observable transactions;
- and reusable institutional capabilities.

The strategic choice is therefore less about whether to build APIs for agents and more about which side of those APIs the bank intends to occupy with the customer.

That distinction returns to relationship ownership. A bank may conclude that becoming the most efficient provider of products to external agents is commercially attractive. Another may conclude that maintaining a direct intelligent relationship with the customer is strategically important. Many institutions will likely pursue both. The architecture should not require that decision to be made irreversibly today. It should make both possible. This is an important reason not to design the relationship layer as another self-contained digital channel.

If it becomes a separate application containing its own product logic, its own copied customer data and its own bespoke journeys, it will reproduce the architectural fragmentation the model is intended to overcome.

The more durable approach is to treat the relationship layer as a consumer of shared institutional capabilities. The same capabilities can serve mobile banking, employees, third-party channels and future agents. The relationship layer differentiates itself through context, continuity and orchestration rather than through ownership of the underlying banking logic. The organisational consequence is similar.

A successful agentic relationship model should not become a new business unit which competes with products for ownership of the customer.

It needs sufficient authority to coordinate across products while preserving product accountability for the underlying financial services.

This is likely to require explicit executive sponsorship because the necessary decisions often cut across conventional boundaries.

Questions such as:

- Who owns persistent customer goals?
- Who decides when one product should be suppressed because it conflicts with another objective?
- Which data can be reused across journeys?
- Who owns the taxonomy of customer needs?
- Who determines the authority available to the agent?
- Who is accountable for cross-product customer outcomes?

cannot be resolved purely within a technology backlog. They are operating-model questions. This may be the most difficult part of the transformation. Technology can be procured. Interfaces can be built. Models will continue to improve. Organisational boundaries change more slowly because they reflect accountability, economics and established sources of authority. It is therefore possible that the principal constraint on persistent relationship banking will not ultimately be model capability.

It may be whether institutions which have spent decades optimising products independently can create sufficiently strong horizontal mechanisms to optimise the relationship between them.

The evidence from AI adoption in financial services makes this distinction increasingly relevant. The Bank of England and FCA's survey found that large banks already report substantially more AI use cases than the median financial firm, yet firms continue to identify data, skills, security and third-party dependencies as significant constraints.[^50] The challenge is shifting from proving that AI can be used somewhere within the institution to determining how it becomes part of a controlled operating model at scale.

That transition is unlikely to happen through a single transformation programme. A more credible path is incremental. A bank can begin with a bounded customer objective. It can expose a limited set of existing capabilities. It can create structured relationship state for that objective. It can define clear escalation boundaries. It can measure whether the model reduces customer effort and employee administration without weakening control. Additional goals and capabilities can then be added progressively. This approach has two advantages.

First, it limits the operational consequence of failure while the model is still being evaluated. Second, it creates empirical evidence about whether the relationship proposition is actually valuable.

The case for persistent AI relationship banking should ultimately be demonstrated through customer and operational outcomes, not through the quality of a prototype conversation.

That distinction is important.

An impressive demonstration may establish that the interaction is technically plausible.

It cannot establish that customers will trust the system, that it reduces cost, that employees can work effectively with it, that underlying banking processes can support it, or that commercial value persists once governance and operational controls are included.

Those are operating-model questions which must be tested in production-like conditions. The architecture proposed in this section can therefore be summarised through several principles. The AI model should not be the system of record. Product systems should remain authoritative for the financial state they own. The relationship layer should retain only the persistent state required for continuity. Banking actions should be exposed as bounded capabilities rather than unrestricted system access. Material decisions should remain within deterministic or appropriately governed decision processes.

Events should update relationship state without automatically producing customer contact. Identity and authority should strengthen dynamically according to the action being attempted. The service should remain operable if a particular AI provider becomes unavailable. Human and automated interactions should consume the same underlying institutional state. And cross-product relationship outcomes require ownership above the individual product journey. None of these principles requires the bank to become technologically homogeneous. They require the institution to become sufficiently interoperable that the customer does not have to coordinate the fragmentation themselves.

This provides a practical definition of the proposed relationship layer. It is not another channel. It is not a replacement core. It is not the language model.

It is the governed orchestration layer which connects customer intent to the bank's existing capabilities and preserves continuity as that intent moves across products, systems and people.

That definition also creates a clearer basis on which the proposition can be tested.

If the model is correct, its value should appear in measurable changes to the customer and operating experience: less repetition, fewer unnecessary handovers, faster progression through complex journeys, better timing of product discussions, more effective use of specialist employees and greater continuity across interactions.

The next section therefore moves from architecture to evidence of value.

It considers how a bank should measure whether persistent AI relationship banking is actually improving outcomes, and why conventional measures such as chatbot containment, digital engagement and product conversion are insufficient on their own.

## 9. Measuring value: from interaction metrics to customer progression

A change in service model should ultimately be justified by evidence that it produces better outcomes. This is particularly important in artificial intelligence, where the quality of a demonstration can be mistaken for evidence of operational value. A system may conduct an impressive conversation without reducing customer effort, progressing a financial objective, improving the use of employee time or producing a better consumer outcome. Conversely, a relatively unremarkable interaction may create substantial value if it eliminates unnecessary repetition, prevents an inappropriate product discussion or ensures that an issue is resolved at the correct point in the customer's journey.

The measurement framework for persistent AI relationship banking should therefore follow from the purpose of the service rather than from the characteristics of the technology.

### Why conventional chatbot metrics mislead

This creates an immediate problem with several of the metrics commonly used to evaluate conversational automation.

Customer-service chatbots are frequently assessed through measures such as containment, deflection, average handling time, conversation volume and the proportion of enquiries completed without human intervention. These measures are useful where the objective is to automate a well-defined servicing task. A system designed to answer balance queries or explain opening hours can reasonably be assessed partly by whether it resolves those enquiries without consuming employee capacity.

The same metrics become less informative where the system is intended to maintain a relationship over time.

A customer who is transferred to a mortgage specialist because their circumstances require judgement may represent a successful outcome even though the conversation was not contained.

A customer who is told that no product should be taken out today may have been served well even though the interaction produced no conversion.

A system which asks fewer questions because it legitimately reuses existing information may create more value than one which achieves a shorter average handling time by giving a superficial answer.

A conversation which ends without completing any transaction may still have progressed the customer materially if it established a goal and clarified the actions required before the next interaction.

The central measurement question is therefore not:

> How much activity did the AI automate?

It is:

> Did the service help the customer make appropriate progress with less unnecessary effort while preserving the controls expected of a regulated bank?

That formulation is deliberately broader than customer satisfaction.

Satisfaction is important, but it is an imperfect proxy for a financial outcome. A customer may be highly satisfied with an interaction which results in easy access to unsuitable or excessive borrowing. A bank might equally produce an appropriate but unwelcome outcome by declining a credit application which the customer hoped would be approved. Consumer outcomes therefore need to be assessed through a combination of customer experience, progression, suitability, operational efficiency and control effectiveness rather than through a single attitudinal measure.

This position is consistent with the direction of Irish consumer regulation. The Central Bank of Ireland's Consumer Protection Code 2025 requires regulated firms not merely to comply with specific transactional rules but to ensure that their culture, strategy, business model, decision-making, systems, controls, policies and processes take customers' interests into account and to deliver fair outcomes. Its guidance states explicitly that securing customers' interests should form part of the firm's decision-making rather than operate solely as an ex-post compliance test.[^31]

The significance for AI measurement is substantial. A relationship layer should not be considered successful solely because it improves a commercial or operational metric if it does so by worsening customer outcomes elsewhere.

A system which increases the number of personal-loan applications while weakening a customer's ability to complete an imminent mortgage objective may perform well against a product target and poorly against the customer's interests.

A system which reduces average handling time by transferring more complex cases back to customers may improve an operational metric while increasing customer effort.

A system which increases engagement by frequently reminding customers about products may improve conversation frequency while making the relationship less useful.

Measurement therefore needs to retain the causal relationship between the customer's objective and the institution's action.

The concept of financial well-being provides one useful starting point, although it is too broad to function as an operational metric on its own. The OECD's recent work defines financial well-being in terms which include the capacity to meet financial needs and obligations, remain resilient to negative shocks, pursue aspirations and goals, make financial choices and feel secure about one's financial situation. It also emphasises that many retail financial products are complex, infrequently purchased and capable of producing significant consumer detriment.[^35]

This matters because the ultimate purpose of retail financial services is not product ownership as an end in itself. A mortgage has value because it enables the acquisition of a home. Savings provide value partly because they create liquidity, resilience or the ability to fund a future objective. Insurance provides value by transferring specified risks. Payments provide value because they allow economic activity to occur. The product is an instrument. The outcome exists outside the product.

A goal-led relationship layer makes that distinction more visible and creates an opportunity to measure service performance against it.

This does not mean that a bank can or should attempt to measure whether every customer's life objective has ultimately been achieved. Many outcomes depend heavily upon factors outside the bank's control. A customer may fail to purchase a home because property prices increase, because they choose not to proceed or because their employment circumstances change. It would be misleading to treat completion of the home purchase itself as a pure measure of banking-service quality.

The relevant task is to identify the parts of progression which the service can reasonably influence.

For a first-home objective, those might include whether the customer understands the deposit requirement, whether affordability can be established, whether unnecessary information is repeatedly requested, whether required documentation is completed, whether an application moves through the process without avoidable delay and whether relevant human support is introduced when required.

The bank is not accountable for whether the customer finds a suitable house.

It is accountable for the quality with which it performs the banking activities required around that objective.

### A measurement hierarchy

This suggests a measurement hierarchy. At the highest level sits the customer objective. Beneath it sit milestones representing material progress. Beneath the milestones sit actions and journeys controlled directly by the institution. And beneath those sit the individual interactions through which the work is performed.

The relationship can therefore be represented as:

```text
Customer objective
        ↓
Milestone progression
        ↓
Banking actions completed
        ↓
Applications / services
        ↓
Individual interactions
```

Conventional digital analytics frequently begin at the bottom of this hierarchy.

- How many people visited the page?
- How many opened the application?
- Where did they abandon?
- How long did the process take?

Those questions remain important. A goal-led model does not eliminate them. It provides a means of connecting them to a higher-order question: what was the customer trying to accomplish when the interaction occurred?

This can materially change how abandonment is interpreted.

A customer who begins a mortgage conversation and does not initiate an application might conventionally appear to have dropped out of the funnel.

If the relationship layer has established that the customer is six months short of the required deposit and has agreed a plan to continue saving, there may have been no failure.

Immediate conversion would arguably have been the wrong outcome.

Similarly, a product which is discussed but deliberately deferred should not necessarily be measured as lost conversion. It may represent evidence that the system sequenced the customer's needs appropriately.

### Why sales funnels are insufficient

This is one reason why conventional sales funnels are insufficient for assessing a relationship layer.

The funnel assumes a relatively linear commercial objective:

```text
Awareness
    ↓
Consideration
    ↓
Application
    ↓
Completion
```

The customer plan may be non-linear:

```text
Objective identified
        ↓
Need clarified
        ↓
Action deferred
        ↓
Milestone reached
        ↓
Need becomes relevant
        ↓
Application initiated
```

The passage of time is not necessarily leakage.

It can be part of the intended service.

This has particular significance for product attribution. If a mortgage is originated twelve months after a customer first discusses buying a home, conventional channel attribution may assign the eventual sale to whichever interface or campaign immediately preceded the application. A persistent relationship model provides evidence that the eventual product arose from a substantially longer chain of activity.

That does not mean all later revenue should be attributed to the relationship agent.

It does mean that simple last-touch attribution may understate the contribution of continuity.

Commercial measurement therefore needs to operate over a longer horizon.

Potential measures include the depth and durability of the customer relationship, retention, the proportion of relevant needs met by the institution and the economic value of relationships in which the bank has successfully helped customers progress significant objectives.

These remain commercial measures.

They become problematic only if they are allowed to replace outcome measures rather than sit alongside them.

### Category 1: Customer progression

The first category of outcome measurement should therefore be customer progression.

A customer objective should have identifiable states which permit the institution to determine whether the relationship is progressing, stalled or complete.

The exact milestones vary by goal. For a home purchase they may concern savings, readiness and application progress. For financial resilience they may concern creation of a reserve and reduction of high-cost debt. For retirement they may involve information gathering, assessment of projected income and completion of an appropriate advice process.

The purpose is not to quantify every human financial ambition through a single score. It is to identify observable changes for which the bank is capable of providing support.

Progression measures should also recognise that doing nothing can be an appropriate state.

If the plan establishes that the next relevant action should occur in three months, the absence of activity in the intervening period is not stagnation.

The relationship layer needs to distinguish between:

- a customer who is appropriately waiting;
- a customer who has abandoned the objective;
- a customer blocked by an unresolved banking action;
- and a customer whose circumstances have changed.

Without that distinction, proactive systems can become excessively interventionist.

### Category 2: Customer effort

The second category is customer effort.

One of the strongest propositions underlying persistent context is that the customer should not repeatedly perform work which the institution could appropriately perform itself.

Customer effort can therefore be measured relatively directly.

- How often did the customer supply the same factual information?
- How many separate channels were required?
- How often did the customer have to explain why they were contacting the bank?
- How many times did identity need to be re-established within the same legitimate journey?
- How much information could be populated from existing authoritative records rather than reconstructed manually?
- How many journeys required the customer to understand which internal product or team was responsible?

These measures are particularly useful because they assess one of the central hypotheses of the proposed model without requiring assumptions about customer sentiment.

A reduction in repeated information requests is observable.

A reduction in unnecessary channel switching is observable.

A reduction in the number of contacts required to progress the same matter is observable.

They also align with a broader body of customer-experience research which emphasises end-to-end journeys rather than isolated touchpoints. McKinsey's banking work has long argued that customer satisfaction and economic value are more closely connected to the performance of complete journeys than to optimisation of individual interactions, and cautions that digital transformation can fail where it focuses on technological touchpoints without accounting for the wider customer experience.[^52]

A persistent relationship architecture effectively extends the concept of the journey.

Rather than ending when a single product process completes, the journey can continue for as long as the agreed customer objective remains active.

### Category 3: Appropriateness and timing

The third category is appropriateness and timing.

This is more difficult to quantify, but it is central to the claim that goal-led banking differs from more sophisticated cross-selling.

The bank should be capable of measuring not only which products were surfaced but why and when.

- Was there an identified customer need?
- Was that need connected to a confirmed objective?
- Was the product relevant at the point at which it was introduced?
- Was another otherwise eligible product deliberately suppressed or deferred because it conflicted with the customer's immediate objective?
- Did the customer decline the topic, and was that decision subsequently respected?

These measures create evidence that the relationship layer is behaving in accordance with the logic described earlier.

They also provide an important counterweight to conversion incentives.

A system that successfully identifies ten additional product opportunities but fails to suppress irrelevant ones may appear commercially productive while creating a poorer customer relationship.

One possible metric is therefore the ratio between relevant needs identified and products surfaced, rather than the total number of products offered.

A lower number is not necessarily better or worse.

The purpose is to understand whether the institution is maintaining meaningful separation between discovery and sales activity.

### Category 4: Human-capacity effectiveness

The fourth category is human-capacity effectiveness.

Section 3 argued that part of the economic opportunity comes from reducing the amount of specialist employee time consumed by information reconstruction, administration and coordination.

This proposition should be measured explicitly rather than inferred from headcount reduction.

Relevant measures include the time employees spend preparing for interactions, the amount of information they must retrieve manually, average time devoted to administrative follow-up and the proportion of human interactions which involve genuine judgement or specialist work.

A system may increase the total number of human interactions while still improve productivity if those interactions become shorter and more consequential.

Equally, a reduction in human contact is not necessarily evidence of success if complex issues are simply left unresolved. The appropriate denominator is therefore not the number of employees avoided. It is the amount of human capacity required to produce an appropriate customer outcome. The distinction is important from both an economic and workforce perspective.

If an experienced mortgage adviser currently spends part of each interaction reconstructing information which the customer has previously supplied, reducing that time creates value without removing the adviser from the relationship.

The same employee capacity can support more customers or devote more time to complex cases.

That value should be visible in measurement.

### Category 5: Continuity

The fifth category is continuity.

This is perhaps the most distinctive metric for the model proposed in this paper.

If persistence is a central benefit, the institution should be capable of measuring whether customer context actually survives between interactions.

Possible measures include:

- the proportion of returning interactions in which the relevant active goal is successfully recognised;
- the proportion of factual information reused appropriately rather than requested again;
- the accuracy with which outstanding actions are carried forward;
- the rate at which human handovers preserve relevant context;
- and the proportion of future check-ins which occur for the reason originally agreed with the customer.

Continuity should also be measured negatively.

- How often did the system rely on stale information?
- How often did an old goal remain active after the customer had abandoned it?
- How often was information reused in a context for which it should have been reconfirmed?

A system can remember too much as well as too little.

### Category 6: Control effectiveness

The sixth category is control effectiveness.

AI systems should not be evaluated solely when they perform normally.

Their behaviour at boundaries and during failure is equally important.

Relevant measures include the frequency with which the system attempts actions outside its authorised capability, tool failure rates, escalation accuracy, frequency of unsupported factual statements, errors in extracted customer information, guardrail performance and the number and severity of incidents in which model output conflicts with authoritative banking state.

The Bank of England and FCA's 2024 survey of AI use in financial services found that firms expected third-party dependencies, model complexity and embedded models to become increasingly important sources of risk, while only a very small proportion of reported automated use cases were described as fully autonomous. The finding reinforces the importance of evaluating the wider operational system rather than model accuracy alone.

### A balanced scorecard

A customer-facing relationship layer should consequently be subject to a balanced scorecard rather than a single success metric.

At a conceptual level, that scorecard might contain:

- Customer progression
- Customer effort
- Appropriateness and timing
- Continuity
- Human-capacity effectiveness
- Control effectiveness
- Customer trust and satisfaction
- Commercial value

The order is important.

Commercial value belongs in the framework.

It should not sit above the others.

A banking service which does not create sustainable economic value is unlikely to persist regardless of how elegant its customer experience may be. The argument for goal-led relationship banking is not that commercial outcomes should be ignored. It is that commercial value should arise through successful relationships rather than serve as the sole objective through which those relationships are managed.

There are plausible reasons to believe that these objectives can align.

A customer who experiences less friction, receives more appropriate assistance and trusts the institution to understand their circumstances may be more likely to retain the bank as their principal financial provider. Improved knowledge can allow relevant needs to be identified earlier. Continuity may improve completion of complex journeys. Better timing may increase conversion when a product genuinely becomes relevant.

But these relationships should be demonstrated rather than assumed.

The bank should therefore measure commercial outcomes alongside customer outcomes and test whether the hypothesised relationship exists.

- For example, does successful progression of a significant customer goal increase subsequent retention?
- Do customers whose information is reused appropriately complete journeys at higher rates?
- Does reducing unnecessary handover increase satisfaction?

Does deferring a product when it is not immediately appropriate increase or decrease the longer-term probability that the customer chooses the bank when the need eventually arises?

Those are empirically testable questions. They are more useful than assuming that a more personalised conversation will necessarily increase relationship value. Customer trust also requires separate treatment. Trust is difficult to observe directly and should not be reduced to a single satisfaction question. It can nevertheless be approached through several measures.

Customers can be asked whether they understand why information is being requested, whether they believe the system accurately understands their objective, whether they are comfortable with relevant information being retained for future interactions and whether they know when they are interacting with an automated system rather than a human.

Behaviour provides additional evidence.

- Do customers correct the system?
- Do they allow goals to remain active?
- Do they return through the relationship interface?
- Do they choose to progress significant financial activity through it?
- Do they frequently abandon the AI interaction in favour of another channel even where no operational barrier requires that move?

None of these behaviours proves trust independently.

Together they can indicate whether customers are willing to rely upon the relationship.

The Central Bank's modernised Consumer Protection Code creates a useful standard against which digital trust should ultimately be considered. Digital platforms are required to be usable, to provide access to support and assistance, to produce consistent and objective outcomes serving the customer's interests, and not to exploit behavioural habits or biases in ways which cause detriment.[^31]

This suggests that experimentation with AI should be measured not simply against the incumbent digital experience but against the regulatory objective the institution is required to achieve.

A conversational journey which customers prefer aesthetically but which produces more inconsistent outcomes is not an improvement.

A more personalised experience which increases commercial conversion by exploiting customer-specific vulnerabilities is not successful relationship banking.

A system which removes a human interaction at the expense of customers who require support is not superior simply because its cost to serve is lower.

Outcome measurement therefore performs a governance function as well as a commercial one. It allows the institution to identify when optimisation of one part of the system creates deterioration elsewhere. This is particularly important because AI permits rapid and highly granular optimisation. A conventional digital journey might change several times per year. An AI system can theoretically alter language, sequencing and intervention according to each individual customer's context. That flexibility creates value. It also makes simple pre-launch review less sufficient.

The institution needs ongoing monitoring of the outcomes actually being produced. This should include distributional analysis. An aggregate metric can conceal materially different performance among different customer groups. An agent may reduce effort for digitally confident customers while increasing difficulty for those with lower digital capability. A system may perform well in ordinary financial circumstances and poorly when customers experience vulnerability. A language model may understand standard forms of expression more reliably than regional, non-native or atypical language.

The OECD's Consumer Finance Risk Monitor continues to identify low digital capability, ageing populations and other forms of vulnerability as important risks as financial services become increasingly digital.[^13]

A bank should therefore ask not only whether the average customer outcome improved but for whom it improved and for whom it deteriorated.

This is especially important if AI becomes a primary interface.

A small disparity in a peripheral feature may affect relatively few interactions.

A disparity in an interface through which customers increasingly access several banking products can propagate across a substantial part of the relationship.

Monitoring should therefore consider differences in:

- successful intent recognition;
- unnecessary clarification;
- escalation rates;
- journey completion;
- customer effort;
- complaints;
- and inappropriate or failed tool use.

The precise categories used for such monitoring must themselves comply with applicable data-protection and equality requirements. The general principle, however, is straightforward: scale magnifies both improvements and defects.

Complaints and corrections provide another important source of evidence. Traditional performance measurement can treat complaints principally as adverse events to be minimised. For an AI system, they are also a high-value source of diagnostic information. A customer who says "that isn't what I meant" has identified an intent-recognition failure. A customer who says "I already told you this" has identified a continuity failure. A customer who says "why are you asking me about that?" may have identified an inappropriate use of context.

A customer transferred to a human who must ask the same questions again has identified a handover failure. These interactions should be classified according to the capability that failed rather than being retained only as generic dissatisfaction.

The Consumer Protection Code explicitly requires firms to resolve complaints, errors and mistakes fairly and promptly and, importantly, to address errors which may have affected other customers rather than treating each complaint solely as an isolated case.[^31]

This requirement is particularly significant for AI.

Where the same model, prompt, tool definition or orchestration rule is used across many customers, a defect discovered through one interaction may be systemic.

The ability to trace a customer outcome back to the model, rule or capability involved therefore becomes part of the bank's measurement infrastructure.

This is one reason why measurement should be designed at the same time as the service rather than added after deployment.

Each significant system state should produce sufficient evidence to determine whether the intended outcome occurred. A goal was created. The institution should know whether it was inferred or customer-confirmed. A product was surfaced. The institution should know which need and goal made it relevant. An action was deferred. The institution should know why. A human was introduced. The institution should know which escalation condition was met. A customer was contacted proactively. The institution should know which event changed the plan sufficiently to justify contact. This is not merely analytical instrumentation.

It is part of the explainability of the service. The same data can support product management, operational monitoring, conduct oversight and experimental evaluation. The experimental dimension is particularly important at the beginning of the service.

A traditional bank should not assume that the complete relationship model described in this paper can be validated through a single pilot.

Different hypotheses should be tested separately.

- Can customers successfully express objectives conversationally?
- Does structured persistence reduce repeated information requests?
- Can the system recognise the appropriate moment to introduce a product?
- Can employees use an AI-generated handover summary without needing to reconstruct the case?
- Do customers value proactive check-ins connected to an agreed goal, or do they experience them as intrusive?
- Does the system correctly identify when not to act?

Each can be investigated through bounded experiments with explicit measures.

### Making the thesis falsifiable

The value of such experimentation is that it converts a broad strategic thesis into a series of falsifiable operational propositions.

For example:

> Customers whose relevant information is reused from previous interactions will require fewer repeated questions than customers using the existing journey, without an increase in data-quality errors.

or:

> Mortgage specialists receiving structured pre-handover context will spend less time reconstructing customer circumstances without an increase in correction rates.

or:

> Customers receiving event-driven contact linked to an explicitly agreed plan will report greater relevance than customers receiving conventional campaign-driven communication.

These propositions can fail.

That is an important property.

A programme based solely on the proposition that "AI will transform banking" is difficult to disprove and therefore difficult to govern. A programme based on measurable hypotheses can be expanded where evidence supports it and changed where it does not.

The same discipline should apply to generative-AI quality.

Benchmarks measuring reasoning or language performance are relevant when selecting models but insufficient for determining whether a relationship layer is improving banking outcomes.

The primary unit of evaluation must eventually move from the model response to the customer journey. A response can be individually excellent and collectively unhelpful. Several responses can each be factually correct while the sequence between them is poorly timed. The system may answer every question accurately while failing to preserve the customer's objective across sessions.

Conversely, a very short response which invokes the correct deterministic capability and advances the customer to the next appropriate milestone may represent excellent performance.

The technology should therefore be evaluated in context. The ultimate question is not whether the model is intelligent. It is whether the service behaves intelligently. This distinction has strategic consequences. If banks measure their AI programmes primarily through cost removal, they are likely to prioritise automation and containment. If they measure primarily through sales conversion, they are likely to prioritise persuasion and product identification. If they measure primarily through conversational satisfaction, they may optimise style. Each can produce value. None alone creates the relationship model considered in this paper.

A relationship-oriented measurement framework instead makes progression, appropriateness and continuity central, while retaining cost, conversion and customer satisfaction as important secondary outcomes.

This is not simply a different dashboard.

Metrics communicate institutional priorities to the systems and people being managed.

If a relationship agent is considered successful whenever it converts a customer into another product, product conversion will become its de facto objective even if the prompt instructs it to act in the customer's interests.

If human teams are measured only on handling time, context-rich conversations may be treated as inefficient. If success requires evidence that the customer's stated objective has progressed appropriately, the incentives become different. The operating model and the measurement model therefore cannot be separated. This returns to the proposition introduced at the beginning of the paper.

Traditional banks are approaching a period in which the interface through which customers make financial decisions may become increasingly contestable. The strategic response cannot be judged only by whether a bank has deployed an AI assistant.

It must be judged by whether the bank has created a service customers choose to rely upon for consequential financial activity.

That creates a demanding test.

The institution must demonstrate that it can understand the customer's objective more effectively than a conventional product interface; retain relevant context without abusing it; coordinate banking activity more effectively than fragmented journeys; introduce human expertise at the appropriate point; and produce enough value for both customer and institution for the relationship to be sustainable.

If it cannot demonstrate those outcomes, the proposition that the bank should own the intelligent relationship layer is weakened.

An independent third-party agent may ultimately perform parts of the coordination more effectively, particularly where comparison across several institutions is important.

If the bank can demonstrate them, however, the strategic position becomes materially different.

The bank would possess not only the regulated products and systems required to execute financial activity, but also a credible interface through which customers can decide what they want those products to accomplish.

This distinction leads naturally to the broader strategic question left open since Section 1.

The issue is not simply whether traditional banks will use AI.

They almost certainly will.

The issue is whether they will primarily provide financial capabilities to agents controlled elsewhere, or whether they will also maintain an intelligent relationship through which customers themselves continue to express financial intent.

These models are not mutually exclusive, but they imply materially different positions in the value chain.

The next section therefore considers the strategic choice between serving customers and serving their agents, the ways in which those models may coexist, and the implications for ownership of the retail banking relationship.

## 10. The strategic choice: serving customers, serving agents, or both

The argument developed in the preceding sections leads to a strategic question which is broader than the deployment of artificial intelligence within an individual bank. If capable AI agents become a meaningful interface through which consumers make financial decisions, the role of the bank itself within the distribution chain may change.

The issue is sometimes described as one of disintermediation. That term is useful, but it can also overstate the likely development. Banks are unlikely to disappear from the provision of regulated financial products simply because another system helps a customer decide which product to use. Deposits still require institutions capable of holding them. Mortgages require funding, underwriting, servicing and regulatory capital. Payments require regulated infrastructure. Insurance and investment products retain their respective manufacturing, distribution and regulatory structures.

The more plausible form of intermediation occurs above those functions.

A third party may increasingly become the interface through which the customer determines what they require, evaluates alternatives and instructs the institutions which ultimately provide the financial products.

In that environment, the bank can remain economically essential while becoming less central to the process through which the customer's financial decisions are made.

This distinction is important because it clarifies what is meant in this paper by relationship ownership. The term does not imply ownership of the customer, nor any proprietary claim over the customer's decisions or data. It refers more narrowly to the position occupied by the service through which the customer's financial intent is first expressed, interpreted, retained and coordinated over time.

A bank may own the mortgage contract while another interface owns much of the interaction which precedes it.

That possibility is not hypothetical in the broader digital economy.

Online travel agencies can mediate the choice of an airline without operating aircraft. Comparison platforms can influence the selection of an insurer without underwriting risk. Digital wallets can become the customer's immediate payments interface while the underlying payment instrument is issued elsewhere.

Artificial intelligence potentially extends this form of intermediation because the interface need no longer wait for the customer to identify the product category which should be compared.

It can begin with the objective.

A customer might eventually say:

> We want to buy a house in about eighteen months. Work out what we need to do and help us manage it.

The agent can potentially establish the customer's financial position, identify a savings requirement, compare deposit products, assess indicative mortgage options across providers, determine when an application becomes appropriate, gather information and initiate contact with selected financial institutions.

At no point does the customer necessarily need to begin by deciding which bank to ask.

The customer's relationship is initially with the agent.

Banks become capabilities which the agent invokes.

This should not be treated as an inevitable outcome. The technological, regulatory and commercial conditions required for agents to operate with that degree of authority remain incomplete. Authentication, delegation, liability, data access, payments authority and consumer protection all become materially more complicated once a system is acting for a customer rather than merely advising them.

Recent developments outside banking nevertheless demonstrate that these questions are becoming practical rather than theoretical.

In September 2026, Federal Reserve Governor Christopher Waller described two emerging models of agentic commerce. In an agent-assisted model, the customer uses an AI system for search and discovery but retains direct control of the decision and payment. In an agent-delegated model, the customer grants an agent authority to make purchases within defined constraints. Waller identified authentication, liability and fraud as major unresolved issues, including the need to establish that an agent possesses authority to act on a person's behalf rather than merely establishing the identity of the person themselves. His remarks concern commerce and payments rather than retail banking, but the underlying problem is directly relevant to financial services: once machines can act on behalf of customers, institutions need to distinguish between the identity of the customer and the authority of the agent representing them.[^53]

A similar development is visible in financial-data policy.

Open banking has already weakened the assumption that the bank providing the account must also control every interface through which account information is consumed. Customers can authorise third parties to access certain payment-account information and initiate specified services on their behalf.

The proposed European framework for financial data access extends that logic towards open finance. The European Commission's proposal would allow customers, subject to permission, to make data across a wider range of financial services available to authorised data users through standardised technical interfaces. The proposal remains under negotiation and should therefore not be treated as settled law. Council papers published in 2026 show that important issues remained unresolved, including the treatment of large digital gatekeepers. Nevertheless, the policy direction is relevant: financial information which has historically remained largely within individual institutions may become progressively more portable and machine-accessible at the customer's direction.[^54]

This is strategically significant because customer data has historically contributed to the incumbent advantage of a bank.

The institution holding the current account has visibility over a substantial part of the customer's financial activity. It knows the customer's existing products. It has established identity. It possesses transaction history and often receives the customer's income. It may have accumulated years of servicing and credit information.

Those advantages remain considerable.

But data portability reduces the extent to which possession of information necessarily implies possession of the interface.

A sufficiently authorised third party may be able to assemble information from several institutions and produce a view which no individual bank possesses.

This creates one potential advantage for independent agents. A bank-owned system can understand the customer's relationship with that bank particularly well. A customer-controlled agent may eventually understand the customer's relationships with all banks simultaneously. The latter may therefore have an advantage where the customer's principal concern is comparison or optimisation across providers.

The ECB has explicitly identified this possibility. Its 2024 Financial Stability Review notes that consumers could increasingly use third-party AI advisers to identify cheaper financial products from different providers. The ECB observes that increased transparency of this kind could improve efficiency for customers while putting downward pressure on bank margins.[^6]

The observation is narrow, but its implications are broader.

Price comparison represents a relatively simple form of agent intermediation.

A more capable agent could compare not only price but features, eligibility, switching cost, existing commitments and the relationship between several financial decisions.

As that capability increases, the customer's own bank is no longer guaranteed to be the place at which a financial need first becomes visible.

That creates at least three plausible strategic positions for an incumbent retail bank.

### Model 1: Bank as product and capability provider

```text
        Customer
           ↓
    Third-party agent
           ↓
         Bank
    products / APIs /
    execution / balance sheet
```

### Model 2: Bank as primary relationship layer

```text
        Customer
           ↓
      Bank agent
           ↓
   Bank capabilities
   + human expertise
```

### Model 3: Hybrid model

```text
          Customer
         ↙        ↘
   Bank agent    External agent
         ↘        ↙
      Bank capabilities
```

The first model is agent-mediated banking.

The customer relationship is substantially coordinated elsewhere. The bank competes to become an attractive provider within that agent's choice set.

This model should not automatically be regarded as strategically inferior.

A bank could choose to specialise in manufacturing and executing financial products efficiently while allowing other firms to incur the cost of customer discovery and interface development. If third-party agents direct well-qualified demand towards the institution, the bank may gain distribution without bearing the full acquisition cost.

There are parallels elsewhere in financial services. Asset managers commonly manufacture investment products which are distributed through advisers or platforms they do not control. Insurers may distribute through brokers. Payment providers may operate invisibly beneath merchant interfaces. A financial institution does not need to own every customer interaction to operate a valuable business. Serving agents could therefore become a legitimate banking strategy. The requirements would differ from those of contemporary digital distribution. Products would need to be highly machine-readable. Eligibility requirements would need to be discoverable.

Prices and features would need to be available through reliable interfaces. Applications would need to accept properly authorised machine-mediated interactions. Status would need to be returned programmatically. The bank would effectively optimise part of its distribution infrastructure for machine customers acting on behalf of human customers. The competitive variables could consequently change. An agent does not necessarily value the same things that influence a human using a banking website. Visual design becomes less important at the execution layer. Structured product information becomes more important. API reliability becomes a distribution capability.

Transparent pricing becomes easier to compare. Operational performance becomes machine-observable. A product which depends substantially upon customer inertia or difficulty of comparison may become more exposed. This could intensify competition.

The open-banking experience demonstrates that machine-mediated access to financial infrastructure can move from a specialist feature towards meaningful scale. Open Banking Limited reported that UK open-banking payments reached 351 million during 2025, an increase of 57 per cent on the previous year. That activity does not demonstrate that AI agents will become dominant financial intermediaries, but it shows that third-party interfaces accessing bank capabilities through standardised APIs can become part of everyday financial infrastructure.[^55]

Agentic distribution could extend that principle. The second strategic position is bank-owned relationship banking. In this model, the institution itself attempts to provide the intelligent interface through which the customer expresses financial intent. The bank does not merely wait for a customer or agent to request a mortgage. It understands that the customer intends to purchase a home. It does not merely provide an account balance. It understands that the balance is being accumulated towards an emergency reserve. It does not merely receive a pension application.

It maintains context around the customer's longer-term retirement objective. The advantage of this position is that the bank participates earlier in the decision process.

It can potentially coordinate several products around the same objective rather than compete for each product independently once the requirement has already been defined.

The disadvantage is equally clear.

A bank-owned agent is not economically neutral.

The institution manufactures or distributes a defined set of financial products and benefits when customers use them.

A customer may reasonably ask whether an agent controlled by one bank will identify the objectively best financial option where that option is provided by another institution.

This problem already exists in conventional banking.

A bank employee explaining the institution's mortgage products is not generally assumed to conduct a whole-of-market comparison unless the service explicitly provides that function.

AI does not create the conflict.

It may make the conflict more visible because an intelligent agent can appear to the customer to possess a broader advisory capability than the institution has authorised it to exercise.

A bank-owned agent therefore needs to be clear about the universe within which it is operating.

> These are the mortgage options available from us.

is materially different from:

> These are your best mortgage options.

The latter implies a comparative assessment which may extend beyond the institution's available information and regulatory proposition. This distinction reinforces the argument made earlier that conversational sophistication cannot be allowed to obscure institutional boundaries. There is, however, an important advantage available to the incumbent bank which an independent agent does not automatically possess. The bank can combine understanding with execution. It already possesses authenticated identity. It already has access to permitted customer and product information.

It owns or is integrated with the systems through which payments, lending, savings and servicing activity actually occur. It operates within an established regulatory framework. It possesses employees capable of intervening where professional judgement is required. It has formal complaint and redress mechanisms. It can move from conversation to action without necessarily transferring the customer into another organisation.

The BIS has identified some of these incumbent advantages when considering generative AI in financial services, noting that banks combine existing customer relationships with mature risk and control frameworks and significant customer reach. It also identifies the corresponding constraint: banks often move more slowly and possess substantial legacy technology and organisational complexity.[^56]

This creates an important competitive dynamic. Third-party agents may begin with superior interface capability but limited access to the banking system. Banks may begin with superior execution capability but weaker conversational and orchestration capability. Over time, each may attempt to acquire what the other possesses. External agents will seek deeper financial access. Banks will seek more capable relationship interfaces. The resulting competitive position may depend upon which side can close its disadvantage more effectively.

This suggests that the question for an incumbent bank is not merely:

> Can we build an AI assistant?

It is:

> Can we combine our existing advantages in trust, data, regulated execution and human expertise with an interface sufficiently useful that customers continue to choose us as the place where financial intent is expressed?

That is a considerably higher standard.

It also explains why a bank's response cannot be limited to an improved chatbot.

If an independent agent can maintain goals across institutions, compare the market, remember customer preferences and execute through open interfaces, then a bank assistant capable only of answering questions about the bank's website does little to preserve the relationship.

The relevant competitor is not the existing banking chatbot. It is the future customer agent. This does not mean that banks must attempt to match the full breadth of a general-purpose personal assistant. An independent agent may know the customer's travel plans, calendar, shopping preferences and communications in addition to their finances. Attempting to replicate that entire context within a bank would be inappropriate and unnecessary.

The bank's potential advantage is narrower but substantial: it can become exceptionally effective within the domain in which it already possesses authority and capability.

It can understand the customer's financial objectives and connect them directly to real financial action. This could be described as domain depth rather than contextual breadth. The general-purpose agent may know more about the customer's life. The bank may be able to do more with the customer's money. Neither advantage should be assumed to dominate automatically. Trust may become one of the factors determining the outcome.

Industry survey evidence suggests that banks retain an advantage here, although the available evidence should be treated cautiously. McKinsey's 2025 Global Banking Annual Review survey, covering approximately 30,000 consumers, reported that 62 per cent identified their primary bank as the provider they would most trust to deliver generative-AI financial services, compared with 19 per cent selecting a major technology company. At the same time, 57 per cent stated that they would consider a third-party financial AI agent if their bank did not provide one. These responses indicate stated preference rather than observed adoption and do not establish how customers will behave as the technology matures. They nevertheless illustrate the strategic tension: banks appear to begin with a trust advantage, while the absence of a credible service could still cause customers to look elsewhere.[^7]

This creates a potential window rather than a permanent advantage.

Trust accumulated through the existing banking relationship can make customers more willing to adopt a bank-provided agent.

If the agent itself subsequently behaves poorly, that same institutional association can transmit the failure back to the bank.

The relationship advantage therefore needs to be earned repeatedly through the behaviour described in earlier sections: accurate memory, appropriate use of information, reliable execution, controlled escalation and clear accountability.

The third strategic position is the hybrid model. This is likely to be the most realistic. Customers may use a bank-owned relationship agent for some financial activity and an independent agent for others. The customer may begin a mortgage conversation directly with their bank because they value continuity with the institution. The same customer may ask an independent agent to compare deposit rates across the market.

A business customer may allow an external treasury agent to optimise cash across several banks while using a bank's proprietary agent for specialist lending support.

The boundary can move according to the task.

Under this model, the bank needs to be capable of both owning a relationship and participating in someone else's.

These capabilities are complementary rather than contradictory.

The architectural work described in Section 8 — structured product information, bounded tools, reusable APIs, events, clear authority models and machine-readable state — supports both.

A capability which allows the bank's own AI agent to retrieve a mortgage application status can potentially also be exposed, under a different permission model, to an authorised third-party agent.

A product catalogue created so the bank's relationship layer can reason accurately about products can also make those products more discoverable externally.

An authentication framework capable of representing delegated authority can support both bank and non-bank agents. This is strategically useful because the long-term distribution structure remains uncertain. The bank does not need to predict precisely how much of the interface will ultimately be controlled by independent agents. It can instead develop an architecture which allows it to compete under several outcomes. This is preferable to treating proprietary and third-party agents as mutually exclusive futures. The more difficult strategic question concerns investment priority.

A bank can become technically capable of serving external agents without investing equally in its own relationship layer. That choice may gradually position it further towards the role of product manufacturer and execution provider. Conversely, a bank can invest heavily in a proprietary assistant while making its products difficult for external agents to access. That may preserve direct interaction for some customers but leave the institution poorly represented wherever customers choose independent interfaces. The relevant decision is therefore not simply whether to permit agent access.

It is where the institution wishes to create differentiated value.

If the primary source of differentiation is product manufacturing, price or balance-sheet capability, allowing third parties to own more of the interface may be economically acceptable.

If the institution believes that customer understanding, multi-product relationships and trusted advice are central to its long-term competitive position, surrendering the intelligent interface carries greater strategic consequence.

This is why failure to make an explicit decision can itself influence the outcome. Relationship intermediation does not require a bank formally to announce that it no longer wishes to own the customer interface. It can occur gradually. Customers begin using external AI tools for financial research. Those tools become capable of retrieving financial information. Product comparison improves. Application processes become machine-accessible. Delegated authority develops. The external agent retains more customer context. The bank continues improving individual product journeys. Each change can appear incremental.

The cumulative effect can nevertheless be a shift in where the customer begins the financial decision. This resembles other forms of platform intermediation. The underlying provider does not necessarily lose the customer in a contractual sense. It loses control over discovery. Once discovery occurs elsewhere, competition can become more transaction-specific.

The customer is less likely to ask:

> What can my bank help me with?

and more likely to instruct an agent:

> Find the most appropriate provider for this requirement.

This can increase consumer welfare through better comparison and lower switching costs.

It can also weaken some of the economics traditionally associated with banking relationships.

The ECB's expectation that third-party AI advisers could increase transparency while reducing bank margins follows directly from this mechanism.[^6]

The degree of commoditisation is likely to vary by product. Simple savings products can be compared relatively easily on rate, access and protection characteristics. Payments may be selected largely on reliability, cost and functionality. Mortgages are more complex because eligibility, underwriting, timing and service quality matter in addition to price.

Financial advice, business banking and complex lending contain still greater quantities of information and judgement which are difficult to reduce to a single comparable variable.

The bank's relationship position may therefore remain more valuable in products for which context and coordination matter most.

This suggests that third-party agents need not reduce all banks to commodity utilities.

They may instead sharpen the distinction between products in which manufacturing is differentiating and services in which relationship capability is differentiating.

For incumbent universal banks, that distinction deserves deliberate consideration.

One possible response is to compete strongly at both levels.

The bank makes its products attractive and accessible to external agents while simultaneously offering a proprietary relationship experience sufficiently useful that many customers prefer to begin there.

There is no inherent contradiction.

A hotel can distribute rooms through an online travel agency while also attempting to persuade customers to book directly.

The strategic difference is that the direct channel must provide sufficient additional value to justify the customer's choice.

For a bank, that value is unlikely to arise simply from withholding products or data from external agents. Regulatory and competitive trends are moving in the opposite direction.

It must instead come from the quality of the relationship itself.

That provides a useful test for the proposition advanced in this paper.

A bank-owned relationship layer deserves to exist only if it can provide something the customer values more than the alternatives.

That could include:

- continuity across financial decisions;
- direct access to authoritative account and product state;
- lower administrative effort;
- ability to execute immediately;
- access to human specialists without restarting;
- institutional accountability;
- and a long-term understanding of customer goals which the customer has chosen to maintain.

If those benefits are weak, a general-purpose agent with broader market access may be more attractive.

The existence of regulatory status does not by itself guarantee customer preference.

Nor should regulation be used principally as a defensive barrier against third-party interfaces.

A customer-centric open-finance framework explicitly seeks to increase customer control and competition. The Commission's proposed FIDA regime, for example, is designed around the premise that customers should be able to decide who uses their financial data and for what purpose.[^54]

The strategic response for an incumbent is therefore stronger if it is framed positively:

> not how can the bank prevent agents from intermediating it?

but:

> What relationship can the bank provide which customers continue to choose even when alternatives are available?

This is a materially healthier question.

It aligns the bank's competitive objective with the quality of the customer proposition rather than with preservation of information asymmetry or switching friction.

It also allows agent compatibility to become an opportunity.

A customer using an independent agent is still a potential customer of the bank.

If the bank's mortgage is appropriately priced, its service reliable and its APIs accessible, the agent may direct business towards it.

The bank can therefore compete simultaneously for the relationship and for the transaction.

Winning the former is valuable but not a prerequisite for competing for the latter.

The strategic danger arises if the bank becomes weak at both.

An institution which does not provide a useful intelligent relationship layer and is also difficult for external agents to access risks being absent both from the customer's chosen interface and from the agent's preferred providers.

Conversely, the institution with strong capabilities on both sides retains strategic optionality. It can serve customers directly. It can serve their authorised agents. And it can allow customers to move between those modes without forcing a change in the underlying financial relationship. This has implications for how banks should view agent interoperability. External agents should not automatically be understood as hostile competitors. They can be customers of banking infrastructure, distributors of bank products and components within customer-controlled financial ecosystems.

At the same time, the bank should recognise that the agent which sits closest to the customer's intent may acquire considerable influence over distribution.

The relationship is therefore simultaneously cooperative and competitive.

The terminology of co-opetition, frequently applied to platform markets, may eventually become relevant, although the precise structure of the agent ecosystem remains too immature to establish this confidently.

The issue of delegated authority will be central. A third-party agent reading product information presents relatively little new conceptual difficulty. An agent accessing personal account data creates greater requirements. An agent initiating applications creates greater requirements again.

An agent moving funds or entering contractual commitments on a customer's behalf raises questions concerning authentication, consent, liability and revocation which remain unresolved across the emerging agent economy.

The Federal Reserve's distinction between agent-assisted and agent-delegated commerce is useful because it suggests that agent intermediation will not arrive as a single event. Assisted models can develop before fully delegated ones because the customer remains directly responsible for consequential actions.[^53]

The same progression is plausible in banking.

In an early stage, an external agent may:

- compare options;
- retrieve information;
- prepare questions;
- or direct the customer to the appropriate bank journey.

At a later stage, subject to regulatory and technical development, it may:

- retrieve authorised financial data;
- pre-populate applications;
- coordinate activity across providers;
- or initiate actions which the customer subsequently confirms.

More extensive delegated authority would require substantially stronger identity, permission and liability frameworks.

This gradual development matters strategically because the migration of relationship activity can precede the migration of execution.

An external agent does not need authority to draw down a mortgage before it can influence which bank the customer chooses.

It only needs to become the place where the decision is made.

This is why the strategic asset identified in Section 1 is the point at which customer intent is formed and understood, rather than simply the final transaction interface.

The bank can lose influence over that point long before it loses the ability to execute the resulting product.

There is also a data feedback effect.

The service through which customers express their objectives obtains information about what customers want before those intentions appear in transactional data.

A bank which sees only completed applications observes realised demand. A relationship agent may observe emerging demand. It knows that a customer hopes to purchase a home in eighteen months even though no mortgage application exists. It knows that another customer is considering retirement even though no pension action has yet occurred. It knows that a household has postponed a purchase because childcare costs remain temporarily high. This information can improve service planning and customer support. It also has considerable commercial sensitivity and must be governed accordingly.

The agent which accumulates this information can develop an increasingly rich representation of customer intent. That is part of what makes relationship ownership strategically important. It is also why customers must retain meaningful control over that information, as argued in Section 6. The bank should not seek to own customer intent in the sense of making it inaccessible elsewhere. It should seek to become the institution to which customers are willing to entrust it. This is an important distinction.

The more open the financial system becomes, the less sustainable a relationship strategy based upon captivity becomes. A stronger strategy is based upon preference. The customer remains because the institution remembers appropriately. Because it can act. Because it provides useful human support. Because it does not repeatedly require information already available. Because it understands the relationship between today's action and the objective established months earlier. And because the customer trusts how that information is being used.

In that sense, the emergence of third-party agents may create competitive discipline which improves bank-owned relationship layers. If customers can easily move their decision-making elsewhere, the bank's relationship layer has to earn continued use. The resulting strategic choice can therefore be stated more precisely than a binary between serving customers and serving agents. Traditional banks are likely to need to do both.

The actual choice is:

> whether the bank intends to remain a meaningful place in which customer financial intent is understood and progressed, or whether it is comfortable allowing that function increasingly to occur elsewhere while concentrating on the provision and execution of financial products.

Both can be rational strategies. What is less attractive is arriving at the second position unintentionally. The distinction should therefore be considered explicitly at executive level. It affects technology architecture. It affects distribution strategy. It affects data strategy. It affects the role of branches and human advisers. It affects how product teams are organised. It affects which external AI platforms should be treated as suppliers, distributors, competitors or all three. And it affects what the institution considers the customer relationship itself to be.

For a traditional full-service retail bank, there is a credible argument that the existing assets of the institution make the first strategy unusually attainable.

It already possesses customers. It already possesses significant financial context. It already has systems capable of executing regulated activity. It already employs people with specialist expertise. It already bears institutional accountability for the outcomes of the financial services it provides. Contemporary AI does not create those assets. It creates a new possibility for connecting them. The strategic opportunity is therefore not to reproduce a general-purpose AI assistant inside a bank.

It is to combine the bank's existing institutional capabilities into a form of relationship which was previously too labour-intensive to provide consistently across a mass retail customer base.

That proposition brings the paper back to its original research question.

The question was whether contemporary artificial intelligence can enable banks to provide the continuity, contextual understanding and coordination historically associated with relationship banking at digital scale, and what follows if customer intent is increasingly mediated by third-party agents.

The evidence considered so far suggests that the technological and economic conditions are moving sufficiently to make the question credible.

It does not establish that the proposition will succeed.

The system still needs to be translated into a concrete service model.

It needs to demonstrate how customer intent becomes persistent state; how goals, needs, products and applications relate; how deterministic bank processes remain authoritative; how human bankers enter and leave the relationship; and how an institution could introduce the capability progressively without attempting to redesign its entire retail bank at once.

The next section therefore moves from the abstract model to a reference architecture for persistent relationship banking: the minimum capabilities required to create such a service and how they would operate together across the lifecycle of a real customer objective.

## 11. A reference architecture for persistent relationship banking

The preceding sections have described a service model rather than a specific technology implementation. This distinction is important. Persistent relationship banking is not created by selecting a sufficiently capable language model, adding a conversational interface to an existing banking application or connecting an AI assistant directly to a series of product systems. It requires a set of institutional capabilities which allow customer intent to persist, banking processes to remain authoritative, actions to occur within defined boundaries and responsibility to move coherently between automated and human service.

The architecture described in this section should therefore be treated as a reference model rather than a prescription for a particular technology stack. Individual banks will have different core systems, customer-data architectures, risk frameworks and organisational structures. The purpose is to identify the minimum functional components which appear necessary if the relationship model developed in this paper is to operate reliably.

The distinction between the AI model and the wider agent system is consistent with emerging technical definitions of agentic systems. NIST describes contemporary AI agents as systems in which general-purpose models are surrounded by software capable of providing perception, planning, memory and access to tools through which actions can be taken in an external environment. Its work on agent-tool taxonomies specifically distinguishes reasoning functions such as task decomposition and memory from action capabilities including authentication, API access and interaction with other systems.[^22]

This is particularly relevant in banking because the model should not itself become the location at which customer state, financial authority or product logic resides.

The proposed architecture can be represented at a high level as follows:

```text
                        CUSTOMER
                            │
                            ▼
                 CONVERSATIONAL INTERFACE
                            │
                            ▼
                 RELATIONSHIP ORCHESTRATOR
               ┌────────────┼────────────┐
               │            │            │
               ▼            ▼            ▼
         RELATIONSHIP     GOALS &       NEEDS /
            STATE          PLANS       INTERPRETATION
               │            │            │
               └────────────┼────────────┘
                            │
                            ▼
                  CAPABILITY CONTROL LAYER
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
             DATA       BANK TOOLS     HUMAN
           SERVICES     & WORKFLOWS    SERVICES
                │           │           │
                └───────────┼───────────┘
                            │
                            ▼
                  SYSTEMS OF RECORD
                            │
                            ▼
                    EVENT / STATE BUS
                            │
                            └──────► Relationship updated
```

A governance and observability layer surrounds the entire architecture.

### Component 1: The conversational interface

The first component is the conversational interface.

Its function is not simply to reproduce the navigation of a banking website through natural language. Its more significant role is to allow the customer to express an objective before translating that objective into the institution's internal product structure.

A customer should be able to begin with:

> My partner and I want to buy our first home next year.

rather than being required to decide in advance whether to enter the savings, mortgage or current-account part of the bank.

The model can interpret that statement, identify that the customer's intention may extend over time and establish what information is necessary to understand the objective further.

This is one of the areas in which generative AI materially changes the interaction model. Conventional software interfaces require the institution to anticipate the available customer intentions and encode them into menus, forms and predefined paths. Natural-language systems allow the customer to provide a considerably less structured description and permit the system to perform part of the translation.

That flexibility should not extend to financial authority.

The conversation layer can decide how to ask a question or explain a result. It should not independently define which documents are legally required, which mortgage rates are available or whether a customer satisfies a lending policy.

Those answers belong elsewhere in the architecture.

### Component 2: Relationship state

The second component is the relationship state.

This is the durable representation of the information required for continuity.

It sits outside the language model.

This separation is fundamental. Foundation models change, conversational sessions end and context windows are temporary. The relationship between the customer and the institution must survive all three.

Relationship state is also narrower than the customer's complete banking record. It should not become a replicated data warehouse containing every transaction and attribute available to the institution. It represents those facts, intentions, decisions and agreed actions which are necessary to continue the relationship coherently.

Conceptually, it may contain objects such as:

- Customer context
- Confirmed circumstances
- Declared preferences
- Active goals
- Paused or completed goals
- Milestones
- Agreed actions
- Outstanding questions
- Future review points
- Relevant permissions
- Linked applications
- Relevant human interactions

Each material item should also contain sufficient provenance to establish where it came from, when it was established and whether it was stated, inferred or confirmed.

As argued in Section 6, this allows the system to distinguish between:

> The customer told us this.

and:

> The model believes this may be true.

Those statements should not have identical operational consequences.

The relationship state is therefore closer to a governed institutional record than to chatbot memory.

### Component 3: The goal and plan layer

The third component is the goal and plan layer.

Its purpose is to represent the customer's objective independently of any individual banking product.

The simplest useful plan object might contain:

- Goal
- Status
- Current position
- Target or target date
- Milestones
- Dependencies
- Outstanding actions
- Completed actions
- Linked needs
- Linked products/applications
- Future review conditions

The plan becomes the mechanism through which the relationship persists between transactions.

This is particularly important because the relevant state may exist for long periods during which no banking product is being acquired.

A customer could establish a first-home objective eighteen months before applying for a mortgage. During the intervening period, the customer's principal actions may simply be saving and periodically reviewing readiness. The absence of a mortgage application does not imply the absence of a banking relationship around the objective. Nor should the plan require constant interaction. A well-designed plan can explicitly represent that no action is required until a later point. This prevents persistence from becoming synonymous with engagement. The system knows what the customer is attempting to achieve.

It also knows when there is no useful reason to contact them.

### Component 4: The needs interpretation layer

The fourth component is the needs interpretation layer.

Goals and products should not be connected directly.

Between them sits the question of what financial need, if any, arises from the customer's circumstances and current stage of the plan.

This is important both commercially and from a conduct perspective. A customer intending to purchase a home does not immediately require every product associated with home ownership. At different points the relevant need may be saving, affordability assessment, borrowing, protection, payment capability or insurance. Some needs may be relevant later. Some may never arise. Some may conflict with more immediate objectives.

The needs layer therefore acts as an interpretative boundary between what the customer wants to achieve and what the bank might sell.

It should maintain a distinction between a candidate need and a need which is sufficiently established to surface to the customer.

A possible state model could include:

- Latent
- Requires clarification
- Relevant but not timely
- Ready to surface
- Discussed
- Accepted
- Declined
- Deferred
- Suppressed

This allows the system to represent one of the most important principles developed earlier in the paper:

> discovery is not activation.

A capable model may identify several plausible needs during one conversation.

The architecture should not require that each one becomes a sales conversation.

The need object can remain latent until additional information, progress in the plan or an explicit customer request makes it relevant.

### Component 5: The relationship orchestrator

The fifth component is the relationship orchestrator.

This is the part of the system which determines what should happen next.

The term orchestrator is preferable to decision maker because much of the authoritative decision-making remains elsewhere.

Its function is to consider the current customer state, active plan, relevant needs, available bank capabilities and applicable authority boundaries and then determine the next permitted action.

This might be:

- ask a clarifying question;
- retrieve information;
- call a calculator;
- update a milestone;
- request a document;
- surface a relevant product;
- schedule a future review;
- wait for an external event;
- or introduce a human specialist.

The orchestrator therefore converts relationship state into workflow.

This is the part of the architecture to which contemporary agentic AI is most relevant.

NIST's emerging description of agents emphasises the combination of planning, memory and tool use rather than language generation alone.[^22] BIS research has likewise begun testing AI agents in bounded financial tasks in which models select actions against explicit operational objectives and constraints. In experiments involving liquidity management in real-time gross settlement systems, generative-AI agents displayed some of the behaviours required for constrained operational decision-making, although the authors emphasise that safeguards and further research would be necessary before such systems could be relied upon operationally.[^26]

The implication for retail banking is not that a general-purpose agent should be given unrestricted autonomy.

It is that orchestration can occur inside a defined action space.

### Component 6: The capability control layer

This leads to the sixth component: the capability control layer.

A relationship agent should not interact directly with arbitrary internal systems.

Instead, the bank exposes a catalogue of bounded capabilities.

For example:

```text
get_customer_balance()
get_mortgage_application_status()
calculate_mortgage_repayment()
get_current_product_rates()
list_application_requirements()
submit_confirmed_application_field()
request_document()
schedule_specialist_appointment()
create_customer_check_in()
```

Each capability should have an explicit contract.

The bank defines:

- what the capability does;
- which information it accepts;
- which system provides the authoritative result;
- which identity or authentication state is required;
- which customers and channels may use it;
- whether the action is read-only or state-changing;
- whether explicit customer confirmation is required;
- and whether human participation is required.

This is substantially safer than attempting to constrain the entire system through natural-language instructions. A prompt can tell an agent not to transfer funds without permission. A capability architecture can make a transfer technically impossible until the required authentication and confirmation have occurred. For consequential financial activity, the latter should be the stronger control.

This architectural pattern is particularly important because financial regulators are increasingly focused on the governance implications of AI rather than only on its model performance. The EBA's June 2026 risk assessment identifies operational failure, bias, data quality, cyber risk, legal and conduct risk, third-party dependency and regulatory uncertainty among the risks arising from increasing AI adoption in banking. It emphasises governance, transparency, data security and integration with existing operational-resilience requirements.[^57]

The capability layer provides one mechanism for applying those principles operationally.

It establishes a boundary between what the AI can reason about and what the bank permits it to do.

### Component 7: The authoritative banking layer

The seventh component is the authoritative banking layer. This consists largely of systems the institution already has. Core banking systems remain authoritative for accounts and balances. Mortgage platforms remain authoritative for mortgage application state. Pricing systems remain authoritative for rates. Credit engines remain authoritative for controlled eligibility or underwriting outputs. Payment systems remain authoritative for executed transactions. Identity services remain authoritative for customer authentication. The relationship layer should not attempt to reproduce these functions probabilistically. This distinction is one of the most important practical characteristics of the proposed model.

The AI may translate. The bank systems determine.

For example, a customer might ask:

> If I borrowed €420,000 over 30 years, roughly what would my monthly payment be on the four-year fixed option?

The model determines that a calculation is required. It identifies the relevant confirmed inputs. It calls an authorised mortgage-calculation service. The calculator returns the result. The model explains it. The numerical answer is therefore not generated because a language model happened to know the formula. It comes from a banking capability designed to produce that result. This pattern should extend wherever a deterministic source of truth exists. The model should not infer an application status if the application system can be queried.

It should not reconstruct current pricing from its training data. It should not invent an eligibility rule. It should not assume that because a customer qualified for a product previously they still qualify today. The relationship can feel conversational while the banking state beneath it remains controlled.

### Component 8: The event architecture

The eighth component is an event architecture. A persistent relationship cannot be entirely request-driven. Relevant things happen when the customer is not actively talking to the bank. An application progresses. A document is received. A rate expires. A target savings level is reached. A payment fails. Another applicant completes an action. A mortgage completes. The relationship layer therefore needs to receive events from underlying operational systems. The important distinction is between an event updating the plan and an event causing customer contact. Those should be separate decisions.

If a required document is received, the relationship state can record that the corresponding milestone has been completed. The system then asks whether that change creates a useful next action. Sometimes it will. Sometimes it will not.

This produces an architecture in which customer communication is derived from relationship relevance rather than from the simple availability of an event.

```text
Operational event
       │
       ▼
Relationship state updated
       │
       ▼
Plan re-evaluated
       │
       ▼
Is there now a useful customer action?
       │
    ┌──┴──┐
   Yes    No
    │      │
    ▼      ▼
Engage   Wait
```

This is the technical equivalent of the principle introduced earlier that the best banking experience may sometimes consist of the bank simply remembering.

### Component 9: Human orchestration

The ninth component is human orchestration. Human involvement should not sit outside the architecture as an emergency fallback. It is one of the capabilities the relationship layer can invoke. This has an important effect on customer experience. A handover no longer means abandoning the agentic relationship. The human enters it. The system prepares the relevant context, establishes why human involvement is required and identifies which questions remain unresolved. The employee then works from the same underlying state. After the human intervention, the agreed outcome returns to the plan.

The relationship continues.

Conceptually:

```text
AI relationship
       │
       ▼
Escalation condition
       │
       ▼
Human specialist
       │
       ├── sees relevant context
       ├── exercises judgement
       ├── records decision/action
       │
       ▼
Relationship state updated
       │
       ▼
AI relationship continues
```

This differs substantially from conventional escalation, where a chatbot or digital journey often terminates when the customer enters another channel.

It also supports the economic argument developed in Section 3.

Human capacity is introduced at the point where judgement or expertise is required rather than being consumed throughout the entire process.

### Component 10: Identity, permission and delegated authority

The tenth component is identity, permission and delegated authority.

The relationship layer must always know not simply who the customer is but what level of authority exists for the current action.

This is particularly important because conversational continuity can obscure security transitions. A customer may begin a conversation while unauthenticated. The system can discuss a general objective. They can subsequently authenticate and allow the relationship to access personal account information. A later financial instruction may require step-up authentication or explicit confirmation. The conversation can remain visually continuous while the authority underneath it changes.

The relationship layer therefore needs to represent identity state explicitly:

```text
Anonymous
    ↓
Recognised
    ↓
Authenticated
    ↓
Authorised for personal data
    ↓
Step-up authentication
    ↓
Confirmed consequential action
```

The system should not infer authority from conversational familiarity.

A returning customer whose objective is remembered still needs the appropriate authentication before the bank reveals or changes protected financial information.

The same principle becomes considerably more important if the bank later accepts instructions from external AI agents.

An institution will need to distinguish between:

- the identity of the customer;
- the identity of the agent;
- the authority delegated to the agent;
- the scope of that authority;
- and the particular actions which still require direct confirmation.

The architecture proposed here does not require those standards to have been fully resolved today.

It does benefit from designing authority as an explicit object rather than assuming that every interaction comes directly from an authenticated human user.

### Component 11: The policy and guardrail layer

The eleventh component is a policy and guardrail layer.

Not every behavioural rule should be embedded within the foundation model's instructions.

Certain rules need to operate independently of model reasoning.

For example:

- Do not present an inferred goal as customer-confirmed.
- Do not surface a product which is currently suppressed by plan state.
- Do not reuse an expired financial fact without reconfirmation.
- Do not submit an application without the required declaration.
- Do not perform a consequential action without appropriate authentication.
- Do not use specified sensitive information outside its permitted context.
- Escalate where vulnerability conditions require human support.

Some of these rules can be implemented deterministically. Others require model interpretation. The important point is that the institution retains a visible policy framework above the behaviour of the model. This allows governance teams to inspect and change the bank's rules without relying upon an opaque accumulation of prompt instructions. It also supports consistency between models. A bank may use several language models for different purposes. The institutional rules should remain consistent even when the underlying model changes.

### Component 12: Observability and auditability

The twelfth component is observability and auditability.

A regulated institution needs to be able to reconstruct material activity after the fact.

For an AI-mediated relationship this means recording more than the final conversational transcript.

The institution may need to know:

- Which model and version interpreted the interaction?
- What authenticated customer state existed?
- What relationship facts were retrieved?
- Which were inferred?
- Which tools were available?
- Which tool was selected?
- What inputs were passed?
- What authoritative result was returned?
- What rules were applied?
- What material state changed?
- Was customer confirmation obtained?
- Was a human involved?
- What was the ultimate action?

The purpose is not to store unrestricted model chain-of-thought.

It is to retain a service-level audit trail.

This distinction is especially important because general-purpose models can change without the surrounding banking process changing. The bank needs to establish whether an error arose from customer data, model interpretation, capability selection, an underlying product system or the rule which connected them.

The EBA's current work reflects this growing emphasis on end-to-end governance. Its 2026–2028 programme specifically identifies explainability, bias and fairness, human oversight and incident reporting as areas requiring further supervisory convergence as AI adoption expands across banking and payments.[^57]

### Component 13: Model independence and operational resilience

The thirteenth component is model independence and operational resilience.

The relationship itself should not belong to a particular foundation-model provider.

This has both strategic and prudential importance.

The EBA's 2026 risk assessment identifies reliance on third-party AI providers among the emerging risks requiring active management and notes that DORA's requirements concerning ICT risk, third-party applications, incident reporting and resilience apply to banks' use of AI systems.[^51] More broadly, the EBA's September 2026 final guidelines on third-party risk emphasise lifecycle management, including due diligence, contractual arrangements, monitoring and exit strategies where third parties support important institutional functions.[^57]

A bank should therefore be capable, at least in principle, of substituting one model for another while retaining the customer's relationship state and institutional capabilities.

That does not imply that models are functionally identical.

A replacement model may provide lower-quality reasoning or conversation.

The point is that changing the model should not erase:

- the customer's active goals;
- application state;
- agreed actions;
- permissions;
- or the bank's underlying tools.

Those belong to the service, not to the model.

A degraded operating mode should also exist.

If the preferred reasoning model is unavailable, the bank might reduce the range of conversational functions available, revert to conventional navigation or route some activity to human support.

It should not become unable to provide core banking services.

This suggests a useful architectural hierarchy:

```text
Relationship state      → institution-owned
Bank capabilities       → institution-controlled
Policies and authority  → institution-controlled
Foundation model        → substitutable component
```

The model is important. It should not be existential. These components together produce a system which is materially different from both a conventional banking application and a conventional chatbot. The distinction can be illustrated through a simple example.

A customer begins:

> My partner and I want to buy our first home next year, but I don't know whether we're anywhere close yet.

The conversational interface identifies a potential home-purchase objective. The relationship layer retrieves permitted existing context after authentication. The customer confirms that they would like the bank to retain this as an active objective. A plan is created. The system establishes the information required to determine the current position. Some information is available from authoritative systems. Other information must be supplied or confirmed by the customer. A deterministic affordability capability provides relevant calculations. The agent explains the result. The plan identifies a savings shortfall and an indicative milestone.

No mortgage application is created because the customer is not yet ready. The relationship state records the agreed objective and next review condition. Three months later, the customer returns. The bank does not ask why they are there. The active objective is available. Their current savings position is retrieved where permitted. Progress is shown. Later still, the required milestone is reached. An event updates the plan. The system identifies that mortgage preparation has become relevant and asks whether the customer wishes to proceed. The customer agrees.

The mortgage process exposes its application requirements as controlled capabilities. Information already available and suitable for reuse is populated. Stale information is confirmed. A specialist is introduced when a matter requiring human judgement arises. That specialist sees the relevant context and completes the intervention. The resulting state is returned to the plan. The mortgage application subsequently completes. The application closes. The home-purchase plan remains active until the wider customer objective is complete. Nothing in this example requires the language model to approve a mortgage.

Nothing requires it to calculate regulated outcomes probabilistically. Nothing requires every customer statement to become permanent memory. Nothing requires the human adviser to disappear. The architectural change lies elsewhere.

The customer objective persists above the individual banking processes, and the institution possesses a mechanism for coordinating those processes around it.

That is the technical foundation of persistent relationship banking. It is also the point at which the proposition becomes experimentally testable. A bank does not need to build every component for every customer objective before determining whether the model creates value. A single bounded objective can provide a meaningful test. The most suitable initial use case would have several characteristics. It should extend over enough time for continuity to matter. It should involve more than one conventional banking activity. It should contain sufficient administration for orchestration to create value.

It should include clear points at which deterministic systems remain authoritative. It should contain at least one circumstance in which specialist human support adds value. And its outcome should be sufficiently observable that the hypotheses developed in Section 9 can be measured.

A first-home journey is one example because it combines a long-lived customer objective, savings, affordability, lending, documentation, product choice, human expertise and subsequent financial needs.

It is not the only possible example.

Preparing financially for a child, recovering from financial difficulty, approaching retirement or organising household finances after marriage could each test different aspects of the same model.

The purpose of a pilot should therefore not be to prove that a bank can create a convincing AI conversation.

That is now a relatively low bar.

The purpose should be to test whether persistent state plus bounded orchestration changes the economics and quality of a genuine banking relationship.

The bank should be able to compare the relationship model against existing journeys and answer concrete questions:

- Does the customer repeat less information?
- Does the institution understand the objective earlier?
- Are products discussed at more appropriate points?
- Do customers make measurable progress between interactions?
- Does the system correctly decide when not to act?
- Do human specialists spend less time reconstructing context?
- Are handovers more effective?
- Can the model operate within the required controls?
- Do customers trust the institution to remember their objective over time?
- And does the resulting relationship generate sufficient customer and economic value to justify further investment?

Those questions bring the argument from architecture to implementation.

The next section should therefore move from the reference model into a worked application of persistent relationship banking, using a first-home customer journey to test how the architecture behaves over time and to make the distinction between a product journey, a chatbot and a genuine relationship layer concrete.

## 12. Worked application: a first-home journey as a persistent banking relationship

The reference architecture becomes more useful when tested against a customer objective which is sufficiently long-lived and operationally complex to expose its strengths and weaknesses. A first-home journey provides an appropriate example because it extends beyond a single product, involves several distinct financial and administrative stages, includes periods during which no transaction occurs, and requires movement between automated processes, regulated lending activity and human judgement.

It also illustrates particularly clearly the distinction between a product journey and a customer objective.

A mortgage is a product.

Buying a first home is not.

The latter can begin months or years before a mortgage application exists and can continue after that application has completed. It may involve building a deposit, understanding affordability, changing spending or borrowing behaviour, establishing the appropriate ownership structure, preparing documentation, selecting a mortgage, finding a property, completing legal and insurance requirements and eventually drawing down the loan.

An institution may perform each of these constituent activities effectively while still requiring the customer to coordinate the relationship between them.

The purpose of this worked example is therefore not to design a new mortgage process. Existing mortgage controls, underwriting requirements, legal processes and product systems remain necessary. It is to test what changes if a persistent relationship is placed above those processes.

Consider a hypothetical household consisting of two customers who are both first-time buyers. They expect to purchase a home in approximately eighteen months but do not yet know whether their current income and savings make that realistic. They already hold some banking products with the institution, although their complete financial position may extend beyond it.

Their starting statement is not:

> I want to apply for a four-year fixed mortgage.

It is:

> We'd like to buy our first home sometime next year, but we don't really know whether we're in a position to do it.

That difference determines the structure of the interaction.

Under a conventional product-led model, the customers may need to begin by locating mortgage information, entering an affordability calculator or contacting a mortgage adviser. They may establish an indicative borrowing amount, discover that a larger deposit is required and then leave the mortgage journey until they believe they are ready to return.

Nothing about that experience is necessarily poor.

The limitation is that the institution may not retain the original objective as an active relationship state.

When the customers return nine months later, the mortgage process may begin again from the point at which the product journey begins rather than from the point at which the customer's home-purchase objective previously stopped.

A persistent relationship model would begin differently.

### Stage 1: Discovery

The first task is discovery.

The conversational system needs to determine what the customers are attempting to achieve without prematurely treating the statement as a mortgage application.

It might establish:

- whether both customers intend to purchase;
- whether they would be first-time buyers;
- the approximate timing;
- whether they have a broad price range in mind;
- what savings they currently expect to use;
- whether they would like the bank to help them track readiness over time.

Some of this information may initially be approximate.

That is appropriate.

At this stage, the purpose is not underwriting. It is to determine whether there is a sufficiently defined objective to justify persistent state.

The system should also distinguish between a casual enquiry and an objective the customers want the bank to retain.

A customer who asks:

> How much could someone on €80,000 borrow?

has not necessarily established a home-purchase plan.

A customer who says:

> Yes, this is something we're actively working towards and we'd like help getting ready for it.

has provided a substantially stronger basis. At that point, the customers could be offered the opportunity to establish an active first-home plan. The important step is explicit. The system does not silently infer a permanent goal from browsing behaviour or conversational probability. It asks. Once the customers agree, the goal becomes persistent state.

Conceptually:

```text
GOAL
Buy first home

STATUS
Active

TARGET
Approximately 18 months

PARTICIPANTS
Customer A
Customer B

CURRENT STAGE
Readiness assessment

NEXT OBJECTIVE
Establish realistic purchase range
and deposit position
```

The goal now exists independently of a mortgage application.

### Stage 2: Establishing the current position

The second task is establishing the current position.

If the customers are authenticated and have authorised access to relevant information, the relationship layer can retrieve data already held by the institution rather than asking them to reconstruct it unnecessarily.

That may include account balances, known liabilities, existing loan repayments and information previously provided in sufficiently recent and reusable processes. Other information may need to be supplied. Income may require confirmation. Savings held with another institution will not necessarily be visible.

Future childcare costs, financial commitments or expected changes in employment may need to be described by the customers because they are not observable from account data.

The distinction between available facts and customer context becomes important here.

A transactional record may show that one customer transfers €1,500 per month into savings.

It does not necessarily establish that €1,500 is the sustainable amount available for a future mortgage repayment.

The relationship layer should therefore use transactional information to reduce administrative work while still allowing the customer to explain circumstances which the data does not capture.

At this point, the institution can begin using existing deterministic mortgage capabilities.

The Irish mortgage framework provides clear external constraints around which the conversation can be organised. Under the Central Bank of Ireland's mortgage measures, first-time buyers are generally subject to a loan-to-income limit of four times gross income and a loan-to-value limit of 90 per cent, although lenders retain limited scope for lending above the macroprudential limits within permitted allowances and continue to apply their own credit policies and affordability assessments.[^58]

Those rules are useful inputs.

They are not themselves the customer's mortgage offer.

Suppose, illustratively, that the customers' combined gross income implies a macroprudential maximum which would support a particular price range once the required equity contribution is considered.

The relationship agent should not calculate that outcome through language-model arithmetic if a controlled mortgage-calculation service exists. It should call the service. The service returns the relevant output. The agent then explains what the result means. This produces an important distinction between maximum theoretical borrowing, indicative affordability and actual lending approval.

A customer may satisfy the Central Bank's macroprudential limit and still not obtain the corresponding mortgage because the lender must consider affordability, existing debt, employment circumstances, credit history and other relevant factors. The CCPC describes mortgage assessment as including income and financial stability, existing debts, ability to meet monthly repayments, credit history and required documentation.[^59]

The relationship layer should therefore avoid converting a macroprudential ceiling into an apparent commitment.

Its role is to help the customers understand where they currently stand.

An appropriate explanation may therefore distinguish:

> Based on the information currently available, this is the broad borrowing range permitted by the mortgage measures.

Your eventual approval may be lower depending on affordability and the bank's credit assessment.

Based on your current savings, this is the approximate gap between your present position and the amount you would need for the purchase range we have discussed.

This is a more useful outcome than simply returning a maximum mortgage number.

The result can now alter the plan.

### Stage 3: A shortfall and a revised milestone

Suppose the customers discover that their present savings are insufficient for their desired purchase range. A conventional mortgage interaction might end here. The relationship model should not. The objective remains valid. The next milestone changes.

For example:

```text
GOAL
Buy first home

CURRENT POSITION
Not yet mortgage-ready

MILESTONE
Build deposit and associated purchase costs

NEXT REVIEW
When savings reach agreed threshold
or in six months, whichever comes first

MORTGAGE APPLICATION
Not yet required
```

This is a critical part of the worked example because it demonstrates why non-conversion can be the correct banking outcome. The customers have expressed a commercially significant need. The bank knows they are likely to require a mortgage eventually. The appropriate action today may nevertheless be not to sell them one. Instead, the bank helps make the objective achievable. This is where the goal-led model begins to differ materially from an enhanced product funnel. A product funnel treats the customer as not yet converted.

A relationship plan treats the customer as actively progressing.

### Stage 4: Which needs arise, and when

The system can now consider what financial needs arise from this stage of the objective. A savings mechanism may be relevant. An emergency reserve may also be relevant. The distinction between the two matters.

If the customers possess €30,000 in total liquid savings, for example, it would be inappropriate simply to assume that the entire amount can be committed to the property deposit. The customers may wish or need to retain liquidity after purchase.

The relationship conversation might therefore establish:

- how much of existing savings the customers consider available for the home;
- whether some amount should remain as a reserve;
- whether additional purchase costs have been considered;
- and what monthly contribution appears realistic.

The customer controls those decisions unless a regulated advice process applies. The system helps make their consequences visible. This also illustrates the importance of resource conflicts between goals. Suppose one customer already has an active emergency-fund goal.

The same €10,000 should not silently appear as both a fully funded emergency reserve and part of the available mortgage deposit.

The relationship layer needs to understand that a financial resource can have more than one possible use but cannot be allocated twice simultaneously.

This is an example of a problem which product systems rarely need to solve in isolation. The mortgage system may simply receive an available-deposit figure. The relationship layer must understand how that figure fits with the customer's other objectives. The same principle applies to borrowing. During discovery, the customers may mention that they also intend to replace a car. From a conventional product perspective, that statement may indicate a potential personal-loan need. From the perspective of the home-purchase plan, the timing matters.

The CCPC advises prospective mortgage applicants that lenders examine existing debt and how applicants manage their finances and specifically recommends, where possible, clearing credit-card balances and overdrafts and maintaining evidence of regular saving.[^59]

The correct response is therefore not automatically to offer a car loan.

The relationship layer may instead make the interaction between the objectives visible:

> Replacing the car is something we can keep in the plan, but additional borrowing before your mortgage assessment could affect affordability. We can revisit it after we have established the mortgage position.

The customer has not been refused a product.

The need has been deferred because of its relationship to another objective.

The state might therefore record:

```text
NEED
Car finance

STATUS
Deferred

REASON
Customer prioritising first-home readiness

REVIEW CONDITION
Reassess after mortgage decision
or if customer circumstances change
```

This is precisely the type of reasoning which should be visible to governance and measurement systems.

If the need later becomes relevant, the institution can establish why it was originally deferred and why it is now being resurfaced.

### Stage 5: Waiting intelligently

The next part of the journey involves time. For several months, the customers continue saving. There is no reason for the bank to manufacture weekly interaction. The plan persists quietly. This is important because a persistent relationship should not be confused with a continuously active relationship. The value lies partly in the bank's ability to wait intelligently.

An appropriate future trigger might be:

- a savings threshold;
- an agreed review date;
- a material change reported by the customer;
- or another banking event which affects readiness.

Suppose the customers agree to review the position in six months unless they reach the agreed savings threshold earlier. That future check-in becomes part of the plan. No employee needs to diarise it manually. No marketing campaign needs to approximate when the customers might become mortgage-ready. The relationship layer already knows why and when another interaction could become useful. If the customers reach the threshold earlier, the event architecture can update the plan.

That does not necessarily mean:

> Congratulations, apply for a mortgage now.

It means the condition previously identified as relevant has changed.

The plan is re-evaluated.

The next conversation might begin:

> You'd asked me to revisit your first-home plan when your available savings reached €45,000. You're now above that level. If your income and other commitments are broadly unchanged, we can update the numbers and see whether it makes sense to move to mortgage preparation.

Several characteristics of the proposed relationship model are contained within that short interaction. The system remembers why the threshold matters. The contact is connected to an action previously agreed with the customer. The system does not assume that other circumstances are unchanged. It asks before relying on old information. And the next step is a reassessment rather than an automatic product sale.

### Stage 6: Moving to mortgage readiness

Suppose the customers choose to continue. The plan now moves from saving to mortgage readiness. At this point, the distinction between persistent relationship state and regulated application state becomes particularly important. Some previously established facts may be reusable. Others need to be reconfirmed.

Some information required for an actual mortgage assessment has never been collected because it was unnecessary during the earlier planning stage.

The institution should not have collected every possible mortgage application field eighteen months earlier merely because it anticipated eventually needing it.

That would conflict with the principle of data minimisation discussed previously. Instead, the relationship layer now queries the mortgage capability for its current requirements. This is preferable to embedding a static representation of the mortgage form within the language model. Mortgage requirements can change. The authoritative journey should define what is required today.

The relationship layer determines which requirements are already satisfied through information that can appropriately be reused and which must be requested from the customer.

The CCPC indicates that Approval in Principle commonly requires identification and address information, proof of income and account or credit-card statements, alongside a credit assessment. It notes that AIP is not a formal mortgage agreement and is typically valid for a limited period, commonly six to twelve months.[^59]

Those characteristics demonstrate why application state and relationship state should remain separate.

The home-purchase goal may have existed for eighteen months.

The AIP has a shorter operational lifetime.

If it expires because the customers have not yet found a suitable property, the customer should not lose the surrounding plan.

The product artifact expires. The relationship does not. The application process can now begin. Here the agent's role changes. Earlier, it interpreted a broad objective and helped establish a plan. Now a more deterministic process exists. The mortgage system knows which information is required. The AI relationship layer can make the process conversational without changing the underlying requirements.

Rather than presenting a long application form immediately, it can collect the required information in an order which fits the conversation.

Where suitable data already exists, it can propose reuse.

For example:

> I have your employment status from the information you confirmed earlier this year. I'll still need you to confirm that nothing has changed before we use it for the mortgage assessment.

This is more sophisticated than simple pre-population.

It recognises the difference between possessing a value and having sufficient authority to rely on the value for the current purpose.

The application itself remains a controlled institutional object. The customer can leave and return. The conversation knows the application exists. The plan knows why it exists. The mortgage system remains authoritative about its status. These are three different layers of state.

```text
HOME-PURCHASE PLAN
Long-lived customer objective

        ↓ linked to

MORTGAGE APPLICATION
Controlled product process

        ↓ governed by

MORTGAGE SYSTEM
Authoritative operational state
```

This separation becomes particularly valuable when the application encounters an exception.

### Stage 7: Escalation to a human specialist

Suppose one of the customers has recently changed employment. The existing automated process may determine that specialist consideration is required. The agent should not improvise a lending-policy answer. Nor should the customer be instructed simply to telephone a generic number and begin again. The relationship layer escalates the relevant part of the case to a mortgage specialist.

The specialist receives:

- the confirmed home-purchase objective;
- current target price range;
- existing deposit position;
- relevant confirmed income information;
- the mortgage application state;
- the reason the automated process could not continue;
- and the specific issue which requires human consideration.

The employee does not need to reconstruct the entire journey. Their scarce time is concentrated on the exception. This is the human-machine complementarity described in Section 7 operating in practice. The human may determine that additional documentation is required. That requirement becomes part of the mortgage application. It also becomes an outstanding action within the customer plan.

The customer can subsequently return to the AI relationship layer and ask:

> Where are we with the house stuff?

The system can answer across both layers:

> Your first-home plan is still active. Your deposit target has been met and the mortgage application is in progress. The outstanding item is the employment document the mortgage specialist requested. Once that's received, the application can return for assessment.

This is different from merely reporting:

> Mortgage application: documents outstanding.

The second statement describes the product process.

The first restores it to the customer's objective.

### Stage 8: Approval in Principle

Assume the application progresses to Approval in Principle.

The relationship layer should now recognise a material milestone.

That milestone does not mean the home-purchase objective is complete.

It means the customers are in a better position to begin or continue searching for a property within the relevant constraints.

The CCPC recommends obtaining AIP before actively searching for a home and emphasises that it establishes an indicative borrowing position rather than a guaranteed final mortgage.[^59]

This provides a natural point for the plan to change state again:

```text
GOAL
Buy first home

STAGE
Property search

COMPLETED MILESTONES
Deposit readiness
Mortgage Approval in Principle

CURRENT ACTION
Find suitable property

BANK ACTION
No immediate action required

REVIEW CONDITION
Customer reports accepted offer
or AIP approaches expiry
```

Again, the correct bank action may be to wait. This is a recurring theme. A conventional engagement system may treat a period of inactivity as an opportunity for additional messaging. A persistent relationship layer can recognise that the customer is performing an activity which largely takes place outside the bank. The bank does not need to insert itself into every week of the property search. It needs to remain ready when the state changes.

### Stage 9: Sale agreed

Suppose the customers find a property and their offer is accepted.

They return:

> We've gone sale agreed.

This statement changes several things simultaneously. The relationship layer knows which active goal the statement relates to. The mortgage system knows that the case can progress towards full approval and a formal Letter of Offer. The property itself now becomes relevant. Valuation and legal checks are required. The customers' finances may need to be reviewed again to establish whether anything material has changed since AIP.

The CCPC describes this stage as including a lender-arranged or lender-approved valuation, final legal checks and an updated review of the applicants' finances before the Letter of Offer is issued.[^59]

The relationship agent can therefore explain the sequence without pretending to own it.

The plan might now contain dependencies:

```text
Accepted offer
      ↓
Property valuation
      ↓
Updated financial review
      ↓
Full mortgage approval
      ↓
Letter of Offer
      ↓
Contracts / legal completion
      ↓
Insurance requirements satisfied
      ↓
Drawdown
```

The advantage of representing dependencies is that the agent can answer a different class of question.

The customer does not always ask:

> What is my application status?

They may ask:

> What are we waiting for?

or:

> What needs to happen before we can get the keys?

Those questions require an understanding of the sequence rather than a single product-state label. This is one of the practical benefits of relationship orchestration. The bank already contains the individual facts. The agent explains their relationship.

### Stage 10: Protection and insurance become timely

At this stage, additional financial needs also become timely.

Mortgage protection is one example.

In Ireland, mortgage protection is generally required by law when taking out a residential mortgage, subject to specified exceptions, and borrowers are not required to buy the protection policy from their mortgage lender.[^59]

Home insurance is also generally required before mortgage drawdown in the home-purchase process. The CCPC describes both mortgage protection and home insurance as requirements to have in place before drawdown.[^59]

These needs could theoretically have been inferred when the customer first said they hoped to buy a house eighteen months earlier.

They were not timely then. They are timely now. This is the distinction between relevance and relevance now operating in a real customer journey. The relationship layer can therefore surface them because the plan has reached the appropriate milestone. Importantly, the bank must be clear about the customer's freedom of choice. If the bank provides relevant insurance products, it can explain them.

It should not imply that obtaining the mortgage requires buying those products from the same institution where that is not the case.

The customer's objective provides a legitimate reason to discuss the need.

It does not remove the institution's obligation to represent the market and product boundaries accurately.

The same principle can improve the design of product choice within the mortgage itself.

### Stage 11: Choosing between rate options

Suppose the customers have several eligible mortgage-rate options.

A conventional digital interface may present these as a set of product cards containing rate, APRC, term, repayments and various conditions.

The relationship layer can still use a structured visual representation.

Conversation does not require converting structured financial information into a wall of prose.

Indeed, the most useful interface may combine natural language with purpose-built financial components.

The system might say:

> Based on the loan amount and term we've been discussing, there are three fixed-rate options available to compare.

It can then present the alternatives in a controlled component containing the authoritative figures returned by the bank's pricing and calculation services.

The customer can select one:

> Talk me through the four-year option.

The conversation then focuses on that product. This illustrates a broader principle. Conversational banking does not mean text-only banking. Natural language is useful for interpretation and explanation. Structured information is often superior for comparison. Forms remain useful for dense factual review. Charts remain useful where trends matter.

A relationship interface should therefore select the mode best suited to the task rather than attempt to force every banking interaction into chat bubbles.

The rate-selection interaction also illustrates the distinction between information and advice.

The system can explain:

- the fixed period;
- the repayment returned by the controlled calculator;
- the APRC;
- relevant break conditions;
- and differences between the available bank products.

If the bank has not authorised the AI system to provide regulated personal recommendations, it should not disguise product comparison as an independent recommendation.

The language should remain within the permitted service proposition.

The system can help the customer understand the decision.

Where formal advice or specialist judgement is required, the relationship can bring in the appropriate human capability.

### Stage 12: Completion of the mortgage

Assume the customers make their selection and the mortgage proceeds. Contracts are signed. The legal process progresses. Insurance is completed. The lender and solicitor perform final checks.

The CCPC describes drawdown as the point at which the lender releases mortgage funds to the purchaser's solicitor, subject to outstanding conditions including insurance, valuation and legal checks being satisfied.[^59]

The mortgage application can now eventually reach:

**COMPLETED**

The conventional product journey has ended.

### Stage 13: Closing the goal, and what follows

The customer objective has not necessarily ended at precisely the same moment.

The relationship layer should determine what completion of the goal means.

For a first-home plan, that may reasonably be when the property purchase has completed and the customers have taken ownership.

The plan can therefore record:

```text
GOAL
Buy first home

STATUS
Completed

OUTCOME
Home purchased

LINKED PRODUCT
Mortgage

COMPLETED
Recorded on completion
```

This creates a useful closure point. But completion should not automatically cause every adjacent product to be surfaced. The fact that the bank now knows the customers are homeowners creates many possible commercial inferences. Furniture finance may be relevant. A credit card may be relevant. Renovation borrowing may be relevant. Savings may need to be rebuilt. Insurance may need review. Investment could eventually become relevant. The goal-led principle still applies.

The system should ask what the customers need next rather than treat completion as an opportunity to open an unrestricted cross-sell sequence.

There may, however, be a directly related objective which the customers have already established.

Suppose during the original planning stage they stated that they wanted to preserve a €15,000 emergency reserve but ultimately used part of it to complete the purchase.

The home-purchase goal can close. The emergency-fund goal may remain active or become the next priority. The relationship continues without assuming that the next objective must involve another bank product. This is a useful test of whether the service is genuinely organised around goals.

The commercially tempting interaction after mortgage completion may be:

> Congratulations. Would you like a home-improvement loan?

A relationship-based interaction could instead be:

> Congratulations — the purchase has completed, so I'll close the first-home plan. You'd previously wanted to rebuild your emergency savings after the purchase. You currently have that goal paused. Would you like to pick it back up, or leave things alone for now?

The latter may produce no immediate revenue.

It demonstrates that the institution remembers the hierarchy of objectives the customer established.

If a renovation need later becomes genuine, it can be discussed at the appropriate point.

The worked journey can therefore be represented as a longitudinal sequence:

```text
CUSTOMER INTENT
"We want to buy our first home."
        ↓
GOAL CONFIRMED
        ↓
READINESS ASSESSED
        ↓
DEPOSIT / FINANCIAL PREPARATION
        ↓
WAIT
        ↓
MILESTONE REACHED
        ↓
MORTGAGE PREPARATION
        ↓
APPROVAL IN PRINCIPLE
        ↓
PROPERTY SEARCH
        ↓
SALE AGREED
        ↓
FULL APPLICATION / APPROVAL
        ↓
PROTECTION / INSURANCE / LEGAL
        ↓
DRAWDOWN
        ↓
HOME PURCHASE COMPLETED
        ↓
GOAL CLOSED
        ↓
NEXT CUSTOMER-CHOSEN OBJECTIVE
```

The bank does not need to own every activity in this sequence. It does not find the property. It does not perform the conveyancing. It does not control housing prices. It may not provide every insurance product the customers choose. Persistent relationship banking does not require the institution to become a closed ecosystem.

It requires the bank to understand enough of the objective to know where the customer is within it and which banking action is relevant next.

This is also why the worked example should not be reduced to "an AI mortgage journey". The mortgage occupies only part of the relationship. The important architectural object is the first-home plan. Several separate banking processes attach to it.

### Comparing the three service models

A useful comparison can therefore be drawn between three service models.

In a product-led digital model, the customer enters the mortgage journey when they believe they need a mortgage. The experience may be highly effective once the product has been selected.

In a conversational product model, the customer speaks to an AI interface which makes the existing mortgage journey easier to navigate.

In a persistent relationship model, the customer's home-purchase objective exists before, during and after the mortgage application, and the AI system coordinates appropriate bank capabilities around it.

The distinction can be shown simply:

```text
PRODUCT-LED

Customer → Mortgage journey → Mortgage


CONVERSATIONAL PRODUCT

Customer → AI → Mortgage journey → Mortgage


PERSISTENT RELATIONSHIP

                Savings
                   ↑
Customer → First-home plan → Mortgage
                   ↓
               Protection
                   ↓
              Human advice
                   ↓
             Future actions
```

The second model may provide a materially better interface.

Only the third changes the organising unit of the relationship.

That distinction provides a useful criterion for evaluating proposed AI banking initiatives.

If the conversational layer disappears and nothing about the bank's understanding of the customer remains, the system is primarily a conversational channel.

If the customer can return months later and the institution still knows what they are trying to achieve, where they are within the objective, what has already happened and what should happen next, a persistent relationship has begun to exist.

The worked example also reveals where the most difficult implementation problems lie. They are not primarily in producing fluent conversation. The system must determine when a casual enquiry becomes a persistent goal. It must distinguish indicative planning information from information suitable for regulated reliance. It must understand which existing customer data can legitimately be reused. It must maintain state across periods of inactivity. It must respond to events generated by other banking systems. It must know when a product becomes relevant and when it should remain deferred.

It must preserve the distinction between bank product information and personal recommendation. It must move customers into human service without losing context. It must allow the underlying product process to remain authoritative. And it must know when the objective is complete. These are more demanding requirements than chatbot quality. They are also more strategically meaningful.

### Designing a bounded pilot

The example provides a clear basis for pilot design. A bank wishing to test persistent relationship banking does not initially need to support every possible financial objective. It could select a bounded first-home cohort and test a limited set of capabilities across a defined period. The first version need not possess unrestricted autonomy.

It could initially support:

- goal establishment;
- authenticated retrieval of selected existing customer information;
- controlled affordability calculations;
- deposit milestone tracking;
- scheduled or event-based check-ins;
- retrieval of current mortgage information;
- preparation for an existing mortgage application process;
- application-state retrieval;
- and contextual handover to human mortgage specialists.

More consequential actions could remain within the existing digital and human processes. The purpose of the pilot would not be to maximise the amount the AI is permitted to do. It would be to test the hypothesis that persistence and orchestration create value even before extensive autonomy is introduced. That is an important sequencing decision.

A bank can learn whether customers want their home-purchase objective remembered without first allowing an AI system to submit a mortgage.

It can test whether structured handovers reduce specialist effort without automating underwriting. It can measure whether event-based check-ins are useful without allowing the system to initiate financial transactions. It can establish whether customers value returning to a conversation which already understands the objective. The architecture can then earn additional authority rather than being granted it in advance. A credible pilot should therefore produce evidence across several dimensions identified in Section 9. On customer progression, the bank can measure whether customers move more successfully from early intention to mortgage readiness.

On customer effort, it can measure repeated information requests, channel changes and the number of contacts required. On continuity, it can measure whether plans and outstanding actions survive correctly between sessions. On timing, it can measure whether product discussions occur at the stages for which they were intended. On human capacity, it can measure whether mortgage specialists spend less time reconstructing cases and more time on substantive issues. On control, it can measure extraction errors, inappropriate tool calls, incorrect reuse of stale information and escalation failures.

On commercial outcomes, it can eventually examine conversion, retention, relationship depth and customer choice of the bank when the mortgage need becomes actionable.

The pilot should also include explicit failure criteria. If persistent memory causes customers to feel monitored rather than supported, the proposition needs to change. If structured context frequently contains inaccuracies, reliance on it should remain limited. If employees spend significant time correcting AI-prepared summaries, the expected capacity benefit may not exist.

If the system increases mortgage conversion principally by encouraging customers to apply before they are ready, it has failed despite the apparent commercial improvement.

If proactive contact connected to plans is experienced as marketing under another name, the distinction the model depends upon has not been achieved.

The value of a worked use case is therefore not merely illustrative.

It makes the thesis falsifiable.

There is a further reason why first-home buying is a useful test.

It is a circumstance in which the customer's objective is likely to be strategically important to the bank even if the eventual mortgage is not won.

If a customer establishes a first-home plan with an institution, uses it for eighteen months, then ultimately selects another bank's mortgage because the competing offer is materially better, several interpretations are possible.

From a narrow product-conversion perspective, the bank has failed.

From a customer-interest perspective, the system may have behaved correctly.

From a relationship perspective, the more important question is whether the customer continues to use the institution as a trusted financial relationship despite purchasing one product elsewhere.

This becomes particularly relevant in the agentic environment described in Section 10.

A credible relationship layer cannot depend entirely upon the assumption that the bank's own product will always be the best answer.

The stronger proposition is that the customer values the relationship enough to continue using it even where individual financial products may be sourced elsewhere.

This creates a difficult commercial question for universal banks, but an important one. If relationship ownership is genuinely valuable, it should be possible for the relationship to survive an individual lost product decision. The analogy with human financial relationships is useful. A trusted adviser does not cease to be valuable because one recommended action does not generate revenue for the adviser. Indeed, the willingness to support an outcome which does not maximise immediate revenue can be part of what creates trust.

A bank-owned agent operates under different commercial and regulatory conditions from an independent adviser, and the analogy should not be extended too far.

The underlying insight nevertheless remains relevant.

If every persistent customer goal inevitably resolves into the institution's own product, customers may reasonably conclude that the apparent relationship is simply a more sophisticated sales funnel.

The first-home use case therefore tests not only the technology. It tests the institution's willingness to distinguish relationship value from immediate product conversion. That may ultimately be one of the most consequential operating-model changes required. The scenario also illustrates the broader proposition with which this paper began. Traditional relationship banking made continuity possible largely through people. Digital banking made individual transactions substantially more efficient but often left the customer responsible for coordinating between them. Contemporary AI creates the possibility of a third model.

The institution can retain the efficiency and control of digital banking while adding a persistent layer capable of remembering an objective, interpreting changing circumstances, coordinating existing processes and invoking human expertise when it becomes necessary.

A first-home customer does not need a dedicated employee for eighteen months.

They may still benefit from the bank behaving as though the relationship itself has remained present for eighteen months.

That is the central proposition.

And it provides the basis for moving from an individual worked example to the final analytical question: whether the evidence assembled throughout the paper is sufficient to support the wider strategic thesis, where its limitations remain, and what conclusions a traditional retail bank can reasonably draw today.

## 13. Discussion: what the evidence supports, and what remains uncertain

The analysis developed throughout this paper supports a proposition which is narrower than the claim that artificial intelligence will transform retail banking, but more consequential than the claim that it will improve customer-service automation.

Contemporary AI appears increasingly capable of performing several functions which have historically contributed to the value of a banking relationship: interpreting unstructured customer objectives, retaining structured context, coordinating multiple activities, retrieving information from disparate sources, invoking bounded tools and maintaining continuity across interactions. These capabilities are not yet sufficiently reliable to justify unrestricted autonomous operation across consequential financial activity. They are, however, sufficiently developed to make a different retail banking service model technically plausible.

The economic significance of that development lies in the possibility that some relationship functions can be separated from the human relationship manager.

Historically, context retention, coordination, interpretation and administration were often bundled with human interaction because the employee was the mechanism through which those functions occurred. The cost of the bundle limited the population to whom high-intensity relationship service could economically be provided. If technology can perform some of those functions reliably while reserving human capacity for judgement, exceptions and specialist expertise, the marginal cost of continuity may fall materially.

That does not mean that a private-banking relationship can simply be digitised and offered to every retail customer.

Nor does it mean that customers will necessarily want one.

Both propositions require considerably stronger evidence than is presently available.

The more defensible conclusion is that the historical trade-off between digital scale and relationship continuity may no longer be as absolute as it once appeared.

The implications are potentially significant enough to justify experimentation. They are not yet sufficiently established to justify treating a particular future model as inevitable. Several objections need to be taken seriously. The first concerns customer demand. A persistent banking relationship is only valuable if customers actually want the institution to occupy that role.

The fact that people use digital banking extensively does not establish that they want their bank to maintain an ongoing representation of their personal objectives. Some customers may want precisely the opposite. They may value banking because it is transactional, predictable and relatively impersonal. They may wish to use the bank to hold money, make payments or obtain credit without creating a broader relationship around those activities.

This possibility should not be regarded as resistance which must be overcome.

It may represent a legitimate service preference.

The model proposed in this paper is therefore stronger when understood as an available relationship capability rather than a universal mode which every retail customer must enter.

Where the customer presents a discrete task, the institution should complete it efficiently.

Where the customer presents an objective which spans time or several activities, the bank can offer continuity.

The customer's willingness to create that continuity should form part of the service itself.

This is particularly important because existing research on adoption of AI financial services does not support the proposition that customers will automatically prefer artificial advisers as their capabilities improve.

Studies of robo-advisory adoption continue to find trust, anxiety, perceived competence and preference for human advisers to be material influences on willingness to use automated financial services. A 2024 study involving 445 investors found that trust, performance expectations, anxiety and preference for human advice all contributed significantly to adoption intentions. More recent work similarly identifies trust as foundational to consumer willingness to adopt AI-enabled financial advice, with perceived competence and perceived goodwill playing distinct roles. These studies concern investment advice rather than the broader relationship model considered here and are drawn from populations outside Ireland, so their direct generalisability is limited. They nonetheless reinforce the proposition that technical capability alone does not create customer acceptance.[^44]

This makes controlled customer choice particularly important. A persistent goal should be confirmed rather than silently established. A proactive check-in should relate to a purpose the customer understands. A human alternative should remain available where appropriate. And the customer should be able to terminate or pause the relationship state which is shaping future interaction. These features may appear to reduce the amount of personalisation available to the bank. They may instead be necessary conditions for customers to permit the relationship to become deeper.

The second objection concerns the credibility of a bank-owned agent acting in the customer's interests. This is one of the strongest objections to the model.

The institution providing the relationship also manufactures or distributes financial products and derives economic value from their use. A bank-owned agent which understands the customer's goals therefore operates within an inherent commercial incentive structure.

That conflict is not created by AI. Banks have always had incentives to deepen customer relationships and distribute additional products. Artificial intelligence changes the scale and effectiveness with which those incentives can be applied. A human employee may know part of the customer's circumstances.

A persistent AI system could potentially know far more, retain it for longer and apply it consistently across millions of interactions.

The same capability which allows a system to recognise that an additional credit product would undermine an imminent mortgage objective could also be used to identify precisely when a customer is most persuadable.

This is why the distinction between relationship banking and optimised cross-selling cannot be assumed from the quality of the interface.

It has to be established through governance and measurable behaviour.

The Irish regulatory framework makes that distinction especially relevant. The Consumer Protection Code 2025 requires firms to incorporate customers' interests into their strategy, business model, systems, controls, policies and processes, and to avoid designing financial services or engagement practices which unfairly exploit customers' behaviours, habits, preferences or biases in a way which causes detriment.[^31]

A goal-led relationship architecture could support those obligations because it provides an explicit reason for an institutional action.

The bank can potentially establish that:

- the customer confirmed a particular objective;
- a financial need arose from that objective;
- the need became relevant at a particular stage;
- and the product surfaced because it addressed that need.

That is a more inspectable causal chain than a pure propensity score. The architecture does not eliminate the conflict of interest. It makes the conflict easier to govern. There remains a more fundamental commercial test.

If the institution's product is clearly unattractive relative to alternatives available to the customer, how should a bank-owned relationship layer behave?

There is no universal answer. A bank is not necessarily providing independent whole-of-market advice merely because its interface is intelligent. Its responsibility is first to describe the scope of the service accurately. A bank agent can credibly help a customer understand and navigate the products available from that bank.

It should not imply that an internal product is objectively the best market option unless the service has actually performed a sufficiently broad and appropriately regulated comparison.

The distinction between:

> This is the option from us which best fits the criteria you have given me.

and:

> This is the best option available to you.

is therefore fundamental.

A sophisticated interface increases rather than reduces the need for that clarity.

The third objection is that third-party agents may be structurally better placed to own the relationship.

An independent agent can potentially observe relationships across several institutions, compare the market and optimise decisions without being tied to the product set of a single bank.

As financial data becomes increasingly portable and machine-readable, that structural advantage could increase.

The ECB has already identified the possibility that third-party AI advisers could help consumers identify cheaper financial products across providers, potentially increasing transparency while putting pressure on banks' margins.[^6]

Industry analysis takes the argument further. McKinsey's 2026 work on retail banking describes three possible responses by incumbent banks: wait, adapt to a third-party agent layer and become a strong product provider within it, or compete to retain the direct customer relationship by building their own agentic relationship layer. The analysis also reports that 23 per cent of respondents to its 2025 global banking survey were already using generative AI for financial tasks at least monthly and that 57 per cent would consider using a third-party financial agent if their bank did not offer one. These figures are survey evidence rather than observed long-term behaviour, and McKinsey's conclusions should be treated as industry analysis rather than independent academic evidence. They nevertheless demonstrate that the strategic choice identified in this paper is already emerging explicitly within banking strategy.[^60]

The strength of the third-party model should therefore not be minimised. An independent agent may eventually possess greater contextual breadth. It may know the customer's financial relationships across several banks. It may have access to broader non-financial context. It may have less direct incentive to favour a particular bank product. And it may be able to switch providers with considerably less friction than the customer would tolerate manually. A bank-owned agent does not automatically defeat those advantages. Its case rests on a different combination of assets.

The incumbent already has authenticated identity. It already possesses authoritative financial state. It already operates the systems required to execute the relevant activity. It already bears regulatory responsibility for much of what occurs. And it can connect the customer directly to appropriately competent human specialists. The strategic contest is therefore not obviously between a more intelligent external agent and a less intelligent bank agent. It may be between contextual breadth and institutional depth. The external agent may understand more of the customer's wider world.

The bank may be capable of executing more deeply within the financial domain. The likely outcome may be hybrid. Customers may use both.

This is why the architecture described in Section 8 is strategically preferable to a closed proprietary assistant. A bank which exposes reusable, controlled capabilities can participate in either future.

Its own relationship layer can use them. Authorised external agents can potentially use a subset of them. The bank therefore does not need to predict perfectly which interface ultimately dominates. It needs to ensure that it remains relevant under both. The fourth objection concerns the economics once governance is included.

Much of the intuitive case for AI in banking rests on the low marginal cost of software relative to human labour.

That comparison can become misleading if it ignores the infrastructure required to operate a regulated AI system safely.

A production relationship layer requires:

- model access;
- orchestration infrastructure;
- secure tool integrations;
- identity and authentication;
- persistent state;
- data governance;
- monitoring;
- evaluation;
- human escalation;
- model-risk oversight;
- privacy review;
- cybersecurity;
- incident management;
- vendor management;
- operational-resilience arrangements;
- and ongoing maintenance as models and banking systems change.

The cost is therefore not simply the cost of an API call. Nor should a reduction in direct employee effort automatically be equated with a proportional reduction in cost. The organisation may initially need both the old and new service models while customer adoption develops. Employees may require additional training. AI-generated cases may create new review work. Control teams may need new capabilities. Third-party model costs can vary materially with volume and complexity. The economic proposition must therefore be demonstrated end to end.

The relevant question is:

> Does the system reduce the total cost of delivering useful continuity once technology, governance, operational support and human intervention are included?

That remains an empirical question. There are nevertheless reasons to regard it as plausible. The opportunity does not depend on full automation. It can create economic value by reducing repeated administration and context reconstruction within existing human processes.

A relationship layer which saves a specialist ten minutes preparing for a consequential conversation creates value even if the specialist still conducts the conversation.

A system which prevents a customer from calling a contact centre because it can accurately explain an application state creates value without making a financial decision.

A system which carries context across channels can reduce work in several parts of the institution simultaneously.

This means the business case may emerge incrementally rather than requiring the entire operating model to be automated before value appears.

Available evidence on current banking AI adoption supports caution but also suggests that institutions are already moving beyond small experiments.

The Bank of England and FCA's 2024 survey found that 75 per cent of respondent firms were already using AI and a further 10 per cent planned adoption within three years. A third of reported AI use cases relied on third-party implementations, while foundation models accounted for 17 per cent of reported use cases. At the same time, only a very small proportion of automated use cases were described as fully autonomous, indicating that existing institutions continue to rely substantially on human involvement and bounded automation.[^50]

That pattern is consistent with the economic model proposed here. The near-term opportunity is not dependent upon replacing the human banker. It lies partly in reallocating human effort away from work which machines can perform reliably. The fifth objection concerns AI reliability itself. This is the most immediate technical constraint. Contemporary agents remain capable of making errors which would be unacceptable if directly translated into consequential financial action.

BIS experiments evaluating agents on comparatively simple multi-stage tasks found that systems could perform impressively on narrow activities while struggling to recognise and recover from their own mistakes. The researchers concluded that near-term agents were more naturally suited to augmenting human operators than operating as unconstrained substitutes.[^27]

Security provides an additional constraint.

NIST research on agent systems highlights that giving models access to external tools creates new categories of risk, including differences between read-only and write capabilities, the trustworthiness of the operating environment, action reversibility and the degree of model autonomy. Its work on agent hijacking has demonstrated that malicious instructions embedded in information an agent processes can cause unintended actions, and more recent large-scale red-team exercises found successful hijacking attacks against each of the frontier models tested.[^22]

These findings make a strong case against architectures which rely principally upon the model's own judgement to remain within safe boundaries.

They strengthen the argument for bounded tools, constrained permissions, deterministic decision systems, customer confirmation and human escalation.

The appropriate comparison should therefore not be:

> AI agent versus human banker.

It should be:

> AI-orchestrated banking system versus current banking system.

The former includes deterministic controls and human participation.

If the relationship model requires general-purpose AI to become infallible before it can create value, it is unlikely to be viable in the foreseeable term.

If it allows probabilistic systems to perform those activities for which probabilistic reasoning is useful while retaining established controls for consequential actions, the reliability threshold becomes considerably more achievable.

The distinction is essential.

A language model does not need to be trusted to approve a mortgage in order to add value to a mortgage relationship.

It needs to understand what the customer is asking sufficiently well to invoke the correct controlled capability. It does not need to be trusted to determine a credit policy. It needs to know when a credit-policy service is authoritative. It does not need unrestricted permission to act on every inferred goal. It needs to distinguish when customer confirmation is required. This is why system design matters at least as much as model quality. The sixth objection concerns privacy and the possibility that relationship banking becomes surveillance banking.

A system which knows a customer's objectives, preferences, financial constraints and previous conversations can provide substantially better continuity. It can also create a much richer profile than conventional banking channels have typically assembled into one customer-facing service. There is a temptation to assume that more context necessarily produces better personalisation. That assumption should be rejected.

The EDPB's opinion on AI models reinforces the requirement for purpose limitation, necessity and consideration of individuals' reasonable expectations, including the nature of the relationship, the original context in which information was collected and potential later uses.[^40]

The relevant design objective is therefore not a complete customer memory. It is a useful and proportionate relationship state. The system should retain what it needs to maintain the service. It should not treat every conversational detail as a durable institutional attribute. Some information may need to remain within a specific product process. Some should expire. Some should be available only to a limited employee population. Some should be used only within the current conversation.

The ability to forget, compartmentalise and reconfirm is therefore part of the value proposition rather than an obstacle to it. The seventh objection concerns whether customers actually need a relationship at all. The language of relationship banking can create a tendency to overstate the complexity of ordinary financial life. Many banking activities are simple. A customer transferring money between accounts does not need a financial plan. A customer replacing an expired card does not require a persistent goal.

A customer who knows exactly which savings product they wish to open may prefer to do so without conversation. The objective of the proposed model should not be to turn routine banking into an ongoing dialogue. That would recreate friction. The value exists where continuity solves a real problem. The more useful segmentation may therefore be based not on customer wealth but on relationship complexity. A mass-market customer buying their first home may temporarily have a highly complex financial objective.

A wealthy customer performing a routine transfer may have a simple one. This suggests that the future allocation of relationship intensity could become more dynamic. Historically, high-intensity service has generally been allocated according to customer value because the scarce resource was human time.

If the marginal cost of digital continuity falls, some of that intensity can instead be allocated according to the complexity or duration of the customer's objective.

This is one of the potentially more important distributional implications of the model.

A first-time buyer does not need to be a private-banking customer in order to benefit from continuity.

A newly separated household does not need to meet a wealth threshold before the institution can preserve relevant context across several interactions.

A customer experiencing a significant change in income may temporarily require considerably more coordination than their ordinary banking relationship would justify economically under a human-only model.

Persistent digital relationships could therefore make service intensity more responsive to need rather than solely to customer economics.

That proposition remains to be tested, but it would represent a meaningful change to retail banking.

The eighth objection concerns institutional capability.

It may be technically possible to build the relationship model while remaining organisationally difficult for a universal bank to operate it.

Sections 5 and 8 identified the central problem. The customer's goal crosses product boundaries. The institution's economics, systems and management structures often do not. A customer may be simultaneously valuable to deposits, mortgages, cards and insurance businesses. Those businesses may have separate targets.

A goal-led system may sometimes conclude that the best customer action is one which reduces the immediate commercial outcome for one of them.

The difficult part of the transformation may therefore be granting the relationship layer enough authority to make those trade-offs.

Technology cannot resolve this independently.

A model can be instructed to prioritise the customer's goal.

If product management, incentives and performance measurement continue to reward immediate product conversion above relationship progression, the system will eventually reflect those organisational priorities.

The Central Bank's requirement that customer interests be reflected in a firm's culture, strategy, business model, decision-making, systems and controls is particularly relevant here because it extends beyond the wording of an individual customer interaction.[^31]

For persistent AI relationship banking to represent a genuinely different model, the institution must be willing to accept some outcomes which a product funnel would classify as failures.

The customer is not yet ready. The product should be deferred. A competing objective is more important. Human advice is required. No action is currently useful. The customer has declined the need. Those outcomes need to be legitimate within the operating model. Otherwise the relationship language becomes cosmetic. The ninth objection is strategic timing. A bank could accept the long-term argument and still conclude that immediate investment is premature. Third-party financial agents remain at an early stage. Delegated authority is unresolved. Customer trust in autonomous financial activity remains uncertain.

Agent security and reliability remain imperfect. Regulatory expectations will continue to develop. A wait-and-see strategy therefore has a rational basis.

Indeed, McKinsey's analysis of retail banking explicitly identifies wait-and-see as one of three plausible strategic postures and notes several sources of friction which could slow third-party-agent adoption: regulation, household switching complexity, cost and trust.[^60]

The weakness of waiting is not that third-party disintermediation is certain to occur rapidly.

It is that several capabilities required to respond later have long lead times.

A bank wishing eventually to operate a persistent relationship layer needs:

- shared customer state;
- machine-readable product information;
- reusable APIs;
- event infrastructure;
- identity and delegation models;
- governed AI capabilities;
- cross-product ownership;
- and employees capable of operating effectively alongside AI.

Those are not capabilities which can all be introduced rapidly after a competitor or third-party interface has already achieved customer adoption.

Conversely, many of them are valuable even if the strongest agentic scenario does not materialise. Better APIs support digital channels. Clearer customer-state architecture supports employees. Reusable capabilities reduce duplication. Event-driven systems improve servicing. Better provenance and data controls support broader analytics. Context-rich human handovers improve existing customer journeys. The appropriate response to strategic uncertainty may therefore not be a large irreversible investment in a fully autonomous bank agent. It may be investment in optionality. The bank develops the underlying capabilities which allow it to move in either direction.

It can build its own relationship layer if customers value it. It can expose products effectively to third-party agents if they become important. And it can use the same infrastructure to improve conventional digital and human service in the meantime. This is a materially different proposition from making a binary prediction about which interface will win. The tenth objection concerns the definition of success. The proposed model is attractive partly because it offers a more customer-centred organising principle than product conversion.

That creates a danger of using vague concepts such as "relationship", "trust" or "financial well-being" in place of measurable outcomes. The model should be held to a stricter standard. It should produce observable improvements. Customers should repeat less information. Complex objectives should progress more efficiently. Product discussions should become better timed. Human specialists should spend less time reconstructing cases. Customer state should survive channel transitions more accurately. The system should know when not to act. Control failures should remain within acceptable limits.

Customers should demonstrate willingness to return to the relationship. Commercial value should ultimately emerge. If these outcomes do not improve, the relationship thesis is weakened regardless of how advanced the conversational interface appears. This is why the worked example in Section 12 deliberately produces falsifiable hypotheses. The service must earn the right to expand.

This is also consistent with the current risk environment. The EBA's June 2026 assessment identifies operational failure, bias, data-quality problems, legal and conduct risk, cyber threats, third-party dependency and regulatory uncertainty among the material risks accompanying increased AI use, and calls for risk-sensitive, transparent deployment integrated with existing resilience and governance frameworks.[^57]

Experimentation should therefore become progressively more consequential as evidence accumulates. An early system can understand a goal. A later system can retrieve customer state. A later system can prepare an application. A later system may be permitted to perform bounded state-changing actions.

Authority should increase because the service has demonstrated reliability under the relevant conditions, not simply because a newer model appears more capable.

This principle can be described as earned autonomy. It may provide a useful implementation philosophy for banking AI. The architecture begins with broad interpretative capability and narrow authority. Authority expands only where the institution can demonstrate that controls, customer outcomes and operational performance justify it. This reverses a common framing of agentic AI. The objective is not to maximise autonomy. It is to allocate exactly as much autonomy as the use case can safely support. The combined evidence therefore suggests a position between technological enthusiasm and institutional conservatism.

There is insufficient evidence to conclude that:

- customers will universally prefer AI-mediated banking;
- general-purpose agents will inevitably disintermediate banks;
- AI can safely replace human judgement in consequential financial decisions;
- the economics of persistent relationship banking are already proven;
- or a bank-owned agent will necessarily outperform an independent one.

There is, however, sufficient evidence to conclude that:

- the capability boundary has moved materially;
- AI systems can increasingly interpret unstructured customer intent and coordinate bounded tools;
- relationship functions can be decomposed rather than treated as an indivisible human service;
- banks already possess important assets in identity, data, execution, regulation and human expertise;
- third-party agents create a credible new interface through which financial intent may increasingly be mediated;
- and a failure to decide what role the bank wishes to occupy could allow that role to emerge by default.

The central strategic insight is consequently less dramatic than the claim that banks face imminent disintermediation.

It is also more durable.

The interface through which customer financial intent is understood is becoming contestable.

Traditional banks have historically occupied much of that position because they held the accounts, distributed the products and controlled the principal customer channels.

AI reduces the extent to which those functions must remain bundled. A third party can potentially understand the objective without manufacturing the mortgage. A bank can potentially maintain the relationship without assigning a human relationship manager. An external agent can potentially compare products while the bank continues to execute them. The institutional boundaries which previously determined the shape of the customer relationship are therefore becoming less fixed. This creates a strategic choice.

A bank can become exceptionally effective at manufacturing and executing financial products for customers and agents which arrive with needs already defined.

It can seek to retain a primary role in understanding and progressing those needs itself. Or it can operate across both models. Each strategy can be rational. The important requirement is that the choice becomes explicit.

For a full-service incumbent retail bank, the case for testing a direct relationship model is particularly credible because the required assets largely already exist.

The institution does not need to create a regulated balance sheet. It already has one. It does not need to acquire customers before learning anything about them. It already has customer relationships. It does not need to invent mortgage, savings or payments infrastructure. It already operates those capabilities. It does not need to create human financial expertise from nothing. It already employs it.

What is missing is a mechanism which can connect those assets around a persistent representation of what the customer is attempting to achieve.

Contemporary AI may provide enough of that mechanism to make experimentation rational.

Whether it ultimately produces a superior service remains to be demonstrated.

That is an important distinction.

The strategic conclusion of this paper should therefore not be:

> Banks must build AI relationship managers.

It is:

> Traditional retail banks should now determine deliberately whether maintaining a direct, persistent role in understanding customer financial intent is strategically important to them, and should test whether contemporary AI makes that role economically and operationally viable at retail scale.

That position preserves uncertainty. It also creates a clear action. The appropriate next step is not wholesale transformation. It is a bounded experiment capable of testing the thesis under real operating constraints.

A suitable experiment should begin with an objective whose persistence matters, such as first-home ownership; connect to genuine authoritative banking capabilities; retain controlled relationship state; preserve human judgement where required; and measure the outcomes identified in Section 9 against the existing service model.

If the evidence shows no material improvement, the hypothesis should be reconsidered.

If the evidence shows that customers value continuity, that employee effort falls, that banking activity becomes better coordinated and that control can be maintained, the strategic case for extending the model becomes materially stronger.

The final section therefore draws together the argument of the paper and sets out the conclusions which can reasonably be reached today, while separating those conclusions from the claims which remain hypotheses.

## 14. Conclusion: the return of relationship banking

Retail banking has spent several decades becoming increasingly effective at allowing customers to transact without needing a banker.

That transformation has delivered substantial benefits. Routine financial activity is faster, more accessible and less costly to distribute. Customers can perform tasks which previously required a branch, a telephone call or direct employee involvement from a device in their pocket. Product applications have become increasingly digital. Banking systems contain substantially more structured information about customers than a branch-based institution could historically have retained through personal relationships alone.

The argument of this paper is not that this transition was mistaken, nor that banking should return to a branch-led model. It is that something different may now be possible. Digital banking has been particularly successful where the customer already knows what they want the institution to do. The customer identifies a task or product and the bank provides an increasingly efficient mechanism through which it can be completed. Relationship banking addresses a different problem. It helps determine what the customer is trying to achieve, retains relevant context between interactions, connects several financial activities to the same objective and assists in determining what should happen next.

Historically, these functions have been difficult to provide universally because they have been closely associated with human labour. A sufficiently capable relationship manager can accumulate soft information, remember previous discussions, interpret changing circumstances, coordinate specialists and follow an objective over time. The same individual has finite capacity. Meaningful continuity has therefore tended to be economically concentrated where the expected value or complexity of the customer relationship justifies the labour required to maintain it.

The central hypothesis examined in this paper is that contemporary artificial intelligence may alter that constraint. The relevant technological development is not principally that machines can now produce more natural conversation. It is that language models can increasingly operate as components within wider systems capable of interpreting unstructured intent, extracting structured information, maintaining persistent external state, selecting from authorised tools and coordinating bounded processes.

Those capabilities allow several functions traditionally bundled within a human banking relationship to be separated. Context retention can become a system capability. Routine coordination can become a system capability. Administrative follow-through can become a system capability. Information gathering can become partly conversational and partly automated. Deterministic banking systems can continue to own calculations, eligibility, product state and financial execution. Human bankers can remain responsible where judgement, expertise, discretion, vulnerability or regulatory accountability makes human involvement materially important. The resulting proposition is therefore not AI instead of the banker.

It is a different allocation of work between customer, machine, banking system and banker. That distinction matters because it changes the economics of the relationship. A customer need not be assigned a dedicated employee for the bank to behave with continuity. The institution may be able to remember what the customer is trying to achieve, maintain an agreed plan, recognise when circumstances have changed and coordinate the relevant parts of the bank without requiring an employee to reconstruct the relationship at every interaction. Human expertise can then be introduced when it adds the greatest value.

This creates the possibility — not yet the certainty — that some characteristics historically associated with higher-value relationship banking could become available much more widely within retail banking. The potential innovation is therefore better described as the reduction in the marginal cost of continuity than as the introduction of conversational AI. This distinction should influence the way banks approach the technology.

A more capable chatbot does not necessarily create a relationship. A customer can have an excellent conversation with an AI system which disappears when the session ends. A system can answer product questions accurately while remaining unaware of the objective which connects them. A customer can be transferred efficiently into a mortgage application while the institution forgets that the mortgage forms only one part of a home-purchase objective established months earlier. Conversational quality is important. It is not sufficient.

A persistent relationship requires something more durable: a governed representation of customer intent which exists independently of the model and independently of any single product application. That representation allows a bank to distinguish between life circumstances, customer goals, financial needs, banking actions and products. The sequence matters.

A life circumstance can create several potential financial needs. A need can have several possible solutions. A product can be relevant without being relevant today. A customer can qualify for a product which does not advance their immediate objective. A possible need can be discovered without being activated commercially. These distinctions are relatively easy to collapse within conventional product marketing because the product is the principal organising object. A goal-led relationship architecture can preserve them. The product remains necessary for execution. The customer's objective becomes the unit through which continuity can be maintained. This is not merely a customer-experience distinction. It has conduct implications.

A persistent AI system may be capable of identifying substantially more potential commercial opportunities than a conventional interface. If its primary objective is product conversion, artificial intelligence could make cross-selling significantly more effective without necessarily making banking more helpful. The legitimacy of the relationship proposition therefore depends upon its ability to distinguish between understanding the customer and exploiting that understanding.

Ireland's regulatory environment makes that distinction particularly relevant. The Central Bank of Ireland's Consumer Protection Code 2025, which has applied since March 2026, explicitly requires firms to incorporate customers' interests into strategy and decision-making and applies the same consumer-protection expectations to digitally delivered services. Digital platforms must provide consistent and objective outcomes serving customer interests, with support available where required, and firms must not design digital engagement in ways which unfairly exploit customer behaviours, habits, preferences or biases to their detriment.[^31]

A persistent AI relationship could support those objectives. It could also undermine them. The difference lies primarily in governance. A goal should not be silently created because a model believes the customer probably wants something. A customer circumstance should not become an automatic product opportunity. Information provided conversationally should not become an unrestricted input to every future banking decision. An inference should not acquire the authority of a confirmed fact merely because the model expresses it confidently. A customer should be able to correct, pause or end a goal which is organising future interactions. And a system should be capable of concluding that the correct action is to wait. These requirements lead to a more disciplined understanding of AI memory. A bank does not need to remember everything a customer has ever said. It needs to remember appropriately.

That requires provenance, purpose limitation, temporal validity and separation between conversational information, relationship state and regulated decision state. It also requires the foundation model itself to remain outside the authoritative customer record.

Models will change. Providers will change. The customer relationship should survive both. This architecture also provides a response to one of the central reliability problems associated with current AI. A bank does not need to trust a language model to become the bank. It can instead use probabilistic systems where probabilistic reasoning is useful and deterministic systems where deterministic control is required. The AI can interpret a customer's question. An authorised calculator can produce the repayment. The AI can recognise that an application status is being requested.

The system of record can provide the status. The AI can recognise that a case has become exceptional. A human specialist can exercise the judgement. The AI can explain the result. The accountable banking capability remains responsible for producing it.

This model is consistent with the direction observable in current financial-sector AI adoption. The Bank of England and FCA found in their 2024 survey that 75 per cent of respondent firms were already using AI, with a further 10 per cent planning adoption within three years, while only a very small proportion of automated use cases were described as fully autonomous. The same survey found increasing reliance on third-party AI implementations and concentration among major model providers.[^50]

That pattern suggests that the relevant near-term model is not unrestricted autonomy.

It is governed augmentation and bounded agency.

This is also consistent with the risk environment identified by European regulators. The EBA's June 2026 risk assessment identifies AI-related operational failure, data-quality problems, bias, legal and conduct risk, cyber threats and third-party dependence among the risks requiring proactive management, while emphasising alignment with operational-resilience requirements under DORA.[^57]

A bank therefore does not need to choose between moving quickly and maintaining control. It needs an architecture which permits capability to expand without requiring authority to expand at the same rate. This paper has described that principle as earned autonomy. A system can begin with substantial interpretative capability and relatively little authority. It can understand the customer's objective. It can retrieve information. It can explain controlled outputs. It can maintain state. It can prepare work. It can recommend that a human become involved.

Only where reliability, controls and customer outcomes have been demonstrated should increasingly consequential actions become available. This is a more appropriate objective for a regulated bank than autonomy for its own sake. The human banker consequently remains central to the model, although the nature of human involvement may change.

Artificial intelligence may reduce the amount of human time required for activities which add relatively little human value: reconstructing information, finding application state, documenting interactions, routing work and following up routine actions.

That can allow employees to spend proportionally more time on judgement, exceptions, advice, vulnerability and significant customer decisions.

The result could therefore be counter-intuitive.

As banking becomes more automated, meaningful human banking may become more economically accessible.

A customer who could never economically have been assigned a permanent relationship manager might nevertheless have access to an experienced human when their circumstances genuinely require one because the system surrounding that employee has reduced the amount of specialist time consumed elsewhere.

AI may therefore make the relationship manager more scalable without attempting to make the relationship manager unnecessary. This is likely to be particularly important in circumstances which are financially significant but infrequent. Buying a first home. Preparing for retirement. Dealing with bereavement. Experiencing financial difficulty. Reorganising household finances after separation. Preparing financially for a child.

The customer may require unusually high service intensity for a period without possessing the wealth which has traditionally justified a dedicated relationship model.

If technology reduces the cost of providing continuity, relationship intensity can potentially become more responsive to customer need and objective complexity, rather than being allocated predominantly according to customer economic value.

That is potentially one of the more socially significant consequences of the model. It remains a hypothesis. It deserves to be tested. The first-home example developed in this paper demonstrates what such a test might look like. The customer expresses an objective before a product has been selected. The bank establishes whether the customer wants that objective to persist. The system creates a plan. Existing information is reused where lawful, reliable and appropriate. Deterministic banking capabilities establish affordability and product state. Milestones persist between sessions.

The system can wait where no useful action exists. Products become relevant as the customer's position changes. An otherwise plausible need can be deferred where it conflicts with a more immediate objective. Human specialists enter where judgement becomes necessary without requiring the customer to recreate the relationship. The mortgage application can complete while the wider goal remains active. And the customer, rather than the product, determines what objective follows. None of those capabilities requires speculative autonomous banking. Most can be tested with existing banking infrastructure combined with relatively bounded AI.

This leads to one of the more practical conclusions of the paper. The threshold for experimentation is considerably lower than the threshold for transformation. A bank does not need to believe that autonomous agents will dominate financial services before testing persistent customer goals. It does not need to automate credit decisions before testing contextual handover.

It does not need to permit AI to execute transactions before testing whether customers value a relationship which remembers where they are going.

It does not need to rebuild the core bank before exposing selected capabilities through controlled interfaces. The strategic question can therefore be investigated empirically without committing the institution to the final form of the model. This is important because considerable uncertainty remains. The paper has not established that customers will universally want their bank to act as a persistent financial relationship manager. It has not established that a bank-owned agent will be trusted more than an independent agent in practice.

It has not established that the total economics remain attractive once governance, infrastructure and operational-resilience costs are included. It has not established that AI reliability is sufficient for broad autonomous financial action. And it has not established how rapidly third-party agents will become important intermediaries in retail finance. The conclusions should not extend beyond the evidence.

What the evidence does establish is that artificial intelligence has moved sufficiently far for the underlying strategic choice to become credible.

This choice concerns not merely technology adoption, but the future position of the bank within the customer relationship.

Historically, the bank which provided the account or product generally also controlled a substantial part of the interface through which the customer interacted with it.

That relationship is becoming less structurally guaranteed.

Open financial architectures, increasingly capable general-purpose agents and machine-readable financial services create the possibility that another system will sit between customer intent and bank execution.

The bank may continue to hold the deposit. It may continue to originate the mortgage. It may continue to provide the payment infrastructure. But the customer may increasingly tell somebody else what they are trying to achieve. That distinction matters. The institution which first understands the customer's objective can help define the problem before individual financial products are selected. It can retain emerging intent which is not yet visible through product applications. It can coordinate activity across providers.

And it can become the interface to which the customer returns when the objective changes. This does not mean that third-party agents will necessarily take the relationship from banks. Banks possess significant advantages of their own. They already hold authenticated relationships. They possess authoritative financial information. They own or operate regulated execution capabilities. They have existing risk and governance infrastructure. They employ financial specialists. They bear institutional accountability.

BIS research also suggests that adoption of AI need not eliminate relationship-based banking; in lending, AI processing of hard information can coexist with relationship-based mechanisms for acquiring softer information.[^46]

The strategic opportunity for incumbents is therefore not to imitate a general-purpose technology company.

It is to combine these existing institutional assets with the new capabilities of AI.

That may allow a bank to offer something neither the conventional product interface nor a general-purpose agent can provide independently:

> a persistent, trusted financial relationship connected directly to the systems and people capable of acting upon it.

Whether that proposition ultimately proves superior is uncertain. The important point is that the decision about whether to pursue it should be conscious. A bank can rationally decide to become highly effective at supplying financial products to external agents. It can rationally decide that maintaining a direct intelligent relationship with customers is strategically important. It can design for both. What it should understand is that failing to make the choice does not necessarily preserve the present position.

If customer behaviour changes while banks continue to optimise principally around individual product journeys, the point at which financial intent is expressed may migrate gradually towards interfaces controlled elsewhere.

No single event need mark that transition. Customers may first use general-purpose AI for financial research. The same systems may later gain authorised access to account information. Comparison may improve. Application preparation may follow. Delegated actions may develop later again. Each step can occur while the bank continues to provide precisely the same underlying financial products. The strategic position can therefore change without the balance sheet changing at all. This is why the most important asset at issue is not necessarily product ownership.

It is the point at which customer intent is understood. That point is becoming contestable. For a traditional retail bank, the appropriate response is not alarmism. The development of third-party agents is uncertain, and the direct banking relationship retains substantial advantages. Nor is the appropriate response to build an AI assistant principally so that the institution can say it has one.

The stronger response is to decide what role the bank intends to occupy and then build the capabilities which preserve strategic optionality.

Those capabilities are useful under several futures:

- a governed representation of customer intent;
- reusable institutional capabilities;
- machine-readable products and processes;
- event-driven state;
- controlled AI tools;
- clear identity and delegated-authority models;
- persistent context independent of the foundation model;
- high-quality human handover;
- and measurement based upon customer progression rather than interaction volume alone.

If proprietary banking agents become important, these capabilities provide their foundation. If third-party agents become important, many of the same capabilities make the institution easier for those agents to access. If agent adoption proceeds more slowly than expected, the same capabilities can improve conventional digital and human service. This reduces the strategic cost of uncertainty. The near-term recommendation which follows from the evidence is consequently deliberately modest. Traditional retail banks should not attempt to predict the final architecture of agentic financial services.

They should determine whether retaining a direct role in understanding customer financial intent matters to their strategy, and they should create enough capability to test that proposition now.

The experiment should be bounded. It should use genuine banking systems. It should preserve deterministic authority for consequential activity. It should involve customers with a real objective extending over time. It should include human specialists. It should measure progression, effort, continuity, appropriateness, control and economics. And it should be capable of failing. The purpose is not to demonstrate that AI can converse. That question has largely been answered.

The purpose is to establish whether AI can help a traditional bank behave as a relationship at a scale which was previously uneconomic.

If the answer is no, banks will still need increasingly intelligent products and interfaces, and they will need to become capable providers to external agents.

If the answer is yes, the consequence is considerably more significant.

Retail banking may no longer need to choose as sharply between the efficiency of digital self-service and the continuity of a personal relationship.

A bank could retain the former while restoring part of the latter.

Not by assigning a personal banker to every customer.

But by making the institution itself capable of remembering what the customer is trying to achieve, helping them progress it, and ensuring that the right person or system appears when they need it.

That is the sense in which artificial intelligence may enable the return of relationship banking.

Not a return to the branch.

A return to continuity.


---

## Notes

Sources are identified below as the text describes them. Full bibliographic references, including publication dates, document numbers and locations, should be completed from the underlying source list before external circulation.

[^1]: Central Statistics Office, *Information Society Statistics – Households*, 2025.
[^2]: European Central Bank, analysis of digital-only banks in the euro area, 2024.
[^3]: Bank for International Settlements, speech on AI, fintechs and banks, April 2025.
[^4]: ECB Banking Supervision, reporting on AI adoption among significant institutions, 2026; and related ECB analysis of AI use by euro-area banks, 2025.
[^5]: Central Bank of Ireland, *Innovation Hub Annual Report 2025* and *Regulatory and Supervisory Outlook 2026*.
[^6]: European Central Bank, *Financial Stability Review*, 2024 — financial-stability implications of artificial intelligence.
[^7]: McKinsey & Company, *Global Banking Annual Review 2025* (consumer survey, approximately 30,000 respondents).
[^8]: Boot, A. (2000), ‘Relationship Banking: What Do We Know?’, *Journal of Financial Intermediation*.
[^9]: Agarwal, S., Chomsisengphet, S., Liu, C., Song, C. and Souleles, N. (2018), study of approximately 100,000 credit-card accounts and associated wider banking relationships.
[^10]: European Central Bank, banking structural statistical indicators (bank offices and staff numbers, 2008–2023, with subsequent annual updates).
[^11]: Department of Finance (Ireland), *Retail Banking Review*, 2022.
[^12]: European Banking Authority, reporting on remote payment-account opening and the effects of digitalisation on access.
[^13]: OECD, *Consumer Finance Risk Monitor*, 2026.
[^14]: Northey, G. et al. (2022), two experimental studies of human and robo-advice in retail investment advice.
[^15]: Liberti, J. and Petersen, M. (2019), ‘Information: Hard and Soft’, *Review of Corporate Finance Studies*.
[^16]: Stein, J. (2002), ‘Information Production and Capital Allocation: Decentralized versus Hierarchical Firms’, *Journal of Finance*.
[^17]: Lloyds Banking Group, published descriptions of its relationship-management propositions.
[^18]: Natixis Investment Managers, global survey of financial professionals, 2024.
[^19]: UBS, published disclosures on its STAAT Insights adviser-intelligence platform.
[^20]: McKinsey & Company, 2025 analysis of commercial-banking relationship-manager time allocation.
[^21]: National Institute of Standards and Technology, *Generative AI Profile*, companion to the AI Risk Management Framework.
[^22]: National Institute of Standards and Technology, work on AI agent systems and agent-related risk.
[^23]: Bank for International Settlements, analysis of retrieval-augmented generation in financial applications.
[^24]: Research literature treating memory as a distinct system component in large-language-model agents.
[^25]: Research literature on task decomposition in large-language-model agents.
[^26]: Bank for International Settlements working paper, 2025 — generative-AI agent tested in simulated real-time gross settlement cash management.
[^27]: Bank for International Settlements, research on computer-using agents in multi-step tasks.
[^28]: European Banking Authority, monitoring of AI adoption across EU and EEA banking.
[^29]: Bank for International Settlements, analysis distinguishing AI systems which augment employees from more agentic systems which automate defined tasks.
[^30]: Research literature on multi-agent large-language-model architectures.
[^31]: Central Bank of Ireland, *Consumer Protection Code 2025*, in effect from March 2026.
[^32]: European Banking Authority, product-governance guidelines for retail banking products.
[^33]: Financial Planning Association, literature on goal-based financial planning.
[^34]: Thaler, R., work on mental accounting, and the subsequent empirical literature on household financial categorisation.
[^35]: OECD, 2026 work on financial consumer protection, adopting the G20 definition of financial well-being.
[^36]: 2024 study in *Decision Support Systems* on life-event prediction using real financial-services data.
[^37]: Blanchett, D., goals-based resource-allocation model; and the wider financial-planning literature on competing objectives.
[^38]: Data Protection Commission (Ireland), guidance on the GDPR principles of purpose limitation and data minimisation.
[^39]: European Data Protection Board, guidance treating profiling as automated processing used to evaluate or predict aspects of an individual.
[^40]: European Data Protection Board, *Opinion 28/2024* on the processing of personal data in the context of AI models.
[^41]: Regulation (EU) 2024/1689 (Artificial Intelligence Act), Annex III and Article 14.
[^42]: Regulation (EU) 2016/679 (General Data Protection Regulation), Article 9.
[^43]: Regulation (EU) 2016/679 (General Data Protection Regulation), Article 22.
[^44]: Studies of robo-advisory adoption, including a 2024 study of 445 investors on trust, anxiety, performance expectations and preference for human advisers.
[^45]: Klingbeil, A., Grützner, C. and Schreck, P. (2024), behavioural experiment on over-reliance on AI advice in financially risky decisions.
[^46]: Bank for International Settlements working paper, 2025 — banks’ adoption of AI in credit scoring and its coexistence with relationship lending.
[^47]: 2024 study in the *International Review of Economics & Finance* on trust in robo-advisory services; and qualitative research with users of an operational bank robo-adviser.
[^48]: Bank for International Settlements, analysis of retraining and upskilling in AI-intensive operating models.
[^49]: McKinsey & Company, work on modular banking architecture and cross-functional platform operating models.
[^50]: Bank of England and Financial Conduct Authority, *Artificial Intelligence in UK Financial Services*, 2024 survey.
[^51]: Regulation (EU) 2022/2554 (Digital Operational Resilience Act); European Supervisory Authorities’ designation of critical ICT third-party providers, November 2025; and joint statement on frontier AI models, July 2026.
[^52]: McKinsey & Company, customer-journey research in banking.
[^53]: Federal Reserve, remarks by Governor Christopher Waller on agentic commerce, September 2026.
[^54]: European Commission, proposed Financial Data Access (FIDA) Regulation, and Council papers published in 2026.
[^55]: Open Banking Limited, UK open-banking payment volumes, 2025.
[^56]: Bank for International Settlements, analysis of generative AI in financial services, including incumbent advantages and corresponding risks.
[^57]: European Banking Authority, risk assessment of June 2026 and 2026–2028 work programme on AI governance; and final guidance of September 2026.
[^58]: Central Bank of Ireland, mortgage measures — loan-to-income and loan-to-value limits applying to first-time buyers.
[^59]: Competition and Consumer Protection Commission (Ireland), consumer guidance on mortgages, Approval in Principle, mortgage protection, home insurance and drawdown.
[^60]: McKinsey & Company, 2026 work on retail banking and incumbent responses to a third-party agent layer.