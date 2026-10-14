import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The explainer loads on demand, for the same reason the console does.
 *
 * It is written for somebody evaluating the work, and it carries an animation library that the
 * product itself has no use for. Imported eagerly it added 46KB gzipped to the bundle every
 * customer downloads before they can say anything, to serve a page most of them never open.
 *
 * In its own file because `router.tsx` exports a router, and a module that exports both a
 * component and something else loses fast refresh.
 */
const Page = lazy(async () => ({
  default: (await import('@/surfaces/HowItWorks')).HowItWorks,
}))

export function LazyHowItWorks(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <Page />
    </Suspense>
  )
}
