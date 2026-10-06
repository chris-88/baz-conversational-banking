import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { startSession } from '@/lib/session'
import { isBackendConfigured } from '@/lib/env'

/** The case this visitor is attached to. Cached, so every screen shares one join. */
export function useCaseSession() {
  return useQuery({
    queryKey: queryKeys.session.current(),
    enabled: isBackendConfigured,
    staleTime: Infinity,
    retry: false,
    queryFn: () => startSession(),
  })
}
