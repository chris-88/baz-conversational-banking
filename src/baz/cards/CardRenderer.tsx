import type { ReactNode } from 'react'
import type { Card } from '@contracts/cards.ts'
import { ProductOptionsCard } from '@/baz/cards/ProductOptionsCard'
import { QuoteCard } from '@/baz/cards/QuoteCard'
import { MortgageRatesCard } from '@/baz/cards/MortgageRatesCard'
import { ComparisonCard } from '@/baz/cards/ComparisonCard'
import { StatusCard } from '@/baz/cards/StatusCard'
import { ReviewCard } from '@/baz/cards/ReviewCard'
import { PausePromptCard } from '@/baz/cards/PausePromptCard'
import { ConsentCard } from '@/baz/cards/ConsentCard'
import { HealthFormCard } from '@/baz/cards/HealthFormCard'
import { PartnerInviteCard } from '@/baz/cards/PartnerInviteCard'
import { UploadRequestCard } from '@/baz/cards/UploadRequestCard'
import { PlanProposalCard } from '@/baz/cards/PlanProposalCard'

/**
 * The card registry.
 *
 * An exhaustive switch, so adding a card type to the contract without building its component
 * fails the typecheck rather than rendering nothing at the customer.
 */
export type CardActions = {
  readonly onSelectProducts?: (products: readonly string[]) => Promise<void> | void
  readonly onDeclineProducts?: (products: readonly string[]) => Promise<void> | void
  /** A quote option the customer wants to go through. Explains; starts nothing. */
  readonly onDiscussQuote?: (option: { id: string; name: string }) => Promise<void> | void
  /** A catalogue product they want to hear about. Also explains; also starts nothing. */
  readonly onChooseComparison?: (option: { id: string; name: string }) => Promise<void> | void
  /** Resolves true only when the server accepted the submit. */
  readonly onSubmit?: (
    applicationId: string,
    confirmations: readonly string[],
  ) => Promise<boolean> | boolean
  readonly onPauseDecision?: (
    applicationId: string,
    decision: 'pause' | 'continue',
  ) => Promise<void> | void
  readonly onConsent?: (applicationId: string, requirementId: string) => Promise<void> | void
  readonly onHealthForm?: (
    applicationId: string,
    values: readonly { key: string; value: unknown }[],
  ) => Promise<void> | void
  readonly onInvitePartner?: (name: string) => Promise<string | undefined> | string | undefined
  readonly onUpload?: (requestId: string, file: File, documentType: string) => Promise<void>
  /** Resolves true only when the server accepted the plan. */
  readonly onConfirmPlan?: (planId: string) => Promise<boolean> | boolean
  readonly onDeclinePlan?: (planId: string) => Promise<void> | void
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
    case 'plan_proposal':
      return (
        <PlanProposalCard
          card={card}
          {...(actions.onConfirmPlan ? { onConfirm: actions.onConfirmPlan } : {})}
          {...(actions.onDeclinePlan ? { onDecline: actions.onDeclinePlan } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'mortgage_rates':
      return <MortgageRatesCard card={card} />

    case 'comparison':
      return (
        <ComparisonCard
          card={card}
          {...(actions.onChooseComparison ? { onChoose: actions.onChooseComparison } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'quote':
      return (
        <QuoteCard
          card={card}
          {...(actions.onDiscussQuote ? { onDiscuss: actions.onDiscussQuote } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

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

    case 'partner_invite':
      return (
        <PartnerInviteCard
          card={card}
          {...(actions.onInvitePartner ? { onInvite: actions.onInvitePartner } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )

    case 'upload_request':
      return (
        <UploadRequestCard
          card={card}
          {...(actions.onUpload ? { onUpload: actions.onUpload } : {})}
          {...(disabled === undefined ? {} : { disabled })}
        />
      )
  }
}
