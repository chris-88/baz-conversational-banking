import { z } from 'zod'
import { CASE_KINDS } from '../domain/case.ts'

/** The windows the console can look at. */
export const PERIODS = ['7d', '30d', '90d', 'all'] as const
export type Period = (typeof PERIODS)[number]

/** How many days each window covers. `all` has no start, so it has nothing to compare against. */
export const PERIOD_DAYS: Readonly<Record<Period, number | null>> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
}
import { PRESET_NAMES, SLIDER_NAMES } from '../llm/persona.ts'

/**
 * `admin` — the presenter console (§37 to §44).
 *
 * Every action here can break a live demonstration, and the site is on a public URL, so the
 * server checks the caller is a known admin on every single call. Client-side routing is a
 * convenience, never the control.
 */

const sliders = z.object(
  Object.fromEntries(SLIDER_NAMES.map((name) => [name, z.number().min(0).max(1)])) as Record<
    (typeof SLIDER_NAMES)[number],
    z.ZodNumber
  >,
)

export const adminRequestSchema = z.discriminatedUnion('action', [
  /**
   * `caseId` is the conversation the presenter is driving. Omitted, the console focuses the
   * most recently active one, which is almost always the one on screen.
   */
    /**
   * §5, §9 — the console's headline numbers, over a window.
   *
   * `all` is the default because a prototype with a day of traffic in it should not open on an
   * empty chart. Every window is compared against the one immediately before it, which is what
   * makes a delta mean anything.
   */
  z.object({
    action: z.literal('overview'),
    period: z.enum(PERIODS).default('all'),
    /** Which case the console is pointed at, for the hand-moves and the inspector. */
    caseId: z.uuid().optional(),
  }),
  /** §43 — restores the canonical presenter case. Audience cases are untouched. */
  z.object({ action: z.literal('reset_case'), caseId: z.uuid().optional() }),
  /** §43 — the gate returns "demo paused" to everything. */
  z.object({ action: z.literal('set_kill_switch'), enabled: z.boolean() }),
  /** §38, §56 — style changes apply to the very next turn. */
  z.object({
    action: z.literal('set_persona'),
    preset: z.enum(PRESET_NAMES).optional(),
    sliders: sliders.optional(),
  }),
  /** §40 — the structured context behind the conversation. */
  z.object({ action: z.literal('inspect_case'), caseId: z.uuid() }),

  /**
   * §41 — the downstream events the bank would raise. Each one is a state-machine transition,
   * never a random timer, so an illegal move is refused rather than faked.
   */
  z.object({
    action: z.literal('simulate_event'),
    applicationId: z.uuid(),
    event: z.enum([
      'received_by_bank',
      'information_requested',
      'information_supplied',
      'assessment_approved',
      'assessment_declined',
      'completed',
    ]),
    detail: z.string().max(120).optional(),
  }),

  /**
   * §35, §42 — a separate, deliberate action. Carries nothing about the application, and the
   * link requires signing in before anything is shown.
   */
  z.object({ action: z.literal('send_notification'), caseId: z.uuid() }),

  /** §44 — clears the room's conversations. Never touches the presenter case. */
  /** §47 — delete every conversation. No exceptions; the sample customer is one click to rebuild. */
  z.object({ action: z.literal('purge_cases') }),

  /** §41 — the bank checks what was sent in, so a document needing verification can pass. */
  z.object({ action: z.literal('verify_documents'), caseId: z.uuid() }),

  /** §41 — time passes and the customer reaches what they were saving for. */
  z.object({ action: z.literal('reach_savings_target'), caseId: z.uuid() }),

  /**
   * §38 — the single most useful lever in the console: move the balance and watch the plan
   * react. Milestones, progress, projections and any waiting check-in all recompute from it,
   * so one number demonstrates the whole machine.
   */
  z.object({
    action: z.literal('set_savings_balance'),
    caseId: z.uuid(),
    amount: z.number().int().nonnegative().max(10_000_000),
  }),

  /** §38 — drive a plan directly: pause it, pick it up, finish it, or bring a check-in due. */
  z.object({
    action: z.literal('plan_move'),
    caseId: z.uuid(),
    planId: z.uuid(),
    move: z.enum(['pause', 'resume', 'complete', 'abandon', 'trigger_checkin']),
  }),

  /**
   * One-click demo moves (§41).
   *
   * Named for what the presenter wants to happen — "credit card approved" — rather than for
   * the transition underneath. The server finds the right application and applies the right
   * sequence, so nobody is hunting through a list mid-presentation.
   */
  z.object({
    action: z.literal('demo_action'),
    caseId: z.uuid(),
    move: z.enum([
      'credit_card_approved',
      'joint_account_approved',
      'mortgage_to_assessment',
      'mortgage_requests_document',
      'protection_approved',
    ]),
  }),
])

export const demoActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** False when the state machine would refuse it right now, with the reason. */
  available: z.boolean(),
  note: z.string(),
})

export const adminOverviewSchema = z.object({
  killSwitch: z.boolean(),
  /** The one-click moves, with whether each is possible from where the case currently is. */
  demoActions: z.array(demoActionSchema).default([]),
  /** The case the controls below act on. */
  focusCaseId: z.uuid().nullable().default(null),
  persona: z.object({ preset: z.string(), sliders: sliders }),
  cases: z.array(
    z.object({
      id: z.uuid(),
      kind: z.enum(CASE_KINDS),
      /** For display: the customer's name, or "Unnamed · 1a2b3c4d" when there is none. */
      label: z.string().nullable(),
      applications: z.number().int(),
      messages: z.number().int(),
      updatedAt: z.string(),
    }),
  ),
  /**
   * §38 — what has just happened, across every case, in plain words.
   *
   * The console follows a conversation live, so this is where the plan machinery becomes
   * visible as it runs rather than something a presenter has to drill in and infer.
   */
  activity: z
    .array(
      z.object({
        at: z.string(),
        actor: z.string(),
        describe: z.string(),
        signal: z.boolean(),
        caseLabel: z.string(),
      }),
    )
    .default([]),
  metrics: z.object({
    /** §53 — the headline measure. */
    questionsAvoided: z.number().int(),
    factsCaptured: z.number().int(),
    productsOffered: z.number().int(),
    applicationsStarted: z.number().int(),
    requestsBlocked: z.number().int(),
  }),
  /**
   * The same counts for the window before this one, and the window asked for.
   *
   * Null when the period is `all`: there is no earlier window, and showing a delta of zero would
   * claim nothing changed rather than that nothing was compared.
   */
  period: z.enum(PERIODS).default('all'),
  previous: z
    .object({
      questionsAvoided: z.number().int(),
      factsCaptured: z.number().int(),
      productsOffered: z.number().int(),
      applicationsStarted: z.number().int(),
      requestsBlocked: z.number().int(),
    })
    .nullable()
    .default(null),
  /** §39 — enforcement made observable. */
  blocked: z.array(z.object({ category: z.string(), at: z.string() })),
})

export const notificationSchema = z.object({
  /** Fixed copy. It says nothing about what changed (§35). */
  message: z.string(),
  url: z.string(),
})

export const adminCaseSchema = z.object({
  caseId: z.uuid(),
  facts: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
      source: z.string(),
      verified: z.boolean(),
      superseded: z.boolean(),
      sensitive: z.boolean(),
    }),
  ),
  applications: z.array(
    z.object({
      id: z.uuid(),
      product: z.string(),
      displayName: z.string(),
      state: z.string(),
      stateLabel: z.string(),
      outstanding: z.array(z.string()),
      /** Which §41 events the state machine will currently accept. */
      canSimulate: z.array(z.string()),
    }),
  ),
  events: z.array(
    z.object({
      type: z.string(),
      actor: z.string(),
      at: z.string(),
      /** Plain words for the presenter. Built server-side so one describer serves everyone. */
      describe: z.string(),
      /** True for the things worth watching happen: plans, milestones, check-ins, notices. */
      signal: z.boolean(),
    }),
  ),
  /** §27 — needs the customer parked, and what would bring each one back. */
  parked: z.array(
    z.object({
      needId: z.string(),
      name: z.string(),
      reason: z.string(),
      revisitWhen: z.string().nullable(),
      ready: z.boolean(),
    }),
  ),
  /**
   * What the needs engine makes of this case, and what the bank has committed to watching
   * for. The presenter can answer "why did Baz offer that" without reading the prompt.
   */
  needs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      state: z.string(),
      confidence: z.number(),
      evidence: z.array(z.string()),
      reason: z.string().nullable(),
    }),
  ),
  /**
   * What the Goal Engine makes of this case: every goal in the catalogue, where it stands, and
   * the evidence behind it.
   *
   * All of them, including the ones nothing points at. "Why was this never mentioned to me" is
   * as fair a question as "why was this suggested", and a console that can only answer the
   * second is a console that cannot show the engine is making decisions rather than guesses.
   */
  goals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      tier: z.string(),
      confidence: z.number(),
      evidence: z.array(z.string()),
      /** Life events that contributed, so "because you mentioned a baby" is answerable. */
      clusters: z.array(z.string()),
      reason: z.string().nullable(),
      revisitWhen: z.string().nullable(),
      /** Fact labels the goal still needs before it could be planned properly. */
      missing: z.array(z.string()),
    }),
  ),
  /** §11 — the life events the case evidences, with the caution each one carries. */
  lifeEvents: z.array(
    z.object({ id: z.string(), name: z.string(), because: z.string(), note: z.string().nullable() }),
  ),
  /** §10 — two goals laying claim to the same money. Raised, never resolved. */
  contentions: z.array(
    z.object({
      resource: z.string(),
      describe: z.string(),
      needed: z.number(),
      available: z.number(),
    }),
  ),
  /**
   * The note a person reads before picking up the phone.
   *
   * Composed on the server from the case, never written by the model: a brief somebody is about
   * to act on is the last place to put invented prose.
   */
  handoff: z.object({
    who: z.string(),
    turns: z.number().int(),
    lastSeen: z.string().nullable(),
    sections: z.array(
      z.object({
        heading: z.string(),
        lines: z.array(z.string()),
        caution: z.boolean().default(false),
      }),
    ),
    /** The same note as plain text, for pasting wherever the adviser actually works. */
    text: z.string(),
  }),
  /** §41 — the hand-moves available on this case, checked against the state machine. */
  demoActions: z.array(demoActionSchema).default([]),
  /** The conversation, oldest first, so a person can read what was actually said. */
  conversation: z.array(
    z.object({
      role: z.enum(['customer', 'baz', 'system']),
      content: z.string(),
      cards: z.array(z.string()),
    }),
  ),
  planSteps: z.array(z.string()),
  /** §38 — every plan on the case, as the engine currently computes it. */
  plans: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      status: z.string(),
      targetAmount: z.number().nullable(),
      currentAmount: z.number().nullable(),
      projectedDate: z.string().nullable(),
      monthsRemaining: z.number().int().nullable(),
      onTrack: z.boolean().nullable(),
      milestones: z.array(
        z.object({ id: z.uuid(), label: z.string(), state: z.string(), achievedAt: z.string().nullable() }),
      ),
      checkins: z.array(
        z.object({
          id: z.uuid(),
          purpose: z.string(),
          state: z.string(),
          when: z.string(),
          agenda: z.array(z.string()),
        }),
      ),
    }),
  ),
  watches: z.array(
    z.object({ describe: z.string(), met: z.boolean(), createdAt: z.string() }),
  ),
})

export type AdminRequest = z.infer<typeof adminRequestSchema>
export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type AdminCase = z.infer<typeof adminCaseSchema>
