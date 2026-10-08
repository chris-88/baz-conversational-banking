import type { NeedContext, NeedDefinition, NeedSuppression } from './types.ts'

/**
 * The needs Baz can recognise.
 *
 * Seeded from `needs-engine/baz-needs-catalogue.json`, which holds all 49. These are the ones
 * the demonstration actually exercises; the rest are data, and adding them is a catalogue
 * entry rather than a code change.
 *
 * Every signal is a condition over recorded facts, never a phrase to match. The catalogue
 * describes signals as things a customer might say — matching those strings would make this a
 * keyword engine, which is the one thing the design rules out (§1). Extraction turns language
 * into facts; this turns facts into needs.
 */

const objective = (context: NeedContext): string => {
  const value = context.facts.get('goals.primaryObjective', 'household')
  return typeof value === 'string' ? value.toLowerCase() : ''
}

/** A product the customer is actually pursuing, as opposed to one merely mentioned. */
const pursuing = (context: NeedContext, product: string): boolean =>
  context.applications.some(
    (application) =>
      application.product === product &&
      application.state !== 'declined' &&
      application.state !== 'completed',
  )

const beingAssessed = (context: NeedContext): boolean =>
  context.applications.some(
    (application) =>
      application.product === 'mortgage' &&
      ['submitted', 'under_review', 'info_required', 'ready'].includes(application.state),
  )

/**
 * §13 — a disclosure is not an opportunity.
 *
 * Someone mentioning an illness has told you something private, not asked to be sold cover.
 * The exception is the customer raising protection themselves, which is a question and
 * deserves an answer.
 */
const healthNotCommercialised: NeedSuppression = {
  id: 'sensitive_health_noncommercialisation',
  describe: 'health was disclosed in confidence and protection was not asked about',
  when: (context) =>
    context.sensitiveDisclosure &&
    !/protect|cover|insur|if anything happen/i.test(objective(context)),
}


/**
 * What the deposit still needs to reach, and whether they are there.
 *
 * A first-time buyer typically needs a tenth of the price, so a target price is enough to
 * compute the gap without asking for it. Returns null when there is nothing to compute from:
 * no price means no gap, not a gap of zero.
 */
export function depositGap(context: NeedContext): { target: number; saved: number; short: number } | null {
  // A target the customer stated outright beats one worked out from the price. Either will do:
  // requiring the price meant someone who said "we're aiming for 60k" had no plan at all.
  const stated = context.facts.number('goals.savingsTarget', 'household')
  const price = context.facts.number('housing.purchasePrice', 'household')

  const target =
    stated !== null && stated > 0
      ? stated
      : price !== null && price > 0
        ? Math.round(price * 0.1)
        : null

  if (target === null) return null

  const saved =
    context.facts.number('assets.depositAmount', 'household') ??
    context.facts.number('assets.savingsBalance', 'household') ??
    0

  return { target, saved, short: Math.max(0, target - saved) }
}

export const needCatalogue: readonly NeedDefinition[] = [
  {
    id: 'first_home_mortgage',
    name: 'Buy a first home',
    family: 'mortgages',
    sensitive: false,
    priority: 'very_high',
    signals: [
      {
        id: 'said-so',
        strength: 'explicit',
        describe: 'they said they want to buy a home',
        when: (context) =>
          /buy|purchas|mortgage|first home|own place|deposit|house|new build/i.test(
            objective(context),
          ),
      },
      {
        id: 'first-time-buyer',
        strength: 'strong_inferred',
        describe: 'they are a first-time buyer',
        when: (context) => context.facts.boolean('housing.firstTimeBuyer', 'household') === true,
      },
      {
        id: 'deposit-saved',
        strength: 'strong_inferred',
        describe: 'they have a deposit set aside',
        when: (context) => (context.facts.number('assets.depositAmount', 'household') ?? 0) > 0,
      },
      {
        id: 'renting-now',
        strength: 'soft_inferred',
        describe: 'they are renting at the moment',
        when: (context) => context.facts.get('housing.currentTenure', 'household') === 'renting',
      },
    ],
    clarifying: [
      {
        question: 'Are you buying on your own or with someone else?',
        answeredWhen: (context) => context.facts.has('household.buyingWith', 'household'),
      },
      {
        question: 'Whereabouts are you looking, and roughly what price?',
        answeredWhen: (context) => context.facts.has('housing.purchasePrice', 'household'),
      },
    ],
    products: ['mortgage'],
    framing:
      'A mortgage is the loan secured on the home itself. We can look at what you could borrow before anything is committed.',
    suppressions: [],
    deferrals: [],
  },

  {
    id: 'shared_household_finances',
    name: 'Shared household finances',
    family: 'everyday_banking',
    sensitive: false,
    priority: 'high',
    signals: [
      {
        id: 'finances-separate',
        strength: 'strong_inferred',
        describe: 'they keep their money separate from their partner',
        when: (context) =>
          context.facts.boolean('household.financesManagedJointly', 'household') === false,
      },
      {
        id: 'recently-married',
        strength: 'soft_inferred',
        describe: 'they married recently',
        when: (context) =>
          context.facts.boolean('lifeEvent.recentlyMarried', 'household') === true ||
          context.facts.get('identity.maritalStatus', 'household') === 'married',
      },
      {
        id: 'buying-together',
        strength: 'soft_inferred',
        describe: 'they are buying a home with someone else',
        when: (context) => context.facts.get('household.buyingWith', 'household') === 'partner',
      },
      {
        id: 'asked-for-one',
        strength: 'explicit',
        describe: 'they asked about a joint account',
        when: (context) => /joint account|account together|shared account/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question:
          'Do you want to combine everything, or just somewhere for the bills and shared spending?',
        answeredWhen: (context) =>
          context.facts.has('household.financesManagedJointly', 'household'),
      },
    ],
    products: ['joint_account'],
    framing:
      'You can keep your own accounts and add a joint one for shared household money — it does not replace either of yours.',
    suppressions: [],
    deferrals: [],
  },

  {
    id: 'family_protection',
    name: 'Protect the people who depend on you',
    family: 'protection',
    sensitive: true,
    priority: 'high',
    signals: [
      {
        id: 'new-child',
        strength: 'strong_inferred',
        describe: 'a new child has arrived or is on the way',
        when: (context) => context.facts.boolean('lifeEvent.newChild', 'household') === true,
      },
      {
        id: 'has-dependants',
        strength: 'soft_inferred',
        describe: 'other people depend on their income',
        when: (context) => (context.facts.number('household.dependantCount', 'household') ?? 0) > 0,
      },
      {
        id: 'asked-for-it',
        strength: 'explicit',
        describe: 'they asked about protecting their family',
        when: (context) => /protect|cover|life insur|if anything happen/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Who depends on your income at the moment?',
        answeredWhen: (context) => context.facts.has('household.dependantCount', 'household'),
      },
    ],
    products: ['protection'],
    framing:
      'If other people rely on your income, there are ways to make sure the household is looked after if something happens to you.',
    suppressions: [healthNotCommercialised],
    deferrals: [],
  },

  {
    id: 'mortgage_protection',
    name: 'Protect a mortgage',
    family: 'protection',
    sensitive: true,
    priority: 'high',
    signals: [
      {
        id: 'mortgage-in-flight',
        strength: 'strong_inferred',
        describe: 'they have a mortgage application in progress',
        when: (context) => pursuing(context, 'mortgage'),
      },
      {
        id: 'buying-a-home',
        strength: 'soft_inferred',
        describe: 'they are buying a home',
        when: (context) => /buy|purchas|first home/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Do you already have mortgage protection in place from somewhere else?',
        answeredWhen: (context) => context.facts.has('protection.coverAmount', 'household'),
      },
    ],
    products: ['protection'],
    framing:
      'Mortgage protection covers what is left on the mortgage. It is normally needed before drawdown rather than now.',
    suppressions: [healthNotCommercialised],
    deferrals: [],
  },

  {
    id: 'home_improvement_borrowing',
    name: 'Pay for work on the home',
    family: 'loans',
    sensitive: false,
    priority: 'medium',
    signals: [
      {
        id: 'named-a-cost',
        strength: 'strong_inferred',
        describe: 'they expect to spend on doing the place up',
        when: (context) => (context.facts.number('borrowing.requestedAmount', 'household') ?? 0) > 0,
      },
      {
        id: 'asked-for-a-loan',
        strength: 'explicit',
        describe: 'they asked about borrowing for the work',
        when: (context) => /loan|borrow|kitchen|renovat|furnish|do the place up/i.test(objective(context)),
      },
      {
        id: 'buying-a-home',
        strength: 'soft_inferred',
        describe: 'they are buying a home that may need work',
        when: (context) => /buy|purchas|first home/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Roughly what do you think the work will come to?',
        answeredWhen: (context) => context.facts.has('borrowing.requestedAmount', 'household'),
      },
    ],
    products: ['personal_loan'],
    framing:
      'A personal loan gives you a fixed amount over a set term, which suits a job with a known cost.',
    suppressions: [],
    deferrals: [
      {
        id: 'active_mortgage_unsecured_credit_defer',
        describe:
          'their mortgage is being assessed, and new borrowing can change what the mortgage team will lend',
        when: beingAssessed,
      },
    ],
  },

  {
    id: 'save_home_deposit',
    name: 'Build the deposit',
    family: 'savings',
    sensitive: false,
    priority: 'high',
    signals: [
      {
        id: 'asked-about-saving',
        strength: 'explicit',
        describe: 'they asked about saving or where to keep their savings',
        when: (context) => /sav(e|ing)|deposit account|put money (aside|away)/i.test(objective(context)),
      },
      {
        id: 'deposit-short',
        strength: 'strong_inferred',
        describe: 'they are still short of the deposit they will need',
        when: (context) => (depositGap(context)?.short ?? 0) > 0,
      },
      {
        id: 'target-date-ahead',
        strength: 'strong_inferred',
        describe: 'they are buying at some point rather than right now',
        when: (context) => context.facts.has('goals.targetDate', 'household'),
      },
      {
        id: 'renting-now',
        strength: 'soft_inferred',
        describe: 'they are renting while they save',
        when: (context) => context.facts.get('housing.currentTenure', 'household') === 'renting',
      },
    ],
    clarifying: [
      {
        question: 'How much could you put away each month?',
        answeredWhen: (context) => context.facts.has('goals.monthlySaving', 'household'),
      },
      {
        question: 'When are you hoping to be ready to buy?',
        answeredWhen: (context) => context.facts.has('goals.targetDate', 'household'),
      },
    ],
    products: ['savings'],
    framing:
      'A savings account keeps the deposit separate from everyday money, and a steady record of saving is something a mortgage assessment looks at in your favour.',
    suppressions: [],
    deferrals: [],
  },

  {
    id: 'home_insurance',
    name: 'Cover the home and what is in it',
    family: 'insurance',
    sensitive: false,
    priority: 'medium',
    signals: [
      {
        id: 'buying-a-home',
        strength: 'soft_inferred',
        describe: 'they are buying a home',
        when: (context) => /buy|purchas|first home|moving/i.test(objective(context)),
      },
      {
        id: 'mortgage-in-flight',
        strength: 'soft_inferred',
        describe: 'they have a mortgage in progress',
        when: (context) => pursuing(context, 'mortgage'),
      },
      {
        id: 'asked-for-it',
        strength: 'explicit',
        describe: 'they asked about home insurance',
        when: (context) => /home insur|contents|buildings cover/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Would you need cover for the building, the contents, or both?',
        // Nothing in the catalogue records the answer, so it stays the open question for
        // this need until the need itself moves on.
        answeredWhen: () => false,
      },
    ],
    products: [],
    framing:
      'Home insurance can cover the building, what is inside it, or both. It is usually sorted closer to drawdown.',
    suppressions: [],
    deferrals: [
      {
        id: 'too_early_in_home_journey',
        describe: 'there is no home to insure until the purchase is further along',
        when: (context) => !beingAssessed(context) && pursuing(context, 'mortgage'),
      },
    ],
  },

  {
    id: 'child_saving',
    name: 'Put something aside for a child',
    family: 'savings',
    sensitive: false,
    priority: 'medium',
    signals: [
      {
        id: 'new-child',
        strength: 'soft_inferred',
        describe: 'a new child has arrived or is on the way',
        when: (context) => context.facts.boolean('lifeEvent.newChild', 'household') === true,
      },
      {
        id: 'asked-for-it',
        strength: 'explicit',
        describe: 'they asked about saving for a child',
        when: (context) => /save for (my |the )?(child|kid|baby)|college fund/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Is that something you want to look at now, or once the house is sorted?',
        answeredWhen: () => false,
      },
    ],
    products: [],
    framing:
      'Saving for a child comes down to when the money is needed — a few years and a long way off are different problems.',
    suppressions: [],
    deferrals: [],
  },

  {
    id: 'everyday_banking',
    name: 'Somewhere for the salary to land',
    family: 'current_accounts',
    sensitive: false,
    priority: 'low',
    signals: [
      {
        id: 'asked-for-it',
        strength: 'explicit',
        describe: 'they asked about a current account or about switching',
        when: (context) => /current account|switch(ing)? (my )?(bank|account)/i.test(objective(context)),
      },
      {
        /*
         * Not "they bank elsewhere", which is true of most people and is nobody's business.
         * This fires when they have told us about money they mean to move every month AND the
         * account it would move from is somewhere else — the one case where an account here
         * does something for them that nothing else can.
         */
        id: 'saving-from-another-bank',
        strength: 'soft_inferred',
        describe: 'they are saving monthly from an account held somewhere else',
        when: (context) =>
          context.facts.get('banking.salaryPaidTo', 'primary') === 'another_bank' &&
          context.facts.has('goals.monthlySaving', 'household'),
      },
    ],
    clarifying: [
      {
        question: 'Where does your salary get paid at the moment?',
        answeredWhen: (context) => context.facts.has('banking.salaryPaidTo', 'primary'),
      },
    ],
    products: ['current_account'],
    framing:
      'A current account here is what makes a standing order possible on payday, and lets income ' +
      'and outgoings be read from records rather than asked for. It is never a condition of ' +
      'anything else.',
    suppressions: [
      {
        id: 'already_banks_here',
        describe: 'their salary is already paid to us, so they have the account this would be',
        when: (context) => context.facts.get('banking.salaryPaidTo', 'primary') === 'this_bank',
      },
    ],
    deferrals: [],
  },

  {
    id: 'everyday_card_credit',
    name: 'A card for flexibility',
    family: 'credit_cards',
    sensitive: false,
    priority: 'low',
    signals: [
      {
        id: 'asked-for-it',
        strength: 'explicit',
        describe: 'they asked about a credit card',
        when: (context) => /credit card/i.test(objective(context)),
      },
    ],
    clarifying: [
      {
        question: 'Would you expect to clear it each month, or carry a balance sometimes?',
        answeredWhen: () => false,
      },
    ],
    products: ['credit_card'],
    framing:
      'A credit card is revolving credit, so it does a different job from a loan with a fixed term.',
    suppressions: [],
    deferrals: [
      {
        id: 'active_mortgage_unsecured_credit_defer',
        describe:
          'their mortgage is being assessed, and new credit can change what the mortgage team will lend',
        when: beingAssessed,
      },
    ],
  },
]

export function needById(id: string): NeedDefinition | undefined {
  return needCatalogue.find((need) => need.id === id)
}
