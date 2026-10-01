import type { ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'

/**
 * Says plainly what this is, on every surface.
 *
 * Uses the `warning` token rather than a palette colour, so it follows the theme instead of
 * fighting it (CLAUDE.md: the look comes from theme tokens, not per-component overrides).
 */
export function PrototypeBanner(): ReactNode {
  return (
    <div
      role="note"
      className="bg-warning text-warning-foreground border-warning-border border-b"
    >
      <div className="mx-auto flex w-full max-w-md items-start gap-2 px-4 py-2">
        <InfoIcon aria-hidden className="mt-[0.15em] size-3.5 shrink-0" />
        <p className="text-2xs leading-snug text-pretty">
          <span className="font-semibold">Prototype.</span> Not a real banking service. All data
          is invented — never enter real personal or banking details.
        </p>
      </div>
    </div>
  )
}
