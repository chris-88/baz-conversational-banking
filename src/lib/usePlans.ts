import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { planProgress } from '@domain/plans/engine.ts'
import { PLAN_GOALS, PLAN_STATUSES, type Plan, type PlanContext, type PlanProgress } from '@domain/plans/types.ts'
import { isFactKey } from '@domain/facts.ts'
import { MILESTONE_KINDS, MILESTONE_STATES, CHECKIN_STATES } from '@domain/plans/types.ts'
import { PRODUCTS } from '@domain/journey.ts'
import { APPLICATION_STATES } from '@domain/state-machine.ts'

/**
 * Plans for a case, read under RLS and costed out here.
 *
 * Progress is computed in the browser by the same engine the server uses, from the same facts
 * — not read from a column. That is deliberate: a stored percentage is a number that can
 * disagree with the balance beside it on the same screen (Invariant 2).
 */
const planRow = z.object({
  id: z.uuid(),
  goal: z.enum(PLAN_GOALS),
  title: z.string(),
  status: z.enum(PLAN_STATUSES),
  target_amount: z.union([z.number(), z.string()]).nullable(),
  target_date: z.string().nullable(),
  last_confirmed_at: z.string().nullable(),
})

const milestoneRow = z.object({
  id: z.uuid(),
  plan_id: z.uuid(),
  kind: z.enum(MILESTONE_KINDS),
  label: z.string(),
  sort: z.number(),
  target_amount: z.union([z.number(), z.string()]).nullable(),
  target_date: z.string().nullable(),
  target_product: z.enum(PRODUCTS).nullable(),
  target_state: z.enum(APPLICATION_STATES).nullable(),
  /** `catch` rather than strict: a milestone is still showable if its binding is unreadable. */
  target_facts: z.array(z.string()).nullable().catch(null),
  state: z.enum(MILESTONE_STATES),
  achieved_at: z.string().nullable(),
})

const checkinRow = z.object({
  id: z.uuid(),
  plan_id: z.uuid(),
  purpose: z.string(),
  agenda: z.array(z.string()).catch([]),
  trigger_kind: z.enum(['date', 'event']),
  due_at: z.string().nullable(),
  trigger_event: z.string().nullable(),
  state: z.enum(CHECKIN_STATES),
})

const factRow = z.object({ key: z.string(), value: z.unknown() })

/** Postgres `numeric` arrives as a string, which would quietly poison every calculation. */
const money = (value: number | string | null): number | null =>
  value === null ? null : typeof value === 'number' ? value : Number(value)

export type PlanView = { readonly plan: Plan; readonly progress: PlanProgress }

export function usePlans(caseId: string | null) {
  return useQuery({
    queryKey: queryKeys.plans.forCase(caseId ?? 'none'),
    enabled: caseId !== null,
    queryFn: async (): Promise<readonly PlanView[]> => {
      const supabase = requireSupabase()

      const [plans, milestones, checkins, facts, applications] = await Promise.all([
        supabase
          .from('plans')
          .select('id, goal, title, status, target_amount, target_date, last_confirmed_at')
          .eq('case_id', caseId ?? '')
          .order('created_at', { ascending: true }),
        supabase
          .from('plan_milestones')
          .select(
            'id, plan_id, kind, label, sort, target_amount, target_date, target_product, target_state, target_facts, state, achieved_at',
          )
          .order('sort', { ascending: true }),
        supabase
          .from('plan_checkins')
          .select('id, plan_id, purpose, agenda, trigger_kind, due_at, trigger_event, state'),
        supabase
          .from('facts')
          .select('key, value')
          .eq('case_id', caseId ?? '')
          .is('superseded_by', null),
        supabase
          .from('applications')
          .select('product, state')
          .eq('case_id', caseId ?? ''),
      ])

      for (const result of [plans, milestones, checkins, facts, applications]) {
        if (result.error) throw new Error(result.error.message)
      }

      const allFacts = factRow.array().parse(facts.data ?? [])
      const read = (key: string): number | null => {
        const value = allFacts.find((fact) => fact.key === key)?.value
        return typeof value === 'number' ? value : null
      }

      /**
       * Subject is not read here, deliberately.
       *
       * A `facts` milestone asks whether the case can answer something at all — "do we know
       * their income" — and for that purpose the primary's income and a household figure are
       * the same answer. The server makes the same call in `missing`.
       */
      const held = new Set(allFacts.map((fact) => fact.key))

      const context: PlanContext = {
        savingsBalance: read('assets.savingsBalance') ?? read('assets.depositAmount'),
        monthlySaving: read('goals.monthlySaving'),
        facts: {
          has: (key) => held.has(key),
          get: (key) => allFacts.find((fact) => fact.key === key)?.value,
          number: (key) => read(key),
          boolean: (key) => {
            const value = allFacts.find((fact) => fact.key === key)?.value
            return typeof value === 'boolean' ? value : null
          },
        },
        today: new Date().toISOString().slice(0, 10),
      }

      const apps = z
        .object({ product: z.enum(PRODUCTS), state: z.enum(APPLICATION_STATES) })
        .array()
        .parse(applications.data ?? [])

      const allMilestones = milestoneRow.array().parse(milestones.data ?? [])
      const allCheckins = checkinRow.array().parse(checkins.data ?? [])

      return planRow
        .array()
        .parse(plans.data ?? [])
        .map((row) => {
          const plan: Plan = {
            id: row.id,
            goal: row.goal,
            title: row.title,
            status: row.status,
            targetAmount: money(row.target_amount),
            targetDate: row.target_date,
            lastConfirmedAt: row.last_confirmed_at,
            applications: apps,
            milestones: allMilestones
              .filter((milestone) => milestone.plan_id === row.id)
              .map((milestone) => ({
                id: milestone.id,
                kind: milestone.kind,
                label: milestone.label,
                sort: milestone.sort,
                targetAmount: money(milestone.target_amount),
                targetDate: milestone.target_date,
                targetProduct: milestone.target_product,
                targetState: milestone.target_state,
                targetFacts:
                  milestone.target_facts === null
                    ? null
                    : milestone.target_facts.filter(isFactKey),
                state: milestone.state,
                achievedAt: milestone.achieved_at,
              })),
            checkins: allCheckins
              .filter((checkin) => checkin.plan_id === row.id)
              .map((checkin) => ({
                id: checkin.id,
                purpose: checkin.purpose,
                agenda: checkin.agenda,
                triggerKind: checkin.trigger_kind,
                dueAt: checkin.due_at,
                triggerEvent: checkin.trigger_event,
                state: checkin.state,
              })),
          }

          return { plan, progress: planProgress(plan, context) }
        })
    },
  })
}
