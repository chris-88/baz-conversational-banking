// deno-lint-ignore-file no-explicit-any
import Anthropic from '@anthropic-ai/sdk'
import { serveJson } from '../_shared/http/serve.ts'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/db/database.types.ts'
import { bazTurnRequestSchema } from '../_shared/contracts/baz-turn.ts'
import { fail, statusFor } from '../_shared/contracts/common.ts'
import { toSseFrame, withdraw, type StreamEvent } from '../_shared/contracts/stream.ts'
import { awaitsCustomer } from '../_shared/contracts/cards.ts'
import type { Card } from '../_shared/contracts/cards.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { evaluateAdvisories } from '../_shared/domain/advisories.ts'
import {
  applicationName,
  evaluateFor,
  findApplication,
  recomputeApplications,
  type NameFor,
} from '../_shared/db/applications.ts'
import { confirmationsForReview, readyForReview } from '../_shared/domain/requirements.ts'
import { factCatalogue } from '../_shared/domain/facts.ts'
import { stateLabel } from '../_shared/domain/state-machine.ts'
import { DATA_NOTICE_EVENT, dataNoticeCard } from '../_shared/llm/data-notice.ts'
import {
  SIGN_IN_PROMPT_EVENT,
  signInPromptCard,
  worthSigningInFor,
} from '../_shared/llm/sign-in-prompt.ts'
import { soundsLikeReturning } from '../_shared/domain/continuity.ts'
import { arrange } from '../_shared/domain/savings/arrange.ts'
import { describeReused, formatFactValue, type ReuseEvent } from '../_shared/domain/reuse.ts'
import { describeArrangement, formatRate, situationFrom } from '../_shared/domain/savings/situation.ts'
import { savingsOptionsFrom } from '../_shared/tenants/boi/savings-options.ts'
import { suitableCurrentAccount } from '../_shared/tenants/boi/current-accounts.ts'
import { caseFactReader } from '../_shared/db/fact-reader.ts'
import {
  ACCOUNT_OPENED_CARD,
  openedAccounts,
  welcomeCardFor,
  welcomedAccounts,
} from '../_shared/db/welcome.ts'
import { asksSomething } from '../_shared/domain/conversation/turn-shape.ts'
import { isRepeatedMessage } from '../_shared/domain/conversation/repeat.ts'
import { outOfAllowance, runGate } from '../_shared/llm/gate.ts'
import { refusalFor } from '../_shared/llm/refusals.ts'
import { stageFor, type Stage } from '../_shared/domain/conversation/stages.ts'
import { CONVERSATION } from '../_shared/llm/conversation.ts'
import { syncFormApplications } from '../_shared/db/form-applications.ts'
import { statusSteps } from '../_shared/db/applications.ts'
import { recordFormAnswers } from '../_shared/db/record-form-answers.ts'
import { formForProduct } from '../_shared/tenants/boi/forms/mapping.ts'
import { formSnapshot } from '../_shared/tenants/boi/forms/snapshots.ts'
import { resolveFormState } from '../_shared/domain/forms/state.ts'
import { createClassifier, type Classifier } from '../_shared/llm/classifier.ts'
import { anthropicProvider } from '../_shared/llm/anthropic-provider.ts'
import { FIXTURE_BANKING, fixtureProvider } from '../_shared/llm/fixture-provider.ts'
import type { ModelProvider } from '../_shared/llm/model.ts'
import { fixtureScript } from './fixtures/index.ts'
import { EMPTY_USAGE, addUsage, type ModelUsage, type TurnUsage } from '../_shared/domain/cost.ts'
import { runBazTurn } from '../_shared/llm/baz.ts'
import { toneBucket } from '../_shared/llm/persona.ts'
import type { ToolName } from '../_shared/llm/tools.ts'
import { boiDomainConfig } from '../_shared/tenants/boi/domain-config.ts'
import { boiProducts, productInfo } from '../_shared/tenants/boi/products.ts'
import {
  surfaceableProducts,
  knowledgeBaseSection,
  knowledgeProduct,
} from '../_shared/tenants/boi/kb-prompt.ts'
import { rateOf } from '../_shared/tenants/boi/rates.ts'
import { loadMortgageRates, loadProductCatalogue } from '../_shared/db/catalogue.ts'
import { mortgageRatesSection, selectRates } from '../_shared/tenants/boi/mortgage-rates-select.ts'
import type {
  BerAnswer,
} from '../_shared/tenants/boi/mortgage-rates-select.ts'
import type { MortgageCustomerType } from '../_shared/tenants/boi/mortgage-rate-types.ts'
import {
  loadCase,
  mustWrite,
  recordFacts,
  saveMessage,
  touchLastSeen,
  type Db,
  writeEvent,
} from '../_shared/db/case-repository.ts'
import { buildCaseDigest } from '../_shared/db/digest.ts'
import { needContextFor, needsFor, revivableNeeds } from '../_shared/db/needs.ts'
import {
  describePlan,
  dueCheckins,
  loadPlans,
  planContextFor,
  proposePlan,
  raiseDueCheckins,
  reconcilePlans,
} from '../_shared/db/plans.ts'
import { blueprintFor } from '../_shared/domain/goals/catalogue.ts'
import { buildQuote } from '../_shared/domain/quotes/engine.ts'
import { suggestionsFor } from '../_shared/domain/quotes/suitability.ts'
import { isProduct, type Product } from '../_shared/domain/journey.ts'
import { describeProspect, wouldInvolve } from '../_shared/domain/prospect.ts'
import { worthRaising, wouldContend } from '../_shared/domain/goals/engine.ts'
import { planDraftFor } from '../_shared/domain/goals/plan.ts'
import { describeGoals, goalContextFor } from '../_shared/db/goals.ts'
import { depositGap } from '../_shared/domain/needs/catalogue.ts'
import type { PlanGoal } from '../_shared/domain/plans/types.ts'
import { participantFor, previousAssistantTurn, type LoadedCase } from '../_shared/db/loaded-case.ts'
import { env } from '../_shared/env.ts'

/**
 * `baz-turn` — gate, then model, then persist (CLAUDE.md > A Baz turn).
 *
 * The order is the point. Nothing reaches the model that the gate has not allowed, and the
 * model's output is persisted only after the tools it called have taken effect, so what the
 * next turn reads is what actually happened.
 */

/**
 * Which tools a turn is offered, from the stage it is in.
 *
 * Enforcement rather than advice, and the reason this feature is not another paragraph of
 * prompt. Telling a model "no products yet" works most of the time; withholding
 * `show_product_options` works every time. A conversation that is still finding out what
 * somebody wants cannot produce a product card, because there is no tool to produce one with.
 *
 * The form tools are further gated on there actually being a form. A tool the model can see is
 * a tool it will eventually try, and on a case with no form-backed application every call
 * would be refused by the server and spend a whole round doing it.
 */
function toolsForTurn(stage: Stage, hasForm: boolean): readonly ToolName[] {
  const allowed = CONVERSATION[stage].tools
  if (hasForm) return allowed

  return allowed.filter(
    (tool) =>
      tool !== 'record_form_answers' &&
      tool !== 'show_form_declarations' &&
      tool !== 'show_form_upload',
  )
}

/** How far back a card still counts as "on screen" rather than scrolled into history. */
const INVITE_CARD_WINDOW = 8

/**
 * How many customer turns before the discovery gate lifts regardless.
 *
 * A customer who will not answer questions must still be able to get somewhere. Four was two
 * exchanges — enough to learn that somebody is renting and has savings, and nothing about what
 * they earn, what they are buying or who else is involved.
 */
const money = (amount: number): string => `€${Math.round(amount).toLocaleString('en-IE')}`

const DISCOVERY_PATIENCE = 7

/**
 * Status is worth refreshing as things change, so this window is short — it only stops the
 * same card appearing twice in a row, which is what happens when the model reaches for it as
 * something to say.
 */
/**
 * Comfortably inside the client's 45-second silence limit, so a slow round never reads as a
 * dead connection. Small enough to survive an intermediary that drops idle streams.
 */
const HEARTBEAT_MS = 10_000

const STATUS_CARD_WINDOW = 2

/** Short, so a genuinely different set of options can still follow a turn later. */
const OPTIONS_CARD_WINDOW = 2

/**
 * Longer than the options window: a quote is read and compared rather than acted on, so it
 * stays useful further up the conversation, and a second copy of the same figures is noise.
 */
const QUOTE_CARD_WINDOW = 4

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function errorResponse(code: Parameters<typeof statusFor>[0], message: string): Response {
  return new Response(JSON.stringify(fail(code, message)), {
    status: statusFor(code),
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}


/**
 * Anything thrown before the stream opens would otherwise be answered by the runtime's own
 * handler: status 500, body "Internal Server Error", and — the part that matters — no CORS
 * headers, so the browser blocks the response and the customer sees "Load failed" with no
 * clue what failed. A turn is allowed to fail; it is not allowed to fail silently.
 */
/** A variable that may be unset, where unset is a valid configuration. `env()` throws. */
const softEnv = (name: string): string | undefined =>
  (globalThis as { Deno?: { env?: { get(key: string): string | undefined } } }).Deno?.env?.get(name)

/**
 * The model this turn runs against, and the classifier that gates it.
 *
 * `LLM_PROVIDER=fixture` replays a script instead of calling Anthropic, which is how a test
 * drives an entire conversation with no key and no bill. The script is named by `LLM_FIXTURE`
 * and the turn within it is chosen by how many times Baz has already spoken on this case, so a
 * scripted conversation advances exactly as a real one does. Nothing Anthropic-shaped is
 * constructed on that branch, so `ANTHROPIC_API_KEY` and `BAZ_MODEL` need not be set.
 *
 * Soft-read, like `PRESENTER_KEY`: unset means Anthropic, which is what production is.
 */
function modelFor(
  loaded: LoadedCase,
  onGateUsage: (used: ModelUsage) => void,
): { readonly provider: ModelProvider; readonly model: string; readonly classify: Classifier } {
  if ((softEnv('LLM_PROVIDER') ?? 'anthropic') === 'fixture') {
    const name = softEnv('LLM_FIXTURE') ?? 'opening'
    const script = fixtureScript(name)
    const ordinal = loaded.messages.filter((message) => message.role === 'baz').length
    const turn = script.turns[ordinal]

    if (turn === undefined) {
      throw new Error(
        `Fixture "${name}" has ${String(script.turns.length)} turn(s) and this is turn ${String(ordinal + 1)}.`,
      )
    }

    return {
      provider: fixtureProvider(turn),
      model: `fixture:${name}`,
      classify: () => Promise.resolve(turn.gate ?? FIXTURE_BANKING),
    }
  }

  /*
   * Bounded, because the SDK default is ten minutes.
   *
   * That is far longer than this function is allowed to live, so a stalled API call does not
   * time out — it holds the connection until the platform kills the whole invocation, and the
   * customer is left watching a stream that will never say anything. A turn that has not
   * finished in ninety seconds has failed; failing as an error beats failing as a hang.
   */
  const anthropic = new Anthropic({
    apiKey: env('ANTHROPIC_API_KEY'),
    timeout: 90_000,
    maxRetries: 1,
  })

  return {
    provider: anthropicProvider(anthropic),
    model: env('BAZ_MODEL'),
    classify: createClassifier({
      apiKey: env('ANTHROPIC_API_KEY'),
      model: env('GATE_MODEL'),
      domainConfig: boiDomainConfig,
      client: anthropic,
      onUsage: onGateUsage,
    }),
  }
}

serveJson(CORS, async (request: Request): Promise<Response> => {
  try {
    return await handleTurn(request)
  } catch (error) {
    console.error('baz-turn failed before the stream opened', error)
    return streamOf([
      {
        type: 'error',
        error: {
          code: 'upstream_unavailable',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        },
      },
    ])
  }
})

async function handleTurn(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return errorResponse('bad_request', 'Use POST.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return errorResponse('unauthorised', 'Sign in first.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('bad_request', 'Body must be JSON.')
  }

  const parsed = bazTurnRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('bad_request', parsed.error.issues.map((i) => i.message).join('; '))
  }
  const turn = parsed.data

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  // Identity comes from the caller's own JWT, never from the request body.
  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in first.')

  const sessionLookup = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', caller.data.user.id)
    .limit(50)

  /*
   * The primary, and only the primary. A partner has a participant on this case too, with the
   * same kind of mapping, and matching on the case id alone let a partner's auth user through
   * here. Their surface is `/join` and the `partner` function; they never drive this
   * conversation (Invariant 7). Found when the partner link was opened on the primary's own
   * phone, which gave one anonymous user both roles.
   */
  const session = (sessionLookup.data ?? []).find(
    (row: any) => row.participants?.case_id === turn.caseId && row.participants?.role === 'primary',
  )
  if (!session) return errorResponse('forbidden', 'This is not your case.')

  /*
   * The catalogue and the rate table Baz speaks from this turn (§51): the rows a presenter has
   * loaded and edited in the console, or the published files until there are any. Read with
   * the case, because every turn that gets past the gate needs both.
   */
  const [loaded, kb, rateTable] = await Promise.all([
    loadCase(admin, turn.caseId),
    loadProductCatalogue(admin),
    loadMortgageRates(admin),
  ])
  if (!loaded) return errorResponse('not_found', 'That case does not exist.')
  const savingsOptions = savingsOptionsFrom(kb.products)

  /*
   * What to call an application whose row carries no name: one created before names were
   * stored (`applicationName`). The catalogue is in hand on every turn, so a SuperSaver from
   * last week is still SuperSaver on a card rather than "Savings account".
   */
  const nameFor: NameFor = (product, catalogueId) =>
    (catalogueId === null ? undefined : knowledgeProduct(catalogueId, kb.products)?.name) ??
    journeyFor(product).displayName

  const tone = toneBucket(loaded.persona)

  // ---- Gate -------------------------------------------------------------
  /*
   * What this turn consumed, accumulated as it happens.
   *
   * Mutable and local to the turn: the gate and every model round add to it, and whatever it
   * holds when the reply is saved goes on the row. Measured, not modelled — the estimating is
   * all in the prices, which live in `domain/cost.ts`.
   */
  let spend: TurnUsage = EMPTY_USAGE

  const recordModel = (used: ModelUsage): void => {
    spend = addUsage(spend, { model: used, gate: EMPTY_USAGE.gate })
  }
  const recordGate = (used: ModelUsage): void => {
    spend = addUsage(spend, { model: EMPTY_USAGE.model, gate: used })
  }

  /*
   * Tool calls the server refused this turn, written as events once the stream is done.
   *
   * Collected rather than written as they happen because the stream is still open and an
   * unawaited write can be cut off with it.
   */
  const rejections: { name: string; error: string }[] = []
  const called: string[] = []

  const { provider, model, classify } = modelFor(loaded, recordGate)

  const customerMessage = turn.message ?? ''
  const isCustomerTurn = turn.trigger === 'message'

  const gate = isCustomerTurn
    ? await runGate(customerMessage, {
        classify: (message, signal) => {
          const previous = previousAssistantTurn(loaded)
          return classify({
            message,
            ...(previous === undefined ? {} : { previousAssistantTurn: previous }),
            ...(signal === undefined ? {} : { signal }),
          })
        },
        domainConfig: boiDomainConfig,
        killSwitch: loaded.killSwitch,
        tone,
      })
    : ({ allowed: true, category: 'banking', clarifyInScope: false, suppressHumour: false,
        suppressProductOffers: false, profanity: false, injectionFlagged: false } as const)

  /**
   * The notice about what is kept, owed to anybody who has typed into the box.
   *
   * This used to fire on the first fact `record_facts` accepted, on the reasoning that a fact
   * is the moment something starts being true. It is not: the message itself is stored, in
   * full, before the gate has even decided whether the model may see it. Half of the cases
   * that reached a customer never showed the notice — somebody who asked a question without
   * stating anything recordable had their words written down and was told nothing, and so did
   * everybody whose turn failed before it could record a fact.
   *
   * Tied to the write that actually happens first, so there is no conversation where the
   * notice is owed and not given. Still once per case, still decided here rather than by the
   * model: a disclosure the model could choose to skip is not a disclosure.
   */
  let pendingNotice: Card | undefined
  if (isCustomerTurn) {
    await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: session.participant_id,
      role: 'customer',
      content: customerMessage,
      gateCategory: gate.category,
    })

    /*
     * The same message again, within ten minutes, is the customer saying the last answer did
     * not land. Twice in one live case, and the transcript showed two ordinary turns. Written
     * as an event so the stall is visible in the console. Nothing else about the turn changes.
     *
     * `loaded` was read before the save above, so its last customer message is the previous
     * one, not the one just written.
     */
    const previousCustomerMessage = [...loaded.messages]
      .reverse()
      .find((message) => message.role === 'customer')
    if (
      previousCustomerMessage !== undefined &&
      isRepeatedMessage(customerMessage, previousCustomerMessage, Date.now())
    ) {
      await writeEvent(admin, {
        caseId: turn.caseId,
        type: 'customer_repeated',
        actor: 'customer',
        payload: { said: customerMessage.trim().slice(0, 120) },
      })
    }

    const alreadyShown = await admin
      .from('events')
      .select('id')
      .eq('case_id', turn.caseId)
      .eq('type', DATA_NOTICE_EVENT)
      .limit(1)
      .maybeSingle()

    if (!alreadyShown.data) {
      await writeEvent(admin, {
        caseId: turn.caseId,
        type: DATA_NOTICE_EVENT,
        actor: 'system',
        payload: {},
      })
      pendingNotice = dataNoticeCard(`${env('APP_BASE_URL')}#/privacy`)
    }
  }

  /**
   * What the tap saved them, as a card (§53).
   *
   * Starting applications writes a `context_reused` event for every requirement satisfied by a
   * fact that was already held. Until now the only trace on the customer's screen was a
   * sentence the model was told and usually paraphrased away; the count lived in the admin
   * console. This reads the rows the tap just wrote and puts them on screen before the model
   * speaks, with the live value of each fact and where it came from. The model writes none of
   * it (Invariant 2).
   *
   * Bounded by the last thing Baz said, so a tap shows what that tap reused and not the history
   * of the case. A sign-in is an action turn too, and the one row it produces, the email the
   * account supplied, is the first thing a signed-in customer is not asked for.
   */
  let pendingReuse: Card | undefined
  if (turn.trigger === 'action') {
    const lastBaz = [...loaded.messages].reverse().find((message) => message.role === 'baz')
    let query = admin
      .from('events')
      .select('payload')
      .eq('case_id', turn.caseId)
      .eq('type', 'context_reused')
      .order('created_at', { ascending: true })
    if (lastBaz !== undefined) query = query.gt('created_at', lastBaz.createdAt)

    const rows = ((await query).data ?? []) as { payload: Record<string, unknown> }[]
    const events = rows.flatMap((row): ReuseEvent[] => {
      const name = row.payload['applicationName']
      if (typeof name !== 'string') return []
      const key = row.payload['key']
      const source = row.payload['source']
      return [{
        key: typeof key === 'string' ? key : null,
        source: typeof source === 'string' ? source : null,
        applicationName: name,
      }]
    })
    const items = describeReused(events, loaded.facts)

    if (items.length > 0) {
      const started = [...new Set(events.map((event) => event.applicationName))]
      pendingReuse = {
        type: 'reuse',
        title: `${String(items.length)} ${items.length === 1 ? 'thing' : 'things'} you never had to type`,
        started,
        items: items.map((item) => ({
          key: item.key,
          label: item.label,
          value: item.value,
          source: item.source,
          provenance: item.provenance,
          usedFor: [...item.usedFor],
        })),
      }
    }
  }

  /**
   * The account is open: the news before anything else (§6 Stage 13, §41).
   *
   * Owed to every opened account that has not been welcomed, on whatever turn comes next. Which
   * ones have been is read from the transcript by application id rather than counted in the
   * loaded messages: those are the last two dozen, sized for the model, and a welcome counted
   * only there would come back each time it scrolled out of them. Asked for only when there is
   * an opened account, so every other case pays nothing for the read. Built from the case, not
   * by the model (Invariant 2).
   */
  let pendingWelcome: Card | undefined
  if (openedAccounts(loaded).length > 0) {
    const welcomed = await admin
      .from('messages')
      .select('cards')
      .eq('case_id', turn.caseId)
      .contains('cards', [{ type: ACCOUNT_OPENED_CARD }])
    pendingWelcome = welcomeCardFor(loaded, welcomedAccounts(welcomed.data ?? []))
  }

  /**
   * A tap is recorded as what it was.
   *
   * It used to be saved as a customer message, so "Started Savings account, Joint current
   * account, Mortgage. 7 things carried over from what we already knew." appeared in the
   * transcript as something the customer had typed. They had not — they had ticked two boxes.
   * The transcript is the record a person reads before phoning them, and putting words in
   * somebody's mouth there is not a cosmetic problem.
   *
   * `system` is already filtered out of the chat and out of the history Baz sees on later
   * turns, which is right: what the tap actually did is in the case, and the digest reports it
   * from there (Invariant 2).
   */
  if (turn.trigger === 'action' && customerMessage.length > 0) {
    await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: session.participant_id,
      role: 'system',
      content: customerMessage,
      gateCategory: 'banking',
    })
  }

  // A blocked turn never reaches the model (Invariant 4). The canned reply is persisted so
  // the conversation reads correctly afterwards, and the block is auditable (§52).
  if (!gate.allowed) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'request_blocked',
      actor: 'system',
      payload: {
        category: gate.category,
        reason: gate.reason,
        injectionFlagged: gate.injectionFlagged,
        /**
         * What was actually asked, capped.
         *
         * §39 wants enforcement observable, and a log of categories and timestamps does not
         * show that: "off topic at 14:06" proves nothing, "count to 10,000 — off topic" proves
         * the thing. The request never reaches the model either way (Invariant 4); this is the
         * record of what was turned away, which is the opposite of answering it.
         */
        request: customerMessage.slice(0, 200),
        /**
         * Present only when the classifier is why this was blocked.
         *
         * A gate that fails closed looks identical from the outside whatever went wrong behind
         * it, which is correct for the customer and useless for whoever has to fix it. This is
         * the one place the difference is recorded.
         */
        ...(gate.classifierFailure ? { classifierFailure: gate.classifierFailure } : {}),
      },
    })

    if (gate.classifierFailure) {
      // Also to the function log, because a gate that is down is an incident, not a data point
      // waiting to be queried.
      console.error(
        `gate classifier ${gate.classifierFailure.kind}: ${gate.classifierFailure.detail}`,
      )
    }
    /*
     * A blocked turn still owes the notice.
     *
     * The request never reaches the model, but it is stored in full — it has to be, because
     * §39 wants the block auditable and the payload carries the first 200 characters of what
     * was asked. Somebody who only ever asks out-of-scope questions is recorded exactly like
     * anybody else, and used to be the one person guaranteed never to be told.
     */
    const messageId = await saveMessage(admin, {
      caseId: turn.caseId,
      participantId: null,
      role: 'baz',
      content: gate.response,
      usage: spend,
      ...(pendingNotice === undefined ? {} : { cards: [pendingNotice] }),
    })

    return streamOf([
      { type: 'text_delta', text: gate.response },
      ...(pendingNotice === undefined
        ? []
        : [{ type: 'card', card: pendingNotice } as const]),
      { type: 'done', messageId, gateCategory: gate.category },
    ])
  }

  // ---- Generate ---------------------------------------------------------
  const primary = participantFor(loaded, 'primary')
  // Catch the plan up with what has actually happened before anything is said about it.
  const achievedMilestones = await reconcilePlans(admin, turn.caseId, loaded)
  for (const { milestone } of achievedMilestones) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'plan_milestone_reached',
      actor: 'system',
      payload: { label: milestone.label },
    })
  }

  /**
   * A check-in waiting on an event becomes due when the event has actually happened. The
   * milestones just reconciled above are what makes that evaluable here rather than on a
   * schedule nothing is watching.
   */
  const firedEvents = [
    ...loaded.eventsSinceLastSeen.map((event) => event.type),
    /*
     * Only money actually arriving. This used to fire on any achieved milestone, so defining a
     * deposit target raised the check-in meant for reaching one — a customer €3,500 short had a
     * "mortgage readiness review" come due the moment their plan was created.
     */
    ...(achievedMilestones.some((entry) => entry.reachedTarget) ? ['savings_target_reached'] : []),
  ]

  const raised = await raiseDueCheckins(admin, turn.caseId, loaded, firedEvents)
  for (const { checkin } of raised) {
    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'checkin_due',
      actor: 'system',
      payload: { purpose: checkin.purpose },
    })
  }

  const loadedPlans = await loadPlans(admin, turn.caseId, loaded)
  const keptPlans = loadedPlans
    .filter((entry) => entry.plan.status === 'active')
    .map((entry) => ({ title: entry.plan.title, lines: [...describePlan(entry)] }))

  const revivable = await revivableNeeds(admin, turn.caseId, loaded)
  const revived = revivable
    .map((item) => {
      const need = loaded.needs.find((candidate) => candidate.id === item.needId)
      return need === undefined ? null : { name: need.name, reason: item.reason }
    })
    .filter((item): item is { name: string; reason: string } => item !== null)

  // Whichever check-in is due now, with the agenda written when it was agreed.
  const dueNow = dueCheckins(loadedPlans, loaded, firedEvents)[0] ?? null

  /**
   * Where the customer is trying to get to, which is not the same as what they are applying for.
   *
   * Built after the plans load, because a goal that already has a plan is settled rather than a
   * candidate to raise again.
   */
  const goalContext = goalContextFor(loaded, loadedPlans, {
    sensitiveDisclosure: gate.suppressHumour,
  })
  const goals = describeGoals(goalContext, loaded.goals)

  /*
   * §9 — "top discovered goals" needs an event, and discovery is not a moment anything else
   * records. A goal reaching a tier worth raising is the closest thing to one: it is when Baz
   * first has grounds to bring it up, which is what the panel is actually asking about.
   *
   * Written once per goal per case. Tiering is recomputed every turn from the facts, so a goal
   * that stays established would otherwise write an event on every message and the chart would
   * measure how talkative somebody was.
   */
  const identifiedBefore = await admin
    .from('events')
    .select('payload')
    .eq('case_id', turn.caseId)
    .eq('type', 'goal_identified')

  /*
   * A failed read means writing nothing, not writing everything. Defaulting to an empty set
   * would make every turn look like the first one and double-count every goal on the chart,
   * which is a worse outcome than a gap — a missing event is visibly missing.
   */
  const alreadyIdentified =
    identifiedBefore.error === null
      ? new Set(
          (identifiedBefore.data as { payload: { goal?: string } }[])
            .map((row) => row.payload.goal)
            .filter((goal): goal is string => goal !== undefined),
        )
      : null

  for (const candidate of alreadyIdentified === null ? [] : goals.candidates) {
    if (candidate.tier === 'latent' || candidate.tier === 'deferred') continue
    if (alreadyIdentified?.has(candidate.goal.id) === true) continue

    await writeEvent(admin, {
      caseId: turn.caseId,
      type: 'goal_identified',
      actor: 'system',
      payload: {
        goal: candidate.goal.id,
        tier: candidate.tier,
        confidence: Number(candidate.confidence.toFixed(2)),
        // What actually raised it, so "why is this on the chart" has an answer.
        because: candidate.evidence[0]?.describe ?? null,
      },
    })
  }

  /**
   * Whether what they are looking at is what suits them.
   *
   * Evaluated against whatever borrowing is actually in play — an application they have started,
   * or the product they have been quoted. Silent until they have said both what they want and
   * how soon they mean to repay it, because guessing a recommendation from an amount alone is
   * how cross-selling works.
   */
  const borrowing = loaded.applications.find((application) =>
    ['personal_loan', 'credit_card'].includes(application.product),
  )?.product

  /**
   * An application if there is one, otherwise whatever they have described wanting.
   *
   * Looking only at started applications meant the rules never ran during the conversation that
   * decides which product to start — which is the one conversation they are for. Somebody who
   * has said an amount and a date is considering borrowing whether or not anything exists yet,
   * and a loan is what people ask for by default.
   */
  const considering: Product | null =
    (borrowing as Product | undefined) ??
    (goalContext !== null && goalContext.facts.has('borrowing.requestedAmount', 'household')
      ? 'personal_loan'
      : null)

  /**
   * Which current account, decided from facts rather than by the model (§51, Invariant 3).
   *
   * Five accounts in the pack, one with a fee, and the model offered that one to everybody.
   * Worked out once a turn from the facts held and the catalogue the turn holds, and put in the
   * digest only while the everyday banking need is live or an account is already being opened:
   * a line about current accounts in a mortgage conversation is noise charged every round. The
   * `show_product_options` handler holds the card to the same pick.
   */
  const currentAccountPick =
    goalContext === null
      ? null
      : suitableCurrentAccount(goalContext.facts, new Date(), kb.products)
  const everydayBankingLive =
    loaded.applications.some((application) => application.product === 'current_account') ||
    needsFor(loaded, { sensitiveDisclosure: gate.suppressHumour }).some(
      (candidate) =>
        candidate.need.id === 'everyday_banking' &&
        (candidate.state === 'ready_to_surface' || candidate.state === 'clarify'),
    )
  const currentAccountLines =
    currentAccountPick === null || !everydayBankingLive
      ? []
      : [
          `Current account: offer the ${currentAccountPick.name} (${currentAccountPick.catalogueId}) ` +
            `and no other current account. ${currentAccountPick.because}` +
            (currentAccountPick.insteadOf.length === 0
              ? ''
              : ` Do not offer ${currentAccountPick.insteadOf.join(', ')}.`),
        ]

  const suitability = [
    ...(considering === null || goalContext === null
      ? []
      : suggestionsFor(considering, {
          facts: goalContext.facts,
          variants: {
            personal_loan: boiProducts.personal_loan.variants,
            credit_card: boiProducts.credit_card.variants,
            savings: boiProducts.savings.variants,
          },
        }).map((suggestion) => `${productInfo(suggestion.to).name}: ${suggestion.because}`)),
    ...currentAccountLines,
  ]

  /*
   * What applying for the quoted product would involve.
   *
   * Only for something they have been shown figures for and have not applied for — once an
   * application exists the digest already describes it properly, and two accounts of the same
   * product would let the model pick the wrong one. Computed from the real journey so that
   * "what would I need?" has an answer that is not improvised (§51, Invariant 3).
   */
  /*
   * Quoted or offered, whichever happened last.
   *
   * Only quoting was too narrow: a customer shown the product options card and asked "what
   * documents do I need?" got "I don't have a fixed document list", because the list is only
   * assembled for something they have been given figures for. Both events mean the same thing
   * here — this product is the one on the table.
   */
  const quoted = await admin
    .from('events')
    .select('payload')
    .eq('case_id', turn.caseId)
    .in('type', ['product_quoted', 'product_offered'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const quotedProduct = (quoted.data?.payload as { product?: string } | undefined)?.product
  const primaryParticipant = participantFor(loaded, 'primary')

  const prospect =
    quotedProduct === undefined ||
    primaryParticipant === null ||
    !isProduct(quotedProduct) ||
    loaded.applications.some((application) => application.product === quotedProduct)
      ? []
      : describeProspect(
          wouldInvolve(quotedProduct, {
            facts: loaded.facts,
            primary: primaryParticipant,
            partner: participantFor(loaded, 'partner'),
          }),
          productInfo(quotedProduct).name,
        )

  /*
   * Where this conversation has got to, worked out from the case.
   *
   * Read every turn and never stored, so a customer who corrects something moves the
   * conversation back by itself rather than carrying on from a position the case no longer
   * supports. What it governs is in `conversation.ts`: what to do in this stage, what belongs
   * to a later one, and which tools the turn is offered at all.
   */
  const approachFact = loaded.facts.find(
    (fact) => fact.key === 'goals.approach' && fact.supersededBy === null,
  )
  const approach =
    approachFact?.value === 'plan' || approachFact?.value === 'product'
      ? approachFact.value
      : null

  /*
   * How their money should be arranged, from the facts held (§40).
   *
   * Computed every turn and never stored, like the stage: a corrected balance or a changed
   * target date changes the arrangement by itself. Null means there is nothing to arrange,
   * either because the figures are not held yet or because only one account fits, and one
   * account is a recommendation rather than an arrangement.
   *
   * Whether it has been shown is read off the persisted cards, which is what lets the stage
   * show it exactly once and then move on.
   */
  const factReader = caseFactReader(loaded)
  const arrangement =
    factReader === null
      ? null
      : arrange(situationFrom(factReader, new Date().toISOString().slice(0, 10)), savingsOptions)
  const arrangementShown = loaded.messages.some((message) => message.cards.includes('arrangement'))

  const stage = stageFor({
    customerTurns: loaded.messages.filter((message) => message.role === 'customer').length,
    goalGaps:
      goals.candidates.find((candidate) => candidate.tier === 'primary')?.missing.length ?? 99,
    approach,
    planAccepted: keptPlans.length > 0,
    // Not until it has nothing left to ask. An arrangement with an open question is not shown.
    arrangement: arrangement !== null && arrangement.needs.length === 0,
    arrangementShown,
    applications: loaded.applications.length,
  })

  const digest = buildCaseDigest(loaded, {
    sensitiveDisclosure: gate.suppressHumour,
    stage,
    acting: turn.trigger === 'action',
    plans: keptPlans,
    ...(goals.lines.length === 0 ? {} : { goals: [...goals.lines] }),
    ...(suitability.length === 0 ? {} : { suitability }),
    ...(prospect.length === 0 ? {} : { prospect: [...prospect] }),
    ...(arrangement === null || arrangement.needs.length > 0
      ? {}
      : { arrangement: describeArrangement(arrangement) }),
    ...(arrangement === null || arrangement.needs.length === 0
      ? {}
      : { arrangementNeeds: arrangement.needs.map((need) => need.why) }),
    ...(revived.length === 0 ? {} : { revived }),
    ...(dueNow === null
      ? {}
      : {
          checkin: {
            purpose: dueNow.checkin.purpose,
            plan: dueNow.plan.title,
            agenda: [...dueNow.checkin.agenda],
          },
        }),
  })
  const needContext = needContextFor(loaded, { sensitiveDisclosure: gate.suppressHumour })

  /**
   * Record what the bank has committed to watching for.
   *
   * Only once the customer has actually opened the savings account: telling someone you will
   * watch for something is a promise, and a promise attaches to the thing they chose to do,
   * not to Baz having mentioned a plan (Invariant 1).
   */
  const planWatch = digest.plan?.watchDetail ?? null
  if (planWatch !== null && loaded.applications.some((a) => a.product === 'savings')) {
    const open = await admin
      .from('plan_watches')
      .select('id')
      .eq('case_id', turn.caseId)
      .is('met_at', null)
      .limit(1)

    if (((open.data ?? []) as unknown[]).length === 0) {
      mustWrite(
        await admin.from('plan_watches').insert({
          case_id: turn.caseId,
          kind: planWatch.kind,
          target: planWatch.kind === 'savings_target' ? planWatch.target : null,
          on_date: planWatch.kind === 'date' ? planWatch.on : null,
          describe: planWatch.describe,
        }),
        'the plan watch',
      )
    }
  }

  /*
   * Whether the offer to sign in is about to appear under this reply.
   *
   * Decided before the model speaks, not after, because it changes what the reply should say.
   * Baz was starting three applications and asking for a name and date of birth in the same
   * breath, with the sign-in card arriving underneath — asking somebody to type what signing
   * in is about to supply, in the wrong order.
   */
  const offeringSignIn =
    !(await caseHasEvent(admin, turn.caseId, SIGN_IN_PROMPT_EVENT)) && worthSigningInFor(loaded)

  /**
   * What the reply has to do when the offer is about to appear beneath it.
   *
   * Applied to every kind of turn, not only a tap. The first version only reached `action`
   * turns, so when the offer landed on an ordinary message the card appeared under "what's
   * your home address, and how long have you lived there?" — a question with nothing to do
   * with it, from a Baz that did not know it was coming.
   */
  const SIGN_IN_INSTRUCTION =
    ' An offer to sign in is on screen directly under your reply, and your reply is what has ' +
    'to lead into it. Put it to them in your own words: there is now something here worth ' +
    'keeping, and signing in means they can stop and pick it up later or on another device. ' +
    'Ask whether they would like to, and end there. Do not ask for their name, date of ' +
    'birth, address or anything else personal in this turn: the offer is the whole point of ' +
    'the turn and a question beside it splits their attention. Do not promise that signing in ' +
    'fills anything in for them, because it does not. It keeps what they have and lets them ' +
    'come back to it. Do not describe the card or name the button.'

  const history = loaded.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role === 'customer' ? 'user' as const : 'assistant' as const, content: message.content }))

  if (isCustomerTurn) {
    history.push({
      role: 'user',
      content: offeringSignIn
        ? `${customerMessage}\n\n(${SIGN_IN_INSTRUCTION.trim()})`
        : customerMessage,
    })
  }

  if (turn.trigger === 'action') {
    // Told as an event, not quoted as speech, so Baz does not answer a question nobody asked.
    history.push({
      role: 'user',
      content:
        `(The customer did this in the app: ${customerMessage} They did not type anything, so ` +
        'do not reply as though they had and do not thank them for a message. ' +
        `${turn.note ?? 'Say what it means for them and what you need next.'} Keep it brief.` +
        (offeringSignIn ? SIGN_IN_INSTRUCTION : '') +
        ')',
    })
  }

  if (turn.trigger === 'return') {
    // §36 — the customer did not ask anything; they came back. Lead with what changed.
    history.push({
      role: 'user',
      content:
        '(The customer has just come back after being away. Open by naming each thing under ' +
        '"Changed since they were last here" — say what actually happened, in your own words, ' +
        'not that something "moved on". Then call show_status and ask what they want to deal ' +
        'with first. This is the one turn where a short list is right.)',
    })
  }

  if (history.length === 0) {
    history.push({ role: 'user', content: '(The customer has just arrived. Open the conversation.)' })
  }

  const spoken: string[] = []
  const shown: unknown[] = []

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()

      /**
       * A turn that is thinking has to say so, even with nothing to say yet.
       *
       * The client gives up on a stream that sends nothing for 45 seconds, on the assumption
       * that a working turn produces text the whole way through. That is not true of a turn
       * that calls a tool first: the model spends its entire first round writing a
       * `record_facts` call and a card request, emits no text at all, and the first byte the
       * browser sees is the opening word of the second round. On a dense opening message that
       * gap was measured at over a minute, and the customer got "that took too long" for a
       * turn the server was still doing properly.
       *
       * An SSE comment costs two bytes a tick and keeps the connection honestly alive. The
       * client skips any line that is not a `data:` line, so this needs nothing of it.
       */
      let beating = true
      const heartbeat = setInterval(() => {
        if (!beating) return
        try {
          controller.enqueue(encoder.encode(': \n\n'))
        } catch {
          // The customer closed the tab mid-turn. Nothing to keep alive.
          beating = false
        }
      }, HEARTBEAT_MS)

      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(toSseFrame(event)))

      try {
        const events = runBazTurn({
          provider,
          model,
          /*
           * The form tool is offered only when there is a form to answer.
           *
           * A tool the model can see is a tool it will eventually try, and on a case with no
           * form-backed application every call would be refused by the server and spend a
           * round doing it. The digest and the tool list agree with each other this way.
           */
          enabledTools: toolsForTurn(stage, digest.forms !== undefined),
          onToolRejected: (rejection) => rejections.push(rejection),
          onToolCalled: (name) => called.push(name),
          onUsage: recordModel,
          prompt: {
            domainConfig: boiDomainConfig,
            productCatalogue: knowledgeBaseSection(kb.products),
            rateGuidance: mortgageRatesSection(rateTable),
            sliders: loaded.persona,
            digest,
            sensitive: gate.suppressHumour,
            clarifyInScope: gate.clarifyInScope,
          },
          history,
          executeTool: async (name, input) => {
            switch (name) {
              /*
               * The form's own questions, answered in conversation.
               *
               * Written straight through like facts are, and checked just as hard: the server
               * decides whether a field applies and whether a value is one the form offers.
               * The form application is resynced immediately so the next thing the model is
               * told about this form reflects the answer it just recorded.
               */
              case 'record_form_answers': {
                const { applicationId, answers } = input as {
                  applicationId: string
                  answers: { fieldId: string; value: string | number | boolean }[]
                }

                const outcome = await recordFormAnswers(admin, {
                  caseId: turn.caseId,
                  applicationId,
                  participantId: primary,
                  answers,
                })

                if (outcome.rejected.length > 0) {
                  rejections.push({
                    name: 'record_form_answers',
                    error: outcome.rejected
                      .map((item) => `${item.fieldId}: ${item.reason}`)
                      .join('; ')
                      .slice(0, 300),
                  })
                }

                if (outcome.accepted.length > 0) {
                  await syncFormApplications(admin, turn.caseId)
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'form_answered',
                    actor: 'customer',
                    applicationId,
                    payload: { fields: outcome.accepted.length },
                  })
                }

                return {
                  result:
                    outcome.accepted.length === 0
                      ? `Nothing recorded. ${outcome.rejected.map((item) => item.reason).join('; ')}`
                      : `Recorded ${String(outcome.accepted.length)} answer${outcome.accepted.length === 1 ? '' : 's'}.`,
                }
              }

              case 'record_facts': {
                const { facts } = input as { facts: { key: any; subject?: any; value: unknown }[] }
                const outcome = await recordFacts(admin, {
                  caseId: turn.caseId,
                  facts,
                  participants: { primary, partner: participantFor(loaded, 'partner') },
                  source: 'customer_stated',
                })

                for (const key of outcome.accepted) {
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'context_captured',
                    actor: 'model',
                    payload: { key },
                  })
                }

                const rejected = outcome.rejected
                  .map((item) => `${item.key}: ${item.reason}`)
                  .join('; ')

                /*
                 * A fact offered and refused, recorded as such.
                 *
                 * `recordFacts` returns its refusals rather than throwing, so nothing upstream
                 * ever saw them: a turn where every single fact bounced looked, from the
                 * outside, exactly like a turn where the model never tried. Which is what sent
                 * the first investigation of this after the wrong cause.
                 */
                if (outcome.rejected.length > 0) {
                  rejections.push({
                    name: 'record_facts',
                    error: rejected.slice(0, 300),
                  })
                }

                // A fact can complete an application. What is outstanding is recomputed here,
                // not remembered by the model (Invariant 3).
                let progressed = ''
                if (outcome.accepted.length > 0) {
                  const reloaded = await loadCase(admin, turn.caseId)
                  if (reloaded) {
                    const summaries = await recomputeApplications(admin, reloaded, {
    nameFor: (product, catalogueId) =>
      (catalogueId === null ? undefined : knowledgeProduct(catalogueId, kb.products)?.name) ??
      journeyFor(product).displayName,
  })
                    const ready = summaries.filter((a) => a.state === 'ready')
                    if (ready.length > 0) {
                      progressed = ` Ready to review: ${ready.map((a) => a.displayName).join(', ')}.`
                    }
                  }
                }

                return {
                  result:
                    `Recorded ${outcome.accepted.length}.` +
                    (rejected ? ` Not recorded — ${rejected}` : '') +
                    progressed,
                }
              }

              case 'show_product_options': {
                const { products } = input as {
                  products: { product: any; reason: string; catalogueId?: string }[]
                }

                /**
                 * §5, §6 — is there enough understanding of this person to be offering anything?
                 *
                 * Two different questions were being conflated. "Is a need established" is
                 * answered the moment somebody says the word mortgage, and the gate passed on
                 * that — so a customer who had said they wanted a broad conversation about their
                 * whole position, and had given one round of answers, was handed a mortgage card
                 * in the same turn Baz was still asking them what price range they had in mind.
                 *
                 * Being sure what somebody needs is not the same as understanding their
                 * position, and a person doing this job would keep asking. The Goal Engine
                 * already works out what a goal needs to know before it can be acted on, so the
                 * gate is whether the case can answer most of it.
                 */
                const candidates = needsFor(loaded, {
                  sensitiveDisclosure: gate.suppressHumour,
                })
                const established = candidates.some(
                  (candidate) =>
                    candidate.state === 'ready_to_surface' || candidate.state === 'clarify',
                )
                const customerTurns = loaded.messages.filter((m) => m.role === 'customer').length

                // Whichever goal the offer is in service of: the one they named, or failing that
                // the best-evidenced one worth raising.
                const leading = worthRaising(goals.candidates, 1)[0] ?? null
                const needed = leading?.goal.informationNeeded.length ?? 0
                const unknown = leading?.missing.length ?? 0
                const understood = needed === 0 || unknown <= Math.floor(needed / 2)

                /**
                 * The escape hatch, raised from four turns.
                 *
                 * Somebody who will not answer questions still has to be able to get somewhere,
                 * and past a certain point continuing to ask is its own failure. But four turns
                 * is two exchanges, which is nowhere near enough to have understood anybody.
                 */
                /**
                 * Did they ask for this, in so many words?
                 *
                 * The gate below decides whether Baz understands somebody well enough to raise
                 * something. It has nothing to say about a product they have just named: "can I
                 * open a current account with you please" answered with "before I set that up,
                 * what sort of price are you looking at" is not discovery, it is not listening.
                 *
                 * Matched against the message in front of us rather than the recorded objective,
                 * because the objective is what they came for and this is what they just said.
                 */
                const asked = ((): boolean => {
                  const said = customerMessage.toLowerCase()
                  if (said === '') return false

                  return products.some((option) => {
                    const product = option.product as Product
                    const name = productInfo(product).name.toLowerCase()
                    return said.includes(name) || said.includes(product.replaceAll('_', ' '))
                  })
                })()

                /**
                 * Or did the needs engine establish it? A need that is ready to surface has
                 * crossed its threshold on explicit or corroborated evidence, and "understand
                 * their position" is the wrong bar for a product with nothing to assess: a
                 * graduate who said "I need a bank account" and gave the facts the account pick
                 * turns on was refused the card for six turns while being asked about a house.
                 */
                const wanted = products.some((option) =>
                  candidates.some(
                    (candidate) =>
                      candidate.state === 'ready_to_surface' &&
                      candidate.need.products.includes(option.product as Product),
                  ),
                )

                if (!asked && !wanted && (!established || !understood) && customerTurns < DISCOVERY_PATIENCE) {
                  const ask =
                    leading === null || leading.missing.length === 0
                      ? 'what has changed for them, who else is involved and what they are hoping to do'
                      : leading.missing
                          .slice(0, 4)
                          .map((key) => factCatalogue[key]?.label?.toLowerCase() ?? key)
                          .join(', ')

                  return {
                    result:
                      `Too early — you do not understand their position well enough to be offering anything yet. ` +
                      `Still unknown: ${ask}. Ask about those, in their language and a couple at a time, ` +
                      'and record what they tell you. Offer once you can actually see where they stand. ' +
                      'Do not mention that you were stopped, and do not ask a question and show options in the same breath.',
                    refused: true,
                  }
                }

                /**
                 * One offer, not one per turn. The card persists in the transcript and stays
                 * tappable, so showing it again adds nothing and makes the conversation look
                 * like it is going in circles. The window is short, so genuinely new options
                 * can still be offered a turn later.
                 */
                const justOffered = loaded.messages
                  .slice(-OPTIONS_CARD_WINDOW)
                  .some((message) => message.cards.includes('product_options'))

                if (justOffered) {
                  return {
                    result:
                      'Those options are already on screen from the previous turn and still work. Answer what they asked and point at the card; do not show it again.',
                  }
                }

                const declined = new Set(
                  loaded.productInterests.filter((i) => i.status === 'declined').map((i) => i.product),
                )

                /*
                 * The current account is decided from facts, not by the model (§51, Invariant 3).
                 *
                 * Whatever account the model named, the card shows the one the rules pick, and
                 * the model is told so it says the right name. From the case as it is now, like
                 * `show_arrangement`: a graduation year recorded earlier in this same turn is not
                 * in the pick the turn began with, and swapping on a stale pick would put the
                 * account with the fee on the card in the one turn that matters.
                 */
                const offersCurrentAccount = products.some(
                  (option) => option.product === 'current_account',
                )
                const fresh = offersCurrentAccount ? await loadCase(admin, turn.caseId) : null
                const freshReader = fresh === null ? null : caseFactReader(fresh)
                const pick =
                  freshReader === null
                    ? currentAccountPick
                    : suitableCurrentAccount(freshReader, new Date(), kb.products)

                const swaps: { readonly from: string | null; readonly note: string }[] = []
                const offered = products.map((option) => {
                  if (option.product !== 'current_account' || pick === null) return option
                  if (option.catalogueId === pick.catalogueId) return option

                  swaps.push({
                    from: option.catalogueId ?? null,
                    note:
                      `Swapped ${option.catalogueId ?? 'an unnamed current account'} for ` +
                      `${pick.catalogueId}: ${pick.because} The card shows the ${pick.name}; ` +
                      'name that account, not the one you asked for.',
                  })
                  return { ...option, catalogueId: pick.catalogueId }
                })

                for (const swap of swaps) {
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'product_swapped',
                    actor: 'system',
                    payload: {
                      product: 'current_account',
                      from: swap.from,
                      to: pick?.catalogueId ?? null,
                      because: pick?.because ?? null,
                    },
                  })
                }

                /*
                 * The specific product's own name, where the model named one.
                 *
                 * Two savings accounts both labelled "Savings account" are two rows a customer
                 * cannot tell apart, and they were the same row to the code as well.
                 */
                const card: Card = {
                  type: 'product_options',
                  options: offered.map((option) => {
                    const catalogue =
                      option.catalogueId === undefined
                        ? undefined
                        : knowledgeProduct(option.catalogueId, kb.products)

                    return {
                      product: option.product,
                      ...(catalogue === undefined ? {} : { catalogueId: catalogue.id }),
                      displayName: catalogue?.name ?? productInfo(option.product).name,
                      oneLine: catalogue?.customer_job ?? productInfo(option.product).oneLine,
                      reason: option.reason,
                      previouslyDeclined: declined.has(option.product),
                    }
                  }),
                }

                for (const option of offered) {
                  await writeEvent(admin, {
                    caseId: turn.caseId,
                    type: 'product_offered',
                    actor: 'model',
                    payload: {
                      product: option.product,
                      reason: option.reason,
                      ...(option.catalogueId === undefined
                        ? {}
                        : { catalogueId: option.catalogueId }),
                    },
                  })
                }

                /**
                 * Offering and asking at once reads as not listening.
                 *
                 * The card is a decision point: it asks the customer to choose. Putting a fresh
                 * question beside it gives them two things to answer and makes the offer look
                 * like something Baz was going to say regardless of their reply.
                 */
                return {
                  result:
                    'Options shown. The customer chooses in the card, so stop there — say in a ' +
                    'sentence why these and leave them to it. Do not ask another question in the ' +
                    'same turn; whatever it is will keep until they have decided.' +
                    (swaps.length === 0 ? '' : ` ${swaps.map((swap) => swap.note).join(' ')}`),
                  card,
                }
              }

              case 'show_status': {
                const justShown = loaded.messages
                  .slice(-STATUS_CARD_WINDOW)
                  .some((message) => message.cards.includes('status'))

                if (justShown) {
                  return {
                    result:
                      'The status card is already on screen from the previous turn. Say what has changed in your own words rather than showing it again.',
                  }
                }

                /*
                 * Nothing to show is a refusal, not an empty card.
                 *
                 * On case ad93c361 the model, denied the plan tool by the stage, drew this card
                 * twice on a case with no applications and narrated "Nothing in progress yet"
                 * as "your plan so far". A status card is a report on applications; with none,
                 * there is nothing for it to report and nothing for it to stand in for.
                 */
                if (loaded.applications.length === 0) {
                  return {
                    result:
                      'Nothing has been started, so there is no status to show and no card to ' +
                      'draw. Do not use this card to stand in for a plan or a summary: say in ' +
                      'words where things are, and ask for what is still needed.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'status',
                  applications: loaded.applications.map((application) => {
                    const match = digest.applications.find((a) => a.id === application.id)
                    const evaluation = evaluateFor(loaded, application)

                    // Journey order, not satisfied-then-outstanding: the customer reads this as
                    // a path through the application, and reordering it as things complete
                    // would make the same card look different for no reason. A checked
                    // document says so on its step.
                    const steps = [...statusSteps(evaluation)]

                    return {
                      id: String(application.id),
                      product: application.product,
                      displayName: applicationName(application, nameFor),
                      state: application.state,
                      stateLabel: stateLabel(application.state),
                      outstandingCount: match?.outstanding.length ?? 0,
                      waitingOn: match?.waitingOn ?? null,
                      steps,
                    }
                  }),
                }
                return {
                  result:
                    'Status card shown, rendered from the case. Say one line about where things ' +
                    'stand — what just moved, or what is next. A card on its own, with nothing ' +
                    'said, reads as the conversation having dropped.',
                  card,
                }
              }

              /*
               * The arrangement, from the engine, with nothing from the model.
               *
               * Every figure is `arrange()`'s arithmetic on the published rates; the model's
               * only part is the sentence it says beside the card. Each allocation carries the
               * journey product and the catalogue id separately, because nine savings accounts
               * share one `savings` journey and one tap has to start the right ones.
               */
              case 'show_arrangement': {
                /*
                 * From the case as it is now, not as it was when the turn began.
                 *
                 * The arrangement is worked out once at the start of the turn, and a fact the
                 * model records in the same turn is not in it. On a live case the customer
                 * said the mortgage was coming here, the model recorded it and called this in
                 * the same breath, Baz described a three-account split, and the card showed
                 * two. `record_facts` reloads for the same reason.
                 */
                const current = await loadCase(admin, turn.caseId)
                const reader = current === null ? null : caseFactReader(current)
                const arrangement =
                  reader === null
                    ? null
                    : arrange(situationFrom(reader, new Date().toISOString().slice(0, 10)), savingsOptions)

                if (arrangement !== null && arrangement.needs.length > 0) {
                  return {
                    result:
                      'Not yet. Before this can be arranged, ask: ' +
                      arrangement.needs.map((need) => need.why).join(' ') +
                      ' One question, then show it next turn.',
                    refused: true,
                  }
                }

                if (arrangement === null) {
                  return {
                    result:
                      'There is nothing to arrange yet. Either what they have saved and what ' +
                      'they can put away each month are not held, or only one account fits. ' +
                      'Ask for the figures if they are missing; otherwise offer products one ' +
                      'at a time.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'arrangement',
                  title: 'How your money would be arranged',
                  allocations: arrangement.allocations.map((allocation) => ({
                    product: 'savings',
                    catalogueId: allocation.productId,
                    name: allocation.name,
                    amount: allocation.amount,
                    cadence: allocation.cadence,
                    termMonths: allocation.termMonths,
                    rate:
                      `${formatRate(allocation.annualRate)} AER` +
                      (allocation.termMonths === null
                        ? ''
                        : ` fixed for ${String(allocation.termMonths)} months`),
                    job: allocation.job,
                    watch: [...allocation.watch],
                  })),
                  firstYearInterest: arrangement.firstYearInterest,
                  bonus:
                    arrangement.bonus === null
                      ? null
                      : {
                          amount: arrangement.bonus.amount,
                          conditions: [...arrangement.bonus.conditions],
                        },
                  notes: [...arrangement.notes],
                }

                return {
                  result:
                    'Arrangement shown, worked out by the server from the facts held. Say one ' +
                    'line about why it is shaped this way, in their terms, and stop. Do not ' +
                    'restate a figure and do not ask anything: one tap starts every account ' +
                    'on it.',
                  card,
                }
              }

              case 'show_review': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.', refused: true }

                const evaluation = evaluateFor(loaded, application)
                if (!readyForReview(evaluation)) {
                  // §48 — a review card is a promise that submission is one tap away, so it is
                  // refused while real information is still missing.
                  const remaining = evaluation.outstanding
                    .filter((item) => item.blocking)
                    .map((item) => item.requirement.label)
                  return {
                    result: `Not ready to review. Still needed: ${remaining.join(', ')}.`,
                    refused: true,
                  }
                }

                /*
                 * The row's own name. Three savings accounts reviewed one after another were
                 * three cards all headed "Savings account", and the customer confirmed each
                 * without being told which it was. A product name is kept as the catalogue
                 * spells it on the button too: "Submit SuperSaver", not "Submit supersaver";
                 * only the journey's generic name reads as a common noun.
                 */
                const name = applicationName(application, nameFor)
                const generic = name === journeyFor(application.product).displayName

                // Built from the case, not from the model's words (Invariant 2). Values are
                // printed as the reuse card prints them, money as money and a PPS number
                // masked, rather than "60000" and "true".
                const card: Card = {
                  type: 'review',
                  applicationId,
                  displayName: name,
                  summary: evaluation.satisfied
                    .flatMap((item) =>
                      item.fact === null
                        ? []
                        : [
                            {
                              label: item.requirement.label,
                              value: formatFactValue(item.fact.key, item.fact.value),
                            },
                          ],
                    )
                    .slice(0, 12),
                  confirmations: confirmationsForReview(evaluation).map((item) => ({
                    requirementId: item.requirement.id,
                    label: item.requirement.label,
                    kind:
                      item.requirement.kind === 'declaration'
                        ? ('declaration' as const)
                        : item.requirement.kind === 'confirmation'
                          ? ('confirmation' as const)
                          : ('reuse' as const),
                    knownValue:
                      item.knownFact === null
                        ? null
                        : formatFactValue(item.knownFact.key, item.knownFact.value),
                  })),
                  confirmLabel: `Submit ${generic ? name.toLowerCase() : name}`,
                }

                return {
                  result:
                    'Review shown. Nothing is submitted until the customer taps. Say in a line ' +
                    'what they are checking and that the tap is what sends it.',
                  card,
                }
              }

              case 'show_pause_prompt': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.', refused: true }

                // The advisory is deterministic; the model may only explain one that applies.
                const advisory = evaluateAdvisories(loaded.applications).find(
                  (candidate) => String(candidate.appliesTo) === applicationId,
                )
                if (!advisory) {
                  return {
                    result: 'There is no advisory for that application, so do not offer to pause it.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'pause_prompt',
                  applicationId,
                  displayName: applicationName(application, nameFor),
                  advisoryTitle: advisory.title,
                  advisoryExplanation: advisory.explanation,
                }

                return { result: 'Pause offered. The customer decides in the card.', card }
              }

              /*
               * The declarations, read out of the published definition.
               *
               * The model picks the moment; it supplies no wording and cannot. What the card
               * shows is what the document says, and the tap is the only way any of it reaches
               * the packet.
               */
              case 'show_form_declarations': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.', refused: true }

                const mapping = formForProduct(application.product)
                const snapshot = mapping ? formSnapshot(mapping.formId) : undefined
                if (!snapshot) {
                  return { result: 'That application has no bank form behind it.', refused: true }
                }

                const stored = loaded.formApplications.find(
                  (row) => row.formId === snapshot.formId,
                )
                const state = resolveFormState(snapshot.definition, stored?.answers ?? {})

                const declarations = state.outstanding
                  .filter((field) => field.type === 'checkbox')
                  .map((field) => ({ fieldId: field.id, wording: field.label }))

                if (declarations.length === 0) {
                  return {
                    result: 'There are no declarations left to make on that form.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'form_declarations',
                  applicationId,
                  formName: snapshot.version,
                  declarations,
                }

                return {
                  result: `Showed ${String(declarations.length)} declarations. The customer ticks each one.`,
                  card,
                }
              }

              /*
               * The next document the form is waiting for.
               *
               * The model names the application; the server picks the control and reads its
               * limits out of the definition. Which document a form wants, and what it will
               * accept, is the document's business.
               */
              case 'show_form_upload': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.', refused: true }

                const mapping = formForProduct(application.product)
                const snapshot = mapping ? formSnapshot(mapping.formId) : undefined
                if (!snapshot) {
                  return { result: 'That application has no bank form behind it.', refused: true }
                }

                const stored = loaded.formApplications.find(
                  (row) => row.formId === snapshot.formId,
                )
                if (!stored) {
                  return { result: 'Nothing has been collected for that form yet.', refused: true }
                }

                const state = resolveFormState(snapshot.definition, stored.answers)
                const wanted = state.outstanding.find((field) => field.type === 'fileupload')
                if (!wanted) {
                  return { result: 'That form is not waiting for any documents.', refused: true }
                }

                const maxMb = Number(wanted.platform?.['maxFileSize'] ?? 0)
                const extensions = String(wanted.platform?.['allowedExtensions'] ?? '')
                  .split(',')
                  .map((entry) => entry.trim().toLowerCase())
                  .filter((entry) => entry.length > 0)

                const card: Card = {
                  type: 'form_upload',
                  applicationId,
                  formApplicationId: stored.id,
                  fieldId: wanted.id,
                  label: wanted.label,
                  formName: snapshot.version,
                  acceptedExtensions: extensions,
                  maxFileSizeMb: Number.isFinite(maxMb) && maxMb > 0 ? maxMb : null,
                }

                return { result: 'Asked for the document. The customer attaches it.', card }
              }

              case 'show_form': {
                const { applicationId } = input as { applicationId: string }
                const application = findApplication(loaded, applicationId)
                if (!application) return { result: 'There is no such application.', refused: true }

                const evaluation = evaluateFor(loaded, application)
                const blocking = evaluation.outstanding.filter((item) => item.blocking)
                const journey = journeyFor(application.product)

                // Consent first, always. The server picks, not the model, so the health
                // questions are unreachable until consent is recorded (§7.5, Invariant 6).
                const consent = blocking.find(
                  (item) => item.requirement.kind === 'confirmation' && item.waitingOn === 'primary',
                )

                if (consent) {
                  const card: Card = {
                    type: 'consent',
                    applicationId,
                    requirementId: consent.requirement.id,
                    title: 'Before we go any further',
                    explanation:
                      'Life cover depends on health information, which I will not ask for in ' +
                      'conversation and cannot work out from anything else you have told me. ' +
                      'You answer these yourself, in a form, and only if you agree to.',
                    covers: [
                      'Whether you smoke',
                      'Your height and weight',
                      'Any medical conditions you have',
                    ],
                    confirmLabel: 'I agree to answer these',
                  }
                  return { result: 'Consent asked for. Nothing sensitive is asked until they agree.', card }
                }

                // Consent given: the health branch is active, so its facts are now outstanding.
                const sensitive = blocking.filter(
                  (item) =>
                    item.requirement.kind === 'fact' &&
                    factCatalogue[item.requirement.fact].sensitivity === 'special',
                )

                if (sensitive.length === 0) {
                  return {
                    result: 'There is no form outstanding for that application.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'health_form',
                  applicationId,
                  title: `${journey.displayName} — health questions`,
                  fields: sensitive.map((item) => {
                    const key = item.requirement.kind === 'fact' ? item.requirement.fact : ''
                    const definition = factCatalogue[key as keyof typeof factCatalogue]
                    const schema = definition.schema as { _def?: { type?: string } }
                    const type = schema._def?.type ?? ''

                    return {
                      key,
                      label: definition.label,
                      kind:
                        type === 'boolean'
                          ? ('boolean' as const)
                          : type === 'array'
                            ? ('text_list' as const)
                            : ('number' as const),
                      unit: key.endsWith('heightCm') ? 'cm' : key.endsWith('weightKg') ? 'kg' : null,
                    }
                  }),
                }

                return { result: 'Health form shown. They answer it themselves.', card }
              }

              case 'show_partner_invite': {
                const { applicationIds } = input as { applicationIds: string[] }
                const applications = applicationIds
                  .map((id) => findApplication(loaded, id))
                  .filter((application) => application !== undefined)

                if (applications.length === 0) {
                  return { result: 'There is no such application.', refused: true }
                }

                const partner = loaded.participants.find((p) => p.role === 'partner')
                if (partner) {
                  return {
                    result: `${partner.displayName ?? 'The second applicant'} has already joined. There is nothing left to invite.`,
                    refused: true,
                  }
                }

                /*
                 * Somebody to invite, and something to invite them to. Three savings accounts
                 * got an invite card because the model was asked for one, and the second
                 * applicant joined to an empty task list: a savings journey asks a partner for
                 * nothing. Whether any of these applications has a second applicant's share is
                 * the requirement engine's to say, not the model's.
                 */
                const needsPartner = applications.some((application) =>
                  evaluateFor(loaded, application).outstanding.some(
                    (item) => item.requirement.subject === 'partner',
                  ),
                )
                if (!needsPartner) {
                  return {
                    result:
                      'None of these applications needs anything from a second applicant, so ' +
                      'there is nobody to invite for them. Do not offer an invite; if the ' +
                      'customer wants a joint product, that is a product choice.',
                    refused: true,
                  }
                }

                /**
                 * One invite card, not one per turn. Asked nicely, the model re-offered it on
                 * almost every turn — four stacked in one transcript — and the customer kept
                 * tapping each new one, so the same invite was created three times. The card
                 * persists in the transcript, so the one already there is still live.
                 */
                const alreadyOnScreen = loaded.messages
                  .slice(-INVITE_CARD_WINDOW)
                  .some((message) => message.cards.includes('partner_invite'))

                if (alreadyOnScreen) {
                  return {
                    result:
                      'The invite card is already on screen from an earlier turn and still works. Point at it in your own words; do not make another.',
                  }
                }

                const card: Card = {
                  type: 'partner_invite',
                  applicationIds: applications.map((application) => String(application.id)),
                  applicationNames: applications.map((application) =>
                    applicationName(application, nameFor),
                  ),
                  // Always null by this point: a joined partner returned above, and a
                  // participant row does not exist before they join.
                  partnerName: null,
                }

                return {
                  result:
                    'Invite offered. Nothing is sent until the customer taps and shares it. Say ' +
                    'in a line who it is for and why they are needed.',
                  card,
                }
              }

              /**
               * §10 — propose, never impose.
               *
               * The model picks the goal and the words; every figure comes from the plan
               * engine. A projected date is something the customer will act on, so it is not
               * the model's to invent (§40).
               */
              case 'propose_plan': {
                const input_ = input as {
                  goal: PlanGoal
                  title: string
                  targetAmount?: number
                  targetDate?: string
                }

                const context = planContextFor(loaded)
                const gap = needContext === null ? null : depositGap(needContext)

                /**
                 * A goal does not have to be about money.
                 *
                 * This used to refuse any plan without a target, which meant "get ready for the
                 * baby" or "organise the bills" could not be planned at all — both of which are
                 * exactly what a concierge is for. A goal whose blueprint has money milestones
                 * still needs a figure; one whose milestones are facts and applications does not.
                 */
                const target = input_.targetAmount ?? gap?.target ?? null
                const blueprint = blueprintFor(input_.goal)
                const needsFigure =
                  blueprint?.milestones.some((candidate) => candidate.binding?.kind === 'numeric') ?? false

                if (target === null && needsFigure) {
                  return {
                    result:
                      'There is nothing measurable to plan towards yet. Find out what they are aiming for first.',
                    refused: true,
                  }
                }

                /*
                 * A target they have already passed is not a plan.
                 *
                 * Somebody with €60,000 against a €320,000 house was offered a plan to save
                 * €32,000 — ten per cent of the price, which is what `depositGap` assumes when
                 * nobody has said otherwise — and the card rendered "€60,000 of €32,000, 100%"
                 * on a goal two years away. The figure was not wrong so much as beside the
                 * point: they had said they wanted to save more, and nobody had asked what for.
                 */
                if (target !== null && gap !== null && target <= gap.saved) {
                  return {
                    result:
                      `They already have ${money(gap.saved)} towards this, which is more than the ` +
                      `${money(target)} in that plan — so there is nothing to save towards and the ` +
                      'card would show it finished. Ask what they are actually aiming for before ' +
                      'planning towards a figure. A bigger deposit means less borrowing and a ' +
                      'better rate, so "more than the minimum" is a real answer worth pinning down.',
                    refused: true,
                  }
                }

                /*
                 * Whether this plan can actually be watched.
                 *
                 * A savings goal is watched by looking at the balance, and the bank can only see
                 * accounts it holds — `plan_watches` is deliberately only written once a savings
                 * account exists. That has always been true and nothing ever said it, so Baz
                 * promised to come back to somebody who banked elsewhere.
                 */
                const watchesAnAmount = target !== null
                const holdsSavings = loaded.applications.some((a) => a.product === 'savings')

                const existing = await admin
                  .from('plans')
                  .select('id, goal')
                  .eq('case_id', turn.caseId)
                  .in('status', ['draft', 'active'])

                if (existing.error) throw new Error(`plans: ${existing.error.message}`)
                const open = (existing.data ?? []) as { id: string; goal: string }[]

                if (open.some((plan) => plan.goal === input_.goal)) {
                  return {
                    result:
                      'They already have a plan for this goal. Talk about that one rather than starting another.',
                    refused: true,
                  }
                }

                /**
                 * §10 — the same money cannot be promised twice.
                 *
                 * Asked before the plan is written, so the clash is not announced in the same
                 * breath as confirming the plan that caused it. The engine raises it; what the
                 * customer's savings are actually for is their call, not the bank's.
                 */
                if (goalContext !== null && wouldContend(goalContext, input_.goal, target)) {
                  return {
                    result:
                      'That would have two plans counting on the same savings. Say so plainly, ' +
                      'and ask which one the money is for before proposing anything.',
                    refused: true,
                  }
                }

                const rawDate = input_.targetDate ?? null
                const draft = planDraftFor({
                  goal: input_.goal,
                  title: input_.title,
                  targetAmount: target,
                  // A month without a day is not a date the engine can measure against.
                  targetDate: rawDate === null || rawDate.length === 7 ? null : rawDate,
                  today: context.today,
                })

                if (draft === null) {
                  return { result: 'That is not a goal I can plan for.', refused: true }
                }

                const planId = await proposePlan(admin, turn.caseId, draft)
                if (planId === null) {
                  return { result: 'That plan could not be saved just now.', refused: true }
                }

                const months =
                  target !== null && context.monthlySaving !== null && context.monthlySaving > 0
                    ? Math.ceil(
                        Math.max(0, target - (context.savingsBalance ?? 0)) / context.monthlySaving,
                      )
                    : null

                const first = draft.checkins[0] ?? null

                const card: Card = {
                  type: 'plan_proposal',
                  planId,
                  title: draft.title,
                  targetAmount: target,
                  currentAmount: context.savingsBalance,
                  projectedDate: null,
                  monthsRemaining: months,
                  milestones: draft.milestones.map((milestone) => ({
                    label: milestone.label,
                    achieved: false,
                  })),
                  checkin:
                    first === null
                      ? null
                      : {
                          purpose: first.purpose,
                          when:
                            first.triggerKind === 'event'
                              ? 'when you reach the target'
                              : (first.dueAt ?? 'later'),
                          agenda: [...first.agenda],
                        },
                  confirmLabel: 'Keep this plan',
                }

                return {
                  result:
                    'Plan proposed. It is a draft and belongs to nobody until they tap it. ' +
                    'Explain what it does for them in a sentence; do not list the milestones ' +
                    'back.' +
                    (watchesAnAmount && !holdsSavings
                      ? ' This one waits on an amount, and they have no savings account here, ' +
                        'so nothing can see the balance and nobody will be able to come back to ' +
                        'them. Say so plainly — the plan still stands, it just cannot be watched ' +
                        'unless the saving happens here. Do not oversell it.'
                      : ''),
                  card,
                }
              }

              /**
               * §51 — a question about money, answered with figures.
               *
               * Everything on the card is computed here from the catalogue. The model chose to
               * show it and supplied what the customer said; it never sees a number it could
               * restate wrongly, which is the whole reason this tool exists.
               */
              /**
               * Several catalogue products side by side (§51).
               *
               * The model picks which and says why; everything else is read from the knowledge
               * base here. An id that is not in the catalogue, or one the pack flags for
               * internal verification, is refused rather than rendered — the filtering that
               * keeps those four out of the prompt has to hold at the card too, or the one
               * place a customer actually reads is the one place it does not apply.
               */
              case 'show_mortgage_rates': {
                const ask = input as {
                  customerType: MortgageCustomerType | 'buy_to_let_new'
                  ber: BerAnswer
                  amountEur?: number
                  termYears?: number
                }

                const selection = selectRates({
                  customerType: ask.customerType,
                  ber: ask.ber,
                  ...(ask.amountEur === undefined ? {} : { amountEur: ask.amountEur }),
                  ...(ask.termYears === undefined ? {} : { termYears: ask.termYears }),
                }, rateTable)

                /*
                 * Refusing to price something is an answer, not a failure. A0 is the live case:
                 * the bank added it to the BER scale and has not published a rate for it, and
                 * rounding it down to A would cost somebody money.
                 */
                if (selection.unavailable !== null) {
                  return {
                    result:
                      `No rate can be quoted: ${selection.unavailable} Tell them that plainly, ` +
                      'and offer to carry on with everything else.',
                    refused: true,
                  }
                }

                if (selection.options.length === 0) {
                  return {
                    result:
                      'No published rate matches those details. Check the buyer type and BER ' +
                      'against what they actually told you before asking them again.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'mortgage_rates',
                  title: 'Your mortgage rate options',
                  basis: {
                    buyerType: ask.customerType.replaceAll('_', ' '),
                    ber: ask.ber,
                    amountEur: ask.amountEur ?? null,
                    termYears: ask.termYears ?? null,
                  },
                  asOf: selection.asOf,
                  options: selection.options.map((option) => ({
                    id: option.id,
                    label: option.label,
                    familyLabel: option.familyLabel,
                    ratePct: option.ratePct,
                    aprcPct: option.aprcPct,
                    cashbackEur: option.cashbackEur,
                    cashbackNote: option.cashbackNote,
                    monthlyEur: option.monthlyEur,
                    note: option.note,
                  })),
                }

                const cheapest = selection.options.reduce((low, option) =>
                  option.ratePct < low.ratePct ? option : low,
                )
                const withCashback = selection.options.find((option) => option.cashbackEur !== null)

                return {
                  result:
                    `${String(selection.options.length)} rates are on the card with their APRCs ` +
                    `and repayments, as published on ${selection.asOf}. Do not read them back. ` +
                    'Say what separates them in a sentence or two' +
                    (withCashback && withCashback.id !== cheapest.id
                      ? `, and be straight that the lowest rate (${String(cheapest.ratePct)}%) pays no cashback while ` +
                        `${withCashback.label} pays ${money(withCashback.cashbackEur ?? 0)} — which is cheaper ` +
                        'depends on how long they stay on it, and it is their call.'
                      : '.') +
                    ' A published rate is not an offer: what they can borrow still goes through a ' +
                    'full assessment.',
                  card,
                }
              }

              case 'show_comparison': {
                const ask = input as { title: string; options: { id: string; reason: string }[] }

                const found = ask.options.map((option) => ({
                  option,
                  product: surfaceableProducts(kb.products).find((candidate) => candidate.id === option.id),
                }))

                const missing = found.filter((entry) => entry.product === undefined)
                if (missing.length > 0) {
                  return {
                    result:
                      `Not in the catalogue, or not for showing: ${missing.map((entry) => entry.option.id).join(', ')}. ` +
                      'Use ids exactly as they appear in the product list, and only ones listed there.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'comparison',
                  title: ask.title,
                  options: found.map(({ option, product }) => {
                    const rate = product === undefined ? null : rateOf(product)

                    return {
                    id: option.id,
                    name: product?.name ?? option.id,
                    oneLine: product?.customer_job ?? '',
                    rate: rate?.headline ?? null,
                    rateNote: rate?.note ?? null,
                    // Four is what fits beside three others on a phone before it stops being
                    // something anybody compares and becomes something they scroll past.
                    highlights: (product?.features ?? []).slice(0, 4).map((feature) => feature),
                    reason: option.reason,
                    endsIn:
                      product === undefined ||
                      product.advice_model === 'information_or_self_serve'
                        ? null
                        : product.advice_model.replaceAll('_', ' '),
                    }
                  }),
                }

                return {
                  result:
                    `Comparing ${String(found.length)} products. They are on the card with what ` +
                    'each one is for — do not read them back. Say in a sentence what separates ' +
                    'them, and leave the choosing to them. Tapping one asks you to go through ' +
                    'it; it starts nothing.',
                  card,
                }
              }

              case 'show_quote': {
                const ask = input as {
                  product: Product
                  amount?: number
                  months?: number
                  monthly?: number
                }

                /**
                 * One quote, not one per turn.
                 *
                 * Asked to go through an option, the model reached for the tool again and put a
                 * second card under the first — the same figures, one row shorter. The card is
                 * still on screen; what the customer wanted was the explanation.
                 */
                const quoteOnScreen = loaded.messages
                  .slice(-QUOTE_CARD_WINDOW)
                  .some((message) => message.cards.includes('quote'))

                if (quoteOnScreen) {
                  return {
                    result:
                      'That quote is already on screen. Talk about it rather than showing it ' +
                      'again — and keep finding out what they need it for and how they mean to ' +
                      'repay it.',
                  }
                }

                const info = productInfo(ask.product)

                /*
                 * What they have already put aside, from the case rather than from the model.
                 *
                 * Somebody with €32,000 towards a €40,000 deposit was told it would take two
                 * years and nine months — which is how long €40,000 takes from nothing. The
                 * arithmetic was right and it answered a question nobody asked. The balance is
                 * a fact the bank holds, so it is read here and never passed in (Invariant 2).
                 */
                const facts = goalContext?.facts
                const opening =
                  ask.product === 'savings'
                    ? (facts?.number('assets.depositAmount', 'household') ??
                      facts?.number('assets.savingsBalance', 'household') ??
                      undefined)
                    : undefined

                const quote = buildQuote(info.variants ?? [], {
                  amount: ask.amount,
                  months: ask.months,
                  monthly: ask.monthly,
                  ...(opening === undefined || opening <= 0 ? {} : { opening }),
                })

                if (quote.problem !== null) {
                  return {
                    result:
                      `No options to show: ${quote.problem} Say that plainly and ask for what ` +
                      'would let you work it out.',
                    refused: true,
                  }
                }

                const card: Card = {
                  type: 'quote',
                  product: ask.product,
                  displayName: info.name,
                  basis: quote.basis,
                  options: quote.options.map((option) => ({
                    id: option.id,
                    name: option.name,
                    highlight: option.highlight,
                    headline: option.headline,
                    figures: [...option.figures],
                    footnote: option.footnote,
                  })),
                }

                /*
                 * Showing somebody what a mortgage would cost is significant (Invariant 9), and
                 * it is also the only record that this product is in play. The next turn reads
                 * it to work out what applying would involve, which it cannot do from a card
                 * payload nothing stores.
                 */
                await writeEvent(admin, {
                  caseId: turn.caseId,
                  type: 'product_quoted',
                  actor: 'model',
                  payload: { product: ask.product, basis: quote.basis },
                })

                return {
                  result:
                    `Showing ${String(quote.options.length)} options for ${info.name}, based on ` +
                    `${quote.basis}. The figures are on the card — do not repeat them. Say in a ` +
                    'sentence what the trade-off between them is, and invite them to tap one so ' +
                    'you can go through it properly. The rates are illustrative.',
                  card,
                }
              }

              case 'request_upload': {
                const { applicationId, documentType } = input as {
                  applicationId: string
                  documentType?: string
                }
                const application = findApplication(loaded, applicationId)
                if (!application) {
                  return { result: 'There is no such application.', refused: true }
                }

                // The journey decides what can be asked for, not the model (Invariant 3). The
                // named type narrows it; without one, the next outstanding document wins.
                const evaluation = evaluateFor(loaded, application)
                const documents = evaluation.outstanding.filter(
                  (item) => item.requirement.kind === 'document',
                )
                // What the bank asked for after submission comes first, whatever the model
                // named: it is the only document an application in `info_required` is waiting
                // on, and the row to upload against already exists (§41).
                const outstanding =
                  documents.find((item) => item.requestId !== undefined) ??
                  documents.find(
                    (item) =>
                      item.requirement.kind === 'document' &&
                      item.requirement.documentType === documentType,
                  ) ??
                  documents[0]

                if (!outstanding || outstanding.requirement.kind !== 'document') {
                  return {
                    result: 'This application is not waiting on any documents.',
                    refused: true,
                  }
                }

                const requirementId = outstanding.requirement.id

                const journey = journeyFor(application.product)

                // One open request per requirement, so asking twice does not pile up rows. A
                // bank request names its row outright; a journey document may have one from
                // an earlier ask.
                const existing = loaded.requests.find(
                  (request) =>
                    request.applicationId === application.id &&
                    request.requirementId === requirementId &&
                    request.status === 'open',
                )

                let requestId = outstanding.requestId ?? existing?.id ?? null
                if (requestId === null) {
                  const created = await admin
                    .from('application_requests')
                    .insert({
                      application_id: application.id,
                      requirement_id: requirementId,
                      kind: 'document',
                      status: 'open',
                      detail: outstanding.requirement.label,
                    })
                    .select('id')
                    .single()

                  if (created.error) return { result: 'That could not be requested just now.' }
                  requestId = (created.data as { id: string }).id
                }

                const card: Card = {
                  type: 'upload_request',
                  requestId,
                  applicationId: String(application.id),
                  label: outstanding.requirement.label,
                  documentType: outstanding.requirement.documentType,
                  applicationName: journey.displayName,
                }

                return {
                  result:
                    `Upload card shown for ${outstanding.requirement.label}. Nothing arrives ` +
                    'until they pick a file. Say in a line what it is for.',
                  card,
                }
              }

              default:
                return { result: 'That is not available yet.' }
            }
          },
        })

        // Before everything, the reuse card included: the account being open is the news, and
        // the model's sentence follows what the customer can already see.
        if (pendingWelcome !== undefined) {
          shown.push(pendingWelcome)
          send({ type: 'card', card: pendingWelcome })
        }

        // First, so it is what the customer sees happen; the model's sentence follows it.
        if (pendingReuse !== undefined) {
          shown.push(pendingReuse)
          send({ type: 'card', card: pendingReuse })
        }

        for await (const event of events) {
          if (event.type === 'text_delta') spoken.push(event.text)
          if (event.type === 'card') shown.push(event.card)
          // Withdrawn from the record as well as the screen: the saved reply is what the
          // customer was left reading, not what was said and then taken back.
          if (event.type === 'retract') {
            spoken.splice(0, spoken.length, withdraw(spoken.join(''), event.length))
          }
          send(event)
        }

        // Last, so it reads as a footnote to the answer rather than interrupting it.
        if (pendingNotice !== undefined) {
          shown.push(pendingNotice)
          send({ type: 'card', card: pendingNotice })
        }

        /*
         * The offer to sign in, once there is something it would protect.
         *
         * Checked after the turn rather than before, because the thing that makes it worth
         * asking — an application — is usually created by the tap that happened during it.
         * Once per case: a prompt that returns every turn is a wall by instalments.
         */
        /*
         * Any turn, not only a typed one.
         *
         * This was gated on `isCustomerTurn`, which excluded exactly the turn that matters:
         * starting applications is a tap, so it arrives as `action`. The offer could therefore
         * only appear on some later message — after Baz had already moved on to asking for a
         * name and a date of birth, which is both the wrong moment and the wrong order. The
         * point of asking here is that signing in can carry the name instead of the customer
         * typing it.
         */
        {
          const after = await loadCase(admin, turn.caseId)

          /*
           * Somebody who has just said they were here before.
           *
           * Not subject to the once-per-case gate above, and not subject to there being
           * anything worth protecting yet: they have asked for the way back, and the way back
           * is an address and a code. The gate exists to stop an *unprompted* offer returning
           * every turn; answering a question is not that.
           *
           * Phrase-matched rather than inferred, deliberately narrowly, because a card
           * appearing is not a judgement to leave to a reading of a sentence. It misses more
           * than it catches and the menu carries the same thing permanently.
           */
          const asking =
            isCustomerTurn &&
            after !== null &&
            after.authLevel !== 'authenticated' &&
            soundsLikeReturning(customerMessage)

          if (after && (asking || worthSigningInFor(after))) {
            // Only an unprompted offer is held to once per case, and only it pays for the read.
            const suppressed =
              !asking && (await caseHasEvent(admin, turn.caseId, SIGN_IN_PROMPT_EVENT))

            if (!suppressed) {
              await writeEvent(admin, {
                caseId: turn.caseId,
                type: SIGN_IN_PROMPT_EVENT,
                actor: 'system',
                payload: asking ? { reason: 'returning_cue' } : {},
              })
              const card = signInPromptCard(`${env('APP_BASE_URL')}#/privacy`)
              shown.push(card)
              send({ type: 'card', card })
            }
          }
        }

        /*
         * A reply that sends the customer to a card nobody drew.
         *
         * Baz once told somebody "tap the card to start it" without ever calling the tool, and
         * then retracted it two paragraphs later. Nothing failed, so nothing was recorded and
         * the only trace was a screenshot. This cannot be fixed after the fact — the words are
         * already sent — but it can stop being invisible.
         *
         * Deliberately narrow. Only phrases that point at something on screen right now, so an
         * ordinary mention of a card in passing does not trip it.
         *
         * Narrow is not the same as right. The first real instance of this in front of a
         * customer read "so here they are" and then, when they said they saw nothing, "sorry
         * about that, they didn't come through. Here they are." Both were a promise of
         * something on screen, neither said "card", and the detector built for this watched
         * both go past. Baz does not use the word card when it is being natural, which is
         * most of the time.
         */
        const text = spoken.join('')
        const promisedACard =
          // "above" refers to a card already on screen, which is not a promise of a new one.
          /\btap (the|that) (card|option)|\bcard below\b/i.test(text) ||
          /\bhere (they|it|those) (are|is)\b|\bhere are (the|your|those|three|some|a few)\b/i.test(
            text,
          )
        if (shown.length === 0 && promisedACard) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'card_promised_not_shown',
            actor: 'model',
            payload: { said: text.slice(0, 200) },
          })
        }

        /*
         * A card waiting for a tap, and a question competing with it.
         *
         * Baz put two savings accounts on screen and asked, underneath them, what the customer
         * paid in rent and whether they banked jointly. Three things asked at once: the reply
         * could answer the text or answer the card, and whichever it did the rest was left
         * hanging. It happened on three of the last four turns of that conversation.
         *
         * The rule is stated in the stage guides and in the tool descriptions, which is where
         * it can actually prevent anything. This is the half that notices, so a turn that
         * breaks it leaves a row rather than only a screenshot.
         */
        const waiting = shown.flatMap((card) => {
          const type =
            typeof card === 'object' && card !== null
              ? (card as { type?: unknown }).type
              : undefined
          return typeof type === 'string' && awaitsCustomer(type) ? [type] : []
        })

        if (waiting.length > 0 && asksSomething(text)) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'question_with_card',
            actor: 'model',
            payload: { cards: waiting, said: text.slice(-200) },
          })
        }

        /*
         * The same thing one turn later: a card from an earlier reply still untapped, and this
         * reply asks something new instead of pointing at it. The digest told the model the
         * card was waiting, so a question here is the rule being broken with the facts in hand.
         */
        if (digest.awaiting !== undefined && waiting.length === 0 && asksSomething(text)) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'question_while_card_awaits',
            actor: 'model',
            payload: {
              card: digest.awaiting.type,
              turnsAgo: digest.awaiting.turnsAgo,
              said: text.slice(-200),
            },
          })
        }

        const messageId = await saveMessage(admin, {
          caseId: turn.caseId,
          participantId: null,
          role: 'baz',
          content: text,
          cards: shown,
          usage: spend,
        })

        /*
         * What the server refused, so a turn that went nowhere can be explained afterwards.
         *
         * The model sees these as tool errors and can correct itself, which is the point. But
         * when it cannot — when the same call is refused three times and the turn ends with
         * nothing said — this is the only record of why.
         */
        if (called.length > 0 || rejections.length > 0) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'turn_tools',
            actor: 'model',
            payload: { called, refused: rejections.length },
          })
        }

        for (const rejection of rejections) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'tool_rejected',
            actor: 'model',
            payload: { tool: rejection.name, error: rejection.error.slice(0, 300) },
          })
        }

        /*
         * The digital form applications, brought up to date with whatever was collected.
         *
         * Caught rather than thrown: the reply has already streamed, and a turn that ends in
         * an error because a console view could not be refreshed would be a worse failure than
         * the one it is reporting. The event row is how it gets noticed.
         */
        try {
          const synced = await syncFormApplications(admin, turn.caseId)
          if (synced.forms.length > 0) {
            await writeEvent(admin, {
              caseId: turn.caseId,
              type: 'form_application_updated',
              actor: 'system',
              payload: { forms: synced.forms, answered: synced.answered, reused: synced.reused },
            })
          }
        } catch (error) {
          await writeEvent(admin, {
            caseId: turn.caseId,
            type: 'form_sync_failed',
            actor: 'system',
            payload: {
              error: (error instanceof Error ? error.message : 'unknown').slice(0, 300),
            },
          })
        }

        // Everything up to now has been seen, so the next return summarises only what is
        // genuinely new (§36).
        await touchLastSeen(admin, turn.caseId)

        send({ type: 'status', caseId: turn.caseId, invalidate: ['case', 'facts', 'applications'] })
        send({ type: 'done', messageId, gateCategory: gate.category })
      } catch (error) {
        /*
         * Whatever went wrong, the customer does not read the upstream's words.
         *
         * A turn driven by a tap skips the gate, so this is the only place a model failure is
         * handled — and it was sending `error.message` straight to the screen. When the API
         * allowance runs out that message is a JSON body containing a billing date and a
         * request id, rendered in a chat bubble to somebody who asked about a savings account.
         *
         * Out of allowance gets the same honest line the gate gives, because the advice is the
         * same: trying again will not help. Everything else keeps the generic one.
         */
        const detail = error instanceof Error ? error.message : String(error)

        send({
          type: 'error',
          error: {
            code: 'upstream_unavailable',
            message: outOfAllowance(detail)
              ? refusalFor('allowance_reached', tone)
              : 'Something went wrong on my side. Try that again?',
          },
        })
      } finally {
        beating = false
        clearInterval(heartbeat)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}

/** Whether something has already happened once on this case. */
async function caseHasEvent(admin: Db, caseId: string, type: string): Promise<boolean> {
  const found = await admin
    .from('events')
    .select('id')
    .eq('case_id', caseId)
    .eq('type', type)
    .limit(1)
    .maybeSingle()
  return Boolean(found.data)
}

function streamOf(events: readonly StreamEvent[]): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) controller.enqueue(encoder.encode(toSseFrame(event)))
        controller.close()
      },
    }),
    { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
  )
}
