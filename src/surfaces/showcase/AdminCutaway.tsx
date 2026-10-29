import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CheckIcon,
  EyeIcon,
  PiggyBankIcon,
  ZapIcon,
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
  CONSOLE_MOVES,
  CONSOLE_PERSONA,
  CONSOLE_PLAN,
} from '@/content/showcase/admin'
import { CaseList } from '@/admin/CaseList'
import { ActivityFeed } from '@/admin/ActivityFeed'
import { GuardrailsScreen } from '@/admin/GuardrailsScreen'
import { PersonaControls } from '@/admin/PersonaControls'
import { MetricCard, PageHeader } from '@/admin/parts'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ProgressBar'
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

/** A console or packet window; the lock screen is drawn by the scene, in the phone. */
export type ConsoleView = Exclude<CutawayView, { kind: 'notification' }>

export function AdminCutaway({ view }: { readonly view: ConsoleView }): ReactNode {
  if (view.kind === 'payload') {
    return (
      <DesktopInset address="baz.chrisquinn.ie/#/admin/forms">
        <PayloadExcerpt />
      </DesktopInset>
    )
  }

  const section =
    view.screen === 'case' || view.screen === 'act'
      ? 'cases'
      : view.screen === 'goals'
        ? 'engine'
        : view.screen
  const address =
    view.screen === 'cases'
      ? ''
      : view.screen === 'case' || view.screen === 'act'
        ? 'case/1a2b3c4d'
        : view.screen === 'goals'
          ? 'engine'
          : view.screen

  return (
    <DesktopInset address={`baz.chrisquinn.ie/#/admin/${address}`}>
      <QueryClientProvider client={inert}>
        {/* Inert: a cutaway is a picture of the console, not the console. */}
        <div inert aria-hidden className="flex h-full min-h-0 select-none" style={{ zoom: 0.92 }}>
          <nav className="bg-muted/40 hidden w-44 shrink-0 flex-col gap-0.5 border-r p-2 lg:flex">
            {SECTIONS.map((item) => (
              <span
                key={item.id}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium [&>svg]:size-3.5',
                  item.id === section
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground',
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
    case 'act':
      return (
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5">
          <div className="min-h-0 overflow-hidden">
            <PageHeader
              title="Aoife Ní Bhriain"
              description="Customer · 3 applications · 1 transfer"
            />
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Transfers
            </p>
            <div className="mt-2 rounded-lg border p-3 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  €32,000 · AIB Savings Account → Bank of Ireland current account
                </span>
                <Badge className="text-[10px]">Settled</Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Once, under PSD2 through Nexus. Initiated by the customer; settled by the bank.
              </p>
            </div>
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Linked accounts
            </p>
            <ul className="mt-2 divide-y rounded-lg border px-3 text-[12.5px]">
              <li className="flex items-center justify-between py-2">
                <span>AIB · Current Account</span>
                <span className="text-muted-foreground">consent 90 days</span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span>AIB · Savings Account</span>
                <span className="text-muted-foreground">consent 90 days</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-[15px] font-semibold">Act as the bank</p>
            <p className="text-muted-foreground mt-1 text-[12.5px]">
              What a person can do on this case by hand. Each one is a real state-machine
              transition.
            </p>
            <ul className="mt-4 space-y-2">
              {CONSOLE_MOVES.map((move) => (
                <li
                  key={move.label}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-3 py-2.5',
                    move.done ? 'bg-success/5 border-success/30' : 'bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md [&>svg]:size-3.5',
                      move.done ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
                    )}
                  >
                    {move.done ? (
                      <CheckIcon strokeWidth={3} />
                    ) : move.label.startsWith('Their') ? (
                      <PiggyBankIcon />
                    ) : (
                      <ZapIcon />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{move.label}</span>
                    <span className="text-muted-foreground block text-[11.5px] leading-snug">
                      {move.note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    case 'goals':
      return (
        <div className="grid h-full min-h-0 grid-cols-2 gap-5">
          <div>
            <PageHeader
              title="Goals & needs"
              description="What the conversation is for, and what the bank promised to watch."
            />
            <div className="mt-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold">{CONSOLE_PLAN.title}</p>
                <Badge variant="secondary" className="text-[10px]">
                  Everything below is computed
                </Badge>
              </div>
              <p className="tabular mt-3 text-sm font-semibold">
                €{CONSOLE_PLAN.current.toLocaleString('en-IE')} of €
                {CONSOLE_PLAN.target.toLocaleString('en-IE')}
              </p>
              <div className="mt-1">
                <ProgressBar
                  value={CONSOLE_PLAN.current / CONSOLE_PLAN.target}
                  label={`target reached · projected ${CONSOLE_PLAN.projected}`}
                />
              </div>
              <ul className="mt-3 space-y-1.5">
                {CONSOLE_PLAN.milestones.map((milestone) => (
                  <li key={milestone.label} className="flex items-center gap-2 text-[12.5px]">
                    <span
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded-full [&>svg]:size-2.5',
                        milestone.achieved ? 'bg-success/15 text-success' : 'border-input border',
                      )}
                    >
                      {milestone.achieved && <CheckIcon strokeWidth={3} />}
                    </span>
                    <span className={milestone.achieved ? 'text-muted-foreground' : ''}>
                      {milestone.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mt-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Watching for
            </p>
            <div className="bg-success/5 border-success/30 mt-2 rounded-lg border p-3">
              <p className="flex items-center gap-2 text-[13px] font-medium">
                <EyeIcon aria-hidden className="size-4" />
                {CONSOLE_PLAN.watch}
              </p>
              <p className="text-success mt-1 flex items-center gap-1.5 text-[12px] font-medium">
                <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
                Met {CONSOLE_PLAN.watchMetOn}. Notified.
              </p>
            </div>
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Check-ins
            </p>
            <div className="mt-2 rounded-lg border p-3">
              <p className="flex items-center gap-2 text-[13px] font-medium">
                <CalendarClockIcon aria-hidden className="size-4" />
                {CONSOLE_PLAN.checkin.purpose}
              </p>
              <p className="text-muted-foreground mt-1 text-[12px]">
                {CONSOLE_PLAN.checkin.when} · done
              </p>
            </div>
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Needs
            </p>
            <ul className="mt-2 space-y-2">
              {CONSOLE_GOALS.map((goal) => (
                <li key={goal.title} className="bg-card rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold">{goal.title}</p>
                    <Badge
                      variant={goal.tier === 'Stated' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {goal.tier}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[12px]">{goal.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    case 'cases':
      return (
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,5fr)_minmax(0,3fr)] gap-5">
          <div className="min-h-0 overflow-hidden">
            <PageHeader
              title="Cases"
              description="Every conversation, and what each one needs from whoever is watching."
            />
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
            <PageHeader
              title="Aoife Ní Bhriain"
              description="Customer · 3 applications · 14 messages"
            />
            <p className="text-muted-foreground mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Facts, with where each came from
            </p>
            <ul className="mt-2 divide-y">
              {CONSOLE_FACTS.map((fact) => (
                <li
                  key={fact.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-3 py-1.5 text-[12.5px]"
                >
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
            <PageHeader
              title="Goals & needs"
              description="What the conversation is for, and what it implies."
            />
            <ul className="mt-4 space-y-2">
              {CONSOLE_GOALS.map((goal) => (
                <li key={goal.title} className="bg-card rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-semibold">{goal.title}</p>
                    <Badge
                      variant={goal.tier === 'Stated' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
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
