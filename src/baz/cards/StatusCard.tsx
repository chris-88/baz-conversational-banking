import type { ReactNode } from 'react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { ProductIcon } from '@/components/ProductIcon'

type Payload = Extract<CardPayload, { type: 'status' }>

/**
 * §14, §59 — rendered entirely from the case. Whatever Baz wrote alongside it, this is what is
 * actually true, and the state's own label always accompanies the colour.
 */
export function StatusCard({ card }: { card: Payload }): ReactNode {
  if (card.applications.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-sm">Nothing in progress yet.</p>
      </Card>
    )
  }

  return (
    <Card className="gap-0 divide-y p-0">
      {card.applications.map((application) => {
        // Submitted work is with the bank, so progress is complete from the customer's side.
        const settled =
          application.state === 'submitted' ||
          application.state === 'under_review' ||
          application.state === 'approved' ||
          application.state === 'completed'

        return (
          <div key={application.id} className="space-y-2.5 px-4 py-3">
            <div className="flex items-center gap-3">
              <ProductIcon product={application.product} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {application.displayName}
                </span>
                {application.waitingOn === 'partner' && (
                  <span className="text-muted-foreground block text-xs">
                    Waiting for your partner
                  </span>
                )}
              </span>
              <StatusBadge state={application.state} />
            </div>

            {!settled && application.outstandingCount > 0 && (
              <ProgressBar
                value={1 / (1 + application.outstandingCount)}
                label={`${String(application.outstandingCount)} outstanding`}
              />
            )}
          </div>
        )
      })}
    </Card>
  )
}
