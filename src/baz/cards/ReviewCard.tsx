import { useState, type ReactNode } from 'react'
import { FileCheckIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/IconTile'

type Payload = Extract<CardPayload, { type: 'review' }>

/**
 * §48 — nothing is submitted silently. The customer sees exactly what is going, and the tap
 * is the only route out of `ready`.
 *
 * Everything shown is built from the case by the server, not written by the model.
 */
export function ReviewCard({
  card,
  onSubmit,
  disabled,
}: {
  card: Payload
  onSubmit?: (applicationId: string) => Promise<void> | void
  disabled?: boolean
}): ReactNode {
  const [busy, setBusy] = useState(false)

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b p-4">
        <IconTile tone="deep">
          <FileCheckIcon />
        </IconTile>
        <div>
          <p className="text-sm font-semibold">{card.displayName}</p>
          <p className="text-muted-foreground text-xs">Check this before it goes.</p>
        </div>
      </div>

      <dl className="divide-y">
        {card.summary.map((row) => (
          <div key={row.label} className="flex items-baseline gap-3 px-4 py-2.5">
            <dt className="text-muted-foreground min-w-0 flex-1 text-xs">{row.label}</dt>
            <dd className="text-right text-sm font-medium tabular">{row.value}</dd>
          </div>
        ))}
      </dl>

      {card.declarations.length > 0 && (
        <ul className="text-muted-foreground border-t px-4 py-3 text-xs">
          {card.declarations.map((declaration) => (
            <li key={declaration}>{declaration}</li>
          ))}
        </ul>
      )}

      <div className="bg-muted/40 border-t p-3">
        <Button
          size="sm"
          className="w-full"
          disabled={disabled ?? busy}
          onClick={() => {
            setBusy(true)
            void Promise.resolve(onSubmit?.(card.applicationId)).finally(() => setBusy(false))
          }}
        >
          {busy ? 'Submitting…' : card.confirmLabel}
        </Button>
      </div>
    </Card>
  )
}
