import type { ReactNode } from 'react'
import {
  GaugeIcon,
  PowerIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconTile } from '@/components/IconTile'
import { ListRow } from '@/components/ListRow'
import { MilestonePanel, type MilestonePanelProps } from '@/components/MilestonePanel'
import { SetupNotice } from '@/components/SetupNotice'

type Section = 'cases' | 'persona' | 'domain' | 'audience'

/** The controls the presenter reaches for, listed where they will live. */
const controls: Readonly<
  Record<Section | 'overview', readonly { icon: ReactNode; title: string; subtitle: string }[]>
> = {
  overview: [
    { icon: <RotateCcwIcon />, title: 'Reset to the canonical case', subtitle: 'Restores the presenter case · §43' },
    { icon: <SendIcon />, title: 'Send a notification', subtitle: 'A separate, deliberate action · §42' },
    { icon: <PowerIcon />, title: 'Demo kill switch', subtitle: 'The gate returns "demo paused" · §43' },
  ],
  cases: [
    { icon: <GaugeIcon />, title: 'Case inspector', subtitle: 'Context with provenance, applications, events · §40' },
    { icon: <ShieldAlertIcon />, title: 'Event simulator', subtitle: 'Each button is a state-machine transition · §41' },
  ],
  persona: [
    { icon: <SlidersHorizontalIcon />, title: 'Six sliders', subtitle: 'Length, humour, sarcasm, formality, playfulness, poetic' },
    { icon: <SlidersHorizontalIcon />, title: 'Presets', subtitle: 'Default, concise, friendly, formal, dry humour, poetic' },
  ],
  domain: [
    { icon: <ShieldAlertIcon />, title: 'Permitted domain', subtitle: 'The categories the gate routes on · §39' },
    { icon: <ShieldAlertIcon />, title: 'Blocked requests', subtitle: 'With the category that caused each one' },
  ],
  audience: [
    { icon: <UsersIcon />, title: 'Live audience activity', subtitle: 'Sessions, turns used against the cap · §44' },
    { icon: <RotateCcwIcon />, title: 'Purge audience cases', subtitle: 'Never touches the presenter case' },
  ],
}

const panels: Record<Section | 'overview', MilestonePanelProps> = {
  overview: {
    milestone: 'M1 · M7',
    title: 'Presenter console',
    description: 'Everything needed to drive and recover the demonstration.',
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
  const key = section ?? 'overview'

  return (
    <div className="space-y-6">
      <SetupNotice />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Controls</h2>
          <Badge variant="secondary" className="text-2xs">
            Not wired up yet
          </Badge>
        </div>
        <Card className="gap-0 divide-y p-0">
          {controls[key].map((control) => (
            <ListRow
              key={control.title}
              leading={<IconTile tone="neutral" size="sm">{control.icon}</IconTile>}
              title={control.title}
              subtitle={control.subtitle}
            />
          ))}
        </Card>
      </section>

      <MilestonePanel {...panels[key]} />
    </div>
  )
}
