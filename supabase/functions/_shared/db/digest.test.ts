import { describe, expect, it } from 'vitest'
import {
  asApplicationId,
  asFactId,
  asParticipantId,
  type Fact,
  type FactKey,
  type FactSubject,
} from '../domain/facts.ts'
import type { Application } from '../domain/state-machine.ts'
import { slidersFor } from '../llm/persona.ts'
import { buildCaseDigest } from './digest.ts'
import type { LoadedCase } from './loaded-case.ts'

const PRIMARY = asParticipantId('11111111-1111-4111-8111-111111111111')
const PARTNER = asParticipantId('22222222-2222-4222-8222-222222222222')

let n = 0
const fact = (key: FactKey, subject: FactSubject, value: unknown, extra: Partial<Fact> = {}): Fact => {
  n += 1
  return {
    id: asFactId(`f-${n}`),
    key,
    subject,
    value,
    source: 'customer_stated',
    verified: false,
    capturedFor: null,
    supersededBy: null,
    capturedAt: '2026-10-01T10:00:00.000Z',
    ...extra,
  }
}

const application = (product: Application['product'], state: Application['state']): Application => ({
  id: asApplicationId(`33333333-3333-4333-8333-00000000000${product.length % 10}`),
  product,
  state,
  resumeTo: null,
})

function loaded(overrides: Partial<LoadedCase> = {}): LoadedCase {
  return {
    caseId: '44444444-4444-4444-8444-444444444444',
    kind: 'presenter',
    authLevel: 'authenticated',
    customerName: 'Aoife',
    lastSeenAt: null,
    participants: [{ id: PRIMARY, role: 'primary', displayName: 'Aoife' }],
    facts: [],
    applications: [],
    confirmations: [],
    documents: [],
    requests: [],
    productInterests: [],
    messages: [],
    eventsSinceLastSeen: [],
    persona: slidersFor('default'),
    killSwitch: false,
    ...overrides,
  }
}

describe('facts in the digest', () => {
  it('renders values for reading rather than dumping them raw', () => {
    const digest = buildCaseDigest(
      loaded({
        facts: [
          fact('income.annualBasic', PRIMARY, 92_000),
          fact('housing.firstTimeBuyer', 'household', true),
          fact('household.dependantCount', 'household', 1),
        ],
      }),
    )

    expect(digest.facts.map((f) => f.value)).toEqual(['92,000', 'yes', '1'])
  })

  it('never puts special-category data in front of the model (Invariant 6)', () => {
    const digest = buildCaseDigest(
      loaded({
        facts: [
          fact('protection.health.smoker', PRIMARY, false),
          fact('protection.health.conditions', PRIMARY, ['asthma']),
          fact('income.annualBasic', PRIMARY, 92_000),
        ],
      }),
    )

    expect(digest.facts).toHaveLength(1)
    expect(digest.facts[0]?.label).toBe('Annual basic salary')
  })

  it('omits a superseded fact, so a corrected value is never shown twice', () => {
    const digest = buildCaseDigest(
      loaded({
        facts: [
          fact('income.annualBasic', PRIMARY, 80_000, { supersededBy: asFactId('newer') }),
          fact('income.annualBasic', PRIMARY, 92_000),
        ],
      }),
    )

    expect(digest.facts).toHaveLength(1)
    expect(digest.facts[0]?.value).toBe('92,000')
  })

  it("marks the partner's facts as theirs", () => {
    const digest = buildCaseDigest(
      loaded({
        participants: [
          { id: PRIMARY, role: 'primary', displayName: 'Aoife' },
          { id: PARTNER, role: 'partner', displayName: 'Emma' },
        ],
        facts: [fact('income.annualBasic', PARTNER, 54_000)],
      }),
    )

    expect(digest.facts[0]?.label).toMatch(/partner/i)
  })

  it('carries provenance through, so reuse can be explained', () => {
    const digest = buildCaseDigest(
      loaded({
        facts: [fact('income.annualBasic', PRIMARY, 92_000, { source: 'bank_held', verified: true })],
      }),
    )

    expect(digest.facts[0]?.source).toBe('bank_held')
    expect(digest.facts[0]?.verified).toBe(true)
  })
})

describe('applications in the digest', () => {
  it('states what is outstanding, computed rather than remembered (Invariant 3)', () => {
    const digest = buildCaseDigest(loaded({ applications: [application('credit_card', 'in_progress')] }))

    expect(digest.applications).toHaveLength(1)
    expect(digest.applications[0]?.outstanding.length).toBeGreaterThan(0)
    expect(digest.applications[0]?.stateLabel).toBe('In progress')
  })

  it('shrinks the outstanding list as facts arrive', () => {
    const before = buildCaseDigest(loaded({ applications: [application('credit_card', 'in_progress')] }))
    const after = buildCaseDigest(
      loaded({
        applications: [application('credit_card', 'in_progress')],
        facts: [
          fact('identity.fullName', PRIMARY, 'Aoife Ní Bhriain'),
          fact('identity.dateOfBirth', PRIMARY, '1992-04-17'),
          fact('household.dependantCount', 'household', 1),
        ],
      }),
    )

    expect(after.applications[0]?.outstanding.length).toBeLessThan(
      before.applications[0]?.outstanding.length ?? 0,
    )
  })

  it('carries the advisory when a loan runs alongside a mortgage (§6 Stage 8)', () => {
    const digest = buildCaseDigest(
      loaded({
        applications: [application('mortgage', 'in_progress'), application('personal_loan', 'in_progress')],
      }),
    )

    expect(digest.advisories).toHaveLength(1)
    expect(digest.advisories[0]?.title).toMatch(/mortgage/i)
  })

  it('is empty when no participant has been created yet', () => {
    expect(buildCaseDigest(loaded({ participants: [] })).applications).toEqual([])
  })
})

describe('customer agency (§49)', () => {
  it('lists declined products so they are not raised again', () => {
    const digest = buildCaseDigest(
      loaded({
        productInterests: [
          { product: 'personal_loan', status: 'declined', reason: null },
          { product: 'mortgage', status: 'accepted', reason: null },
        ],
      }),
    )

    expect(digest.declinedProducts).toEqual(['personal_loan'])
  })
})

describe('what changed since last time (§36)', () => {
  it('describes known events in the customer’s language', () => {
    const digest = buildCaseDigest(
      loaded({
        eventsSinceLastSeen: [
          { type: 'application_approved', createdAt: '2026-10-01T09:00:00Z', payload: { applicationName: 'Your credit card' } },
          { type: 'information_requested', createdAt: '2026-10-01T09:05:00Z', payload: { applicationName: 'Your mortgage', detail: 'one more payslip' } },
        ],
      }),
    )

    expect(digest.eventsSinceLastSeen).toEqual([
      'Your credit card was approved.',
      'Your mortgage: the team asked for one more payslip.',
    ])
  })

  it('omits an event type nobody has written copy for, rather than guessing', () => {
    const digest = buildCaseDigest(
      loaded({
        eventsSinceLastSeen: [
          { type: 'some_future_event', createdAt: '2026-10-01T09:00:00Z', payload: {} },
        ],
      }),
    )

    expect(digest.eventsSinceLastSeen).toEqual([])
  })
})

describe('the partner', () => {
  it('names them and what is waiting on them', () => {
    const digest = buildCaseDigest(
      loaded({
        participants: [
          { id: PRIMARY, role: 'primary', displayName: 'Aoife' },
          { id: PARTNER, role: 'partner', displayName: 'Emma' },
        ],
        applications: [application('joint_account', 'waiting_partner')],
      }),
    )

    expect(digest.partner?.name).toBe('Emma')
    expect(digest.partner?.outstanding.length).toBeGreaterThan(0)
  })

  it('is absent before anyone has joined', () => {
    expect(buildCaseDigest(loaded()).partner).toBeNull()
  })
})

/**
 * Invariant 6 has two halves. The model must never see special-category values — and it must
 * know they exist, or it reports answered health questions as outstanding, which is what
 * happened the first time this ran.
 */
describe('special-category data is held, not hidden', () => {
  const withHealth = () =>
    loaded({
      applications: [application('protection', 'in_progress')],
      facts: [
        fact('protection.health.smoker', PRIMARY, false, {
          capturedFor: asApplicationId('33333333-3333-4333-8333-000000000000'),
        }),
      ],
    })

  it('still shows no value anywhere in the digest', () => {
    const digest = buildCaseDigest(withHealth())
    expect(JSON.stringify(digest)).not.toContain('smoker')
    expect(digest.facts).toEqual([])
  })

  it('tells the model the information is held, so it does not report it as missing', () => {
    const digest = buildCaseDigest(withHealth())
    expect(digest.sensitiveHeld?.length).toBe(1)
    expect(digest.sensitiveHeld?.[0]).toMatch(/answered and recorded/i)
  })

  it('says nothing at all when no sensitive data has been given', () => {
    expect(buildCaseDigest(loaded()).sensitiveHeld).toEqual([])
  })
})

/**
 * The model could not tell "never been told this" from "we have it, confirm it at review", so
 * it asked again for values the customer had already given.
 */
describe('outstanding items say why they are outstanding', () => {
  it('marks a known value as confirmed at review rather than missing', () => {
    const digest = buildCaseDigest(
      loaded({
        applications: [application('credit_card', 'in_progress')],
        facts: [fact('identity.address', PRIMARY, '14 Sample Terrace', { capturedFor: null })],
      }),
    )

    const address = digest.applications[0]?.outstanding.find((item) => item.startsWith('Your home address'))
    expect(address).toMatch(/already known, confirmed on the review card/)
  })

  it('marks something genuinely unknown as worth asking for', () => {
    const digest = buildCaseDigest(
      loaded({ applications: [application('credit_card', 'in_progress')] }),
    )

    expect(digest.applications[0]?.outstanding.some((item) => item.includes('not yet known'))).toBe(
      true,
    )
  })
})
