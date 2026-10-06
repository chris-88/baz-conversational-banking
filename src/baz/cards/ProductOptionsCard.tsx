import { useState, type ReactNode } from 'react'
import { ArrowRightIcon } from 'lucide-react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductIcon } from '@/components/ProductIcon'
import { cn } from '@/lib/utils'

type Payload = Extract<CardPayload, { type: 'product_options' }>

/**
 * §8, §49 — Baz explains why something might fit; the customer chooses.
 *
 * Nothing is pre-selected and declining is offered beside accepting, because §49 is explicit
 * that discovery must not become cross-selling. Selecting calls `case-action`, which is what
 * actually creates applications (Invariant 1).
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
  const [chosen, setChosen] = useState<readonly string[]>([])
  const [busy, setBusy] = useState(false)

  const toggle = (product: string) =>
    setChosen((current) =>
      current.includes(product) ? current.filter((item) => item !== product) : [...current, product],
    )

  const run = (
    fn: ((products: readonly string[]) => Promise<void> | void) | undefined,
    products: readonly string[],
  ) => {
    if (!fn || products.length === 0 || busy) return
    setBusy(true)

    /**
     * A card that has committed stays spent.
     *
     * `busy` used to clear on completion, which put a live "Not right now" back on screen while
     * Baz was still answering the first one. Choosing and declining are decisions, not controls,
     * and the card stays in the transcript afterwards as a record of what was decided. Only a
     * failure gives it back, because then nothing was decided.
     */
    void Promise.resolve(fn(products)).catch(() => {
      setBusy(false)
    })
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <ul className="divide-y">
        {card.options.map((option) => {
          const selected = chosen.includes(option.product)

          return (
            <li key={option.product}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                  selected ? 'bg-accent/40' : 'hover:bg-muted/50',
                )}
              >
                <ProductIcon product={option.product} />

                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-balance">{option.displayName}</span>
                    {option.previouslyDeclined && (
                      <Badge variant="secondary" className="text-2xs shrink-0">
                        Declined before
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground block text-xs">{option.oneLine}</span>
                  <span className="text-foreground/75 block text-xs">{option.reason}</span>
                </span>

                <Checkbox
                  className="mt-1"
                  checked={selected}
                  onCheckedChange={() => toggle(option.product)}
                  disabled={disabled ?? busy}
                  aria-label={`Choose ${option.displayName}`}
                />
              </label>
            </li>
          )
        })}
      </ul>

      <div className="bg-muted/40 space-y-2 border-t p-3">
        <Button
          size="sm"
          className="w-full"
          disabled={(disabled ?? busy) || chosen.length === 0}
          onClick={() => run(onSelect, chosen)}
        >
          {chosen.length === 0
            ? 'Choose what to look at'
            : `Start ${String(chosen.length)} ${chosen.length === 1 ? 'application' : 'applications'}`}
          <ArrowRightIcon />
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
