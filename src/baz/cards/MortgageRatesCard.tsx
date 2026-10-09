import type { ReactNode } from 'react'
import type { Card as CardPayload } from '@contracts/cards.ts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Payload = Extract<CardPayload, { type: 'mortgage_rates' }>

const money = (amount: number): string => `€${amount.toLocaleString('en-IE')}`

/**
 * The bank's published mortgage rates, for this customer and this property.
 *
 * The rate is the headline because it is what was asked for, but the APRC sits under it
 * deliberately: they are different numbers and the one people compare on is usually the wrong
 * one. Cashback gets its own line in euro rather than a percentage, because "2% of drawdown"
 * and "€13,000" are the same fact and only one of them is a decision.
 *
 * Every figure here was selected and calculated by the server from the rate table. There is no
 * rate data in this file, and nothing on this card is tappable — a published rate is not an
 * offer, and a card that looks like one would be saying so.
 */
export function MortgageRatesCard({ card }: { card: Payload }): ReactNode {
  const { basis } = card

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="space-y-1 p-4 pb-3">
        <p className="text-sm font-semibold">{card.title}</p>
        <p className="text-muted-foreground text-xs">
          {[
            basis.buyerType,
            `BER ${basis.ber}`,
            basis.amountEur === null ? null : money(basis.amountEur),
            basis.termYears === null ? null : `over ${String(basis.termYears)} years`,
          ]
            .filter((part) => part !== null)
            .join(' · ')}
        </p>
      </div>

      <ul className="space-y-2 px-3 pb-3">
        {card.options.map((option) => (
          <li key={option.id} className="rounded-xl border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{option.label}</p>
                {/*
                  A variable rate's term and its family are both just "Variable", and printing
                  it twice reads as a mistake rather than as emphasis.
                */}
                {option.familyLabel === option.label ? null : (
                  <p className="text-muted-foreground truncate text-xs">{option.familyLabel}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base leading-tight font-bold tabular-nums">
                  {option.ratePct.toFixed(2)}%
                </p>
                {option.aprcPct === null ? null : (
                  <p className="text-muted-foreground text-2xs tabular-nums">
                    {option.aprcPct.toFixed(1)}% APRC
                  </p>
                )}
              </div>
            </div>

            {option.monthlyEur === null && option.cashbackEur === null ? null : (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {option.monthlyEur === null ? null : (
                  <Badge variant="secondary" className="font-normal tabular-nums">
                    {money(option.monthlyEur)} a month
                  </Badge>
                )}
                {option.cashbackEur === null ? (
                  <Badge variant="outline" className="text-muted-foreground font-normal">
                    No cashback
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal tabular-nums">
                    {money(option.cashbackEur)} cashback
                  </Badge>
                )}
              </div>
            )}

            {option.note === null ? null : (
              <p className="text-muted-foreground mt-2 text-xs leading-snug">{option.note}</p>
            )}
          </li>
        ))}
      </ul>

      {/*
        The as-of date, because a rate without one cannot be checked — and this table is the
        bank's own published snapshot rather than a live feed.
      */}
      <p className="text-muted-foreground bg-muted/40 border-t px-4 py-2.5 text-xs leading-snug">
        Published rates as at {card.asOf}. A rate is not an offer — what you can borrow depends on
        a full assessment.
      </p>
    </Card>
  )
}
