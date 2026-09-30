import { defineJourney } from '../journey.ts'

/**
 * §7.1 — the anchor journey. Primary and secondary applicant, the richest financial
 * requirements, documents, and post-submission state changes.
 *
 * Information gathered here is what every other journey then reuses.
 */
export const mortgage = defineJourney({
  product: 'mortgage',
  status: 'draft',
  source: null,
  displayName: 'Mortgage',
  supportsPartner: true,
  requirements: [
    // ---- Identity ----
    { kind: 'fact', id: 'name', fact: 'identity.fullName', subject: 'primary', label: 'Your full name' },
    { kind: 'fact', id: 'dob', fact: 'identity.dateOfBirth', subject: 'primary', label: 'Your date of birth' },
    { kind: 'fact', id: 'address', fact: 'identity.address', subject: 'primary', label: 'Your home address' },
    { kind: 'fact', id: 'years-at-address', fact: 'identity.yearsAtAddress', subject: 'primary', label: 'Years at that address' },
    { kind: 'fact', id: 'nationality', fact: 'identity.nationality', subject: 'primary', label: 'Your nationality' },
    { kind: 'fact', id: 'marital-status', fact: 'identity.maritalStatus', subject: 'primary', label: 'Your marital status' },
    { kind: 'fact', id: 'ppsn', fact: 'identity.ppsn', subject: 'primary', label: 'Your PPS number' },

    // ---- Household ----
    { kind: 'fact', id: 'buying-with', fact: 'household.buyingWith', subject: 'household', label: 'Buying alone or with someone' },
    { kind: 'fact', id: 'dependants', fact: 'household.dependantCount', subject: 'household', label: 'Number of dependants' },

    // ---- Employment and income ----
    { kind: 'fact', id: 'employment-status', fact: 'employment.status', subject: 'primary', label: 'Your employment status' },
    { kind: 'fact', id: 'employer', fact: 'employment.employerName', subject: 'primary', label: 'Your employer' },
    { kind: 'fact', id: 'occupation', fact: 'employment.occupation', subject: 'primary', label: 'Your occupation' },
    { kind: 'fact', id: 'employment-start', fact: 'employment.startDate', subject: 'primary', label: 'When you started that job' },
    { kind: 'fact', id: 'income-basic', fact: 'income.annualBasic', subject: 'primary', label: 'Your annual basic salary' },
    { kind: 'fact', id: 'income-variable', fact: 'income.annualVariable', subject: 'primary', label: 'Your bonus or commission', optional: true },

    // ---- Outgoings, assets, liabilities ----
    { kind: 'fact', id: 'current-tenure', fact: 'housing.currentTenure', subject: 'household', label: 'Your current housing' },
    { kind: 'fact', id: 'rent', fact: 'expenditure.monthlyRent', subject: 'household', label: 'Monthly rent' },
    { kind: 'fact', id: 'childcare', fact: 'expenditure.monthlyChildcare', subject: 'household', label: 'Monthly childcare' },
    { kind: 'fact', id: 'savings', fact: 'assets.savingsBalance', subject: 'household', label: 'Your savings' },
    { kind: 'fact', id: 'deposit', fact: 'assets.depositAmount', subject: 'household', label: 'Deposit available' },
    { kind: 'fact', id: 'loan-repayments', fact: 'liabilities.monthlyLoanRepayments', subject: 'primary', label: 'Monthly loan repayments' },
    { kind: 'fact', id: 'card-balance', fact: 'liabilities.creditCardBalance', subject: 'primary', label: 'Credit card balance' },

    // ---- The purchase ----
    { kind: 'fact', id: 'purchase-price', fact: 'housing.purchasePrice', subject: 'household', label: 'Property price' },
    { kind: 'fact', id: 'property-county', fact: 'housing.propertyCounty', subject: 'household', label: 'Where you are buying' },
    { kind: 'fact', id: 'first-time-buyer', fact: 'housing.firstTimeBuyer', subject: 'household', label: 'First-time buyer' },

    // ---- Documents ----
    { kind: 'document', id: 'doc-payslip', subject: 'primary', label: 'Your most recent payslip', documentType: 'payslip', requiresVerification: true },
    { kind: 'document', id: 'doc-salary-cert', subject: 'primary', label: 'Salary certificate', documentType: 'salary_certificate' },
    { kind: 'document', id: 'doc-bank-statement', subject: 'primary', label: 'Six months of bank statements', documentType: 'bank_statement' },
    { kind: 'document', id: 'doc-id', subject: 'primary', label: 'Photo ID', documentType: 'photo_id' },
    { kind: 'document', id: 'doc-address', subject: 'primary', label: 'Proof of address', documentType: 'proof_of_address' },

    // ---- Declaration ----
    { kind: 'declaration', id: 'mortgage-declaration', subject: 'primary', label: 'Mortgage application declaration', fresh: true },
  ],
  branches: [
    {
      id: 'second-applicant',
      describe: 'Buying with a partner, so a second applicant is assessed too',
      when: (facts) => facts.get('household.buyingWith', 'household') === 'partner',
      requirements: [
        { kind: 'fact', id: 'partner-name', fact: 'identity.fullName', subject: 'partner', label: "Your partner's full name" },
        { kind: 'fact', id: 'partner-dob', fact: 'identity.dateOfBirth', subject: 'partner', label: "Your partner's date of birth" },
        { kind: 'fact', id: 'partner-ppsn', fact: 'identity.ppsn', subject: 'partner', label: "Your partner's PPS number" },
        { kind: 'fact', id: 'partner-employment-status', fact: 'employment.status', subject: 'partner', label: "Your partner's employment status" },
        { kind: 'fact', id: 'partner-employer', fact: 'employment.employerName', subject: 'partner', label: "Your partner's employer" },
        { kind: 'fact', id: 'partner-income-basic', fact: 'income.annualBasic', subject: 'partner', label: "Your partner's annual basic salary" },
        { kind: 'fact', id: 'partner-loan-repayments', fact: 'liabilities.monthlyLoanRepayments', subject: 'partner', label: "Your partner's monthly loan repayments" },
        { kind: 'document', id: 'partner-doc-payslip', subject: 'partner', label: "Your partner's most recent payslip", documentType: 'payslip', requiresVerification: true },
        { kind: 'declaration', id: 'partner-mortgage-declaration', subject: 'partner', label: 'Mortgage application declaration', fresh: true },
      ],
    },
    {
      id: 'gifted-deposit',
      describe: 'Part of the deposit is a gift, so its source must be evidenced',
      when: (facts) => (facts.number('assets.giftedDeposit', 'household') ?? 0) > 0,
      requirements: [
        { kind: 'document', id: 'doc-gift-letter', subject: 'primary', label: 'Letter confirming the gifted deposit', documentType: 'bank_statement' },
      ],
    },
  ],
})
