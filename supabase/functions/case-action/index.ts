// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import { serveJson } from '../_shared/http/serve.ts'
import type { Database, Json } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  caseActionRequestSchema,
  type CaseActionResponse,
} from '../_shared/contracts/case-action.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { factCatalogue, isFactKey, parseFactValue } from '../_shared/domain/facts.ts'
import { transition } from '../_shared/domain/state-machine.ts'
import {
  loadCase,
  mustWrite,
  recordFacts,
  type Db,
  type Insert,
  writeEvent,
} from '../_shared/db/case-repository.ts'
import { canTransition } from '../_shared/domain/plans/engine.ts'
import { deferNeed } from '../_shared/db/needs.ts'
import { syncFormApplications } from '../_shared/db/form-applications.ts'
import { formForProduct } from '../_shared/tenants/boi/forms/mapping.ts'
import { formSnapshot } from '../_shared/tenants/boi/forms/snapshots.ts'
import { resolveFormState } from '../_shared/domain/forms/state.ts'
import type { PlanStatus } from '../_shared/domain/plans/types.ts'
import { knowledgeProduct } from '../_shared/tenants/boi/kb-prompt.ts'
import { loadProductCatalogue } from '../_shared/db/catalogue.ts'
import { env } from '../_shared/env.ts'
import {
  createApplications,
  evaluateFor,
  findApplication,
  recomputeApplications,
  recordReuse,
} from '../_shared/db/applications.ts'

/**
 * `case-action` — the customer's taps (Invariant 1, §27, §48).
 *
 * The model cannot reach any of this. Each action re-reads the case, checks the caller owns
 * it, and puts every state change through the state machine, so an illegal move is refused
 * rather than written.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const errorResponse = (code: Parameters<typeof statusFor>[0], message: string) =>
  json(fail(code, message), statusFor(code))


serveJson(CORS, async (request: Request): Promise<Response> => {
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

  const parsed = caseActionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('bad_request', parsed.error.issues.map((i) => i.message).join('; '))
  }
  const action = parsed.data

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in first.')

  // Resolve the case from the action, then check the caller actually owns it.
  const caseId =
    'caseId' in action
      ? action.caseId
      : await caseIdForApplication(admin, action.applicationId)

  if (!caseId) return errorResponse('not_found', 'That application does not exist.')

  const sessions = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', caller.data.user.id)
    .limit(50)

  const session = (sessions.data ?? []).find((row: any) => row.participants?.case_id === caseId)
  if (!session) return errorResponse('forbidden', 'This is not your case.')

  let loaded = await loadCase(admin, caseId)
  if (!loaded) return errorResponse('not_found', 'That case does not exist.')

  // The catalogue names the applications (§51): the console's rows, or the published file.
  const kb = await loadProductCatalogue(admin)

  let summary = ''
  let inviteUrl: string | undefined

  switch (action.action) {
    case 'select_products': {
      const created = await createApplications(
        admin,
        loaded,
        action.products,
        // The catalogue knows SuperSaver from the 365 31-Day Notice Account; the journey only
        // knows they are both savings. Two applications called "Savings account" tell the
        // customer nothing about which is which.
        (product, catalogueId) =>
          (catalogueId === null ? undefined : knowledgeProduct(catalogueId, kb.products)?.name) ??
          journeyFor(product).displayName,
      )
      loaded = (await loadCase(admin, caseId))!

      // §53 — count what each new application never had to ask for.
      const startedNow = new Set(
        created.map((choice) => `${choice.product}:${choice.catalogueId ?? ''}`),
      )
      let reused = 0
      for (const application of loaded.applications) {
        if (!startedNow.has(`${application.product}:${application.catalogueId ?? ''}`)) continue
        reused += await recordReuse(admin, loaded, application, evaluateFor(loaded, application))
      }

      const names = created.map(
        (choice) =>
          (choice.catalogueId === undefined
            ? undefined
            : knowledgeProduct(choice.catalogueId, kb.products)?.name) ?? journeyFor(choice.product).displayName,
      )
      summary =
        created.length === 0
          ? 'Those were already started.'
          : `Started ${names.join(', ')}.` +
            (reused > 0
              ? ` ${String(reused)} ${reused === 1 ? 'thing' : 'things'} carried over from what we already knew.`
              : '')
      break
    }

    case 'decline_product': {
      /**
       * Declining twice is declining once.
       *
       * The upsert was always idempotent; the event was not, so a repeated tap wrote a second
       * `product_declined` and sent Baz a second turn to answer. Metrics are derived from
       * events (Invariant 9), so a duplicate here is not just noise on screen.
       */
      const already = loaded.productInterests.some(
        (interest) => interest.product === action.product && interest.status === 'declined',
      )

      if (already) {
        summary = 'Already left to one side.'
        break
      }

      const written = await admin
        .from('product_interests')
        .upsert(
          { case_id: caseId, product: action.product, status: 'declined' },
          { onConflict: 'case_id,product' },
        )

      if (written.error) return errorResponse('conflict', 'That could not be recorded.')

      await writeEvent(admin, {
        caseId,
        type: 'product_declined',
        actor: 'customer',
        payload: { product: action.product },
      })
      summary = 'Noted — I will not bring that up again.'
      break
    }

    case 'confirm_requirement': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // The requirement must actually belong to this journey; a confirmation for something
      // that is not asked for would satisfy nothing and should not be stored.
      const journey = journeyFor(application.product)
      const known = [
        ...journey.requirements,
        ...journey.branches.flatMap((branch) => branch.requirements),
      ].some((requirement) => requirement.id === action.requirementId)

      if (!known) return errorResponse('bad_request', 'That is not part of this application.')

      mustWrite(
        await admin.from('application_confirmations').upsert(
          {
            application_id: action.applicationId,
            requirement_id: action.requirementId,
            participant_id: session.participant_id,
            kind: 'confirmation',
          },
          { onConflict: 'application_id,requirement_id' },
        ),
        'the confirmation',
      )
      summary = 'Confirmed.'
      break
    }

    case 'submit_application': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // The ticked confirmations land first, so the application can actually reach `ready`.
      // Each is checked against the journey, as `confirm_requirement` does.
      if (action.confirmations.length > 0) {
        const journey = journeyFor(application.product)
        const known = new Set(
          [
            ...journey.requirements,
            ...journey.branches.flatMap((branch) => branch.requirements),
          ].map((requirement) => requirement.id),
        )

        const unknown = action.confirmations.filter((id) => !known.has(id))
        if (unknown.length > 0) {
          return errorResponse('bad_request', 'Those are not part of this application.')
        }

        mustWrite(
          await admin.from('application_confirmations').upsert(
            action.confirmations.map((requirementId) => ({
              application_id: action.applicationId,
              requirement_id: requirementId,
              participant_id: session.participant_id,
              kind: 'confirmation',
            })),
            { onConflict: 'application_id,requirement_id' },
          ),
          'the confirmation',
        )

        // Recompute so the application reaches `ready` before submission is attempted.
        loaded = (await loadCase(admin, caseId))!
        await recomputeApplications(admin, loaded)
        loaded = (await loadCase(admin, caseId))!
      }

      const current = findApplication(loaded, action.applicationId) ?? application

      // §48 — the state machine is the rule, not a condition written here.
      const result = transition(current, { type: 'submission_confirmed' })
      if (!result.ok) {
        return errorResponse(
          'illegal_transition',
          current.state === 'ready' ? result.error.message : 'That is not ready to submit yet.',
        )
      }

      mustWrite(
        await admin
          .from('applications')
          .update({ state: result.application.state, submitted_at: new Date().toISOString() })
          .eq('id', action.applicationId),
        'the application',
      )

      await writeEvent(admin, {
        caseId,
        type: 'application_submitted',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { applicationName: journeyFor(application.product).displayName },
      })

      summary = `${journeyFor(application.product).displayName} submitted.`
      break
    }

    /**
     * §10, §37 — the customer decides what happens to the plan.
     *
     * The transition table refuses anything incoherent, so a completed plan cannot quietly
     * reactivate and an abandoned one cannot be paused. Nothing here infers intent: every
     * change came from a tap.
     */
    /**
     * §10 — a declaration is only a declaration if somebody read it and tapped.
     *
     * The wording is read from the published definition here rather than taken from the
     * request, so the record says exactly what was on screen. Every field is checked to be a
     * declaration on this form and active on this customer's branch: a client cannot confirm
     * something the journey never showed.
     */
    case 'confirm_form_declarations': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      const mapping = formForProduct(application.product)
      const snapshot = mapping ? formSnapshot(mapping.formId) : undefined
      if (!snapshot) return errorResponse('bad_request', 'That application has no form behind it.')

      const row = await admin
        .from('form_applications')
        .select('id, answers')
        .eq('case_id', caseId)
        .eq('form_id', snapshot.formId)
        .maybeSingle()

      if (row.error) return errorResponse('conflict', row.error.message)
      if (!row.data) return errorResponse('not_found', 'Nothing has been collected for that form.')

      const state = resolveFormState(snapshot.definition, (row.data.answers ?? {}) as Record<string, unknown>)
      const active = new Set(state.active.map((field) => field.id))
      const byId = new Map(snapshot.definition.fields.map((field) => [field.id, field]))

      const writes = []
      for (const fieldId of action.fieldIds) {
        const field = byId.get(fieldId)
        if (!field || field.type !== 'checkbox' || !active.has(fieldId)) {
          return errorResponse('bad_request', 'That is not a declaration on this form.')
        }

        // A checkbox submits the value its own choice declares, which is the form's business.
        const choice = field.choices?.[0]?.value ?? 'Yes'

        writes.push({
          form_application_id: row.data.id,
          field_id: fieldId,
          value: choice as unknown as Json,
          source: 'consent' as const,
          // What was on screen, stored beside the agreement to it.
          wording: field.label.slice(0, 2000),
          participant_id: session.participant_id,
        })
      }

      mustWrite(
        await admin
          .from('form_answers')
          .upsert(writes, { onConflict: 'form_application_id,field_id' }),
        'the declarations',
      )

      await writeEvent(admin, {
        caseId,
        type: 'consent_granted',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { form: snapshot.formId, declarations: writes.length },
      })

      summary = `${String(writes.length)} ${writes.length === 1 ? 'declaration' : 'declarations'} recorded.`
      break
    }

    case 'decide_plan': {
      const row = await admin
        .from('plans')
        .select('id, status, title, target_amount')
        .eq('id', action.planId)
        .eq('case_id', caseId)
        .maybeSingle()

      const current = row.data as
        | { id: string; status: PlanStatus; title: string; target_amount: number | string | null }
        | null
      if (!current) return errorResponse('not_found', 'There is no such plan.')

      const target: PlanStatus =
        action.decision === 'keep'
          ? 'active'
          : action.decision === 'not_now' || action.decision === 'abandon'
            ? 'abandoned'
            : action.decision === 'pause'
              ? 'paused'
              : 'active'

      if (!canTransition(current.status, target)) {
        return errorResponse('conflict', `That plan cannot move from ${current.status}.`)
      }

      const now = new Date().toISOString()
      mustWrite(
        await admin
          .from('plans')
          .update({
            status: target,
            ...(action.decision === 'keep' ? { confirmed_at: now, last_confirmed_at: now } : {}),
            ...(target === 'paused' ? { paused_at: now } : {}),
          })
          .eq('id', current.id),
        'the plan',
      )

      /**
       * Keeping a plan is agreeing its target, so the target becomes a fact about them.
       *
       * Baz usually works the figure out — a tenth of the purchase price — and until the customer
       * said yes that was an estimate. Once they have agreed it, it is something they told the
       * bank: the deposit engine stops re-deriving it, and the plan's own "target defined"
       * milestone can be evidenced by the case rather than ticked by hand.
       */
      if (action.decision === 'keep' && current.target_amount !== null) {
        const amount = Number(current.target_amount)

        if (Number.isFinite(amount) && amount > 0) {
          // `goals.savingsTarget` is a household key, so the catalogue decides its subject —
          // which is the whole reason facts go through one writer rather than an insert here.
          await recordFacts(admin, {
            caseId,
            facts: [{ key: 'goals.savingsTarget', value: Math.round(amount) }],
            participants: {
              primary: loaded.participants.find((p) => p.role === 'primary')?.id ?? null,
              partner: loaded.participants.find((p) => p.role === 'partner')?.id ?? null,
            },
            source: 'customer_stated',
          })
        }
      }

      await writeEvent(admin, {
        caseId,
        type:
          action.decision === 'keep'
            ? 'plan_created'
            : action.decision === 'pause'
              ? 'plan_paused'
              : action.decision === 'resume'
                ? 'plan_resumed'
                : 'plan_abandoned',
        actor: 'customer',
        payload: { planId: current.id, title: current.title },
      })

      summary =
        action.decision === 'keep'
          ? `Kept "${current.title}" as a plan.`
          : action.decision === 'pause'
            ? `Paused "${current.title}".`
            : action.decision === 'resume'
              ? `Picked "${current.title}" back up.`
              : `Dropped "${current.title}".`
      break
    }

    case 'invite_partner': {
      const existing = loaded.participants.find((participant) => participant.role === 'partner')

      const partnerId =
        existing?.id ??
        ((
          mustWrite(
            await admin
              .from('participants')
              .insert({ case_id: caseId, role: 'partner', display_name: action.name })
              .select('id')
              .single(),
            'the participant',
          )
        ).data as { id: string }).id

      if (existing) {
        mustWrite(
          await admin.from('participants').update({ display_name: action.name }).eq('id', partnerId),
          'the participant',
        )
      }

      // Opaque, hashed, single-use, and good for a day — longer than a handoff because the
      // customer has to pass it to someone else (§58, Invariant 8).
      const token = crypto.randomUUID().replaceAll('-', '')
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
      const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

      mustWrite(
        await admin.from('tokens').insert({
          case_id: caseId,
          kind: 'partner_invite',
          token_hash: hash,
          participant_id: partnerId,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
        'the link',
      )

      await writeEvent(admin, {
        caseId,
        type: 'partner_invited',
        actor: 'customer',
        payload: { partnerName: action.name },
      })

      const base = (globalThis as any).Deno?.env?.get('APP_BASE_URL') ?? ''
      inviteUrl = `${base}/#/join/${token}`
      summary = `${action.name} can join with that link.`
      break
    }

    case 'subscribe_push': {
      /*
       * Keyed on the endpoint, which the push service makes unique per browser. Upserting
       * rather than inserting is what stops a phone that re-subscribes — which browsers do on
       * their own schedule — collecting rows that would each deliver another copy of the same
       * notification.
       */
      const stored = await admin.from('push_subscriptions').upsert(
        {
          case_id: loaded.caseId,
          participant_id: session.participant_id,
          endpoint: action.endpoint,
          p256dh: action.p256dh,
          auth: action.auth,
          expired_at: null,
        },
        { onConflict: 'endpoint' },
      )
      if (stored.error) return errorResponse('conflict', stored.error.message)

      await writeEvent(admin, {
        caseId: loaded.caseId,
        type: 'push_subscribed',
        actor: 'customer',
        payload: {},
      })

      return json(ok({ subscribed: true }), 200)
    }

    case 'grant_consent': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      const journey = journeyFor(application.product)
      const requirement = [
        ...journey.requirements,
        ...journey.branches.flatMap((branch) => branch.requirements),
      ].find((candidate) => candidate.id === action.requirementId)

      // Consent is only meaningful for something this journey actually asks consent for.
      if (!requirement || requirement.kind !== 'confirmation') {
        return errorResponse('bad_request', 'That is not something to consent to here.')
      }

      mustWrite(
        await admin.from('application_confirmations').upsert(
          {
            application_id: action.applicationId,
            requirement_id: action.requirementId,
            participant_id: session.participant_id,
            kind: 'consent',
          },
          { onConflict: 'application_id,requirement_id' },
        ),
        'the confirmation',
      )

      // Recorded as a consent in its own right, not only as a satisfied requirement (§9).
      mustWrite(
        await admin.from('consents').upsert(
          {
            case_id: caseId,
            participant_id: session.participant_id,
            kind: 'health_questions',
            granted: true,
          },
          { onConflict: 'participant_id,kind' },
        ),
        'the consent',
      )

      await writeEvent(admin, {
        caseId,
        type: 'consent_granted',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { requirementId: action.requirementId, kind: 'health_questions' },
      })

      summary = 'Thanks — noted.'
      break
    }

    case 'submit_health_form': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      // Invariant 6, enforced at the only door special-category data can come through: the
      // consent must already be recorded for THIS application. Without it, nothing is written.
      const consented = loaded.confirmations.some(
        (confirmation) =>
          String(confirmation.applicationId) === action.applicationId &&
          confirmation.requirementId.includes('health-consent'),
      )

      if (!consented) {
        return errorResponse('forbidden', 'Health questions cannot be answered before consent.')
      }

      const rows: Record<string, unknown>[] = []
      const problems: string[] = []

      for (const entry of action.values) {
        if (!isFactKey(entry.key)) {
          problems.push(`${entry.key} is not something we collect.`)
          continue
        }

        // This form exists for special-category data. Anything else belongs elsewhere, and
        // accepting it here would route ordinary facts around the normal checks.
        if (factCatalogue[entry.key].sensitivity !== 'special') {
          problems.push(`${entry.key} does not belong on this form.`)
          continue
        }

        const parsed = parseFactValue(entry.key, entry.value)
        if (!parsed.ok) {
          problems.push(`${factCatalogue[entry.key].label}: ${parsed.issues.join('; ')}`)
          continue
        }

        rows.push({
          case_id: caseId,
          key: entry.key,
          participant_id: session.participant_id,
          subject_kind: 'participant',
          value: parsed.value,
          source: 'customer_stated',
          verified: false,
          captured_for: action.applicationId,
        })
      }

      if (problems.length > 0) {
        return errorResponse('bad_request', problems.join(' '))
      }

      mustWrite(
        await admin.from('facts').insert(rows as Insert<'facts'>[]),
        'the facts',
      )
      await writeEvent(admin, {
        caseId,
        type: 'health_form_completed',
        actor: 'customer',
        applicationId: action.applicationId,
        // The keys answered, never the values: nothing sensitive goes in an event payload.
        payload: { answered: rows.length },
      })

      summary = 'Thanks, that is everything I needed from you on the health side.'
      break
    }

    case 'pause_application':
    case 'resume_application': {
      const application = findApplication(loaded, action.applicationId)
      if (!application) return errorResponse('not_found', 'That application does not exist.')

      const pausing = action.action === 'pause_application'
      const result = transition(application, { type: pausing ? 'paused' : 'resumed' })
      if (!result.ok) return errorResponse('illegal_transition', result.error.message)

      mustWrite(
        await admin
          .from('applications')
          .update({ state: result.application.state, resume_to: result.application.resumeTo })
          .eq('id', action.applicationId),
        'the application',
      )

      /**
       * §27 — "leave it for now" is only kind if something remembers.
       *
       * Pausing a loan while a mortgage is in flight parks the need with the condition that
       * brings it back, so the customer does not have to raise it again themselves months
       * later. Recorded against the need, not the application, because the need is what they
       * actually wanted.
       */
      if (pausing && application.product === 'personal_loan') {
        await deferNeed(admin, caseId, {
          needId: 'home_improvement_borrowing',
          revisitWhen: 'mortgage_completed',
          reason: 'you asked me to leave it until the mortgage was sorted',
        })
      }

      await writeEvent(admin, {
        caseId,
        type: pausing ? 'application_paused' : 'application_resumed',
        actor: 'customer',
        applicationId: action.applicationId,
        payload: { applicationName: journeyFor(application.product).displayName },
      })

      summary = `${journeyFor(application.product).displayName} ${pausing ? 'paused' : 'resumed'}.`
      break
    }
  }

  // Recompute after every action: what is outstanding is derived, never remembered.
  loaded = (await loadCase(admin, caseId))!
  const applications = await recomputeApplications(admin, loaded, {
    nameFor: (product, catalogueId) =>
      (catalogueId === null ? undefined : knowledgeProduct(catalogueId, kb.products)?.name) ??
      journeyFor(product).displayName,
  })

  /*
   * And the digital form applications, so selecting a product puts its form in the console
   * immediately rather than on the next thing the customer happens to say.
   *
   * Caught: the action itself succeeded, and failing it now would roll a real state change
   * back in the customer's face over a view they cannot see.
   */
  try {
    await syncFormApplications(admin, caseId)
  } catch (error) {
    await writeEvent(admin, {
      caseId,
      type: 'form_sync_failed',
      actor: 'system',
      payload: { error: (error instanceof Error ? error.message : 'unknown').slice(0, 300) },
    })
  }

  return json(
    ok({
      applications: [...applications],
      summary,
      ...(inviteUrl === undefined ? {} : { inviteUrl }),
    } satisfies CaseActionResponse),
    200,
  )
})

async function caseIdForApplication(
  admin: Db,
  applicationId: string,
): Promise<string | null> {
  const result = await admin
    .from('applications')
    .select('case_id')
    .eq('id', applicationId)
    .maybeSingle()
  return (result.data as { case_id?: string } | null)?.case_id ?? null
}
