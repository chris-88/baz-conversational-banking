import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { MilestonePanel } from '@/components/MilestonePanel'
import { BoiHeader } from '@/shells/boi/BoiHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §6 Stage 9, §33 — partner joins through a single-use token and sees only their own tasks. */
export function PartnerJoin(): ReactNode {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="boi-theme bg-background min-h-dvh">
      <PrototypeBanner />
      <BoiHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">You&rsquo;ve been invited</h1>
          <p className="text-muted-foreground text-sm">
            Complete your part of the applications you are named on.
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            invite token present: {token ? 'yes' : 'no'}
          </p>
        </div>

        <MilestonePanel
          milestone="M5"
          title="Partner participation"
          description="Scoped DTOs only: the partner never reads tables or the primary's conversation."
          sections={['§6 Stage 9', '§33', '§29', '§58']}
          scope={[
            'Token redeemed once, creating a partner participant with its own anonymous session',
            'Task list of exactly what this person must supply, with forms and uploads',
            'One partner answer satisfies that requirement in every application they are party to',
            'Completion writes events and updates the primary case over Realtime',
          ]}
        />
      </main>
    </div>
  )
}
