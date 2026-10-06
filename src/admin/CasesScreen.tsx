import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, PowerIcon, RotateCcwIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { IconTile } from '@/components/IconTile'
import { routes } from '@/app/routes'
import { adminApi } from '@/admin/adminClient'
import { ActivityFeed, ActivityPlaceholder } from '@/admin/ActivityFeed'
import { isPurgeable } from '@domain/case.ts'
import type { AdminOverview } from '@contracts/admin.ts'

/**
 * The console's home: every live conversation, and what is happening in them.
 *
 * This replaces three screens that were all lists of the same cases under different headings.
 * A case here is a link, because everything worth knowing about one belongs on its own page
 * rather than squeezed beside the others.
 */
export function CasesScreen({
  data,
  onChanged,
}: {
  readonly data: AdminOverview
  readonly onChanged: () => void
}): ReactNode {
  const doomed = data.cases.filter((item) => isPurgeable(item, data.focusCaseId))

  const purge = useMutation({
    mutationFn: () => adminApi.purgeCases(data.focusCaseId ?? undefined),
    onSuccess: onChanged,
  })
  const reset = useMutation({ mutationFn: adminApi.resetCase, onSuccess: onChanged })
  const kill = useMutation({ mutationFn: adminApi.setKillSwitch, onSuccess: onChanged })

  return (
    <div className="space-y-6">
      <Metrics metrics={data.metrics} />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Live conversations</h2>
          <span className="text-muted-foreground tabular text-2xs">{data.cases.length}</span>
        </div>

        <Card className="gap-0 divide-y p-0">
          {data.cases.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">Nobody has started one yet.</p>
          )}
          {data.cases.map((item) => (
            <Link
              key={item.id}
              to={routes.admin.case(item.id)}
              className="hover:bg-muted/50 flex items-center gap-3 p-4 transition-colors"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.label ?? item.id.slice(0, 8)}
                </span>
                <span className="text-muted-foreground tabular block text-xs">
                  {item.applications} applications · {item.messages} messages · updated{' '}
                  {item.updatedAt.slice(11, 16)}
                </span>
              </span>
              {!isPurgeable(item, data.focusCaseId) && (
                <Badge variant="secondary" className="text-2xs shrink-0">
                  kept
                </Badge>
              )}
              <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
            </Link>
          ))}
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-2xs">
            Purging deletes every conversation except the one on screen and any that were named,
            along with their facts, applications and plans. It cannot be undone.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={purge.isPending || doomed.length === 0}
            onClick={() => purge.mutate()}
          >
            {purge.isPending ? 'Clearing…' : `Purge ${String(doomed.length)}`}
          </Button>
        </div>
      </section>

      {data.activity.length > 0 ? <ActivityFeed activity={data.activity} /> : <ActivityPlaceholder />}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Controls</h2>
        <Card className="gap-0 divide-y p-0">
          <div className="flex items-center gap-3 p-4">
            <IconTile tone="neutral" size="sm">
              <RotateCcwIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Rebuild the sample customer</p>
              <p className="text-muted-foreground text-xs">
                Signed in, with the details the bank holds and nothing else. Other conversations
                are untouched.
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
              {reset.isPending ? 'Rebuilding…' : 'Rebuild'}
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4">
            <IconTile tone={data.killSwitch ? 'warning' : 'neutral'} size="sm">
              <PowerIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Pause Baz</p>
              <p className="text-muted-foreground text-xs">
                Every request is turned away at the gate, without calling a model. §43
              </p>
            </div>
            <Switch
              checked={data.killSwitch}
              onCheckedChange={(enabled) => kill.mutate(enabled)}
              aria-label="Pause Baz"
            />
          </div>
        </Card>
      </section>
    </div>
  )
}

function Metrics({ metrics }: { readonly metrics: AdminOverview['metrics'] }): ReactNode {
  const tiles = [
    { label: 'Questions avoided §53', value: metrics.questionsAvoided },
    { label: 'Facts captured', value: metrics.factsCaptured },
    { label: 'Applications started', value: metrics.applicationsStarted },
    { label: 'Requests blocked §25', value: metrics.requestsBlocked },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="gap-0 p-4">
          <p className="tabular text-2xl font-semibold">{tile.value}</p>
          <p className="text-muted-foreground text-xs">{tile.label}</p>
        </Card>
      ))}
    </div>
  )
}
