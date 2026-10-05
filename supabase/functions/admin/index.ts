// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { adminRequestSchema, type AdminCase, type AdminOverview } from '../_shared/contracts/admin.ts'
import { factCatalogue, isFactKey } from '../_shared/domain/facts.ts'
import { journeyFor } from '../_shared/domain/journeys/index.ts'
import { stateLabel, transition, type TransitionEvent } from '../_shared/domain/state-machine.ts'
import { slidersFor } from '../_shared/llm/persona.ts'
import { canonicalCase } from '../_shared/domain/seed/canonical.ts'
import { loadCase, writeEvent } from '../_shared/db/case-repository.ts'
import { evaluateFor } from '../_shared/db/applications.ts'

/**
 * The presenter console (§37 to §44).
 *
 * Every action can break a live demonstration and the site is public, so admin status is
 * checked server-side on every call. Client-side routing only decides what is drawn.
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

function env(name: string): string {
  const value = (globalThis as any).Deno?.env?.get(name)
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Missing ${name}`)
  return value
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return errorResponse('bad_request', 'Use POST.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return errorResponse('unauthorised', 'Sign in as an administrator.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('bad_request', 'Body must be JSON.')
  }

  const parsed = adminRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('bad_request', 'Unrecognised request.')

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  if (caller.error || !caller.data.user) return errorResponse('unauthorised', 'Sign in.')

  // The whole protection. An anonymous visitor is never in this table.
  const isAdmin = await admin
    .from('admin_users')
    .select('auth_user_id')
    .eq('auth_user_id', caller.data.user.id)
    .maybeSingle()

  if (!isAdmin.data) return errorResponse('forbidden', 'You are not an administrator.')

  const action = parsed.data

  switch (action.action) {
    case 'set_kill_switch': {
      await admin
        .from('domain_config')
        .update({ kill_switch: action.enabled })
        .eq('scope', 'global')
      return json(ok({ killSwitch: action.enabled }), 200)
    }

    case 'set_persona': {
      const update: Record<string, unknown> = {}
      if (action.preset !== undefined) {
        update.preset = action.preset
        update.sliders = slidersFor(action.preset)
      }
      // Explicit sliders win, so a preset can be nudged without becoming a different preset.
      if (action.sliders !== undefined) {
        update.sliders = action.sliders
        update.preset = action.preset ?? 'custom'
      }
      if (Object.keys(update).length === 0) return errorResponse('bad_request', 'Nothing to set.')

      await admin.from('persona_config').update(update).eq('scope', 'global')
      return json(ok(update), 200)
    }

    case 'reset_case': {
      // §43 — the presenter case only. Audience cases are deliberately left alone.
      const presenter = await admin.from('cases').select('id').eq('kind', 'presenter')
      for (const row of (presenter.data ?? []) as { id: string }[]) {
        await admin.from('cases').delete().eq('id', row.id)
      }

      const customer = await admin
        .from('customers')
        .upsert(
          {
            bank_reference: canonicalCase.customer.bankReference,
            full_name: canonicalCase.customer.fullName,
            date_of_birth: canonicalCase.customer.dateOfBirth,
            email: canonicalCase.customer.email,
            mobile: canonicalCase.customer.mobile,
            existing_products: [...canonicalCase.customer.existingProducts],
          },
          { onConflict: 'bank_reference' },
        )
        .select('id')
        .single()

      const created = await admin
        .from('cases')
        .insert({
          kind: 'presenter',
          label: canonicalCase.label,
          customer_id: (customer.data as { id: string }).id,
          auth_level: 'authenticated',
        })
        .select('id')
        .single()

      const caseId = (created.data as { id: string }).id

      const participant = await admin
        .from('participants')
        .insert({ case_id: caseId, role: 'primary', display_name: canonicalCase.customer.firstName })
        .select('id')
        .single()

      const participantId = (participant.data as { id: string }).id

      await admin.from('facts').insert(
        canonicalCase.bankHeldFacts.map((fact) => ({
          case_id: caseId,
          key: fact.key,
          participant_id: fact.subject === 'household' ? null : participantId,
          subject_kind: fact.subject === 'household' ? 'household' : 'participant',
          value: fact.value,
          source: fact.source,
          verified: fact.verified,
        })),
      )

      await writeEvent(admin, {
        caseId,
        type: 'case_reset',
        actor: 'admin',
        payload: { facts: canonicalCase.bankHeldFacts.length },
      })

      return json(ok({ caseId, facts: canonicalCase.bankHeldFacts.length }), 200)
    }

    case 'overview': {
      const [config, persona, cases, events, blocked] = await Promise.all([
        admin.from('domain_config').select('kill_switch').eq('scope', 'global').maybeSingle(),
        admin.from('persona_config').select('preset, sliders').eq('scope', 'global').maybeSingle(),
        admin.from('cases').select('id, kind, label, updated_at').order('updated_at', { ascending: false }).limit(25),
        admin.from('events').select('type'),
        admin
          .from('events')
          .select('payload, created_at')
          .eq('type', 'request_blocked')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const counts = new Map<string, number>()
      for (const row of (events.data ?? []) as { type: string }[]) {
        counts.set(row.type, (counts.get(row.type) ?? 0) + 1)
      }

      const caseRows = (cases.data ?? []) as { id: string; kind: string; label: string | null; updated_at: string }[]
      const summaries = await Promise.all(
        caseRows.map(async (row) => {
          const [apps, messages] = await Promise.all([
            admin.from('applications').select('id', { count: 'exact', head: true }).eq('case_id', row.id),
            admin.from('messages').select('id', { count: 'exact', head: true }).eq('case_id', row.id),
          ])
          return {
            id: row.id,
            kind: row.kind as 'presenter' | 'audience',
            label: row.label,
            applications: apps.count ?? 0,
            messages: messages.count ?? 0,
            updatedAt: row.updated_at,
          }
        }),
      )

      const overview: AdminOverview = {
        killSwitch: (config.data as { kill_switch?: boolean } | null)?.kill_switch ?? false,
        persona: {
          preset: (persona.data as { preset?: string } | null)?.preset ?? 'default',
          sliders: ((persona.data as { sliders?: unknown } | null)?.sliders ?? slidersFor('default')) as AdminOverview['persona']['sliders'],
        },
        cases: summaries,
        metrics: {
          questionsAvoided: counts.get('context_reused') ?? 0,
          factsCaptured: counts.get('context_captured') ?? 0,
          productsOffered: counts.get('product_offered') ?? 0,
          applicationsStarted: counts.get('application_created') ?? 0,
          requestsBlocked: counts.get('request_blocked') ?? 0,
        },
        blocked: ((blocked.data ?? []) as { payload: { category?: string }; created_at: string }[]).map(
          (row) => ({ category: row.payload?.category ?? 'unknown', at: row.created_at }),
        ),
      }

      return json(ok(overview), 200)
    }

    case 'simulate_event': {
      const found = await admin
        .from('applications')
        .select('id, case_id, product, state, resume_to')
        .eq('id', action.applicationId)
        .maybeSingle()

      const row = found.data as any
      if (!row) return errorResponse('not_found', 'No such application.')

      // §41 — the state machine decides, so an illegal move is refused rather than faked.
      const result = transition(
        { id: row.id, product: row.product, state: row.state, resumeTo: row.resume_to },
        { type: action.event } as TransitionEvent,
      )

      if (!result.ok) return errorResponse('illegal_transition', result.error.message)

      await admin
        .from('applications')
        .update({ state: result.application.state, resume_to: result.application.resumeTo })
        .eq('id', action.applicationId)

      const names: Record<typeof action.event, string> = {
        received_by_bank: 'application_received',
        information_requested: 'information_requested',
        information_supplied: 'document_received',
        assessment_approved: 'application_approved',
        assessment_declined: 'application_declined',
        completed: 'application_completed',
      }

      await writeEvent(admin, {
        caseId: row.case_id,
        type: names[action.event],
        actor: 'admin',
        applicationId: action.applicationId,
        payload: {
          applicationName: journeyFor(row.product).displayName,
          ...(action.detail === undefined ? {} : { detail: action.detail }),
        },
      })

      return json(ok({ state: result.application.state }), 200)
    }

    case 'send_notification': {
      // §58 — the link carries an opaque single-use code, never anything about the case.
      const code = crypto.randomUUID().replaceAll('-', '')
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
      const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

      const participant = await admin
        .from('participants')
        .select('id')
        .eq('case_id', action.caseId)
        .eq('role', 'primary')
        .maybeSingle()

      await admin.from('tokens').insert({
        case_id: action.caseId,
        kind: 'notification',
        token_hash: hash,
        participant_id: (participant.data as { id?: string } | null)?.id ?? null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

      await writeEvent(admin, {
        caseId: action.caseId,
        type: 'notification_sent',
        actor: 'admin',
        payload: { channel: 'in_app' },
      })

      const base = (globalThis as any).Deno?.env?.get('APP_BASE_URL') ?? ''

      return json(
        ok({
          // Fixed copy, saying nothing about the application itself (§35).
          message:
            'Bank of Ireland: Baz has an update about something you’re working on with us. ' +
            'Open the app to continue securely.',
          url: `${base}/#/app/login?n=${code}`,
        }),
        200,
      )
    }

    case 'inspect_case': {
      const loaded = await loadCase(admin, action.caseId)
      if (!loaded) return errorResponse('not_found', 'No such case.')

      const events = await admin
        .from('events')
        .select('type, actor, created_at')
        .eq('case_id', action.caseId)
        .order('created_at', { ascending: false })
        .limit(40)

      const inspected: AdminCase = {
        caseId: action.caseId,
        // The inspector DOES show that sensitive facts exist, flagged — this surface is for
        // the person running the demonstration, not for the model.
        facts: loaded.facts.map((fact) => ({
          key: fact.key,
          label: isFactKey(fact.key) ? factCatalogue[fact.key].label : fact.key,
          value: factCatalogue[fact.key].sensitivity === 'special' ? '(held)' : String(fact.value),
          source: fact.source,
          verified: fact.verified,
          superseded: fact.supersededBy !== null,
          sensitive: factCatalogue[fact.key].sensitivity === 'special',
        })),
        applications: loaded.applications.map((application) => ({
          id: String(application.id),
          product: application.product,
          displayName: journeyFor(application.product).displayName,
          state: application.state,
          stateLabel: stateLabel(application.state),
          outstanding: evaluateFor(loaded, application)
            .outstanding.filter((item) => item.blocking)
            .map((item) => item.requirement.label),
          // Only offer the presenter moves the machine will actually accept.
          canSimulate: (
            [
              'received_by_bank',
              'information_requested',
              'information_supplied',
              'assessment_approved',
              'assessment_declined',
              'completed',
            ] as const
          ).filter((event) => transition(application, { type: event } as TransitionEvent).ok),
        })),
        events: ((events.data ?? []) as { type: string; actor: string; created_at: string }[]).map(
          (row) => ({ type: row.type, actor: row.actor, at: row.created_at }),
        ),
      }

      return json(ok(inspected), 200)
    }
  }
})
