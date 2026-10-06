import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { MessagesSquareIcon } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { PageHeader, MetricCard } from '@/admin/parts'
import { CaseList } from '@/admin/CaseList'
import { CaseDetail } from '@/admin/CaseDetail'
import { ActivityFeed, ActivityPlaceholder } from '@/admin/ActivityFeed'
import type { AdminOverview, Period } from '@contracts/admin.ts'

/**
 * The console's home: every conversation, the one being looked at, and what is happening.
 *
 * Three panes rather than a list page that navigates to a detail page. Somebody watching a room
 * use Baz is comparing conversations, not reading one — and losing the list every time they open
 * a case meant going back to find out who was next.
 *
 * The selection lives in the address (`/admin/case/:id`), so it is linkable and survives a
 * reload. The list is the same component either way.
 */
export function CasesWorkspace({
  data,
  period,
  onPeriodChange,
}: {
  readonly data: AdminOverview
  readonly period: Period
  readonly onPeriodChange: (next: Period) => void
}): ReactNode {
  const { caseId } = useParams<{ caseId: string }>()

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Cases"
        description="Every live conversation, what Baz understood, and what you can do about it."
        actions={<PeriodSelect value={period} onChange={onPeriodChange} />}
      />

      <Metrics metrics={data.metrics} previous={data.previous} />

      {/*
        react-resizable-panels v4: horizontal is the default orientation, and sizes are strings
        read as percentages — a bare number would be pixels.
      */}
      <ResizablePanelGroup className="min-h-0 flex-1 overflow-hidden rounded-xl border">
        <ResizablePanel defaultSize="25" minSize="18" maxSize="40">
          <CaseList cases={data.cases} selected={caseId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="50" minSize="30">
          {caseId === undefined ? (
            <NothingSelected />
          ) : (
            // Keyed so switching case resets the tabs rather than keeping whichever one the
            // previous conversation happened to be open on.
            // `@container`, so what is inside measures the pane rather than the window. A
            // two-column note keyed to `lg:` stayed two-column in a 550px pane.
            <div className="@container h-full overflow-y-auto p-4">
              <CaseDetail key={caseId} />
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="25" minSize="18" maxSize="40">
          <div className="h-full overflow-y-auto p-3">
            {data.activity.length > 0 ? (
              <ActivityFeed activity={data.activity} />
            ) : (
              <ActivityPlaceholder />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function NothingSelected(): ReactNode {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessagesSquareIcon />
        </EmptyMedia>
        <EmptyTitle>Pick a conversation</EmptyTitle>
        <EmptyDescription>
          What was said, what Baz made of it, and what you can do about it.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** How far back the numbers reach. */
function PeriodSelect({
  value,
  onChange,
}: {
  readonly value: Period
  readonly onChange: (next: Period) => void
}): ReactNode {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Period)}>
      <SelectTrigger className="w-40">
        <CalendarIcon />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  )
}

function Metrics({
  metrics,
  previous,
}: {
  readonly metrics: AdminOverview['metrics']
  readonly previous: AdminOverview['previous']
}): ReactNode {
  const tiles = [
    {
      label: 'Questions avoided',
      value: metrics.questionsAvoided,
      was: previous?.questionsAvoided,
      note: 'Answers reused instead of asked again. §53',
    },
    {
      label: 'Facts captured',
      value: metrics.factsCaptured,
      was: previous?.factsCaptured,
      note: 'Across every conversation.',
    },
    {
      label: 'Applications started',
      value: metrics.applicationsStarted,
      was: previous?.applicationsStarted,
      note: 'Begun from a card the customer tapped.',
    },
    {
      label: 'Requests blocked',
      value: metrics.requestsBlocked,
      was: previous?.requestsBlocked,
      note: 'Turned away before the model saw them. §25',
    },
  ]

  return (
    <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <MetricCard
          key={tile.label}
          label={tile.label}
          value={tile.value}
          previous={previous === null ? null : tile.was}
          note={tile.note}
        />
      ))}
    </div>
  )
}
