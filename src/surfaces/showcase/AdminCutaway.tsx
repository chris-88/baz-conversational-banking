import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ActivityIcon,
  BarChart3Icon,
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TagIcon,
  TargetIcon,
  UsersIcon,
} from 'lucide-react'
import type { CutawayView } from '@/content/showcase/types'
import {
  CONSOLE_ACTIVITY,
  CONSOLE_BLOCKED,
  CONSOLE_CASES,
  CONSOLE_FACTS,
  CONSOLE_GOALS,
  CONSOLE_METRICS,
  CONSOLE_PERSONA,
} from '@/content/showcase/admin'
import { CaseList } from '@/admin/CaseList'
import { ActivityFeed } from '@/admin/ActivityFeed'
import { GuardrailsScreen } from '@/admin/GuardrailsScreen'
import { PersonaControls } from '@/admin/PersonaControls'
import { MetricCard, PageHeader } from '@/admin/parts'
import { Badge } from '@/components/ui/badge'
import { Claim } from '@/components/Primitives'
import { DesktopInset } from './DesktopInset'
import { PayloadExcerpt } from './PayloadExcerpt'
import { cn } from '@/lib/utils'

/**
 * The console, in cutaway.
 *
 * The console's own list, feed, guardrails and persona components, fed fixture data typed
 * against the console's contract. They are rendered inert: nothing inside can be tabbed to
 * or clicked, the mutations they define are never fired, and the query client they see has
 * fetching switched off, so a screen that would normally load its own data shows the fixture
 * and nothing else. The analytics cutaway is a grid of the console's metric cards and is
 * labelled illustrative, because the console computes those numbers from live events.
 */
const SECTIONS = [
  { id: 'cases', label: 'Cases', icon: <FolderIcon /> },
  { id: 'engine', label: 'Goals & needs', icon: <TargetIcon /> },
  { id: 'catalogue', label: 'Products & rates', icon: <TagIcon /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3Icon /> },
  { id: 'forms', label: 'Digital forms', icon: <FileTextIcon /> },
  { id: 'guardrails', label: 'Guardrails', icon: <ShieldCheckIcon /> },
  { id: 'persona', label: 'Persona', icon: <SlidersHorizontalIcon /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquareIcon /> },
  { id: 'collaborators', label: 'Collaborators', icon: <UsersIcon /> },
] as const

const inert = new QueryClient({
  defaultOptions: { queries: { enabled: false, retry: false }, mutations: { retry: false } },
})

const noop = (): void => undefined

export function AdminCutaway({ view }: { readonly view: CutawayView }): ReactNode {
  if (view.kind === 'payload') {
    return (
      <DesktopInset address="baz.chrisquinn.ie/#/admin/forms">
        <PayloadExcerpt />
      </DesktopInset>
    )
  }

  const section =
    view.screen === 'case' ? 'cases' : view.screen === 'analytics' ? 'analytics' : view.screen

  return (
    <DesktopInset address={`baz.chrisquinn.ie/#/admin/${view.screen === 'cases' ? '' : view.screen === 'case' ? 'case/1a2b3c4d' : view.screen}`}>
      <QueryClientProvider client={inert}>
        {/* Inert: a cutaway is a picture of the console, not the console. */}
        <div inert aria-hidden className="flex h-full min-h-0 select-none" style={{ zoom: 0.92 }}>
          <nav className="bg-muted/40 hidden w-44 shrink-0 flex-col gap-0.5 border-r p-2 lg:flex">
            {SECTIONS.map((item) => (
              <span
                key={item.id}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium [&>svg]:size-3.5',
                  item.id === section ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-hidden p-5">
            <Screen screen={view.screen} />
          </div>
        </div>
      </QueryClientProvider>
    </DesktopInset>
  )
}

function Screen({
  screen,
}: {
  readonly screen: Extract<CutawayView, { kind: 'admin' }>['screen']
}): ReactNode {
  switch (screen) {
    case 'cases':
      return (
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,5fr)_minmax(0,3fr)] gap-5">
          <div className="min-h-0 overflow-hidden">
            <PageHeader title="Cases" description="Every conversation, and what each one needs from whoever is watching." />
            <div className="mt-4 h-[calc(100%-4.5rem)] overflow-hidden rounded-lg border">
              <CaseList cases={CONSOLE_CASES} selected={CONSOLE_CASES[0]?.id} />
            </div>
          </div>
          <ActivityFeed activity={CONSOLE_ACTIVITY} />
        </div>
      )
    case 'case':
      return (
        <div className="grid h-full min-h-0 grid-cols-2 gap-5">
          <div className="min-h-0 overflow-hidden">
            <PageHeader title="Aoife Ní Bhriain" description="Customer · 3 applications · 14 messages" />
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Facts, with where each came from
            </p>
            <ul className="mt-2 divide-y">
              {CONSOLE_FACTS.map((fact) => (
                <li key={fact.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-3 py-1.5 text-[12.5px]">
                  <span className="text-muted-foreground truncate">{fact.label}</span>
                  <span className="truncate font-medium">{fact.value}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {fact.source}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <PageHeader title="Goals & needs" description="What the conversation is for, and what it implies." />
            <ul className="mt-4 space-y-2">
              {CONSOLE_GOALS.map((goal) => (
                <li key={goal.title} className="bg-card rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-semibold">{goal.title}</p>
                    <Badge variant={goal.tier === 'Stated' ? 'default' : 'secondary'} className="text-[10px]">
                      {goal.tier}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[12.5px]">{goal.detail}</p>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-[11.5px]">
              <ActivityIcon aria-hidden className="size-3" />
              Every row above is an event the console can replay.
            </p>
          </div>
        </div>
      )
    case 'guardrails':
      return (
        <div className="h-full min-h-0 overflow-hidden">
          <GuardrailsScreen blocked={CONSOLE_BLOCKED} killSwitch={false} onChanged={noop} />
        </div>
      )
    case 'persona':
      return (
        <div className="h-full min-h-0 overflow-hidden">
          <PersonaControls persona={CONSOLE_PERSONA} onChanged={noop} />
        </div>
      )
    case 'analytics':
      return (
        <div className="h-full min-h-0 overflow-hidden">
          <PageHeader
            title="Analytics"
            description="Derived from events. These figures are illustrative."
            actions={<Claim kind="illustrative" />}
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <MetricCard label="Questions avoided" {...CONSOLE_METRICS.questionsAvoided} />
            <MetricCard label="Facts captured" {...CONSOLE_METRICS.factsCaptured} />
            <MetricCard label="Applications started" {...CONSOLE_METRICS.applicationsStarted} />
            <MetricCard label="Requests blocked" {...CONSOLE_METRICS.requestsBlocked} />
          </div>
        </div>
      )
  }
}
