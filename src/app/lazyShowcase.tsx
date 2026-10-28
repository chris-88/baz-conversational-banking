import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The showcase loads on demand, for the same reason the explainer does: it is for a room,
 * not a customer, and it carries the full animation library and three cue files that
 * nobody opening Baz to say something should have to download first.
 */
const Page = lazy(async () => ({
  default: (await import('@/surfaces/Showcase')).Showcase,
}))

export function LazyShowcase(): ReactNode {
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
