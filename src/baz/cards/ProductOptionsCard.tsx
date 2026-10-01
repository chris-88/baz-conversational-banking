import type { ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Payload = Extract<CardPayload, { type: 'product_options' }>

/**
 * §8, §49 — Baz explains why something might fit; the customer chooses. Selecting calls
 * `case-action`, which is what actually creates applications (Invariant 1).
 */
export function ProductOptionsCard({
  card,
  onSelect,
  disabled,
}: {
  card: Payload
  onSelect?: (products: readonly string[]) => void
  disabled?: boolean
}): ReactNode {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <ul className="divide-y">
        {card.options.map((option) => (
          <li key={option.product} className="flex gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium">{option.displayName}</span>
                {option.previouslyDeclined && (
                  <Badge variant="secondary" className="text-2xs">
                    Declined before
                  </Badge>
                )}
              </span>
              <span className="text-muted-foreground block text-xs">{option.oneLine}</span>
              <span className="text-foreground/80 block text-xs italic">{option.reason}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="bg-muted/40 border-t p-3">
        <Button
          size="sm"
          className="w-full"
          disabled={disabled}
          onClick={() => onSelect?.(card.options.map((option) => option.product))}
        >
          <CheckIcon />
          Let&rsquo;s look at these
        </Button>
        <p className="text-muted-foreground mt-2 text-center text-2xs">
          Choosing is up to you. Applications are created in M3.
        </p>
      </div>
    </Card>
  )
}
