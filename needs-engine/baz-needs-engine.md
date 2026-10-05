# Baz Needs Engine — Human-Readable Design

**Version:** 0.1  
**As of:** 5 October 2026  
**Companion file:** `baz-needs-catalogue.json`

## 1. Purpose

This document defines how Baz should move from **conversation** to **customer need** to **relevant BOI option**.

The core principle is:

> **Baz should detect needs, not keywords.**

A customer saying “we just had a baby” should not mechanically trigger a life-insurance sales message. It is evidence that may contribute to several possible needs — family protection, shared household finances, saving for a child, income resilience — and Baz should decide what to clarify, what to defer and what not to surface at all.

The machine-readable catalogue is intended to be the source of truth for developers. This document explains the operating model and gives Product, Design, Compliance and Engineering a reviewable version of the same logic.

---

## 2. Scope

This catalogue covers BOI **personal banking** in the Republic of Ireland:

- current accounts and youth/student/graduate variants;
- savings and deposit accounts;
- personal lending and overdrafts;
- credit cards;
- mortgages;
- home and travel insurance;
- life and protection;
- pensions and retirement;
- investment journeys;
- international payments and foreign-currency needs.

Business banking, corporate banking, private banking and wealth management are outside scope.

Rates, offers, eligibility, scheme availability and regulated wording change over time. In production these must come from controlled BOI product data, not model memory.

---

## 3. Where the Needs Engine sits

```text
Customer conversation
        ↓
Fact extraction
        ↓
Structured customer context
        ↓
Needs Engine
        ↓
Need candidates
  confidence
  priority
  timing
  evidence
  conflicts
  suppressions
  questions still required
        ↓
Baz decides how to discuss the need
        ↓
Customer chooses
        ↓
Application / advice / service journey
```

The conversational model can interpret language and phrase questions. The bank should still be able to explain **why a need appeared** and **why a product was or was not surfaced**.

---

## 4. The four discovery dimensions

Every meaningful statement can contribute evidence in four dimensions.

### Life event
Marriage, baby, college, graduation, retirement, moving house, moving country.

### Goal
Buy a home, build savings, protect family income, renovate, buy a car, retire.

### Financial circumstance
Cash sitting in a current account, short until payday, no emergency reserve, high fixed costs, existing debt, lump sum, foreign-currency income.

### Existing relationship
Existing BOI account, mortgage, loan or card; partner relationship; whether the customer is new or known.

The same life event can produce very different needs depending on the other dimensions.

---

## 5. Evidence strength

### Explicit — score 1.0
The customer directly states the need.

> “I want a mortgage.”

The need can be explored immediately.

### Strong inferred — score 0.7
The customer gives circumstances strongly associated with a need.

> “We’re renting, have €45k saved and have started viewing houses.”

Baz should usually clarify:

> “Are you planning to buy your first home?”

### Soft inferred — score 0.35
Useful context but insufficient on its own.

> “We got married last month.”

This supports possible shared-finances/protection needs, but should not immediately trigger products.

Suggested POC thresholds:

- **0.50** → ask a clarifying question;
- **0.75** → eligible to surface if timing and suppression rules permit.

These are POC defaults, not permanent production policy.

---

## 6. Need lifecycle

A need should have explicit state:

1. **LATENT** — weak evidence exists.
2. **CLARIFY** — enough evidence for a useful follow-up.
3. **READY_TO_SURFACE** — evidenced and appropriate now.
4. **SURFACED** — Baz has explained the option.
5. **ACCEPTED** — customer wants to progress it.
6. **DECLINED** — customer does not want it.
7. **DEFERRED** — relevant but wrong timing.
8. **SUPPRESSED** — should not be surfaced under current conditions.

This is distinct from application state. A need exists before an application exists.

---

## 7. Timing matters as much as relevance

A product can be relevant and still be wrong to mention now.

Example: a first-time buyer says they expect €15,000 of renovation costs. That creates a legitimate borrowing need. But if their mortgage is in affordability assessment, Baz should usually hold the need as **DEFERRED**, explain why, and let the customer decide whether to proceed.

That is orchestration, not cross-selling.

---

## 8. Suppression is first-class

The engine needs explicit reasons to **not** surface a product.

### Persistent financial difficulty
Suppress opportunistic overdraft/card/loan cross-sell and route toward support.

### Active mortgage assessment
De-prioritise new unsecured borrowing because it may change financial commitments.

### Short investment horizon
If the money is needed in the short/medium term, prefer savings/deposits over investment discovery.

### Sensitive health disclosure
A diagnosis or illness disclosure is not a commercial trigger for protection selling.

### Customer decline
Do not keep resurfacing a product once declined unless circumstances materially change.

---

## 9. How Baz should phrase discovery

Avoid:

> “I recommend Product X.”

Prefer:

> “You mentioned X. BOI has an option designed to help with Y. Would you like me to explain it?”

Example:

> “You said you and Emma still keep household finances separate. If it would help, we can look at a joint account for bills and shared spending without changing either of your personal accounts.”

For advice-led journeys such as investments or pensions, Baz should surface the **advice/suitability journey**, not pretend to make the recommendation itself.

---

## 10. Current BOI product/service catalogue

| Family | Product / journey | Type |
|---|---|---|
| Everyday Banking | Personal Current Account | product |
| Everyday Banking | Joint Current Account | journey_configuration |
| Everyday Banking | Basic Bank Account | product |
| Youth Banking | Smart Start Account | product |
| Youth Banking | Second Level Current Account | product |
| Student Banking | Third Level Current Account | product |
| Graduate Banking | Graduate Current Account | product |
| Retirement Banking | Golden Years Current Account | product |
| Borrowing | Current Account Overdraft | product_service |
| Savings | SuperSaver Account | product |
| Savings | GoalSaver Account | product |
| Savings | MortgageSaver Account | product |
| Savings | 365 31-Day Notice Account | product |
| Savings | Advantage Fixed Term Deposit Account | product |
| Savings | Instant Access Demand Account / Money Pot | product |
| Youth Savings | Smart Start Money Pot | product |
| Savings | Notice Deposit Account | product |
| Savings | Save for Kids / Child Savings | product |
| Savings Fx | Currency Deposit Account | product |
| Loans | Personal Loan | product |
| Loans | Graduate Loan | product_variant |
| Loans | Car Loan | product |
| Loans | Green Car Loan | product_variant |
| Loans | Home Improvement Loan | product |
| Loans | Green Home Improvement Loan | product_variant |
| Loans | Home Energy Upgrade Loan Scheme | scheme_product |
| Loans | Undergraduate Student Loan | product_variant |
| Loans | Postgraduate Loan | product_variant |
| Loans | Top-Up Loan | product |
| Credit Cards | Classic Credit Card | product |
| Credit Cards | Platinum Credit Card | product |
| Credit Cards | Aer Credit Card | product |
| Credit Cards | Affinity Credit Card | product |
| Credit Cards | Student Credit Card | product |
| Credit Cards | Credit Card Instalment Plan | existing_customer_feature |
| Mortgages | First-Time Buyer Mortgage | journey |
| Mortgages | Moving Home Mortgage | journey |
| Mortgages | Mortgage Switcher | journey |
| Mortgages | Buy-to-Let Mortgage | journey |
| Mortgages | Self-Build Mortgage | journey |
| Mortgages | Equity Release / Mortgage Top-Up | journey |
| Mortgages | EcoSaver Mortgage Rate | pricing_overlay |
| Insurance | Home Insurance | product |
| Insurance | Travel Insurance | product |
| Protection | Family / Life Cover | product |
| Protection | Mortgage Protection | product |
| Protection | Income Protection | product |
| Protection | Specified Illness Cover | product |
| Pensions | Pension Planning / Personal Pension / PRSA | advice_journey |
| Pensions | Retirement Options / ARF / Annuity | advice_journey |
| Investments | Investment Journey | advice_journey |
| International | International Payments / Foreign Currency Transfers | service |

---

## 11. Needs matrix

The detailed JSON contains full signal strengths, suppressions, conflicts and notes. The tables below give the human review view.


### Everyday banking

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Everyday banking** | I need a bank account; I need somewhere for my salary; I need a debit card; I want to switch bank | Is this mainly for salary, bills and everyday spending? | Personal Current Account | A current account can give you a home for salary, bills, card spending and everyday payments. |
| **Shared household finances** | we just got married; we keep our money separate; we want an account for bills; shared household costs | Do you want to combine everything, or just have somewhere for shared bills and spending? | Joint Current Account | You can keep your individual accounts and add a joint account for shared household money. |
| **Moving to Ireland** | I'm moving to Ireland; starting a job in Ireland; relocating to Dublin | When are you moving? | Personal Current Account | BOI has a current-account journey for people moving to Ireland; we can check what you can set up before you arrive. |
| **Basic payment account** | I just need a basic account; I don't have any payment account in Ireland | Do you currently hold another payment account in the Republic of Ireland? | Basic Bank Account | BOI has a basic payment account for eligible customers who need core everyday banking. |

### Youth banking

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Child money skills** | pocket money; first debit card for my child; teach my child about money; my child is 7 to 15 | How old are they? | Smart Start Account, Smart Start Money Pot | A child account can help them learn to spend and save while you keep appropriate oversight. |
| **Teen banking** | my teenager needs an account; secondary school account; first independent account | How old are they? | Second Level Current Account | BOI has an account designed for second-level students. |

### Student banking

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Third-level student banking** | starting college; university student; third level account; postgraduate student | Are you in full-time third-level education? | Third Level Current Account, Undergraduate Student Loan, Postgraduate Loan, Student Credit Card | We can look at day-to-day student banking first, then any borrowing or credit needs separately. |

### Graduate banking

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Graduate banking** | just graduated; first job after college; graduate account | When did you graduate? | Graduate Current Account, Graduate Loan | BOI has banking and borrowing options specifically for recent graduates. |

### Retirement banking

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Retirement everyday banking** | I'm retiring; I'm 66; my pension is replacing my salary | Are you looking mainly for everyday banking, or do you also want to review retirement income? | Golden Years Current Account, Retirement Options / ARF / Annuity | We can separate everyday banking from the bigger retirement-planning conversation. |

### Savings

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Emergency / rainy-day cash** | emergency fund; rainy day; I need instant access; ring-fence some money | Would you need to get at this money immediately? | Instant Access Demand Account / Money Pot | You can separate emergency cash from everyday spending while keeping it available on demand. |
| **Build a regular saving habit** | save every month; start saving from payday; want to become a better saver | What are you saving for? | SuperSaver Account, GoalSaver Account | A regular-savings account can automate the habit; the right one depends on your goal and access needs. |
| **Save for a defined goal** | saving for a holiday; saving for a wedding; saving for a car; I have a savings goal | How much do you want to build up? | GoalSaver Account | We can put the goal on a regular saving path and keep it separate from day-to-day money. |
| **Save a first-home deposit** | saving for a deposit; first home in a few years; renting and building savings | Are you both first-time buyers? | MortgageSaver Account, First-Time Buyer Mortgage | You can build the deposit first and, when you're ready, carry the context into the mortgage journey. |
| **Lump sum with limited access** | I have a lump sum; I can give notice before taking it out; I won't need all of this immediately | How quickly might you need access? | 365 31-Day Notice Account, Notice Deposit Account | If you can give notice before withdrawing, a notice account may suit the access pattern better than instant-access cash. |
| **Lump sum not needed for a fixed period** | I won't need the money for 6 to 18 months; cash sitting idle; fixed term savings | Are you comfortable locking the money away for a fixed period? | Advantage Fixed Term Deposit Account | If you do not need near-term access, a fixed-term deposit can give the money a defined home for that period. |
| **Save for a child** | save for my baby; save for college; child's future | How old is the child? | Save for Kids / Child Savings, GoalSaver Account, Investment Journey | The key question is time horizon: shorter-term child savings and long-term investing solve different problems. |

### Savings & foreign currency

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Hold foreign currency** | paid in dollars; want to keep pounds; don't want to convert yet | Which currency? | Currency Deposit Account, International Payments / Foreign Currency Transfers | We should first distinguish between holding foreign currency and simply sending or receiving it. |

### Borrowing / cashflow

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Occasional short-term cashflow gap** | short until payday; need a small buffer; temporary shortfall; overdraft | Is this a one-off shortfall or something that happens regularly? | Current Account Overdraft | An overdraft can provide short-term flexibility on a current account. |

### Loans

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **One-off personal borrowing** | need money for a wedding; big purchase; once-in-a-lifetime holiday; personal loan | How much do you need? | Personal Loan | A personal loan gives you a fixed lump sum and a defined repayment term. |
| **Finance a car** | buying a car; changing my car; dealer quote | How much are you looking to borrow? | Car Loan, Green Car Loan | BOI has car borrowing options; vehicle type may affect which route is relevant. |
| **Fund home improvements** | new kitchen; extension; renovating; home improvement loan | Roughly how much will the work cost? | Home Improvement Loan, Green Home Improvement Loan, Home Energy Upgrade Loan Scheme, Equity Release / Mortgage Top-Up | There are unsecured and mortgage-backed routes; the size and nature of the work determine what is worth exploring. |
| **Improve home energy efficiency** | heat pump; solar panels; insulation; deep retrofit | What work are you planning? | Green Home Improvement Loan, Home Energy Upgrade Loan Scheme, Home Insurance | Energy-efficiency works may qualify for dedicated borrowing routes; home cover may also need reviewing after major upgrades. |
| **Additional borrowing on an existing BOI loan** | top up my loan; I already have a BOI loan and need more | How long have you been repaying the existing loan? | Top-Up Loan | A top-up can combine the existing balance and new borrowing into one replacement loan. |
| **Finance third-level education** | college fees; masters fees; student loan; postgraduate course | Is the course undergraduate or postgraduate? | Undergraduate Student Loan, Postgraduate Loan | BOI has student borrowing options with eligibility tied to the course and student account relationship. |

### Credit cards

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Flexible card-based credit** | need a credit card; want flexibility for purchases; want a card for emergencies | Do you expect to clear the balance in full each month, or sometimes carry it? | Classic Credit Card, Platinum Credit Card | A credit card is revolving credit, so it is a different tool from a structured personal loan. |
| **Travel-reward credit card** | fly Aer Lingus often; travel rewards; Aer Credit Card | How often do you fly with Aer Lingus? | Aer Credit Card | If Aer Lingus travel is already part of your normal spending pattern, the travel-reward card may be worth comparing with the standard cards. |
| **Lower-rate credit card priority** | want the lowest card rate; I sometimes carry a card balance | How often do you expect to carry a balance? | Platinum Credit Card, Classic Credit Card | The relevant comparison is total card cost and usage, not simply rewards. |
| **College affinity card** | affinity card; support my college through card spend | Which participating college are you interested in? | Affinity Credit Card | An affinity card links everyday card use with support for a participating college. |
| **Student credit card** | student credit card; need a small card while at college | Do you hold a BOI third-level current account? | Student Credit Card | There is a student-oriented credit-card route subject to account and eligibility requirements. |
| **Spread a large existing card purchase** | spread this card purchase; large purchase on my BOI card | Was the purchase at least €250? | Credit Card Instalment Plan | If the purchase is already on an eligible BOI card, an instalment plan may be more relevant than taking a separate loan. |

### Mortgages

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Buy first home** | buy my first house; first-time buyer; renting and viewing homes | Are you buying alone or with someone? | First-Time Buyer Mortgage, MortgageSaver Account, Mortgage Protection, Home Insurance | We can start with affordability and the mortgage, then bring in deposit saving, protection and home insurance at the right stage. |
| **Move to another home** | selling and buying another house; upsizing; downsizing; need more space for family | Do you currently have a mortgage? | Moving Home Mortgage, Home Insurance, Mortgage Protection | This is a moving-home journey rather than a first-time buyer journey; existing mortgage context matters. |
| **Switch existing mortgage** | switch mortgage; mortgage rate is ending; move my mortgage to BOI | Who is your current lender? | Mortgage Switcher, Mortgage Protection, Home Insurance | We can explore whether moving your existing mortgage to BOI is relevant before discussing rates or application steps. |
| **Build or substantially renovate a home** | building my own house; bought a site; planning permission; self build | Do you already own the site? | Self-Build Mortgage, Mortgage Protection, Home Insurance | A self-build mortgage releases funds in stages, so it is a different journey from buying a completed home. |
| **Buy an investment property** | buy-to-let; rental property; investment property | Will this property be rented out rather than used as your main home? | Buy-to-Let Mortgage, Home Insurance | Investment-property borrowing is a separate mortgage need and should be treated distinctly from buying a home to live in. |
| **Borrow against existing home equity** | release equity; top up my mortgage; borrow against my house; large renovation and I have equity | What is your approximate property value and mortgage balance? | Equity Release / Mortgage Top-Up, Home Improvement Loan | For larger needs, borrowing against available home equity may be worth comparing with unsecured borrowing. |
| **Energy-efficient home / mortgage pricing** | BER A; BER B; energy efficient home; EcoSaver | Do you know the property's BER? | EcoSaver Mortgage Rate | The home's BER may affect which BOI mortgage pricing options are available. |

### Insurance

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Protect home and contents** | buying a house; moving home; renting and need contents cover; home insurance | Do you need buildings cover, contents cover, or both? | Home Insurance | Home insurance can protect the building, belongings, or both depending on your situation. |
| **Protect upcoming travel** | booked a holiday; travelling abroad; ski trip; travel insurance | Is this one trip or do you travel several times a year? | Travel Insurance | Single-trip and annual cover solve different travel patterns; destination and activities can also matter. |

### Life & protection

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Protect dependants financially** | just had a baby; new dependant; sole earner; my family relies on my income | Who depends financially on your income? | Family / Life Cover, Income Protection, Specified Illness Cover | If other people rely on your income, we can explore ways of protecting the household if something happens to you. |
| **Protect a main-home mortgage** | mortgage application progressing; mortgage protection; getting ready to draw down | Do you already have suitable mortgage protection in place? | Mortgage Protection | Mortgage protection is normally part of getting a main-home mortgage ready for drawdown. |
| **Protect income if unable to work** | what if I couldn't work; sole earner; high fixed household costs; income protection | What sick pay or income protection do you already have through work? | Income Protection | Income protection is designed to replace part of your income if illness or injury prevents you working. |
| **Financial resilience to specified serious illness** | specified illness cover; critical illness cover; how would we cope financially if I became seriously ill | Do you already have this cover through work or another policy? | Specified Illness Cover | Specified illness cover can provide a lump sum if a covered condition is diagnosed. |

### Pensions

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Start retirement saving** | I don't have a pension; need to start saving for retirement; self-employed and no pension | Do you have any workplace pension already? | Pension Planning / Personal Pension / PRSA | We can start by understanding what retirement you want and what provision you already have, then look at the appropriate pension route. |
| **Review existing retirement provision** | I have a pension but don't know if it's enough; old pensions from previous jobs; am I on track for retirement | What pension arrangements do you already have? | Pension Planning / Personal Pension / PRSA | A pension review is about whether your existing provision is on track before deciding whether anything should change. |
| **Turn pension savings into retirement income** | retiring soon; what do I do with my pension at retirement; ARF; annuity | When are you retiring? | Retirement Options / ARF / Annuity | At retirement, income security, flexibility and access become the key trade-offs; this should move into an advice-led retirement conversation. |

### Investments

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Invest long-term surplus cash** | money I won't need for 5+ years; want long-term growth; want to invest a lump sum | When might you need this money? | Investment Journey | If the money is genuinely long-term and you can accept investment risk, we can start the investment suitability journey. |
| **Invest regularly for a long-term goal** | invest every month; long-term savings over 10 years; college fund in 15 years | What is the goal and time horizon? | Investment Journey | For long horizons, investing may be worth exploring alongside or instead of cash saving, subject to affordability and risk. |

### International payments

| Need | Signals Baz should notice | Clarify | BOI options | Customer framing |
|---|---|---|---|---|
| **Send or receive money internationally** | send money abroad; pay overseas tuition; buy property abroad; paid in another currency | Which country and currency? | International Payments / Foreign Currency Transfers, Currency Deposit Account | BOI can support international and foreign-currency payments; whether you also need to hold the currency is a separate question. |

---

## 12. High-value conflict rules

### Mortgage vs new unsecured borrowing
If a customer is progressing a mortgage and also wants a personal loan, car loan, overdraft or new credit:

- retain the need;
- lower its timing/priority or defer it;
- explain that new borrowing may affect mortgage commitments;
- let the customer choose.

Do not silently remove the option, and do not blindly cross-sell it.

### Deposit saving vs investment
If money is for a house deposit, wedding, tuition or other near-term goal, prefer cash saving/deposit needs and suppress long-term investing where access or capital certainty matters.

### Emergency reserve before investment
If the customer wants to invest all accessible cash and has no meaningful emergency reserve, clarify liquidity first.

### Mortgage protection vs family protection
These are different needs:

- mortgage protection protects the mortgage balance;
- family/life protection protects dependants and wider household finances.

Both may be relevant, but Baz should explain why.

### Loan vs card vs instalment plan
Purpose matters:

- defined lump sum + defined repayment period → loan;
- revolving purchasing flexibility → credit card;
- large purchase already on eligible BOI card → instalment plan may be more relevant.

---

## 13. Sensitive and advice-led journeys

### Protection
Baz may identify protection needs from dependants, income reliance or mortgage milestones.

It should not:

- use fear-based language;
- infer sales opportunities from diagnoses;
- guess health information;
- reuse sensitive information outside the appropriate context.

### Investments
Baz may recognise that investing is worth exploring.

It should not:

- promise returns;
- select a fund from casual conversation;
- skip affordability, risk or suitability.

### Pensions
Baz can recognise:

- no pension;
- uncertain adequacy;
- approaching retirement.

It should surface the appropriate planning/advice route, not choose pension instruments itself.

---

## 14. Example: the POC household

The customer says:

> “My wife and I want to buy our first home.”

Baz later establishes:

- recently married;
- new baby;
- separate personal accounts;
- first-time buyers;
- deposit saved;
- both working;
- about €15k of furnishing/renovation cost expected;
- no protection review yet.

A sensible need state might be:

| Need | Confidence | Priority | Timing | Why |
|---|---:|---|---|---|
| First-home mortgage | 1.00 | Very high | Now | Explicit |
| Shared household finances | 0.85 | High | Now | Marriage + separate finances + shared costs |
| Mortgage protection | 0.80 | High | Mortgage milestone | Main-home mortgage |
| Family protection | 0.72 | High | Clarify | New dependant + income reliance |
| Home insurance | 0.65 | High | Later | Relevant to home purchase, wrong stage now |
| Personal/home-improvement borrowing | 0.90 | Medium | Defer | Explicit future cost; conflicts with mortgage |
| Child saving | 0.35 | Medium | Later/clarify | Baby alone is not enough |
| Credit card | 0.25 | Low | Do not surface | No actual need expressed |
| Investment | Suppressed | — | — | Near-term house cash needs |

The engine should **not surface every relevant product at once**.

---

## 15. Developer responsibilities

The Needs Engine should support queries such as:

- What needs are latent?
- Which need should be clarified next?
- Why is it present?
- What evidence supports it?
- Which product families map to it?
- Is it appropriate to surface now?
- Does another active journey conflict?
- Has the customer declined it already?
- What approved language can Baz use to explain it?

Example audit state:

```json
{
  "need": "shared_household_finances",
  "state": "READY_TO_SURFACE",
  "confidence": 0.84,
  "evidence": [
    "marital_status=MARRIED",
    "customer_statement=we still keep everything separate",
    "goal=shared_bills"
  ],
  "products": ["joint_current_account"]
}
```

This is preferable to “the AI thought a joint account sounded relevant.”

---

## 16. Separation of responsibilities

### LLM / conversation
- understand language;
- extract candidate facts;
- ask natural follow-ups;
- explain surfaced needs;
- support customer choice.

### Needs Engine
- score evidence;
- apply timing/conflict/suppression logic;
- maintain need state;
- map needs to approved product families.

### Product catalogue
- product availability;
- current eligibility;
- approved descriptions;
- live pricing/terms where needed;
- expiry/effective dates.

### Application orchestrator
- create selected applications;
- track requirements;
- progress state;
- report status.

This separation is one of the strongest governance features of the design.

---

## 17. Governance and refresh

Each production product entry should eventually carry:

- product owner;
- active/inactive flag;
- effective date;
- next review date;
- source of truth;
- eligibility source;
- regulated/advice flag;
- approved customer explanation.

Time-limited schemes and promotional products should expire automatically or require live validation before Baz surfaces them.

---

## 18. Source notes

This v0.1 catalogue was checked against current official Bank of Ireland personal-banking pages on **5 October 2026**, including current accounts, savings, loans, credit cards, mortgages, insurance, life/protection and international payments.

Current rates and promotions are intentionally not embedded in the needs logic. Those belong in controlled runtime product data.

---

## 19. Guiding rule

> **Understand the need first. Explain why an option is relevant. Let the customer decide.**

Baz should feel like a banker who understands the customer's situation — not an advertising engine with a chat interface.
