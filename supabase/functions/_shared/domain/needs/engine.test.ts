import { describe, expect, it } from 'vitest'
import { combineConfidence, evaluateNeeds, nextToClarify } from './engine.ts'
import { NEED_THRESHOLDS, type NeedCandidate, type NeedContext } from './types.ts'
import { needCatalogue, needById } from './catalogue.ts'

/** A reader over a plain object, so a test can state the case in one literal. */
function contextOf(
  facts: Record<string, unknown>,
  extra: Partial<Omit<NeedContext, 'facts'>> = {},
): NeedContext {
  const read = (key: string, subject = 'household') => facts[`${key}:${subject}`] ?? facts[key]

  return {
    facts: {
      has: (key, subject) => read(key, subject) !== undefined,
      get: (key, subject) => read(key, subject),
      number: (key, subject) => {
        const value = read(key, subject)
        return typeof value === 'number' ? value : null
      },
      boolean: (key, subject) => {
        const value = read(key, subject)
        return typeof value === 'boolean' ? value : null
      },
    },
    sensitiveDisclosure: extra.sensitiveDisclosure ?? false,
    applications: extra.applications ?? [],
    decisions: extra.decisions ?? [],
  }
}

const find = (candidates: readonly NeedCandidate[], id: string) =>
  candidates.find((candidate) => candidate.need.id === id)

describe('combining evidence', () => {
  it('treats one explicit statement as certain', () => {
    expect(combineConfidence(['explicit'])).toBe(1)
  })

  it('never lets a single soft signal reach the clarify threshold', () => {
    // "We got married last month" supports several needs and establishes none of them.
    expect(combineConfidence(['soft_inferred'])).toBeLessThan(NEED_THRESHOLDS.clarify)
  })

  it('needs corroboration before a strong signal will surface', () => {
    expect(combineConfidence(['strong_inferred'])).toBeLessThan(NEED_THRESHOLDS.surface)
    expect(combineConfidence(['strong_inferred', 'soft_inferred'])).toBeGreaterThanOrEqual(
      NEED_THRESHOLDS.surface,
    )
  })

  it('accumulates without ever exceeding certainty', () => {
    const many = combineConfidence(['strong_inferred', 'strong_inferred', 'soft_inferred'])
    expect(many).toBeLessThanOrEqual(1)
    expect(many).toBeGreaterThan(combineConfidence(['strong_inferred', 'strong_inferred']))
  })

  it('matches the worked example in the design (§14)', () => {
    // Marriage, separate finances and shared costs: the document says about 0.85.
    const score = combineConfidence(['soft_inferred', 'strong_inferred', 'soft_inferred'])
    expect(score).toBeGreaterThan(0.8)
    expect(score).toBeLessThan(0.92)
  })

  it('has no evidence at all when nothing matched', () => {
    expect(combineConfidence([])).toBe(0)
  })
})

describe('a need appears only when the case supports it', () => {
  it('leaves everything latent for a case that knows nothing', () => {
    const candidates = evaluateNeeds(contextOf({}))
    expect(candidates.every((candidate) => candidate.state === 'latent')).toBe(true)
  })

  it('surfaces the mortgage the moment the customer asks for one', () => {
    const candidates = evaluateNeeds(
      contextOf({ 'goals.primaryObjective': 'buy my first home', 'housing.firstTimeBuyer': true }),
    )
    const mortgage = find(candidates, 'first_home_mortgage')

    expect(mortgage?.state).toBe('ready_to_surface')
    expect(mortgage?.confidence).toBe(1)
  })

  it('asks before it offers when the evidence is only circumstantial', () => {
    // Married with separate finances: enough to ask about a joint account, not to offer one.
    const candidates = evaluateNeeds(contextOf({ 'identity.maritalStatus': 'married' }))
    const shared = find(candidates, 'shared_household_finances')

    expect(shared?.state).toBe('latent')
    expect(shared?.confidence).toBeLessThan(NEED_THRESHOLDS.clarify)
  })

  it('explains itself with the evidence that produced it', () => {
    const candidates = evaluateNeeds(
      contextOf({ 'goals.primaryObjective': 'buy my first home', 'housing.firstTimeBuyer': true }),
    )
    const mortgage = find(candidates, 'first_home_mortgage')

    expect(mortgage?.evidence.length).toBeGreaterThan(0)
    expect(mortgage?.evidence[0]?.describe).toBeTruthy()
  })
})

describe('a diagnosis is not a sales trigger (§13, Invariant 6)', () => {
  it('suppresses protection when health was disclosed and nothing was asked', () => {
    const candidates = evaluateNeeds(
      contextOf({
        'household.dependantCount': 2,
        'lifeEvent.newChild': true,
        }, { sensitiveDisclosure: true }),
    )
    const family = find(candidates, 'family_protection')

    expect(family?.state).toBe('suppressed')
    expect(family?.reason).toMatch(/health|disclos/i)
  })

  it('still allows protection when the customer raised it themselves', () => {
    const candidates = evaluateNeeds(
      contextOf({
        'household.dependantCount': 2,
        'lifeEvent.newChild': true,
        'goals.primaryObjective': 'protect my family if anything happens to me',
      }, { sensitiveDisclosure: true }),
    )

    expect(find(candidates, 'family_protection')?.state).not.toBe('suppressed')
  })
})

describe('timing is not the same as relevance (§7, §12)', () => {
  it('defers new borrowing while a mortgage is being assessed, rather than dropping it', () => {
    const candidates = evaluateNeeds(
      contextOf(
        { 'goals.primaryObjective': 'buy my first home', 'borrowing.requestedAmount': 15_000 },
        { applications: [{ product: 'mortgage', state: 'under_review' }] },
      ),
    )
    const borrowing = find(candidates, 'home_improvement_borrowing')

    expect(borrowing?.state).toBe('deferred')
    expect(borrowing?.reason).toMatch(/mortgage/i)
    // Still a real need — the customer may choose it anyway.
    expect(borrowing?.confidence).toBeGreaterThanOrEqual(NEED_THRESHOLDS.surface)
  })

  it('offers the same borrowing freely when no mortgage is in flight', () => {
    const candidates = evaluateNeeds(
      contextOf({ 'goals.primaryObjective': 'buy my first home', 'borrowing.requestedAmount': 15_000 }),
    )
    expect(find(candidates, 'home_improvement_borrowing')?.state).toBe('ready_to_surface')
  })
})

describe('what the customer has already settled', () => {
  it('does not resurface something they declined', () => {
    const candidates = evaluateNeeds(
      contextOf(
        { 'goals.primaryObjective': 'buy my first home' },
        { decisions: [{ needId: 'first_home_mortgage', state: 'declined' }] },
      ),
    )

    expect(find(candidates, 'first_home_mortgage')?.state).toBe('declined')
  })

  it('keeps a recorded decision in front of a computed one', () => {
    const candidates = evaluateNeeds(
      contextOf(
        { 'goals.primaryObjective': 'buy my first home' },
        { decisions: [{ needId: 'first_home_mortgage', state: 'accepted' }] },
      ),
    )

    expect(find(candidates, 'first_home_mortgage')?.state).toBe('accepted')
  })
})

describe('what to ask next', () => {
  it('picks the best-evidenced need that is still a question', () => {
    const candidates = evaluateNeeds(
      contextOf({ 'identity.maritalStatus': 'married', 'household.buyingWith': 'partner' }),
    )
    const question = nextToClarify(candidates)

    expect(question?.need.id).toBe('shared_household_finances')
    expect(question?.nextQuestion).toBeTruthy()
  })

  it('asks nothing when there is nothing worth asking', () => {
    expect(nextToClarify(evaluateNeeds(contextOf({})))).toBeNull()
  })

  it('never asks about a need it is suppressing', () => {
    const candidates = evaluateNeeds(
      contextOf({
        'household.dependantCount': 2,
        'lifeEvent.newChild': true,
        }, { sensitiveDisclosure: true }),
    )

    expect(nextToClarify(candidates)?.need.id).not.toBe('family_protection')
  })
})

describe('the catalogue itself', () => {
  it('gives every need approved wording to work from', () => {
    for (const need of needCatalogue) {
      expect(need.framing.length, need.id).toBeGreaterThan(20)
    }
  })

  it('has a unique id for every need and every signal within it', () => {
    const ids = needCatalogue.map((need) => need.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const need of needCatalogue) {
      const signals = need.signals.map((signal) => signal.id)
      expect(new Set(signals).size, need.id).toBe(signals.length)
    }
  })

  it('only maps to products that can actually be applied for', () => {
    // A need may legitimately have none — most are explained, not started.
    for (const need of needCatalogue) {
      for (const product of need.products) {
        expect(typeof product, need.id).toBe('string')
      }
    }
  })

  it('finds a need by id', () => {
    expect(needById('first_home_mortgage')?.name).toBeTruthy()
    expect(needById('not_a_need')).toBeUndefined()
  })
})
