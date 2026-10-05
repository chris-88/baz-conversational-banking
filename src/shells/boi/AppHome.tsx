import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, BellIcon, MoreHorizontalIcon, WalletIcon } from 'lucide-react'
import { canonicalCustomer } from '@domain/seed/canonical.ts'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { SetupNotice } from '@/components/SetupNotice'
import { routes } from '@/app/routes'
import { StatusBadge } from '@/components/StatusBadge'
import { ProductIcon } from '@/components/ProductIcon'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ProgressBar'
import { NotificationCard } from '@/components/NotificationCard'
import { useApplications } from '@/lib/useApplications'
import { useCaseProgress } from '@/lib/useCaseProgress'
import { useCaseSession } from '@/lib/useCaseSession'

function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * §14, §36 — the consolidated view. "Your next steps" is the surface the conversation feeds:
 * everything in it will be derived from outstanding requirements once M3 lands, never written
 * by the model.
 */
export function AppHome(): ReactNode {
  const navigate = useNavigate()
  const session = useCaseSession()
  const applications = useApplications(session.data?.caseId ?? null)
  const progress = useCaseProgress({
    caseId: session.data?.caseId ?? null,
    applications: applications.data ?? [],
  })

  return (
    <div className="flex-1 space-y-6 px-4 pt-4 pb-28">
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
        >
          {canonicalCustomer.firstName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Hi {canonicalCustomer.firstName}</p>
          <p className="text-muted-foreground text-xs">{greeting()}</p>
        </div>
        <Link
          to={routes.app.baz}
          aria-label={
            session.data?.hasUpdates === true
              ? 'Notifications — something changed while you were away'
              : 'Notifications'
          }
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring relative grid size-9 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          <BellIcon aria-hidden className="size-5" />
          {session.data?.hasUpdates === true && (
            <span
              aria-hidden
              className="bg-state-progress ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"
            />
          )}
        </Link>
      </header>

      <SetupNotice />

      {session.data?.hasUpdates === true && (
        <NotificationCard
          title="New message from Baz"
          when="Since you were last here"
          preview="Something moved on your applications. Open the conversation and I'll talk you through what changed."
          actionLabel="View message"
          onAction={() => {
            void navigate(routes.app.baz)
          }}
        />
      )}

      <Link
        to={routes.app.baz}
        className="bg-brand-deep text-brand-deep-foreground focus-visible:ring-ring flex items-center gap-4 rounded-2xl p-5 focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="flex-1 space-y-1.5">
          <span className="block text-lg leading-tight font-semibold text-balance">
            Let’s make your next chapter happen.
          </span>
          <span className="block text-xs opacity-85">
            Tell Baz what you’re trying to do, or pick up where you left off.
          </span>
        </span>
        <span
          aria-hidden
          className="bg-primary-foreground/15 grid size-9 shrink-0 place-items-center rounded-full"
        >
          <ArrowRightIcon className="size-4" />
        </span>
      </Link>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Your accounts</h2>
          <span className="text-muted-foreground text-2xs">Synthetic</span>
        </div>
        <Card className="gap-0 p-4">
          <div className="flex items-start gap-3">
            <IconTile tone="primary"><WalletIcon /></IconTile>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Current Account</span>
              <span className="text-muted-foreground block text-xs">•••• 1234</span>
            </span>
          </div>

          <p className="tabular mt-3 text-h3 font-semibold">€3,482.50</p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Link to={routes.app.baz}>View details</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="More account actions (not part of this prototype)"
              className="px-3"
            >
              <MoreHorizontalIcon aria-hidden />
            </Button>
          </div>
        </Card>
        <p className="text-muted-foreground text-2xs">
          Synthetic balance. No real account is connected.
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Your applications</h2>
          <Link to={routes.app.baz} className="text-primary text-xs font-medium">
            Ask Baz
          </Link>
        </div>

        {applications.isPending && session.data ? (
          <Card className="gap-0 divide-y p-0">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </Card>
        ) : (applications.data?.length ?? 0) === 0 ? (
          <Card className="p-4">
            <p className="text-muted-foreground text-sm">
              Nothing in progress yet. Tell Baz what you&rsquo;re trying to do and it will start
              whatever you choose.
            </p>
          </Card>
        ) : (
          <Card className="gap-0 divide-y p-0">
            {applications.data?.map((application) => {
              const steps = progress.data?.get(application.id)
              const next = steps?.outstanding[0]

              return (
                <Link
                  key={application.id}
                  to={routes.app.baz}
                  className="hover:bg-muted/50 focus-visible:ring-ring block space-y-2.5 px-4 py-3.5 transition-colors first:rounded-t-xl last:rounded-b-xl focus-visible:ring-2 focus-visible:outline-none focus-visible:-outline-offset-2"
                >
                  <span className="flex items-center gap-3">
                    <ProductIcon product={application.product} size="sm" />
                    <span className="min-w-0 flex-1 text-sm font-medium text-pretty">
                      {application.displayName}
                    </span>
                    {/* The badge carries the state's own words, so colour is never the only signal. */}
                    <StatusBadge state={application.state} />
                  </span>

                  {steps && steps.total > 0 && (
                    <ProgressBar
                      value={steps.done / steps.total}
                      label={`${String(steps.done)} of ${String(steps.total)} done`}
                    />
                  )}

                  {next && (
                    <span className="text-muted-foreground block text-xs">
                      {next.waitingOnPartner ? 'With your partner: ' : 'Next: '}
                      <span className="text-foreground">{next.label}</span>
                      {steps && steps.outstanding.length > 1 &&
                        ` and ${String(steps.outstanding.length - 1)} more`}
                    </span>
                  )}
                </Link>
              )
            })}
          </Card>
        )}
      </section>
    </div>
  )
}
