import { useCallback, useEffect, useRef, useState } from 'react'
import { describeEvent, isNarratable } from '@domain/narration.ts'
import { supabase } from '@/lib/supabase'
import { useRealtimeInvalidation } from '@/lib/useRealtimeInvalidation'

/**
 * Whether the bank has moved while this screen was open, and what to say about it.
 *
 * An open screen used to be inert. The presenter simulates "assessment approved" on the
 * console, the phone on the big screen does nothing, and the customer finds out on their next
 * turn, on a reload, or from a push notification. Realtime was wired to the admin console and
 * nowhere else.
 *
 * Two ways the news arrives, both ending in the same check: a change to `events` over the
 * socket, which RLS scopes to this customer's own case, and coming back to the tab, which is
 * also how a tapped push notification lands (under hash routing `#/baz?n=` is a fragment-only
 * change, so nothing remounts and the return turn never fired).
 *
 * The check reads the newest narratable event and compares it to the one last acknowledged.
 * Nothing fires a turn by itself: a reply arriving while somebody is mid-thought is worse than
 * a pill they can tap when they are ready.
 */
export type CaseUpdate = {
  readonly id: string
  /** The digest's own sentence for it, so the pill and what Baz then says cannot disagree. */
  readonly text: string
}

export function useCaseUpdates(caseId: string | null): {
  readonly update: CaseUpdate | null
  /** The customer has acted on it. The next check starts from here. */
  readonly acknowledge: () => void
} {
  /*
   * Tagged with the case it belongs to and filtered on read, rather than cleared when the case
   * changes: clearing it would be a state change inside the effect that notices the change,
   * which cascades a render. Filtering costs nothing and cannot.
   */
  const [update, setUpdate] = useState<(CaseUpdate & { readonly caseId: string }) | null>(null)
  const acknowledged = useRef<string | null>(null)
  const baselined = useRef(false)

  const check = useCallback(() => {
    if (!supabase || caseId === null) return
    void supabase
      .from('events')
      .select('id, type, payload')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        const latest = ((data ?? []) as { id: string; type: string; payload: unknown }[]).find(
          (row) => isNarratable(row.type),
        )
        if (latest === undefined) return

        /*
         * The first look sets the baseline and shows nothing. Anything already there when the
         * screen opened is the opening's business: `hasUpdates` fires the return turn for it.
         */
        if (!baselined.current) {
          baselined.current = true
          acknowledged.current = latest.id
          return
        }
        if (latest.id === acknowledged.current) return

        const text = describeEvent({
          type: latest.type,
          payload: (latest.payload ?? {}) as Record<string, unknown>,
        })
        if (text !== null) setUpdate({ caseId, id: latest.id, text })
      })
  }, [caseId])

  // Baseline on mount, and again whenever the case changes. Refs only: no state is set here.
  useEffect(() => {
    baselined.current = false
    acknowledged.current = null
    check()
  }, [check])

  useRealtimeInvalidation(['events'], check, caseId !== null)

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [check])

  const acknowledge = useCallback(() => {
    setUpdate((current) => {
      if (current !== null) acknowledged.current = current.id
      return null
    })
  }, [])

  const visible =
    update !== null && update.caseId === caseId ? { id: update.id, text: update.text } : null

  return { update: visible, acknowledge }
}
