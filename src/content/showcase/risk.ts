import type { RiskScene, ShowcaseCue } from './types'

/**
 * The last sixty seconds: so what.
 *
 * A strategic risk and a design opportunity, not a prophecy. The copy keeps the prototype,
 * the strategy and what production would still need apart, because the brief asks for that
 * and because a room of bankers will notice if it doesn't.
 */
export const RISK_CUES: readonly ShowcaseCue<RiskScene>[] = [
  {
    id: 'compress',
    chapter: 'risk',
    startMs: 0,
    endMs: 5_700,
    scene: 'compress',
    presenter: {
      eyebrow: 'What you’ve just seen',
      title: 'One conversation, several products, nothing asked twice.',
      body: 'That was a bank-owned assistant sitting on the bank’s own journeys. Now step back and look at where that conversation could happen instead.',
    },
  },
  {
    id: 'assistant',
    chapter: 'risk',
    startMs: 5_700,
    endMs: 19_300,
    scene: 'assistant',
    presenter: {
      eyebrow: 'The shift',
      title: 'Personal AI assistants are becoming the first place people ask.',
      body: 'Compare mortgages, manage savings, arrange protection, plan ahead. The access an assistant needs mostly exists: PSD2 has obliged banks since 2018 to open accounts to licensed third parties at the customer’s request.',
      technicalNote:
        'Directive (EU) 2015/2366 covers payment accounts: account information and payment initiation, with the customer’s consent. Applications need no API at all. A bank’s journey is a public web form.',
    },
  },
  {
    id: 'ownership',
    chapter: 'risk',
    startMs: 19_300,
    endMs: 35_700,
    scene: 'ownership',
    presenter: {
      eyebrow: 'The strategic question',
      title: 'If somebody else owns the conversation, the bank keeps the products.',
      body: 'The regulated products, the balance sheet and the infrastructure stay with the bank. The context, the relationship and the pricing power move to whoever the customer talks to.',
    },
  },
  {
    id: 'paths',
    chapter: 'risk',
    startMs: 35_700,
    endMs: 44_500,
    scene: 'paths',
    presenter: {
      eyebrow: 'Two responses',
      title: 'Baz explores both ways to respond.',
      body: 'A direct relationship through a bank-owned assistant, and secure, customer-authorised access for the assistants customers choose themselves.',
      bullets: [
        'A direct Baz relationship: built and running',
        'Access for customer-chosen assistants: a strategic possibility, prototyped',
      ],
    },
  },
  {
    id: 'question',
    chapter: 'risk',
    startMs: 44_500,
    endMs: 50_560,
    scene: 'question',
    presenter: {
      title: 'Who will customers choose to talk to?',
      body: 'The opportunity is real. The question is who holds the relationship.',
    },
  },
]
