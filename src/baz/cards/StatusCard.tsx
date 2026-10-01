import type { ReactNode } from 'react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/StatusDot'

type Payload = Extract<CardPayload, { type: 'status' }>

/**
 * §14, §59 — rendered entirely from the case. Whatever Baz wrote alongside it, this is what
 * is actually true, and the state's label always accompanies the colour.
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
      {card.applications.map((application) => (
        <div key={application.id} className="flex items-center gap-3 px-4 py-3">
          <StatusDot state={application.state} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{application.displayName}</span>
            <span className="text-muted-foreground block text-xs">
              {application.stateLabel}
              {application.outstandingCount > 0 &&
                ` · ${String(application.outstandingCount)} outstanding`}
              {application.waitingOn === 'partner' && ' · waiting for your partner'}
            </span>
          </span>
        </div>
      ))}
    </Card>
  )
}
