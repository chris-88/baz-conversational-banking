import { useState, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { goalCatalogue } from '@domain/goals/catalogue.ts'
import { lifeEventClusters } from '@domain/goals/clusters.ts'
import { GOAL_THRESHOLDS } from '@domain/goals/types.ts'
import { needCatalogue } from '@domain/needs/catalogue.ts'
import { NEED_THRESHOLDS, SIGNAL_STRENGTHS } from '@domain/needs/types.ts'

/**
 * What Baz knows how to recognise, and what it does about it.
 *
 * The catalogue is the answer to the question this prototype always gets asked — whether the
 * model is deciding any of this. Twenty-six goals and nine needs, each with the conditions that
 * raise it, the information it needs before it can be acted on, and the rules that hold it back.
 * None of it is prompt text.
 */
export function EngineScreen(): ReactNode {
  const [filter, setFilter] = useState('')

  const match = (text: string) => text.toLowerCase().includes(filter.trim().toLowerCase())

  return (
    <Tabs defaultValue="goals" className="space-y-6">
      <Thresholds />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="goals">Goals ({goalCatalogue.length})</TabsTrigger>
          <TabsTrigger value="needs">Needs ({needCatalogue.length})</TabsTrigger>
          <TabsTrigger value="events">Life events ({lifeEventClusters.length})</TabsTrigger>
        </TabsList>
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter…"
          className="max-w-56"
        />
      </div>

      <TabsContent value="goals">
        <Card className="py-0">
          <Accordion type="single" collapsible className="w-full">
            {goalCatalogue
              .filter((goal) => match(goal.name) || match(goal.id) || match(goal.description))
              .map((goal) => (
                <Entry
                  key={goal.id}
                  value={goal.id}
                  title={goal.name}
                  summary={goal.description}
                  badges={[{ text: goal.category.replaceAll('_', ' ') }]}
                >
                  <Rows
                    label="Raised when"
                    items={goal.signals.map(
                      (signal) =>
                        `${signal.describe} — ${signal.strength.replaceAll('_', ' ')} (${String(
                          SIGNAL_STRENGTHS[signal.strength],
                        )})${signal.declaration === true ? ', counts as them naming it' : ''}`,
                    )}
                  />
                  <Rows
                    label="Needs to know"
                    items={goal.informationNeeded.map((key) => String(key))}
                  />
                  <Rows
                    label="Milestones"
                    items={goal.milestones.map(
                      (milestone) =>
                        `${milestone.label} — ${milestone.category}${
                          milestone.binding === null
                            ? ', confirmed by the customer'
                            : milestone.binding.kind === 'facts'
                              ? `, once we know ${milestone.binding.keys.join(' and ')}`
                              : milestone.binding.kind === 'numeric'
                                ? `, at ${String(Math.round(milestone.binding.fraction * 100))}% of target`
                                : milestone.binding.kind === 'application'
                                  ? `, when the ${milestone.binding.product} reaches ${milestone.binding.state}`
                                  : ', on the target date'
                        }`,
                    )}
                  />
                  {goal.checkins.length > 0 && (
                    <Rows
                      label="Check-ins"
                      items={goal.checkins.map(
                        (checkin) =>
                          `${checkin.purpose} — ${
                            checkin.kind === 'event'
                              ? `when ${checkin.event.replaceAll('_', ' ')}`
                              : `every ${String(checkin.everyMonths)} months`
                          } · ${checkin.agenda.join('; ')}`,
                      )}
                    />
                  )}
                  {goal.deferrals.length > 0 && (
                    <Rows
                      label="Held back when"
                      items={goal.deferrals.map(
                        (rule) => `${rule.describe} — back when ${rule.revisitWhen}`,
                      )}
                    />
                  )}
                  {goal.suppressions.length > 0 && (
                    <Rows
                      label="Never raised when"
                      items={goal.suppressions.map((rule) => rule.describe)}
                    />
                  )}
                  <Rows
                    label="Leads to"
                    items={[
                      ...goal.relationships.related.map((id) => `alongside ${id}`),
                      ...goal.relationships.followOn.map((id) => `afterwards ${id}`),
                      ...goal.relationships.conflicts.map((id) => `conflicts with ${id}`),
                    ]}
                  />
                  {goal.linkedNeeds.length > 0 && (
                    <Rows label="Routes to" items={[...goal.linkedNeeds]} />
                  )}
                </Entry>
              ))}
          </Accordion>
        </Card>
      </TabsContent>

      <TabsContent value="needs">
        <Card className="py-0">
          <Accordion type="single" collapsible className="w-full">
            {needCatalogue
              .filter((need) => match(need.name) || match(need.id) || match(need.framing))
              .map((need) => (
                <Entry
                  key={need.id}
                  value={need.id}
                  title={need.name}
                  summary={need.framing}
                  badges={[
                    { text: need.priority.replaceAll('_', ' ') },
                    ...(need.sensitive
                      ? [{ text: 'sensitive', tone: 'destructive' as const }]
                      : []),
                  ]}
                >
                  <Rows
                    label="Raised when"
                    items={need.signals.map(
                      (signal) =>
                        `${signal.describe} — ${signal.strength.replaceAll('_', ' ')} (${String(
                          SIGNAL_STRENGTHS[signal.strength],
                        )})`,
                    )}
                  />
                  {need.clarifying.length > 0 && (
                    <Rows label="Asks first" items={need.clarifying.map((item) => item.question)} />
                  )}
                  {need.products.length > 0 && <Rows label="Offers" items={[...need.products]} />}
                  {need.deferrals.length > 0 && (
                    <Rows label="Held back when" items={need.deferrals.map((r) => r.describe)} />
                  )}
                  {need.suppressions.length > 0 && (
                    <Rows
                      label="Never raised when"
                      items={need.suppressions.map((r) => r.describe)}
                    />
                  )}
                </Entry>
              ))}
          </Accordion>
        </Card>
      </TabsContent>

      <TabsContent value="events">
        <Card className="py-0">
          <Accordion type="single" collapsible className="w-full">
            {lifeEventClusters
              .filter((cluster) => match(cluster.name) || match(cluster.id))
              .map((cluster) => (
                <Entry
                  key={cluster.id}
                  value={cluster.id}
                  title={cluster.name}
                  summary={cluster.note}
                >
                  <Rows label="Recognised by" items={cluster.signals.map((s) => s.describe)} />
                  <Rows label="Usually about" items={[...cluster.primary]} />
                  <Rows label="Often alongside" items={[...cluster.secondary]} />
                  {cluster.deferred.length > 0 && (
                    <Rows label="Comes later" items={[...cluster.deferred]} />
                  )}
                </Entry>
              ))}
          </Accordion>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

/**
 * One catalogue entry, shut until somebody wants it.
 *
 * Twenty-six goals fully expanded is twelve thousand pixels of screen, which is a reference
 * manual rather than a console. The summary line is what the room needs to see; the conditions
 * underneath are what they ask about.
 */
function Entry({
  value,
  title,
  badges,
  summary,
  children,
}: {
  readonly value: string
  readonly title: string
  readonly badges?: readonly {
    readonly text: string
    readonly tone?: 'destructive'
  }[]
  readonly summary: string | null
  readonly children: ReactNode
}): ReactNode {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="gap-3 px-4 hover:no-underline">
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block font-medium">{title}</span>
          {summary !== null && (
            <span className="text-muted-foreground block text-sm font-normal">{summary}</span>
          )}
        </span>
        {(badges ?? []).map((badge) => (
          <Badge
            key={badge.text}
            variant={badge.tone === 'destructive' ? 'destructive' : 'secondary'}
            className="shrink-0"
          >
            {badge.text}
          </Badge>
        ))}
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <dl className="divide-y border-t px-4">{children}</dl>
      </AccordionContent>
    </AccordionItem>
  )
}

function Rows({
  label,
  items,
}: {
  readonly label: string
  readonly items: readonly string[]
}): ReactNode {
  if (items.length === 0) return null

  return (
    <div className="flex gap-4 py-3">
      <dt className="text-muted-foreground w-32 shrink-0 text-sm">{label}</dt>
      <dd className="min-w-0 flex-1 space-y-1">
        {items.map((item) => (
          <p key={item} className="text-sm">
            {item}
          </p>
        ))}
      </dd>
    </div>
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
