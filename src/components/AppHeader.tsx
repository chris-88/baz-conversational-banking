import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The product header.
 *
 * Deliberately not a replica of any bank's chrome: a neutral mark, the product name, and the
 * tenant named as plain text. No brand assets are used (Invariant 10).
 */
export function AppHeader({
  subtitle,
  className,
}: {
  subtitle?: string | undefined
  className?: string | undefined
}): ReactNode {
  return (
    <header
      className={cn(
        'bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold"
        >
          B
        </span>

        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">Baz</p>
          <p className="text-muted-foreground truncate text-2xs">
            {subtitle ?? 'Bank of Ireland · conversational banking'}
          </p>
        </div>
      </div>
    </header>
  )
}
