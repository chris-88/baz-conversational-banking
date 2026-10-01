import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { MilestonePanel } from '@/components/MilestonePanel'
import { AppHeader } from '@/components/AppHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §45, §46 — QR entry for the audience. An isolated case, never the presenter's. */
export function AudienceEntry(): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <AppHeader subtitle="Try it yourself" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8 pb-20">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Try Baz</h1>
          <p className="text-muted-foreground text-sm">
            Your own private conversation, separate from the demonstration.
          </p>
        </div>

        <div className="grid gap-2">
          <Button size="lg" disabled>
            Start fresh
          </Button>
          <Button size="lg" variant="outline" disabled>
            Use the demo customer
          </Button>
        </div>

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
