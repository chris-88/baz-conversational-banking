import type { ReactNode } from 'react'
import { SparklesIcon, UserRoundIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { MilestonePanel } from '@/components/MilestonePanel'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { MobileHeader } from '@/shells/boi/MobileHeader'

/** §45, §46 — QR entry for the audience. An isolated case, never the presenter's. */
export function AudienceEntry(): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <MobileHeader subtitle="Try it yourself" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
        <section className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Try Baz</h1>
          <p className="text-muted-foreground text-sm">
            Your own private conversation, completely separate from the demonstration on screen.
          </p>
        </section>

        <Card className="gap-0 divide-y p-0">
          <ListRow
            leading={<IconTile tone="primary"><SparklesIcon /></IconTile>}
            title="Start fresh"
            subtitle="A brand new customer with nothing known about them"
            disabled
            onClick={() => undefined}
          />
          <ListRow
            leading={<IconTile tone="deep"><UserRoundIcon /></IconTile>}
            title="Use the demo customer"
            subtitle="Already signed in, with the facts the bank holds"
            disabled
            onClick={() => undefined}
          />
        </Card>
        <p className="text-muted-foreground text-2xs">Both options arrive in M8.</p>

        <MilestonePanel
          milestone="M8"
          title="Audience experience"
          description="Isolation enforced by case ownership, with hard caps."
          sections={['§45', '§46', '§47']}
          scope={[
            'A fresh session and a new case per scan',
            'Or clone the demo customer, already signed in with bank-held facts',
            'Turn and concurrent-case caps set by configuration',
            'No notifications, and the guardrails hold under deliberate probing',
          ]}
        />
      </main>
    </div>
  )
}
