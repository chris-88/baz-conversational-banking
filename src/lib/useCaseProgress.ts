import { useQuery } from '@tanstack/react-query'
import { asApplicationId, asFactId, asParticipantId, type Fact } from '@domain/facts.ts'
import { evaluateJourney } from '@domain/requirements.ts'
import { journeyFor } from '@domain/journeys/index.ts'
import type { PRODUCTS } from '@domain/journey.ts'
import { confirmationRow, documentRow, factRow, participantRow } from '@db/rows.ts'
import { requireSupabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'

export type ApplicationProgress = {
  readonly done: number
  readonly total: number
  /** What is still needed, in journey order. */
  readonly outstanding: readonly { readonly label: string; readonly waitingOnPartner: boolean }[]
}

type Input = {
  readonly caseId: string | null
  readonly applications: readonly {
    readonly id: string
    readonly product: (typeof PRODUCTS)[number]
  }[]
}

/**
 * §14, Invariant 3 — how far each application has to go, for the consolidated view.
 *
 * Read under RLS and evaluated with the same requirement engine the Edge Functions use, so the
 * home screen and Baz cannot disagree about what is outstanding. The model is not involved: it
 * decides how to ask, never what is still needed.
 */
export function useCaseProgress({ caseId, applications }: Input) {
  // Applications are part of the key: a new one must recompute rather than reuse a map that
  // has no entry for it.
  const ids = applications.map((application) => application.id).join(',')

  return useQuery({
    queryKey: queryKeys.applications.progress(caseId ?? 'none', ids),
    enabled: caseId !== null && applications.length > 0,
    queryFn: async (): Promise<ReadonlyMap<string, ApplicationProgress>> => {
      const supabase = requireSupabase()

      const [participants, facts, confirmations, documents] = await Promise.all([
        supabase
          .from('participants')
          .select('id, role, display_name')
          .eq('case_id', caseId ?? ''),
        supabase
          .from('facts')
          .select(
            'id, key, participant_id, subject_kind, value, source, verified, captured_for, superseded_by, captured_at',
          )
          .eq('case_id', caseId ?? ''),
        supabase.from('application_confirmations').select('application_id, requirement_id'),
        supabase.from('documents').select('application_id, requirement_id, verified'),
      ])

      for (const result of [participants, facts, confirmations, documents]) {
        if (result.error) throw new Error(result.error.message)
      }

      const participantRows = participantRow.array().parse(participants.data ?? [])
      const primary = participantRows.find((row) => row.role === 'primary')
      if (!primary) throw new Error('The case has no primary participant.')
      const partner = participantRows.find((row) => row.role === 'partner') ?? null

      const factRows = factRow.array().parse(facts.data ?? [])
      const confirmationRows = confirmationRow.array().parse(confirmations.data ?? [])
      const documentRows = documentRow.array().parse(documents.data ?? [])

      const domainFacts: Fact[] = factRows.map((row) => ({
        id: asFactId(row.id),
        key: row.key,
        subject:
          row.subject_kind === 'household'
            ? 'household'
            : asParticipantId(row.participant_id ?? primary.id),
        value: row.value,
        source: row.source,
        verified: row.verified,
        capturedFor: row.captured_for === null ? null : asApplicationId(row.captured_for),
        supersededBy: row.superseded_by === null ? null : asFactId(row.superseded_by),
        capturedAt: row.captured_at,
      }))

      return new Map(
        applications.map((application) => {
          const evaluation = evaluateJourney(journeyFor(application.product), {
            applicationId: asApplicationId(application.id),
            participants: {
              primary: asParticipantId(primary.id),
              partner: partner ? asParticipantId(partner.id) : null,
            },
            facts: domainFacts,
            confirmations: confirmationRows
              .filter((row) => row.application_id === application.id)
              .map((row) => row.requirement_id),
            documents: documentRows
              .filter((row) => row.application_id === application.id && row.requirement_id !== null)
              .map((row) => ({ requirementId: row.requirement_id ?? '', verified: row.verified })),
          })

          const blocking = evaluation.outstanding.filter((item) => item.blocking)

          return [
            application.id,
            {
              done: evaluation.satisfied.length,
              total: evaluation.satisfied.length + blocking.length,
              outstanding: blocking.map((item) => ({
                label: item.requirement.label,
                waitingOnPartner: item.waitingOn === 'partner',
              })),
            },
          ]
        }),
      )
    },
  })
}
