import { useState, type ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

type Payload = Extract<CardPayload, { type: 'product_options' }>

/**
 * §8, §49 — Baz explains why something might fit; the customer chooses. Selecting calls
 * `case-action`, which is what actually creates applications (Invariant 1).
 */
export function ProductOptionsCard({
  card,
  onSelect,
  onDecline,
  disabled,
}: {
  card: Payload
  onSelect?: (products: readonly string[]) => Promise<void> | void
  onDecline?: (products: readonly string[]) => Promise<void> | void
  disabled?: boolean
}): ReactNode {
  // Nothing is pre-selected: §49 is explicit that discovery must not become cross-selling.
  const [chosen, setChosen] = useState<readonly string[]>([])
  const [busy, setBusy] = useState(false)

  const toggle = (product: string) =>
    setChosen((current) =>
      current.includes(product)
        ? current.filter((item) => item !== product)
        : [...current, product],
    )

  const run = (fn: ((products: readonly string[]) => Promise<void> | void) | undefined, products: readonly string[]) => {
    if (!fn || products.length === 0) return
    setBusy(true)
    void Promise.resolve(fn(products)).finally(() => setBusy(false))
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <ul className="divide-y">
        {card.options.map((option) => (
          <li key={option.product}>
            <label className="flex cursor-pointer gap-3 px-4 py-3">
            <Checkbox
              className="mt-0.5"
              checked={chosen.includes(option.product)}
              onCheckedChange={() => toggle(option.product)}
              disabled={disabled ?? busy}
              aria-label={`Choose ${option.displayName}`}
            />
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
            </label>
          </li>
        ))}
      </ul>

      <div className="bg-muted/40 space-y-2 border-t p-3">
        <Button
          size="sm"
          className="w-full"
          disabled={(disabled ?? busy) || chosen.length === 0}
          onClick={() => run(onSelect, chosen)}
        >
          <CheckIcon />
          {chosen.length === 0
            ? 'Choose what you want to look at'
            : `Start ${String(chosen.length)} ${chosen.length === 1 ? 'application' : 'applications'}`}
        </Button>

        {onDecline !== undefined && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground w-full"
            disabled={disabled ?? busy}
            onClick={() => run(onDecline, card.options.map((option) => option.product))}
          >
            Not right now
          </Button>
        )}
      </div>
    </Card>
  )
}
