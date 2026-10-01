import type { ReactNode } from 'react'
import { Wordmark } from '@/shells/boi/Wordmark'
import { cn } from '@/lib/utils'

/**
 * The header for standalone mobile surfaces — the partner and audience entry points — which
 * sit outside the authenticated app shell and so have no tab bar beneath them.
 */
export function MobileHeader({
  subtitle,
  className,
}: {
  subtitle?: string | undefined
  className?: string | undefined
}): ReactNode {
  return (
    <header
      className={cn(
        'bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 border-b backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-3 px-4">
        <Wordmark tone="primary" />
        {subtitle !== undefined && (
          <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
        )}
      </div>
    </header>
  )
}
