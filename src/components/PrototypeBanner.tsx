import type { ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'

/**
 * Sits above the simulated bank chrome on every surface, so it reads as the real page talking
 * rather than part of the prototype.
 *
 * Invariant 10 is about data; this is about the person looking at the screen. The site carries
 * Bank of Ireland branding on a public personal domain, so it says plainly what it is.
 */
export function PrototypeBanner(): ReactNode {
  return (
    <div
      role="note"
      className="flex items-start gap-2 bg-amber-100 px-3 py-2 text-[11px] leading-snug text-amber-950"
    >
      <TriangleAlertIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <strong className="font-semibold">Prototype, not a real banking service.</strong> A
        demonstration of conversational banking, not operated by or affiliated with Bank of
        Ireland. All data is invented. Never enter real personal or banking details.
      </p>
    </div>
  )
}
