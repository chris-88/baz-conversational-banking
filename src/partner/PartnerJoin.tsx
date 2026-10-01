import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { MilestonePanel } from '@/components/MilestonePanel'
import { AppHeader } from '@/components/AppHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §6 Stage 9, §33 — a partner joins through a single-use token and sees only their own tasks. */
export function PartnerJoin(): ReactNode {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />
      <AppHeader subtitle="Second applicant" />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8 pb-20">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">You&rsquo;ve been invited</h1>
          <p className="text-muted-foreground text-sm">
            Complete your part of the applications you are named on.
          </p>
          <p className="text-muted-foreground text-2xs tabular">
            invite token present: {token ? 'yes' : 'no'}
          </p>
        </div>

        <MilestonePanel
          milestone="M5"
          title="Partner participation"
          description="Scoped data only: a partner never reads the primary customer's conversation."
          sections={['§6 Stage 9', '§33', '§29', '§58']}
          scope={[
            'The token is redeemed once, creating a partner with their own session',
            'A task list of exactly what this person must supply, with forms and uploads',
            'One answer satisfies that requirement in every application they are party to',
            'Completing a task updates the primary case live',
          ]}
        />
      </main>
    </div>
  )
}
