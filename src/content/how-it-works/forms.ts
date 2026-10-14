/**
 * The two published journeys Baz reads, and what is honestly claimable about each.
 *
 * Two different counts live here and the difference matters more than either number. The
 * captured count is how many entries a real browser submitted when somebody completed the
 * genuine journey; the generated count is how many Baz produced for a particular conversation.
 * They are not the same claim, and a page that shows the captured number beside Baz's name
 * says we generated something we did not.
 */

export type FormProfile = {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly url: string
  /** Objects in the published definition, counted from the snapshot in the repository. */
  readonly fieldCount: number
  /** Entries in the captured browser submission, for one completed branch. */
  readonly capturedEntries: number
  /** What that capture is evidence of, in case anyone asks where the number came from. */
  readonly capturedBasis: string
  readonly capabilities: readonly string[]
}

export const forms: readonly FormProfile[] = [
  {
    id: '1833',
    name: 'SuperSaver',
    version: 'SuperSaver - R2.0.1',
    url: 'https://digital.bankofireland.com/personal-banking/supersaver/',
    fieldCount: 499,
    capturedEntries: 64,
    capturedBasis: 'One completed branch, captured from the live web journey',
    capabilities: ['Conditional logic', 'Documents', 'Consents'],
  },
  {
    id: '1940',
    name: 'Personal Loan',
    version: 'Consumer Loans E2E Combined - R9.10.1',
    url: 'https://digital.bankofireland.com/consumer-lending/personal-loan',
    fieldCount: 418,
    capturedEntries: 74,
    capturedBasis: 'One completed branch: a new standard loan for a car, repaid monthly',
    capabilities: [
      'Conditional logic',
      'Calculated fields',
      'Affordability inputs',
      'Eligibility state',
      'Documents',
      'Consents',
    ],
  },
]

/**
 * The worked example, field by field.
 *
 * One sentence from a customer, and the three values it resolves to in the bank's own
 * definition. Highlighting a phrase lights its field and its wire entry, which demonstrates the
 * translation better than any amount of prose about translation.
 */
export type Mapping = {
  readonly id: 'purpose' | 'amount'
  /** The words in the customer's sentence. */
  readonly phrase: string
  readonly fieldId: string
  readonly fieldType: string
  readonly fieldLabel: string
  readonly toscana: string
  /** Every wire entry this phrase ends up producing. */
  readonly entries: readonly { readonly key: string; readonly value: string }[]
  readonly note: string
}

export const workedExample = {
  sentence: 'I need €20,000 for a car.',
  mappings: [
    {
      id: 'purpose',
      phrase: 'for a car',
      fieldId: '500',
      fieldType: 'conditionalSelect',
      fieldLabel: 'What is the purpose of your loan?',
      toscana: 'Purpose_Of_Loan',
      entries: [{ key: 'input_500', value: 'Car purchase' }],
      note: 'The form offers seven purposes. The answer has to be one of them, so Baz resolves the phrase to the form’s own spelling or asks.',
    },
    {
      id: 'amount',
      phrase: '€20,000',
      fieldId: '179',
      fieldType: 'number',
      fieldLabel: 'How much do you want to borrow?',
      toscana: 'Loan_Amount',
      entries: [
        { key: 'input_179', value: '20000' },
        { key: 'input_255', value: '20000' },
      ],
      note: 'Two entries from one number. 255 is the total, which the definition calculates as {:179}+{:218}+{:219}+{:381}+{:396}+{:453}+{:501}. Nobody is asked for it.',
    },
  ] satisfies readonly Mapping[],
} as const

/**
 * An abbreviated field from the published definition, for the schema panel.
 *
 * Real shape, real keys, real values, trimmed to what fits on a card.
 */
export const definitionExtract = `{
  "id": 500,
  "type": "conditionalSelect",
  "label": "What is the purpose of your loan?",
  "isRequired": true,
  "toscana": "Purpose_Of_Loan",
  "choices": [
    { "text": "Car purchase", "value": "Car purchase" },
    { "text": "Home improvements", "value": "Home improvements" }
  ],
  "conditionalLogic": {
    "actionType": "show",
    "logicType": "all",
    "rules": [{ "fieldId": "207", "operator": "is", "value": "New loan" }]
  }
}`

/**
 * What the engine produced on a real case, as opposed to what the bank's own journey produced.
 *
 * Measured against the live project on 14 October: a personal loan case holding twenty facts,
 * with the product questions answered in conversation.
 */
export const generated = {
  formId: '1940',
  collected: 21,
  outstanding: 18,
  entries: 43,
  status: 'GENERATED, NOT SENT',
  measuredAt: '2026-10-14',
} as const

/**
 * How honest each calculating control's answer is.
 *
 * The scale exists because the loan definition describes decision machinery, and the difference
 * between arithmetic we are entitled to do and a credit decision we are not is the whole
 * integrity of the feature. These are the live values from that same case.
 */
export const calculations: readonly {
  readonly fieldId: string
  readonly label: string
  readonly fidelity: 'source_faithful' | 'fixture' | 'unsupported'
  readonly result: string
  readonly why: string
}[] = [
  {
    fieldId: '235',
    label: 'Quick quote',
    fidelity: 'source_faithful',
    result: '€903.63 a month',
    why: 'Standard amortisation, from the five inputs this control declares, at a published rate.',
  },
  {
    fieldId: '238',
    label: 'Full quote and affordability',
    fidelity: 'source_faithful',
    result: '€903.63 a month',
    why: 'Fourteen declared inputs, every one of them a reference the definition itself writes down.',
  },
  {
    fieldId: '239',
    label: 'Eligibility',
    fidelity: 'fixture',
    result: 'eligible',
    why: 'A stand-in. Affordability at the bank is a credit decision made by systems that are not published, and inventing one would be the exact failure this architecture exists to prevent.',
  },
  {
    fieldId: '231',
    label: 'Simulated repayments',
    fidelity: 'unsupported',
    result: 'no result',
    why: 'This control declares no term among its inputs, so there is nothing to compute from. Reporting that is more useful than producing a number that looks right.',
  },
]
