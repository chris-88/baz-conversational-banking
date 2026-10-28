/**
 * The executive article, condensed from the short paper.
 *
 * `vault/relationship-banking-white-paper.md` is the source and stays the longer argument;
 * this is the version somebody reads on a phone after a five-minute showcase. Six sections,
 * in the order the brief asks for, every number with a source, and the hypothetical kept
 * apart from the measured. Footnote markers are `[^n]` and resolve to `sources` by number.
 *
 * Status: draft for discussion, and the page says so, until the copy is approved.
 */

export type Section = {
  readonly id: string
  readonly heading: string
  readonly paragraphs: readonly string[]
  /** An optional two-column list, for the section that separates built from still needed. */
  readonly columns?: readonly { readonly title: string; readonly items: readonly string[] }[]
}

export type Source = { readonly n: number; readonly text: string; readonly url: string }

export const article = {
  eyebrow: 'Article · Draft for discussion',
  title: 'Who owns the customer relationship in the age of AI?',
  standfirst:
    'The opportunity for conversational banking, the risk of disintermediation, and why Baz explores both.',
  byline: 'Christopher Quinn, October 2026',
  readingTime: '8 minutes',

  sections: [
    {
      id: 'journeys',
      heading: 'Product journeys versus a life',
      paragraphs: [
        'A couple open their bank’s website on a Tuesday evening because they think they need a mortgage. They don’t start on the Mortgages page. They type what is going on: married in the spring, a baby in August, renting and hoping to buy.',
        'Banking is organised the other way round. A bank has a mortgage journey, an account-opening journey and a protection journey, each with its own process, its own questions and its own application. The customer experiences one life event; the bank offers three forms, and asks for the same salary in all of them.',
        'The gap between those two shapes used to be closed by a person. A relationship manager held the customer’s situation in their head, knew which product came first and which could wait, and remembered the conversation the next time. That was rationed by customer value, because a person can only hold so many customers in their head.[^1] Everybody else got the forms.',
      ],
    },
    {
      id: 'ai',
      heading: 'What AI changes',
      paragraphs: [
        'The current generation of language models, wrapped in a conservative system, can take an unstructured account of somebody’s life and turn it into structure, hold that structure over time, and choose from a fixed set of actions. Those were the jobs the relationship manager did. The constraint that rationed them has gone.',
        'Baz is a working proof of that. It is a conversational layer over one retail bank’s simulated product journeys. The customer says what they are trying to do; Baz works out what it involves, asks only for what it does not know, and starts several applications at once from facts collected once. It reads the bank’s published form definitions and prepares the exact request the bank’s own website would send, and it never sends it. It was built by one person in sixteen working days, and a twelve-turn conversation costs about 55 cent in model fees, measured.[^2]',
        'The point is not the demo. The point is that the part of the stack that understands the customer, remembers what they are trying to do and coordinates the rest is now cheap, and no longer needs a bank to build it.',
      ],
    },
    {
      id: 'risk',
      heading: 'The risk of losing the conversation',
      paragraphs: [
        'The same layer can be built over several banks’ journeys by somebody who is not a bank, and most of the access it needs already exists. Since 2018, PSD2 has obliged banks to let licensed third parties read account information and initiate payments at the customer’s request; open-banking payments in the UK alone ran to 351 million in 2025.[^3] Applications do not even need an API. A bank’s application journey is a public web form. An agent does not need the bank’s permission to apply on a customer’s behalf. It needs the customer’s.',
        'The direction of travel is more of the same. The European Commission’s financial data access proposal would extend the open-banking model across financial products,[^4] and the Federal Reserve is already asking who is liable when an agent, not the person, gives the instruction.[^5] McKinsey’s 2025 survey of 30,000 consumers found 62 per cent would most trust their primary bank to provide AI financial services, and 57 per cent would consider a third-party agent if their bank did not offer one.[^6] Those are stated preferences. Read them as a trust advantage with an expiry date.',
        'None of this arrives as an event. Customers start using a general-purpose assistant for financial research, because it is where they already are. It gets authorised access to their accounts, because they ask it to. It compares products across banks, prepares applications, and eventually acts within limits the customer sets. The bank still holds the deposit and originates the mortgage. It just is not in the room when the customer decides what they want.',
        'What follows is hypothetical, and the numbers are invented, but the shape is familiar. An assistant that moves people’s savings and debt between providers whenever a better rate appears becomes the most trusted financial brand in the market, because its incentives are visibly the customer’s. Its head of partnerships then walks into a bank and names the commission for being offered to customers, and the higher commission for a competitor being dropped. The same thing happened to hotels with the travel sites and to developers with the app stores. The balance sheets stayed where they were. The pricing power did not.',
      ],
    },
    {
      id: 'responses',
      heading: 'Two complementary responses',
      paragraphs: [
        'A bank can be the relationship layer itself: the place customers choose to say what they are trying to do, because the bank remembers appropriately, can act immediately, can bring a competent person into the conversation without a restart, and is accountable when it gets something wrong. That has to be earned every time a customer comes back, and it carries an uncomfortable condition. The layer only earns that trust if it will sometimes tell a customer that a competitor’s product is better.',
        'Or a bank can serve the customer’s chosen assistant through the same bounded capabilities: machine-readable products, discoverable eligibility, reliable status, and authority that is scoped to what the customer authorised. That posture gives up the conversation and competes on price, service and reliability inside somebody else’s interface.',
        'The realistic answer is both, and the same architectural work supports both: governed customer state with provenance, a catalogue of bounded tools the model can call and nothing else, event-driven state, and a decent handover to a person. Baz runs the first posture end to end and prototypes the second by exposing itself as a tool another agent can call, with every guardrail unchanged.',
        'What is not defensible is the posture most banks are currently in: keep improving individual product journeys and let the question answer itself. That is a choice to become a provider, made by nobody, on no particular date.',
      ],
    },
    {
      id: 'today',
      heading: 'What Baz demonstrates today, and what it does not',
      paragraphs: [
        'The principle Baz runs on is easy to state. The model proposes; the bank’s systems decide; people judge. The model turns what a customer says into structure and decides how to ask the next question. It cannot create, submit, pause or resume an application, grant consent or make a declaration, because no such tool exists. The customer’s tap commits, and the server checks state and rules before writing anything.',
        'That boundary is structural rather than requested. NIST’s red-teaming found successful hijacking attacks against every frontier model it tested,[^7] which is an argument for narrow authority, not for waiting.',
      ],
      columns: [
        {
          title: 'Working in the prototype',
          items: [
            'Discovery from a life event, with facts recorded against a catalogue and reused across concurrent applications',
            'Published form definitions read, filled from what is known, and the submission packet built for inspection only',
            'Partner participation, deterministic advisories, return after bank-side events, a presenter console with provenance',
            'Email-code sign-in and synthetic bank-held data; an MCP server so another agent can use Baz within the same guardrails',
          ],
        },
        {
          title: 'Still required for production',
          items: [
            'Real identity and KYC, consent records that satisfy purpose limitation,[^8] and the Consumer Protection Code’s digital-conduct duties[^9]',
            'Model-risk oversight, evaluation infrastructure, security and incident management, resilience under DORA, and AI Act human oversight[^10]',
            'The handover to a specialist with the confirmed goal, the facts and their provenance, which the prototype leaves unbuilt',
            'Evidence that customers want a bank that remembers: research on automated advice still finds trust and a preference for people as real barriers[^11]',
          ],
        },
      ],
    },
    {
      id: 'paper',
      heading: 'How this fits the longer argument',
      paragraphs: [
        'The paper this article condenses, The Return of Relationship Banking, makes the case at length: that relationship banking was never abandoned on purpose but rationed by cost, that the cost has collapsed, and that the question a bank now faces is about position rather than adoption. It sets out the three postures, the architecture that supports all of them, and a scorecard that measures whether customers progress from a vague intention to an agreed objective rather than whether a chatbot contained a call.',
        'It also proposes a pilot that is allowed to fail: one long-lived objective, most obviously a first home, a bounded cohort, real specialists with a real handover, and failure conditions stated up front. If customers feel watched rather than helped, the proposition is wrong. If conversion rises because people were nudged to apply before they were ready, the pilot has failed however good the number looks.',
        'The decision it puts in front of a bank is a narrow one. Do you want to be the place where your customers’ financial intent is expressed, or are you content for that to happen elsewhere while you execute what comes out of it? Both can be rational. Arriving at the second by accident is not.',
      ],
    },
  ] satisfies readonly Section[],

  sources: [
    {
      n: 1,
      text: 'Boot, A. (2000), “Relationship Banking: What Do We Know?”, Journal of Financial Intermediation.',
      url: 'https://people.bath.ac.uk/mnsrf/Teaching%202011/IB/Literature/L9/Boot.pdf',
    },
    {
      n: 2,
      text: 'Measured on the live prototype after prompt caching; the figures and their basis are in the explainer’s economics chapter.',
      url: 'https://baz.chrisquinn.ie/#/how-it-works/economics',
    },
    {
      n: 3,
      text: 'Directive (EU) 2015/2366 (PSD2); Open Banking Limited, Open banking in 2025.',
      url: 'https://www.openbanking.org.uk/insights/open-banking-in-2025-now-part-of-the-uks-everyday-financial-life/',
    },
    {
      n: 4,
      text: 'European Commission, proposed framework for financial data access (FIDA).',
      url: 'https://finance.ec.europa.eu/digital-finance/framework-financial-data-access_en',
    },
    {
      n: 5,
      text: 'Federal Reserve, remarks by Governor Christopher Waller on agentic commerce, 28 September 2026.',
      url: 'https://www.federalreserve.gov/newsevents/speech/waller20260928a.htm',
    },
    {
      n: 6,
      text: 'McKinsey & Company, How gen AI agents threaten retail banks’ customer relationships, 2025.',
      url: 'https://www.mckinsey.com/industries/financial-services/our-insights/how-gen-ai-agents-threaten-retail-banks-customer-relationships',
    },
    {
      n: 7,
      text: 'NIST, lessons learned on tool use in agent systems, including agent hijacking, 2025.',
      url: 'https://www.nist.gov/news-events/news/2025/08/lessons-learned-consortium-tool-use-agent-systems',
    },
    {
      n: 8,
      text: 'Data Protection Commission, the principles of data protection, including purpose limitation.',
      url: 'https://dataprotection.ie/en/organisations/data-protection-basics/principles-data-protection',
    },
    {
      n: 9,
      text: 'Central Bank of Ireland, Consumer Protection Code 2025, digital products and services.',
      url: 'https://www.centralbank.ie/consumer-hub/consumer-protection-code/consumer-protection-code-digital-products-services',
    },
    {
      n: 10,
      text: 'Regulation (EU) 2024/1689, the Artificial Intelligence Act, Article 14.',
      url: 'https://eur-lex.europa.eu/eli/reg/2024/1689',
    },
    {
      n: 11,
      text: 'A 2024 study of 445 investors on trust, anxiety and preference for human advisers in robo-advisory adoption.',
      url: 'https://www.sciencedirect.com/science/article/pii/S097038962400048X',
    },
  ] satisfies readonly Source[],
} as const
