import type { ReactNode } from 'react'
import { MilestonePanel } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'

/** §14, §36 — the conversation is the consolidated view across every application. */
export function AppHome(): ReactNode {
  return (
    <div className="space-y-6">
      <SetupNotice />

      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Your applications</h1>
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
          'Choosing products creates several independent applications at once',
          'What each one still needs is computed from facts, not remembered by the model',
          'Nothing is submitted without being shown to you and confirmed',
          'Coming back shows exactly what changed while you were away',
        ]}
      />
    </div>
  )
}
