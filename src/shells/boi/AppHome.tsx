import type { ReactNode } from 'react'
import { MilestonePanel } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'

/** §14, §36 — the conversation is the consolidated view across every application. */
export function AppHome(): ReactNode {
  return (
    <div className="space-y-6">
      <SetupNotice />

      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Your applications</h1>
        <p className="text-muted-foreground text-sm">
          One conversation across everything you have in progress.
        </p>
      </div>

      <MilestonePanel
        milestone="M3 · M6"
        title="Concurrent applications and return"
        description="Status cards render from the database, never from model text."
        sections={['§13', '§14', '§36', '§59']}
        scope={[
          'Product selection creating several independent applications at once',
          'Outstanding requirements computed from facts, not remembered by the model',
          'Review and confirm before any submission',
          'Return summary describing exactly what changed since the last visit',
        ]}
      />
    </div>
  )
}
