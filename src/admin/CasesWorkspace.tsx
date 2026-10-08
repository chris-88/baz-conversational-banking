import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontalIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/lib/queryKeys'
import { adminApi } from '@/admin/adminClient'
import { CaseContext } from '@/admin/CaseContext'
import { useRealtimeInvalidation } from '@/lib/useRealtimeInvalidation'
import { MessagesSquareIcon } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PeriodSelect, PageHeader, MetricCard } from '@/admin/parts'
import { euro, tokens } from '@/lib/utils'
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
  const queryClient = useQueryClient()

  /**
   * One fetch for both panes.
   *
   * The conversation and the context are two views of the same case, and fetching them
   * separately is two chances for them to disagree about what state it is in.
   */
  const inspection = useQuery({
    queryKey: queryKeys.admin.caseInspection(caseId ?? ''),
    queryFn: () => adminApi.inspect(caseId ?? ''),
    enabled: caseId !== undefined,
  })

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'case'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] })
  }, [queryClient])

  // The console follows the conversation as it happens, rather than needing a reload.
  useRealtimeInvalidation(
    ['messages', 'facts', 'applications', 'events', 'product_interests'],
    refresh,
  )

  const inspected = inspection.data ?? null

  return (
    <div className="@container flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Cases"
        description="Every live conversation, what Baz understood, and what you can do about it."
        actions={
          <>
            <PeriodSelect value={period} onChange={onPeriodChange} />
            <Controls onChanged={refresh} count={data.cases.length} />
          </>
        }
      />

      <Metrics metrics={data.metrics} previous={data.previous} cost={data.cost} />

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
          ) : inspected === null ? (
            <Loading />
          ) : (
            // Keyed so switching case resets the tabs rather than keeping whichever one the
            // previous conversation happened to be open on.
            <CaseDetail key={caseId} caseId={caseId} data={inspected} onChanged={refresh} />
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/*
          The right pane answers "what do I need to know": about this customer when one is
          selected, about everything when none is. Two questions, one place to look.
        */}
        <ResizablePanel defaultSize="25" minSize="18" maxSize="40">
          {inspected === null ? (
            <div className="h-full overflow-y-auto p-3">
              {data.activity.length > 0 ? (
                <ActivityFeed activity={data.activity} />
              ) : (
                <ActivityPlaceholder />
              )}
            </div>
          ) : (
            <CaseContext key={caseId} data={inspected} />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

/**
 * Running the prototype, rather than running a case.
 *
 * In a menu because they are used between demonstrations and never during one, and a button bar
 * that is wrong most of the time is worse than one click.
 */
function Controls({
  count,
  onChanged,
}: {
  readonly count: number
  readonly onChanged: () => void
}): ReactNode {
  const [confirming, setConfirming] = useState(false)
  const reset = useMutation({ mutationFn: adminApi.resetCase, onSuccess: onChanged })
  const purge = useMutation({
    mutationFn: adminApi.purgeCases,
    onSuccess: () => {
      setConfirming(false)
      onChanged()
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Controls">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem disabled={reset.isPending} onSelect={() => reset.mutate()}>
            <RotateCcwIcon />
            {reset.isPending ? 'Rebuilding…' : 'Rebuild the sample customer'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={count === 0 || purge.isPending}
            onSelect={(event) => {
              // The menu would close and take the dialog with it.
              event.preventDefault()
              setConfirming(true)
            }}
          >
            <Trash2Icon />
            Purge all {count} conversations
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete every conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              All {count} go, along with their facts, applications, plans and events. The sample
              customer can be rebuilt afterwards from this menu. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction onClick={() => purge.mutate()}>
              {purge.isPending ? 'Clearing…' : `Delete all ${String(count)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Loading(): ReactNode {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-72 w-full" />
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

function Metrics({
  metrics,
  previous,
  cost,
}: {
  readonly metrics: AdminOverview['metrics']
  readonly previous: AdminOverview['previous']
  readonly cost: AdminOverview['cost']
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
    {
      /*
       * The tokens are measured; the euro is those multiplied by prices held in
       * `domain/cost.ts`. Shown together because one of them is a fact and the other depends
       * on a rate that will be out of date before this is.
       */
      label: 'Cost to run',
      value: cost.euro,
      was: undefined,
      note: `${tokens(cost.tokens)} tokens across ${String(cost.turns)} turns, at today's prices.`,
      display: euro(cost.euro),
    },
  ]

  return (
    <div className="@3xl:grid-cols-3 @6xl:grid-cols-5 grid shrink-0 grid-cols-2 gap-4">
      {tiles.map((tile) => (
        <MetricCard
          key={tile.label}
          label={tile.label}
          value={tile.value}
          previous={previous === null ? null : tile.was}
          note={tile.note}
          {...(tile.display === undefined ? {} : { display: tile.display })}
        />
      ))}
    </div>
  )
}
