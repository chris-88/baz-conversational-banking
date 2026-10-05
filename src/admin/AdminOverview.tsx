import { useCallback, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLinkIcon, FileCheckIcon, PowerIcon, RotateCcwIcon, SendIcon, ShieldAlertIcon, ZapIcon } from 'lucide-react'
import { PRESET_NAMES, SLIDER_NAMES, type PresetName } from '@llm/persona.ts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { IconTile } from '@/components/IconTile'
import { queryKeys } from '@/lib/queryKeys'
import { useRealtimeInvalidation } from '@/lib/useRealtimeInvalidation'
import { adminApi } from '@/admin/adminClient'
import { routes } from '@/app/routes'
import { boiDomainConfig } from '@tenants/boi/domain-config.ts'
import { CaseInspector } from '@/admin/CaseInspector'

type Section = 'cases' | 'persona' | 'domain' | 'audience'
type Pane = Section | 'overview'

export function AdminOverview({ section }: { section?: Section }): ReactNode {
  const queryClient = useQueryClient()
  const overview = useQuery({ queryKey: queryKeys.admin.cases(), queryFn: adminApi.overview })
  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: queryKeys.admin.cases() }),
    [queryClient],
  )

  /**
   * §40 — the console follows the conversation as it happens. A presenter watching someone
   * talk to Baz should see the facts land and the applications appear, rather than reloading
   * to find out whether anything did.
   */
  useRealtimeInvalidation(
    ['messages', 'facts', 'applications', 'events', 'product_interests'],
    refresh,
  )

  if (overview.isPending) return <Skeleton className="h-40 w-full" />
  if (overview.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{overview.error.message}</AlertDescription>
      </Alert>
    )
  }

  const data = overview.data

  const pane: Pane = section ?? 'overview'

  switch (pane) {
    case 'persona':
      return <PersonaControls persona={data.persona} onChanged={refresh} />
    case 'domain':
      return <DomainView blocked={data.blocked} killSwitch={data.killSwitch} onChanged={refresh} />
    case 'cases':
      return <Cases cases={data.cases} metrics={data.metrics} />
    case 'audience':
      return <Audience cases={data.cases} metrics={data.metrics} onChanged={refresh} />
    case 'overview':
      return <Overview data={data} onChanged={refresh} />
  }
}

function Overview({
  data,
  onChanged,
}: {
  data: Awaited<ReturnType<typeof adminApi.overview>>
  onChanged: () => void
}): ReactNode {
  const [message, setMessage] = useState<string | null>(null)

  const reset = useMutation({
    mutationFn: adminApi.resetCase,
    onSuccess: () => {
      setMessage('Presenter case restored. Audience cases untouched.')
      onChanged()
    },
    onError: (error: Error) => setMessage(error.message),
  })

  const kill = useMutation({
    mutationFn: adminApi.setKillSwitch,
    onSuccess: () => onChanged(),
  })

  return (
    <div className="space-y-6">
      <Metrics metrics={data.metrics} />

      <DemoActions data={data} onChanged={onChanged} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Controls</h2>
        <Card className="gap-0 divide-y p-0">
          <div className="flex items-center gap-3 p-4">
            <IconTile tone="neutral" size="sm">
              <RotateCcwIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Reset the presenter case</p>
              <p className="text-muted-foreground text-xs">
                Back to the start: signed in, bank-held facts, nothing else. §43
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
              {reset.isPending ? 'Resetting…' : 'Reset'}
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4">
            <IconTile tone={data.killSwitch ? 'warning' : 'neutral'} size="sm">
              <PowerIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Demo paused</p>
              <p className="text-muted-foreground text-xs">
                The gate turns every request away, without calling a model. §43
              </p>
            </div>
            <Switch
              checked={data.killSwitch}
              onCheckedChange={(enabled) => kill.mutate(enabled)}
              aria-label="Pause the demonstration"
            />
          </div>
        </Card>

        {message !== null && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </section>

      <CaseList cases={data.cases} metrics={data.metrics} compact />
    </div>
  )
}

/**
 * §41 — the moves a presenter actually wants, named for the outcome rather than the
 * transition. Each is disabled with a reason when the state machine would refuse it, so
 * nothing fails live.
 */
function DemoActions({
  data,
  onChanged,
}: {
  data: Awaited<ReturnType<typeof adminApi.overview>>
  onChanged: () => void
}): ReactNode {
  const [notification, setNotification] = useState<string | null>(null)
  const caseId = data.presenterCaseId

  const run = useMutation({
    mutationFn: (move: Parameters<typeof adminApi.demoAction>[1]) =>
      adminApi.demoAction(caseId ?? '', move),
    onSuccess: onChanged,
  })

  const verify = useMutation({
    mutationFn: () => adminApi.verifyDocuments(caseId ?? ''),
    onSuccess: onChanged,
  })

  const notify = useMutation({
    mutationFn: () => adminApi.notify(caseId ?? ''),
    onSuccess: (result) => {
      setNotification(result.url)
      onChanged()
    },
  })

  if (caseId === null) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Demo controls</h2>
        <Badge variant="secondary" className="text-2xs">
          One tap each
        </Badge>
      </div>

      {/*
        §55 opens on the public website, and a public conversation normally starts a case of
        its own that these moves cannot touch. This link starts it on the presenter case
        instead, so the whole story runs as one take.
      */}
      <a
        href={`#${routes.baz}?demo=1`}
        target="_blank"
        rel="noreferrer"
        className="bg-card hover:bg-muted/60 focus-visible:ring-ring mb-2 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconTile tone="deep" size="sm">
          <ExternalLinkIcon />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Open the public site for the demo</span>
          <span className="text-muted-foreground block text-2xs">
            Starts the public conversation on this case, so the moves below reach it. An
            ordinary visitor still gets a case of their own. §55
          </span>
        </span>
      </a>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.demoActions.map((move) => (
          <button
            key={move.id}
            type="button"
            disabled={!move.available || run.isPending}
            title={move.note}
            onClick={() => run.mutate(move.id as Parameters<typeof adminApi.demoAction>[1])}
            className="bg-card hover:bg-muted/60 focus-visible:ring-ring flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <IconTile tone={move.available ? 'primary' : 'neutral'} size="sm">
              <ZapIcon />
            </IconTile>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{move.label}</span>
              <span className="text-muted-foreground block text-2xs">{move.note}</span>
            </span>
          </button>
        ))}

        <button
          type="button"
          disabled={verify.isPending}
          onClick={() => verify.mutate()}
          className="bg-card hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 sm:col-span-2"
        >
          <IconTile tone="primary" size="sm">
            <FileCheckIcon />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">The bank checks the documents</span>
            <span className="text-muted-foreground block text-2xs">
              {verify.data
                ? `${String(verify.data.verified)} marked as checked.`
                : 'Marks what has been sent in as verified, so anything waiting on a check can pass. §41'}
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={notify.isPending}
          onClick={() => notify.mutate()}
          className="bg-card hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 sm:col-span-2"
        >
          <IconTile tone="deep" size="sm">
            <SendIcon />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Send the update notification</span>
            <span className="text-muted-foreground block text-2xs">
              {notification ?? 'Says nothing about the application; the link needs a sign-in. §35'}
            </span>
          </span>
        </button>
      </div>
    </section>
  )
}

function Metrics({ metrics }: { metrics: Awaited<ReturnType<typeof adminApi.overview>>['metrics'] }): ReactNode {
  const tiles = [
    { label: 'Questions avoided', value: metrics.questionsAvoided, note: '§53' },
    { label: 'Facts captured', value: metrics.factsCaptured, note: '' },
    { label: 'Applications started', value: metrics.applicationsStarted, note: '' },
    { label: 'Requests blocked', value: metrics.requestsBlocked, note: '§25' },
  ]

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="gap-1 p-3">
          <p className="tabular text-2xl font-semibold leading-none">{tile.value}</p>
          <p className="text-muted-foreground text-2xs">
            {tile.label} {tile.note}
          </p>
        </Card>
      ))}
    </section>
  )
}

/** §40, §41 — pick a case, then drive it. */
function Cases({
  cases,
  metrics,
}: {
  cases: Awaited<ReturnType<typeof adminApi.overview>>['cases']
  metrics: Awaited<ReturnType<typeof adminApi.overview>>['metrics']
}): ReactNode {
  const [selected, setSelected] = useState<string | null>(cases[0]?.id ?? null)

  return (
    <div className="space-y-6">
      <Metrics metrics={metrics} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Cases</h2>
        <div className="flex flex-wrap gap-2">
          {cases.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={selected === item.id ? 'default' : 'outline'}
              onClick={() => setSelected(item.id)}
            >
              <Badge variant="secondary" className="text-2xs">
                {item.kind}
              </Badge>
              {item.label ?? item.id.slice(0, 8)}
            </Button>
          ))}
        </div>
      </section>

      {selected !== null && <CaseInspector caseId={selected} />}
    </div>
  )
}

function CaseList({
  cases,
  metrics,
  compact,
}: {
  cases: Awaited<ReturnType<typeof adminApi.overview>>['cases']
  metrics: Awaited<ReturnType<typeof adminApi.overview>>['metrics']
  compact?: boolean
}): ReactNode {
  return (
    <section className="space-y-2">
      {compact !== true && <Metrics metrics={metrics} />}
      <h2 className="text-sm font-semibold">Cases</h2>
      <Card className="gap-0 divide-y p-0">
        {cases.length === 0 && <p className="text-muted-foreground p-4 text-sm">No cases yet.</p>}
        {cases.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-4">
            <Badge variant={item.kind === 'presenter' ? 'default' : 'secondary'} className="text-2xs">
              {item.kind}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label ?? item.id.slice(0, 8)}</p>
              <p className="text-muted-foreground tabular text-xs">
                {item.applications} applications · {item.messages} messages
              </p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}

/** §44, §47 — what the room is doing, and how to clear it. */
function Audience({
  cases,
  metrics,
  onChanged,
}: {
  cases: Awaited<ReturnType<typeof adminApi.overview>>['cases']
  metrics: Awaited<ReturnType<typeof adminApi.overview>>['metrics']
  onChanged: () => void
}): ReactNode {
  const audience = cases.filter((item) => item.kind === 'audience')
  const purge = useMutation({ mutationFn: adminApi.purgeAudience, onSuccess: onChanged })

  return (
    <div className="space-y-6">
      <Metrics metrics={metrics} />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Audience conversations</h2>
          <Button
            size="sm"
            variant="outline"
            disabled={purge.isPending || audience.length === 0}
            onClick={() => purge.mutate()}
          >
            {purge.isPending ? 'Clearing…' : `Purge ${String(audience.length)}`}
          </Button>
        </div>
        <Card className="gap-0 divide-y p-0">
          {audience.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">Nobody has tried it yet.</p>
          )}
          {audience.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.label ?? item.id.slice(0, 8)}
                </span>
                <span className="text-muted-foreground tabular block text-xs">
                  {item.applications} applications · {item.messages} messages
                </span>
              </span>
            </div>
          ))}
        </Card>
        <p className="text-muted-foreground text-2xs">
          Purging clears audience conversations only. The presenter case is never touched. §45
        </p>
      </section>
    </div>
  )
}

function PersonaControls({
  persona,
  onChanged,
}: {
  persona: Awaited<ReturnType<typeof adminApi.overview>>['persona']
  onChanged: () => void
}): ReactNode {
  const [sliders, setSliders] = useState(persona.sliders)

  const save = useMutation({
    mutationFn: adminApi.setPersona,
    onSuccess: () => onChanged(),
  })

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Style only. Changing these cannot alter what Baz may discuss, what it can do, or any
          customer protection — and it applies to the very next message. §18, §56
        </AlertDescription>
      </Alert>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_NAMES.map((preset: PresetName) => (
            <Button
              key={preset}
              size="sm"
              variant={persona.preset === preset ? 'default' : 'outline'}
              disabled={save.isPending}
              onClick={() => save.mutate({ preset })}
            >
              {preset.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Sliders</h2>
        <Card className="space-y-5 p-4">
          {SLIDER_NAMES.map((name) => (
            <div key={name} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm font-normal capitalize">{name}</Label>
                <span className="text-muted-foreground tabular text-xs">
                  {sliders[name].toFixed(2)}
                </span>
              </div>
              <Slider
                value={[sliders[name]]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) =>
                  setSliders((current) => ({ ...current, [name]: value ?? 0 }))
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            className="w-full"
            disabled={save.isPending}
            onClick={() => save.mutate({ sliders })}
          >
            {save.isPending ? 'Applying…' : 'Apply to the next message'}
          </Button>
        </Card>
      </section>
    </div>
  )
}

function DomainView({
  blocked,
  killSwitch,
  onChanged,
}: {
  blocked: Awaited<ReturnType<typeof adminApi.overview>>['blocked']
  killSwitch: boolean
  onChanged: () => void
}): ReactNode {
  const kill = useMutation({ mutationFn: adminApi.setKillSwitch, onSuccess: () => onChanged() })

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldAlertIcon />
        <AlertDescription>
          Enforcement sits in front of the model, not inside it. A blocked request never reaches
          Baz at all. §25
        </AlertDescription>
      </Alert>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Categories</h2>
        <Card className="gap-0 divide-y p-0">
          {boiDomainConfig.categories.map((category) => (
            <div key={category.id} className="flex items-start gap-3 p-4">
              <Badge
                variant={category.reachesModel ? 'default' : 'secondary'}
                className="text-2xs shrink-0"
              >
                {category.reachesModel ? 'reaches Baz' : 'blocked'}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm font-medium">{category.label}</p>
                <p className="text-muted-foreground text-xs">{category.description}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recently blocked</h2>
        <Card className="gap-0 divide-y p-0">
          {blocked.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">Nothing blocked yet.</p>
          )}
          {blocked.map((item, index) => (
            <div key={`${item.at}-${String(index)}`} className="flex items-center gap-3 p-4">
              <Badge variant="secondary" className="text-2xs">
                {item.category}
              </Badge>
              <span className="text-muted-foreground tabular text-xs">
                {new Date(item.at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <p className="text-sm font-medium">Demo paused</p>
          <p className="text-muted-foreground text-xs">Turns every request away. §43</p>
        </div>
        <Switch checked={killSwitch} onCheckedChange={(v) => kill.mutate(v)} aria-label="Pause" />
      </div>
    </div>
  )
}
