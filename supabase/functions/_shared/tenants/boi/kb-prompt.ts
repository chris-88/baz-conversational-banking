import { boiKnowledgeBase } from './knowledge-base.ts'
import type { KnowledgeProduct } from './kb-types.ts'
import { boiProducts } from './products.ts'
import { rateAsOf, rateOf } from './rates.ts'
import { combinationsSection } from './combinations.ts'

/**
 * Bank of Ireland's actual retail offering, as the prompt sees it.
 *
 * This replaced a catalogue of seven invented products. Everything here is read from their
 * public site and verified on the date in the metadata, which is why the disclaimer below says
 * what it says rather than "illustrative and invented for a prototype" — that sentence was
 * honest about the old catalogue and would be a lie about this one, in the unusual direction of
 * telling somebody that real published terms were made up.
 *
 * What is still invented is the arithmetic. The pack holds no mortgage rate table and no
 * protection premiums — it says so itself, under `not_authoritative_for` — so the figures the
 * quote card computes from remain illustrative and are labelled as such wherever they appear.
 */

/** Three objects the pack flags as needing an internal check. They are not put to customers. */
export function surfaceable(product: KnowledgeProduct): boolean {
  return product.catalogue_status === 'active_public'
}

export const SURFACEABLE_PRODUCTS: readonly KnowledgeProduct[] =
  boiKnowledgeBase.products.filter(surfaceable)

/**
 * What a figure in this pack is worth.
 *
 * Every pricing snapshot carries `volatile: true`, and several are months old — the personal
 * loan's APR range is dated February 2025. A rate stated as current when it is a snapshot is
 * the one mistake this whole catalogue exists to avoid.
 */
export const KB_DISCLAIMER =
  'This catalogue is Bank of Ireland’s real public retail offering, read from their site and ' +
  `verified on ${String(boiKnowledgeBase.metadata.as_of)}. Descriptions, features, eligibility ` +
  'and cautions can be stated as fact.\n' +
  'Rates, APR, APRC, premiums, fees and promotions CANNOT. Every figure here is a snapshot and ' +
  'some are months old, so give them as "around" or "last published at", never as today’s rate, ' +
  'and say the live figure comes from the product pages. Any figure the quote card computes ' +
  'from is illustrative, because this catalogue holds no mortgage rate table and no premiums.\n' +
  'Never state an eligibility decision, an approval, or what somebody can borrow.'

function line(label: string, values: readonly string[] | undefined): readonly string[] {
  return values === undefined || values.length === 0 ? [] : [`${label}: ${values.join('; ')}`]
}

/** One product, short enough that sixty-one of them is still readable. */
function describe(product: KnowledgeProduct): string {
  const usage = product.baz_usage

  const rate = rateOf(product)
  const asOf = rateAsOf(product)

  return [
    `## ${product.name} [${product.id}]`,
    product.customer_job,
    /*
     * The rate, where the pack holds one. For a deposit account it is the entire question, and
     * leaving it out of the prompt meant Baz compared savings accounts on their features.
     */
    ...(rate === null
      ? []
      : [
          `Rate: ${rate.headline}${rate.note === null ? '' : ` (${rate.note})`}` +
            `${asOf === null ? '' : ` — last published ${asOf}`}`,
        ]),
    ...line('Suits', product.best_for),
    ...line('Features', product.features),
    ...line('Eligibility', product.eligibility),
    ...line('Care', product.constraints_and_cautions),
    ...line('Raise when', usage.surface_when),
    ...line('Ask first', usage.clarify),
    // Loudest, because these are the lines somebody would otherwise cross without noticing.
    ...(usage.must_not_say === undefined ? [] : [`NEVER: ${usage.must_not_say.join(' ')}`]),
    ...line('Hold back when', usage.suppress_when),
    ...line('Not yet when', usage.defer_when),
    ...(product.advice_model === 'information_or_self_serve'
      ? []
      : [`Ends in: ${product.advice_model.replaceAll('_', ' ')} — you take it to the door, not through it.`]),
  ].join('\n')
}

/**
 * The rates the quote card computes from, which are the one invented thing left.
 *
 * Kept separate and said plainly, because the catalogue above is real and these are not. The
 * pack holds no mortgage rate table and no premiums, so a card that works out a repayment has
 * to work it out from something, and the honest answer is to name the something.
 */
function illustrativeRates(): string {
  const lines = Object.values(boiProducts).flatMap((product) => {
    const variants = product.variants ?? []
    if (variants.length === 0) return []

    return [
      `- ${product.name}:`,
      ...variants.map((variant) => {
        const rate = `${(variant.annualRate * 100).toFixed(2).replace(/\.?0+$/, '')}%`
        const term =
          variant.fixedYears === undefined
            ? ''
            : ` fixed for ${String(variant.fixedYears)} year${variant.fixedYears === 1 ? '' : 's'}`
        return `  - ${variant.name}: ${rate}${term}`
      }),
    ]
  })

  return [
    '# Rates used in calculations',
    '',
    'These are ILLUSTRATIVE and invented, unlike the catalogue above. Bank of Ireland publishes',
    'its mortgage rates in a table this pack does not carry, and protection is individually',
    'quoted, so the quote card computes from these instead. Say they are illustrative every time',
    'a figure from one of them is shown, and never present one as a rate on offer.',
    '',
    ...lines,
  ].join('\n')
}

export function knowledgeBaseSection(): string {
  return [
    '# Products',
    '',
    KB_DISCLAIMER,
    '',
    ...boiKnowledgeBase.knowledge_policy.baz_rules.map((rule) => `- ${rule}`),
    '',
    ...SURFACEABLE_PRODUCTS.map(describe),
    '',
    combinationsSection(),
    '',
    illustrativeRates(),
  ].join('\n\n')
}
