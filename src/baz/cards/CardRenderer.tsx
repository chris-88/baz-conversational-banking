import type { ReactNode } from 'react'
import type { Card } from '@contracts/cards.ts'
import { ProductOptionsCard } from '@/baz/cards/ProductOptionsCard'
import { StatusCard } from '@/baz/cards/StatusCard'

/**
 * The card registry.
 *
 * An exhaustive switch, so adding a card type to the contract without building its component
 * fails the typecheck rather than rendering nothing at the customer.
 */
export function CardRenderer({
  card,
  onSelectProducts,
  disabled,
}: {
  card: Card
  onSelectProducts?: (products: readonly string[]) => void
  disabled?: boolean
}): ReactNode {
  switch (card.type) {
    case 'product_options':
      return (
        <ProductOptionsCard
          card={card}
          {...(onSelectProducts ? { onSelect: onSelectProducts } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'status':
      return <StatusCard card={card} />

    // Built in M3, when the actions behind them exist.
    case 'review':
    case 'pause_prompt':
    case 'partner_invite':
    case 'upload_request':
      return null
  }
}
