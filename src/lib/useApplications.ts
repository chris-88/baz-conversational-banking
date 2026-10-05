import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { requireSupabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { PRODUCTS } from '@domain/journey.ts'
import { APPLICATION_STATES, stateLabel } from '@domain/state-machine.ts'
import { journeyFor } from '@domain/journeys/index.ts'

/**
 * Applications for a case, read under RLS.
 *
 * Read directly rather than through an Edge Function because this is a read, and RLS already
 * restricts it to the primary customer (CLAUDE.md > Architecture). The display name and state
 * label come from the domain, so the screen and the model describe state identically.
 */
const applicationRow = z.object({
  id: z.uuid(),
  product: z.enum(PRODUCTS),
  state: z.enum(APPLICATION_STATES),
  updated_at: z.string(),
})

export type ApplicationView = {
  readonly id: string
  readonly product: (typeof PRODUCTS)[number]
  readonly displayName: string
  readonly state: (typeof APPLICATION_STATES)[number]
  readonly stateLabel: string
}

export function useApplications(caseId: string | null) {
  return useQuery({
    queryKey: queryKeys.applications.forCase(caseId ?? 'none'),
    enabled: caseId !== null,
    queryFn: async (): Promise<readonly ApplicationView[]> => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('applications')
        .select('id, product, state, updated_at')
        .eq('case_id', caseId ?? '')
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)

      return applicationRow
        .array()
        .parse(data ?? [])
        .map((row) => ({
          id: row.id,
          product: row.product,
          displayName: journeyFor(row.product).displayName,
          state: row.state,
          stateLabel: stateLabel(row.state),
        }))
    },
  })
}
