import { useMemo, useState, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { goalCatalogue } from '@domain/goals/catalogue.ts'
import { lifeEventClusters } from '@domain/goals/clusters.ts'
import { GOAL_THRESHOLDS } from '@domain/goals/types.ts'
import { needCatalogue } from '@domain/needs/catalogue.ts'
import { NEED_PRIORITIES, NEED_THRESHOLDS } from '@domain/needs/types.ts'
import { PageHeader } from '@/admin/parts'
import { CatalogueList, type CatalogueEntry } from '@/admin/CatalogueList'
import { ClusterDetail, GoalDetail, NeedDetail } from '@/admin/CatalogueDetail'

/**
 * What Baz knows how to recognise, and what it does about it (§6).
 *
 * The catalogue is the answer to the question this prototype always gets asked — whether the
 * model is deciding any of this. Twenty-six goals, nine needs and ten life events, each with the
 * conditions that raise it, the information it needs before it can be acted on, and the rules
 * that hold it back. None of it is prompt text.
 */
export function EngineScreen(): ReactNode {
  /*
   * Two layouts, decided by how wide the content column is rather than the window — this screen
   * sits beside a sidebar that collapses. Wide: a fixed-height frame where the list scrolls on
   * its own. Narrow: everything stacks at natural height and the page scrolls, because a
   * squashed list over a squashed detail is worse than scrolling.
   */
  return (
    <div className="@container @3xl:h-full @3xl:min-h-0 flex flex-col gap-4">
      <PageHeader
        title="Goals and needs"
        description="The catalogue the engines read. Conditions over facts, scored and combined — not phrases the model matches on."
      />

      <Thresholds />

      <Tabs defaultValue="goals" className="@3xl:min-h-0 @3xl:flex-1 flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="goals">Goals ({goalCatalogue.length})</TabsTrigger>
          <TabsTrigger value="needs">Needs ({needCatalogue.length})</TabsTrigger>
          <TabsTrigger value="events">Life events ({lifeEventClusters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="@3xl:min-h-0 @3xl:flex-1">
          <Goals />
        </TabsContent>

        <TabsContent value="needs" className="@3xl:min-h-0 @3xl:flex-1">
          <Needs />
        </TabsContent>

        <TabsContent value="events" className="@3xl:min-h-0 @3xl:flex-1">
          <Clusters />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** The two-pane frame. The container is the screen root, so these rules measure the column. */
function Split({
  list,
  detail,
}: {
  readonly list: ReactNode
  readonly detail: ReactNode
}): ReactNode {
  return (
    <div className="@3xl:grid-cols-[22rem_1fr] @3xl:h-full @3xl:min-h-0 grid gap-4">
      {/* Capped rather than full height when stacked, so the list cannot push detail off-screen. */}
      <Card className="@3xl:max-h-none @3xl:min-h-0 max-h-[26rem] overflow-hidden py-0">
        {list}
      </Card>
      <div className="@3xl:overflow-y-auto @3xl:min-h-0">{detail}</div>
    </div>
  )
}

function Goals(): ReactNode {
  const entries = useMemo<readonly CatalogueEntry[]>(
    () =>
      goalCatalogue.map((goal) => ({
        id: goal.id,
        name: goal.name,
        summary: goal.description,
        group: goal.category,
        rank: null,
        rankOrder: 0,
        sensitive: false,
        searchable: goal.signals.map((signal) => signal.describe).join(' '),
      })),
    [],
  )

  const [selected, setSelected] = useState<string | undefined>(goalCatalogue[0]?.id)
  const goal = goalCatalogue.find((item) => item.id === selected)

  return (
    <Split
      list={
        <CatalogueList
          entries={entries}
          selected={selected}
          onSelect={setSelected}
          groupLabel="category"
          sortable={false}
        />
      }
      detail={goal === undefined ? <Nothing /> : <GoalDetail goal={goal} />}
    />
  )
}

function Needs(): ReactNode {
  const entries = useMemo<readonly CatalogueEntry[]>(
    () =>
      needCatalogue.map((need) => ({
        id: need.id,
        name: need.name,
        summary: need.framing,
        // Needs have no category, and priority is the grouping anybody would reach for.
        group: need.priority,
        rank: need.priority,
        rankOrder: NEED_PRIORITIES.indexOf(need.priority),
        sensitive: need.sensitive,
        searchable: need.signals.map((signal) => signal.describe).join(' '),
      })),
    [],
  )

  const [selected, setSelected] = useState<string | undefined>(needCatalogue[0]?.id)
  const need = needCatalogue.find((item) => item.id === selected)

  return (
    <Split
      list={
        <CatalogueList
          entries={entries}
          selected={selected}
          onSelect={setSelected}
          groupLabel="priority"
          sortable
        />
      }
      detail={need === undefined ? <Nothing /> : <NeedDetail need={need} />}
    />
  )
}

function Clusters(): ReactNode {
  const entries = useMemo<readonly CatalogueEntry[]>(
    () =>
      lifeEventClusters.map((cluster) => ({
        id: cluster.id,
        name: cluster.name,
        summary: cluster.note ?? '',
        group: 'life event',
        rank: null,
        rankOrder: 0,
        sensitive: false,
        searchable: cluster.signals.map((signal) => signal.describe).join(' '),
      })),
    [],
  )

  const [selected, setSelected] = useState<string | undefined>(lifeEventClusters[0]?.id)
  const cluster = lifeEventClusters.find((item) => item.id === selected)

  return (
    <Split
      list={
        <CatalogueList
          entries={entries}
          selected={selected}
          onSelect={setSelected}
          groupLabel="life event"
          sortable={false}
        />
      }
      detail={cluster === undefined ? <Nothing /> : <ClusterDetail cluster={cluster} />}
    />
  )
}

function Nothing(): ReactNode {
  return (
    <Empty className="h-full border border-dashed">
      <EmptyHeader>
        <EmptyTitle>Nothing selected</EmptyTitle>
        <EmptyDescription>Pick something from the list to see how it works.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/**
 * The numbers that decide how readily anything gets raised.
 *
 * Shown rather than editable: they are constants the engines import, and a slider here would
 * change what the screen says without changing what Baz does. Changing them is a one-line edit
 * and a deploy, which for a prototype is the honest amount of work.
 */
function Thresholds(): ReactNode {
  return (
    <Alert>
      <AlertDescription className="space-y-1">
        <span className="block text-xs">
          Evidence is combined across signals so several weak ones add up without any being
          decisive. A goal is worth mentioning at {GOAL_THRESHOLDS.secondary} and established at{' '}
          {GOAL_THRESHOLDS.strong}; a need is clarified at {NEED_THRESHOLDS.clarify} and offered at{' '}
          {NEED_THRESHOLDS.surface}.
        </span>
        <span className="text-muted-foreground block text-2xs">
          The conditions below are code, not prompt text — the model cannot change them, and neither
          can this screen. Adding a goal means adding its conditions.
        </span>
      </AlertDescription>
    </Alert>
  )
}
