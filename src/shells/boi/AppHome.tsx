import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, BellIcon, HomeIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { canonicalCustomer } from '@domain/seed/canonical.ts'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { SetupNotice } from '@/components/SetupNotice'
import { routes } from '@/app/routes'

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
        <button
          type="button"
          disabled
          aria-label="Notifications (not available in this prototype)"
          className="text-muted-foreground grid size-9 place-items-center rounded-full opacity-50"
        >
          <BellIcon aria-hidden className="size-5" />
        </button>
      </header>

      <SetupNotice />

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
          <span className="text-muted-foreground text-xs">View all</span>
        </div>
        <Card className="gap-0 p-0">
          <ListRow
            leading={<IconTile tone="primary"><WalletIcon /></IconTile>}
            title="Current Account"
            subtitle="•••• 1234"
            trailing={<span className="tabular text-sm font-semibold">€3,482.50</span>}
          />
        </Card>
        <p className="text-muted-foreground text-2xs">
          Synthetic balance. No real account is connected.
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Your next steps</h2>
          <span className="text-muted-foreground text-xs">M3</span>
        </div>
        <Card className="gap-0 divide-y p-0">
          <ListRow
            leading={<IconTile tone="deep"><HomeIcon /></IconTile>}
            title="Complete your mortgage application"
            subtitle="Computed from outstanding requirements, not remembered"
          />
          <ListRow
            leading={<IconTile tone="warning"><UsersIcon /></IconTile>}
            title="Your joint account invitation"
            subtitle={`Sent to ${'Emma'} · waiting for completion`}
          />
        </Card>
      </section>
    </div>
  )
}
