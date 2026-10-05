import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClockIcon, ChevronRightIcon, FlagIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ProgressBar'
import { IconTile } from '@/components/IconTile'
import type { PlanView } from '@/lib/usePlans'
import { routes } from '@/app/routes'

const euro = (amount: number): string => `€${amount.toLocaleString('en-IE')}`

/**
 * §31 — "Your plans", above the accounts.
 *
 * The app already shows balances and applications. What it has never been able to show is why
 * they exist together, which is the only thing on this screen a customer could not get from a
 * statement.
 */
export function PlanSummary({ plans }: { plans: readonly PlanView[] }): ReactNode {
  const active = plans.filter(({ plan }) => plan.status === 'active')
  if (active.length === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Your plans</h2>
        <span className="text-muted-foreground text-2xs">Baz is tracking these</span>
      </div>

      {active.map(({ plan, progress }) => (
        <Card key={plan.id} className="gap-0 p-0">
          <Link
            to={routes.app.baz}
            className="hover:bg-muted/50 focus-visible:ring-ring block rounded-xl p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex items-start gap-3">
              <IconTile tone="deep" size="sm">
                <FlagIcon />
              </IconTile>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-pretty">{plan.title}</span>
                {progress.current !== null && progress.target !== null && (
                  <span className="tabular text-muted-foreground block text-xs">
                    {euro(progress.current)} of {euro(progress.target)}
                  </span>
                )}
              </span>
              <ChevronRightIcon aria-hidden className="text-muted-foreground mt-1 size-4 shrink-0" />
            </span>

            {progress.fraction !== null && (
              <span className="mt-3 block">
                <ProgressBar
                  value={progress.fraction}
                  label={
                    progress.monthsRemaining === null
                      ? 'towards your target'
                      : progress.monthsRemaining === 0
                        ? 'target reached'
                        : `about ${String(progress.monthsRemaining)} month${progress.monthsRemaining === 1 ? '' : 's'} to go`
                  }
                />
              </span>
            )}

            {progress.nextMilestone !== null && (
              <span className="text-muted-foreground mt-2 block text-xs">
                Next: <span className="text-foreground">{progress.nextMilestone.label}</span>
              </span>
            )}

            {/* §20 — the customer can see the next contact is scheduled and why. */}
            {progress.nextCheckin !== null && (
              <span className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <CalendarClockIcon aria-hidden className="size-3.5" />
                {progress.nextCheckin.purpose}
                {progress.nextCheckin.dueAt !== null &&
                  ` · ${progress.nextCheckin.dueAt.slice(0, 10)}`}
              </span>
            )}
          </Link>
        </Card>
      ))}
    </section>
  )
}
