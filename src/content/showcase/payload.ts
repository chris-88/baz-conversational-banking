/**
 * The loan packet the walkthrough shows, captured and never sent.
 *
 * Produced by the real engine (`fillFromFacts` → `resolveFormState` → `resolveNdi` →
 * `buildSubmission`) over the published loan definition and the facts below, on 2026-10-28,
 * and pinned here so the showcase does not carry a 444KB definition in its bundle. The test
 * beside this file recomputes it from the same inputs, so the numbers on screen cannot drift
 * from what the engine produces.
 *
 * The entries that are not here are the questions the wizard had not yet reached: a loan
 * amount sits on a page that opens once earlier pages are answered, which is the form's
 * design and not ours to short-cut. The eligibility line is a fixture by design: a credit
 * decision is not this prototype's to make, and the excerpt says so.
 */

export type PayloadEntrySource = 'answer' | 'reused' | 'default' | 'derived' | 'consent' | 'runtime'

export type PayloadExcerptEntry = {
  readonly key: string
  readonly fieldId: string
  readonly label: string
  readonly value: string
  readonly source: PayloadEntrySource
  readonly toscana: string | null
  /** A note for the one line a reader should not take at face value. */
  readonly note?: string
}

/** The facts the showcase customer holds by the time the loan form is read. */
export const PAYLOAD_FACTS: Readonly<Record<string, { readonly value: unknown; readonly bankHeld: boolean }>> = {
  'identity.fullName': { value: 'Aoife Ní Bhriain', bankHeld: true },
  'identity.dateOfBirth': { value: '1992-04-17', bankHeld: true },
  'identity.address': { value: '14 Seapoint Terrace, Dublin 8, D08 XY12', bankHeld: true },
  'identity.yearsAtAddress': { value: 3, bankHeld: true },
  'identity.email': { value: 'aoife.demo@example.invalid', bankHeld: true },
  'identity.mobile': { value: '+353871000417', bankHeld: true },
  'identity.ppsn': { value: '9000417T', bankHeld: true },
  'identity.maritalStatus': { value: 'married', bankHeld: false },
  'employment.status': { value: 'employed_full_time', bankHeld: true },
  'employment.employerName': { value: 'Ardán Software Limited', bankHeld: true },
  'employment.occupation': { value: 'Software engineer', bankHeld: false },
  'employment.startDate': { value: '2021-03-01', bankHeld: true },
  'income.annualBasic': { value: 92_000, bankHeld: true },
  'income.netMonthly': { value: 5_100, bankHeld: false },
  'expenditure.monthlyRent': { value: 1_800, bankHeld: false },
  'household.dependantCount': { value: 1, bankHeld: false },
  'housing.currentTenure': { value: 'renting', bankHeld: false },
  'assets.savingsBalance': { value: 32_000, bankHeld: false },
  'liabilities.monthlyLoanRepayments': { value: 0, bankHeld: true },
  'liabilities.creditCardBalance': { value: 0, bankHeld: true },
  'banking.salaryPaidTo': { value: 'this_bank', bankHeld: true },
  'borrowing.requestedAmount': { value: 15_000, bankHeld: false },
  'borrowing.repaymentMonths': { value: 36, bankHeld: false },
  'borrowing.purpose': { value: 'Home improvements', bankHeld: false },
}

/** What the form had been told before the facts were filled in: that this is a new loan. */
export const PAYLOAD_SEED: Readonly<Record<string, unknown>> = { '207': 'New loan' }

const EXCERPT: readonly PayloadExcerptEntry[] = [
  { key: 'input_500', fieldId: '500', label: 'What is the purpose of your loan?', value: 'Home improvements', source: 'answer', toscana: 'Purpose_Of_Loan' },
  { key: 'input_178', fieldId: '178', label: 'Living arrangements', value: 'tenant', source: 'answer', toscana: 'Residential_Status' },
  { key: 'input_77', fieldId: '77', label: 'Marital status', value: 'married', source: 'answer', toscana: 'Marital_Status' },
  { key: 'input_242', fieldId: '242', label: 'Number of dependents', value: '1', source: 'answer', toscana: 'No_of_Dependents' },
  { key: 'input_83', fieldId: '83', label: 'Net monthly salary', value: '5100', source: 'answer', toscana: 'Net_Monthly_Income' },
  { key: 'input_86', fieldId: '86', label: 'Monthly rent payments', value: '1800', source: 'answer', toscana: 'Rental_Payments' },
  { key: 'input_203', fieldId: '203', label: 'First name', value: 'Aoife', source: 'reused', toscana: 'Ignore_First_Name' },
  { key: 'input_87', fieldId: '87', label: 'Total credit card balance (if applicable)', value: '0', source: 'reused', toscana: 'Credit_Card_Outstanding_Bal' },
  { key: 'input_88', fieldId: '88', label: 'Other monthly loan repayments (if applicable)', value: '0', source: 'reused', toscana: 'Other_Monthly_Loan_Repayments' },
  { key: 'input_23', fieldId: '23', label: 'How much do you have in savings?', value: '32000', source: 'answer', toscana: 'Total_Savings_Amount' },
  { key: 'input_239', fieldId: '239', label: 'Eligibility (Full Quote)', value: 'eligible', source: 'derived', toscana: null, note: 'A fixture. A credit decision is not this prototype’s to make.' },
]

export const PAYLOAD = {
  formId: '1940',
  formName: 'Personal loan',
  formVersion: 'Consumer Loans E2E Combined - R9.10.1',
  target: 'https://digital.bankofireland.com/api/forms/1940',
  method: 'POST',
  encoding: 'multipart/form-data',
  entries: 35,
  answered: 15,
  reusedFields: 6,
  outstanding: 19,
  capturedAt: '2026-10-28',
  excerpt: EXCERPT,
} as const
