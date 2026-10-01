import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { MilestonePanel } from '@/components/MilestonePanel'
import { BoiHeader } from '@/shells/boi/BoiHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §45, §46 — QR entry for the audience. Isolated case, never touches the presenter case. */
export function AudienceEntry(): ReactNode {
  return (
    <div className="boi-theme bg-background min-h-dvh">
      <PrototypeBanner />
      <BoiHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Try Baz</h1>
          <p className="text-muted-foreground text-sm">
            Your own private conversation, separate from the demonstration.
          </p>
        </div>

        <div className="grid gap-2">
          <Button disabled>Start fresh</Button>
          <Button variant="secondary" disabled>
            Use the demo customer
          </Button>
        </div>

        <MilestonePanel
          milestone="M8"
          title="Audience experience"
          description="Isolation enforced by case ownership under RLS, with hard caps."
          sections={['§45', '§46', '§47']}
          scope={[
            'A fresh anonymous session and a new case per scan',
            'Option to clone the canonical customer, already authenticated with bank-held facts',
            'Turn and concurrent-case caps from environment configuration',
            'No SMS, and the guardrails hold under deliberate probing',
          ]}
        />
      </main>
    </div>
  )
}
