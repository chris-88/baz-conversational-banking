import type { ReactNode } from 'react'
import { MilestonePanel, type MilestonePanelProps } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'

type Section = 'cases' | 'persona' | 'domain' | 'audience'

const panels: Record<Section | 'overview', MilestonePanelProps> = {
  overview: {
    milestone: 'M1 · M7',
    title: 'Presenter console',
    description: 'Everything the presenter needs to drive and recover the demonstration.',
    sections: ['§37', '§43'],
    scope: [
      'Reset to the canonical presenter case — built in M1, because it is needed constantly',
      'Global kill switch making the gate return a "demo paused" response',
      'Notification send as a separate, deliberate action',
    ],
  },
  cases: {
    milestone: 'M7',
    title: 'Case inspection and event control',
    description: 'See the structured context behind the conversation, and move state deliberately.',
    sections: ['§40', '§41'],
    scope: [
      'Context with provenance: where each fact came from and whether it is verified',
      'Applications with outstanding requirements, computed not remembered',
      'Conversation and the full event log with actor',
      'Event simulator: each button is a state-machine transition, never a random timer',
    ],
  },
  persona: {
    milestone: 'M7',
    title: 'Persona controls',
    description: 'Six sliders and named presets. Style only — never scope, tools or protections.',
    sections: ['§17', '§18', '§38'],
    scope: [
      'Sliders: length, humour, sarcasm, formality, playfulness, poetic',
      'Presets: default, concise, friendly, formal, dry humour, poetic',
      'Read fresh every turn so a change applies to the next message',
      'No free-text persona instructions, ever',
    ],
  },
  domain: {
    milestone: 'M7',
    title: 'Domain controls',
    description: 'What is in scope, and proof that enforcement sits in front of the model.',
    sections: ['§19', '§25', '§39'],
    scope: [
      'The permitted domain, shown as categories',
      'Blocked-request log with the gate category that caused it',
      'Evidence that the model never saw the blocked input',
    ],
  },
  audience: {
    milestone: 'M8',
    title: 'Audience activity',
    description: 'Live view of audience sessions, with purge.',
    sections: ['§44', '§47'],
    scope: [
      'Session and case counts, turns used against the cap',
      'Needs discovered and questions avoided, derived from events',
      'Purge audience cases without touching the presenter case',
    ],
  },
}

export function AdminOverview({ section }: { section?: Section }): ReactNode {
  const panel = panels[section ?? 'overview']

  return (
    <div className="space-y-6">
      <SetupNotice />
      <MilestonePanel {...panel} />
    </div>
  )
}
