import { z } from 'zod'
import {
  categoryReachesModel,
  type DomainCategoryId,
  type DomainConfig,
} from '../tenants/boi/domain-config.ts'
import { refusalFor, type RefusalReason, type ToneBucket } from './refusals.ts'

/**
 * The gate is enforcement, not a request (§25, Invariant 4).
 *
 * Nothing reaches the Baz model without passing through here, and a blocked turn produces a
 * canned string rather than model output — so there is no path by which the model could be
 * induced to answer the blocked question and append a disclaimer (§26).
 *
 * Order: deterministic checks, then classification, then routing. The deterministic layer
 * exists because a classifier is a model too, and §25 explicitly rules out relying on asking
 * a model nicely.
 */

export const GATE_CATEGORIES = [
  'banking',
  'ambiguous',
  'general_knowledge',
  'competitor',
  'off_topic',
  'abusive',
  'prompt_injection',
  'unsupported',
] as const satisfies readonly DomainCategoryId[]

/**
 * Long enough for a customer explaining their circumstances, short enough that a prompt
 * stuffed with instructions is refused before it costs anything.
 */
export const MAX_INPUT_LENGTH = 1_000

export const classificationSchema = z.object({
  category: z.enum(GATE_CATEGORIES),
  profanity: z.boolean(),
  sensitive: z.boolean(),
})

export type Classification = z.infer<typeof classificationSchema>

/**
 * Patterns confident enough to decide on their own. Deliberately narrow: they must not fire
 * on ordinary banking language, so each requires an instruction-shaped object rather than a
 * bare keyword. "Can I ignore the letter about my overdraft?" must pass.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /\bignore\s+(?:all\s+)?(?:your|the|any|my|previous|prior|earlier|above)\s*(?:previous\s+|prior\s+|earlier\s+)?(?:instructions?|prompts?|rules?|directions?|guidelines?)\b/i,
  /\bdisregard\s+(?:all\s+|the\s+|any\s+)?(?:above|previous|prior|earlier|your)\b/i,
  /\b(?:show|reveal|print|repeat|output|tell)\s+(?:me\s+)?(?:your|the)\s+(?:system\s+|initial\s+|original\s+)?(?:prompt|instructions|rules)\b/i,
  /\bpretend\s+(?:that\s+)?(?:you(?:'re|\s+are)?\s+)?(?:not|no\s+longer)\b/i,
  /\byou\s+are\s+now\b/i,
  /\b(?:act|behave)\s+as\s+(?:an?\s+)?(?:general|unrestricted|uncensored|different)\b/i,
  /\b(?:unrestricted|jailbreak|jailbroken|developer\s+mode|dan\s+mode)\b/i,
  /\bforget\s+(?:everything|all)\s+(?:above|before|you)\b/i,
]

export type PreCheckFailure = { readonly reason: 'empty' | 'too_long' }

/** Runs before any model call, so an empty or oversized turn costs nothing. */
export function deterministicPreCheck(input: string): PreCheckFailure | null {
  if (input.trim().length === 0) return { reason: 'empty' }
  if (input.length > MAX_INPUT_LENGTH) return { reason: 'too_long' }
  return null
}

/** §24 — flagged deterministically, and still classified, so the admin view shows both. */
export function looksLikeInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export type GateAllowed = {
  readonly allowed: true
  readonly category: DomainCategoryId
  /** The model is told to clarify within banking scope rather than guess (§20). */
  readonly clarifyInScope: boolean
  /** Sensitive turns force humour, sarcasm, playfulness and poetic to zero (§50, Invariant 5). */
  readonly suppressHumour: boolean
  /** No product offers during a sensitive turn (§50). */
  readonly suppressProductOffers: boolean
  readonly profanity: boolean
  readonly injectionFlagged: boolean
}

export type GateBlocked = {
  readonly allowed: false
  readonly category: DomainCategoryId
  readonly reason: RefusalReason
  /** The canned reply. Never contains the prohibited answer (§26). */
  readonly response: string
  readonly injectionFlagged: boolean
  /**
   * Why the classifier did not answer, when that is the reason for the block.
   *
   * The customer still gets the same short retry message — failing closed is the point, and
   * what went wrong upstream is not their problem. But it was being discarded here as well,
   * which meant an outage, an expired key and a slow response were indistinguishable from
   * each other in the one place anybody would look. Carried out so the block is auditable
   * (§39) and so the cause is in Sentry rather than inferred.
   */
  readonly classifierFailure?: ClassifierFailure
}

export type ClassifierFailure = {
  /** `timeout` means the deadline won the race; the request may still have been in flight. */
  readonly kind: 'timeout' | 'error' | 'unparseable'
  readonly detail: string
}

export type GateResult = GateAllowed | GateBlocked

export type RouteOptions = {
  readonly tone?: ToneBucket
  readonly injectionFlagged?: boolean
}

/** Pure: the routing decision for a classification. Tested against fixed classifier output. */
export function routeClassification(
  classification: Classification,
  domainConfig: DomainConfig,
  options: RouteOptions = {},
): GateResult {
  const tone = options.tone ?? 'neutral'
  const injectionFlagged = options.injectionFlagged ?? false

  if (!categoryReachesModel(domainConfig, classification.category)) {
    return {
      allowed: false,
      category: classification.category,
      reason: classification.category,
      response: refusalFor(classification.category, tone),
      injectionFlagged,
    }
  }

  return {
    allowed: true,
    category: classification.category,
    clarifyInScope: classification.category === 'ambiguous',
    suppressHumour: classification.sensitive,
    suppressProductOffers: classification.sensitive,
    profanity: classification.profanity,
    injectionFlagged,
  }
}

// ---------------------------------------------------------------------------
// Running the gate
// ---------------------------------------------------------------------------

export type GateDeps = {
  /** Injected so routing can be tested against fixed classifier output. */
  readonly classify: (input: string) => Promise<Classification>
  readonly domainConfig: DomainConfig
  /** §43 — turns every request away without reaching the classifier or the model. */
  readonly killSwitch: boolean
  readonly tone?: ToneBucket
  readonly timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 4_000

function blocked(
  category: DomainCategoryId,
  reason: RefusalReason,
  tone: ToneBucket,
  injectionFlagged = false,
): GateBlocked {
  return {
    allowed: false,
    category,
    reason,
    response: refusalFor(reason, tone),
    injectionFlagged,
  }
}

type ClassifyOutcome =
  | { readonly ok: true; readonly classification: Classification }
  | { readonly ok: false; readonly failure: ClassifierFailure }

const TIMED_OUT = Symbol('timed out')

async function classifyWithin(input: string, deps: GateDeps): Promise<ClassifyOutcome> {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS
  let timer: ReturnType<typeof setTimeout> | undefined

  // A symbol rather than null: a classifier that resolves null is a different fault from one
  // that never resolves, and the two were arriving here as the same value.
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs)
  })

  try {
    const raw = await Promise.race([deps.classify(input), timeout])

    if (raw === TIMED_OUT) {
      return { ok: false, failure: { kind: 'timeout', detail: `no answer within ${timeoutMs}ms` } }
    }

    const parsed = classificationSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        failure: { kind: 'unparseable', detail: parsed.error.issues[0]?.message ?? 'invalid shape' },
      }
    }

    return { ok: true, classification: parsed.data }
  } catch (error) {
    // Fails closed exactly as before. The difference is that it now says what happened.
    return {
      ok: false,
      failure: {
        kind: 'error',
        detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
    }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/**
 * The single entry point. Everything the Edge Function needs to decide whether this turn
 * reaches the model, and what to say if it does not.
 */
export async function runGate(input: string, deps: GateDeps): Promise<GateResult> {
  const tone = deps.tone ?? 'neutral'

  if (deps.killSwitch) {
    return blocked('unsupported', 'demo_paused', tone)
  }

  const preCheck = deterministicPreCheck(input)
  if (preCheck) {
    return blocked('unsupported', preCheck.reason, tone)
  }

  const injectionFlagged = looksLikeInjection(input)

  const outcome = await classifyWithin(input, deps)

  // Timeout, error or unparseable output all fail closed with a short retry message.
  if (!outcome.ok) {
    return {
      ...blocked('unsupported', 'classifier_unavailable', tone, injectionFlagged),
      classifierFailure: outcome.failure,
    }
  }

  const classification = outcome.classification

  // A confident deterministic match wins over the classifier. The classifier still ran, so
  // the admin view records what it thought, but a regex-certain injection never reaches the
  // model on the strength of a classifier saying otherwise (§24).
  if (injectionFlagged) {
    return blocked('prompt_injection', 'prompt_injection', tone, true)
  }

  return routeClassification(classification, deps.domainConfig, { tone, injectionFlagged })
}
