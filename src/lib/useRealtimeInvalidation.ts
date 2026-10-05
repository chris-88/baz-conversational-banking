import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Keeps a screen current while something else changes the case.
 *
 * Realtime tells us a row changed; it never carries the new state into the cache. The handler
 * only invalidates, and TanStack refetches through the same path as the first load — so what
 * is on screen always came from the server, never from a payload we patched in by hand
 * (CLAUDE.md > TanStack Query).
 *
 * The console is the first caller: a presenter watching someone talk to Baz should see the
 * facts and applications arrive, not have to reload to find out anything happened.
 */
export function useRealtimeInvalidation(
  tables: readonly string[],
  invalidate: () => void,
  enabled = true,
): void {
  const queries = useQueryClient()

  // Joined so the effect keys on the contents rather than a fresh array each render.
  const key = tables.join(',')

  useEffect(() => {
    if (!enabled) return
    const client = supabase
    if (client === null) return

    const channel = client.channel(`watch:${key}`)

    for (const table of key.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        invalidate()
      })
    }

    void channel.subscribe()

    return () => {
      void client.removeChannel(channel)
    }
    // `client` is stable; `invalidate` is the caller's concern to keep stable.
  }, [key, enabled, invalidate, queries])
}
