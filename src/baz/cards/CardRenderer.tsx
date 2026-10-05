import type { ReactNode } from 'react'
import type { Card } from '@contracts/cards.ts'
import { ProductOptionsCard } from '@/baz/cards/ProductOptionsCard'
import { StatusCard } from '@/baz/cards/StatusCard'
import { ReviewCard } from '@/baz/cards/ReviewCard'
import { PausePromptCard } from '@/baz/cards/PausePromptCard'
import { ConsentCard } from '@/baz/cards/ConsentCard'
import { HealthFormCard } from '@/baz/cards/HealthFormCard'

/**
 * The card registry.
 *
 * An exhaustive switch, so adding a card type to the contract without building its component
 * fails the typecheck rather than rendering nothing at the customer.
 */
export type CardActions = {
  readonly onSelectProducts?: (products: readonly string[]) => Promise<void> | void
  readonly onDeclineProducts?: (products: readonly string[]) => Promise<void> | void
  readonly onSubmit?: (
    applicationId: string,
    confirmations: readonly string[],
  ) => Promise<void> | void
  readonly onPauseDecision?: (
    applicationId: string,
    decision: 'pause' | 'continue',
  ) => Promise<void> | void
  readonly onConsent?: (applicationId: string, requirementId: string) => Promise<void> | void
  readonly onHealthForm?: (
    applicationId: string,
    values: readonly { key: string; value: unknown }[],
  ) => Promise<void> | void
}

export function CardRenderer({
  card,
  actions = {},
  disabled,
}: {
  card: Card
  actions?: CardActions
  disabled?: boolean
}): ReactNode {
  switch (card.type) {
    case 'product_options':
      return (
        <ProductOptionsCard
          card={card}
          {...(actions.onSelectProducts ? { onSelect: actions.onSelectProducts } : {})}
          {...(actions.onDeclineProducts ? { onDecline: actions.onDeclineProducts } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'status':
      return <StatusCard card={card} />

    case 'review':
      return (
        <ReviewCard
          card={card}
          {...(actions.onSubmit ? { onSubmit: actions.onSubmit } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'pause_prompt':
      return (
        <PausePromptCard
          card={card}
          {...(actions.onPauseDecision ? { onDecide: actions.onPauseDecision } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'consent':
      return (
        <ConsentCard
          card={card}
          {...(actions.onConsent ? { onConsent: actions.onConsent } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'health_form':
      return (
        <HealthFormCard
          card={card}
          {...(actions.onHealthForm ? { onSubmit: actions.onHealthForm } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    // Built in M5, alongside the partner experience.
    case 'partner_invite':
    case 'upload_request':
      return null
  }
}
