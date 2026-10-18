import type { ClaimKind } from '@/components/Primitives'

/**
 * What is built, for somebody deciding whether this is a product or a demo.
 *
 * Three groups, by who meets the thing: the customer in the conversation, the customer around
 * it, and the bank behind it. Every tile is a feature that exists today unless its claim says
 * `production`, in which case it is a direction and the body says so. Counts carry the date
 * they were measured on, and the ones a test can recompute are recomputed in
 * `capabilities.test.ts`.
 */

export type CapabilityGroup = 'conversation' | 'around' | 'bank'

export type Capability = {
  readonly group: CapabilityGroup
  readonly title: string
  readonly body: string
  readonly claim: Extract<ClaimKind, 'poc' | 'production'>
  /** Where to look. A path or a spec section, never a sentence. */
  readonly source: string
}

export const GROUPS: readonly {
  readonly id: CapabilityGroup
  readonly title: string
  readonly lede: string
}[] = [
  {
    id: 'conversation',
    title: 'In the conversation',
    lede: 'What a customer can be shown and asked, and what decides it.',
  },
  {
    id: 'around',
    title: 'Around it',
    lede: 'How a case survives the tab, the phone, the second applicant and the month in between.',
  },
  {
    id: 'bank',
    title: 'For the bank',
    lede: 'What a presenter, and later an operator, can see and change without a deploy.',
  },
]

/** Measured counts, with the date. The test recomputes the ones it can. */
export const MEASURED = {
  measuredAt: '2026-10-16',
  cards: 19,
  tools: 16,
  journeys: 7,
  mortgageRates: 133,
  formFields: { supersaver: 499, personalLoan: 418 },
  tests: { count: 940, files: 75, basis: 'npm run check' },
  adrs: 8,
  guardrailCases: 55,
} as const

export const capabilities: readonly Capability[] = [
  // ---- In the conversation ----
  {
    group: 'conversation',
    title: `${String(MEASURED.cards)} cards, ${String(MEASURED.tools)} tools`,
    body: 'A card is a proposal and the tap is the commitment. The model has no tool that creates, submits, pauses or resumes anything; it draws a card and case-action does the writing after validating the tap.',
    claim: 'poc',
    source: 'src/baz/cards/CardRenderer.tsx, _shared/llm/tools.ts',
  },
  {
    group: 'conversation',
    title: 'Tools withheld by stage',
    body: 'Seven stages, read off the case every turn and never stored. Each one decides which tools the model is handed, so a product card cannot appear before anybody has asked what the customer wants.',
    claim: 'poc',
    source: '_shared/domain/conversation/stages.ts',
  },
  {
    group: 'conversation',
    title: 'Questions avoided, counted',
    body: 'A requirement satisfied by a fact the bank held or the customer gave earlier writes an event. The customer sees the list; the console sees the count.',
    claim: 'poc',
    source: '§53, _shared/domain/reuse.ts',
  },
  {
    group: 'conversation',
    title: `${String(MEASURED.mortgageRates)} published mortgage rates`,
    body: 'Indexed by buyer type, BER, amount and term. All four are required, so Baz asks rather than quoting a range, and the server computes the repayments.',
    claim: 'poc',
    source: '_shared/tenants/boi/mortgage-rates-select.ts',
  },
  {
    group: 'conversation',
    title: 'Comparison and quote engines',
    body: 'Products side by side from the catalogue, and the cost of a thing from any two of amount, term and monthly. No figure on either card is the model’s.',
    claim: 'poc',
    source: '_shared/domain/quotes/engine.ts',
  },
  {
    group: 'conversation',
    title: 'Savings arranged, not listed',
    body: 'Given what they hold and what they save, the engine splits it across accounts: the bonus first and only what qualifies, the lump sum locked for the horizon, the rest at the best rate.',
    claim: 'poc',
    source: '_shared/domain/savings/arrange.ts',
  },
  {
    group: 'conversation',
    title: 'Two of the bank’s own forms, read',
    body: `SuperSaver (${String(MEASURED.formFields.supersaver)} controls) and the personal loan (${String(MEASURED.formFields.personalLoan)}), parsed from the published definitions. Baz asks their questions in conversation, ticks their declarations in their wording, and generates a packet nobody sends.`,
    claim: 'poc',
    source: '_shared/domain/forms, docs/architecture/digital-forms.md',
  },
  {
    group: 'conversation',
    title: 'Health data behind a consent gate',
    body: 'Protection questions are asked only through a structured form after an explicit consent card. The model cannot record a health fact however plainly somebody says it.',
    claim: 'poc',
    source: '§7.5, Invariant 6',
  },
  {
    group: 'conversation',
    title: 'Eight-category guardrail',
    body: 'Deterministic checks, then a small classifier, in front of the model. Blocked input never reaches it, a profane banking question is a banking question, and a sensitive turn zeroes the humour and suppresses offers.',
    claim: 'poc',
    source: '§19 to §27, _shared/llm/gate.ts',
  },

  // ---- Around it ----
  {
    group: 'around',
    title: 'One case, any surface',
    body: 'The same conversation in a browser tab and in the installed app, with sign-in as the bridge. Facts the bank already holds arrive on sign-in and are not asked for again.',
    claim: 'poc',
    source: '§29, src/baz/useConversation.ts',
  },
  {
    group: 'around',
    title: 'A second applicant, on their own phone',
    body: 'An invite link that neither expires nor is used up. The partner sees their own tasks and the names and states of the applications they are party to, never the conversation. One answer lands in every application that needs it.',
    claim: 'poc',
    source: '§33, src/partner/PartnerJoin.tsx',
  },
  {
    group: 'around',
    title: 'Web Push, hand-written',
    body: 'RFC 8291 and 8292 in an Edge Function, confirmed delivering to a real phone. The copy says nothing about the application and the link carries a single-use token.',
    claim: 'poc',
    source: '_shared/push/webpush.ts',
  },
  {
    group: 'around',
    title: 'A return that knows what changed',
    body: 'Coming back runs a turn with a return trigger. The digest carries every event since the customer was last seen, each already described in a fixed sentence, and the status card renders from the database beside the summary.',
    claim: 'poc',
    source: '§36, _shared/domain/narration.ts',
  },
  {
    group: 'around',
    title: 'Installable, with the same address',
    body: 'A PWA. The install offer appears when there is something worth keeping, and the lock-screen notification opens the installed app on the right case.',
    claim: 'poc',
    source: 'vite-plugin-pwa, src/baz/InstallCard.tsx',
  },
  {
    group: 'around',
    title: 'Baz for the partner',
    body: 'Today the second applicant gets a task list, not a conversation. Giving them Baz in partner mode, scoped to their own tasks, is the obvious next step and is not built.',
    claim: 'production',
    source: 'docs/start-here/project-status.md',
  },
  {
    group: 'around',
    title: 'A plan the customer can browse',
    body: 'Plans, milestones, check-ins and watches are real in the database and in the console. The customer meets them only as a card and as Baz raising a check-in; a surface of their own is a direction.',
    claim: 'production',
    source: 'docs/features/customer-plans.md',
  },

  // ---- For the bank ----
  {
    group: 'bank',
    title: 'A console with seven sections',
    body: 'Cases, Goals & needs, Products & rates, Analytics, Digital forms, Guardrails, Persona. Behind a real sign-in and an admin role checked on every call.',
    claim: 'poc',
    source: 'src/admin/AdminConsole.tsx',
  },
  {
    group: 'bank',
    title: 'The bank moves by pressing a button',
    body: 'Every simulated event is a state-machine transition, and the server offers only the ones the machine will accept. No random timers. Sending the notification is a separate, explicit act.',
    claim: 'poc',
    source: '§41, §42, src/admin/DemoActions.tsx',
  },
  {
    group: 'bank',
    title: 'A handoff note nobody wrote',
    body: 'The brief a person reads before picking up the phone: what the customer wanted, what they agreed to, what they turned down, where each application has got to. Built from the case, never by the model.',
    claim: 'poc',
    source: 'src/admin/HandoffNote.tsx',
  },
  {
    group: 'bank',
    title: 'Products and rates as rows',
    body: 'Reword a product, change a rate or add one without a deploy. Each payload is validated against the published file’s own shape both ways, so Baz can be handed a different catalogue but never a malformed one.',
    claim: 'poc',
    source: '§51, src/admin/ProductsScreen.tsx',
  },
  {
    group: 'bank',
    title: 'Persona as six sliders',
    body: 'Length, humour, sarcasm, formality, playfulness, poetic, each mapped to fixed prose and read fresh every turn. Style only: no slider can change scope, tools or a protection.',
    claim: 'poc',
    source: '§17, §18, _shared/llm/persona.ts',
  },
  {
    group: 'bank',
    title: 'Guardrails you can poke',
    body: 'The permitted domain as data, a live test box for the question somebody in the room always asks, every blocked request with its category, and a kill switch.',
    claim: 'poc',
    source: '§39, src/admin/GuardrailsScreen.tsx',
  },
  {
    group: 'bank',
    title: 'Metrics from events',
    body: 'Questions avoided, facts captured, applications started, requests blocked and the cost to run, each derived from the event stream rather than counted separately.',
    claim: 'poc',
    source: '§52, §66, src/admin/AnalyticsScreen.tsx',
  },
  {
    group: 'bank',
    title: 'A conversation that costs nothing to replay',
    body: 'A fixture provider replays a script transcribed from a live case, turn for turn, with no key and no bill, so layout and copy are checked without spending a model call.',
    claim: 'poc',
    source: 'supabase/functions/baz-turn/fixtures',
  },
  {
    group: 'bank',
    title: `${String(MEASURED.tests.count)} tests, ${String(MEASURED.adrs)} decision records`,
    body: `Every legal and illegal state transition, the requirement engine, the forms engine, the persona composer, the gate routing and the §53 count, in ${String(MEASURED.tests.files)} files. Eight architecture decision records say why.`,
    claim: 'poc',
    source: `${MEASURED.tests.basis}, ${MEASURED.measuredAt}; docs/decisions/`,
  },
]
