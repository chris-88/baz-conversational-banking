import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, FileJsonIcon, ShieldOffIcon } from 'lucide-react'
import { adminApi, type FormInspection, type SubmissionEntry } from '@/admin/adminClient'
import { routes } from '@/app/routes'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * What a real Bank of Ireland digital form looks like going through Baz.
 *
 * Three things side by side, because the claim only lands when they can be read against each
 * other: the definition the bank publishes, what Baz has collected from the customer, and the
 * exact packet those answers produce. The argument is not that Baz can hold a conversation
 * about SuperSaver. It is that Baz is another renderer of the SuperSaver journey.
 *
 * Works on an unfinished application on purpose. A packet filling up as the conversation goes
 * is far more convincing than one presented complete, and it is the honest state of most
 * applications most of the time.
 */

const SOURCE_TONE: Readonly<Record<SubmissionEntry['source'], string>> = {
  answer: 'bg-primary/10 text-primary',
  reused: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  consent: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  default: 'bg-muted text-muted-foreground',
  runtime: 'bg-muted text-muted-foreground',
}

const SOURCE_LABEL: Readonly<Record<SubmissionEntry['source'], string>> = {
  answer: 'asked',
  reused: 'already knew',
  consent: 'consent',
  default: 'form default',
  runtime: 'runtime',
}

/** Masked unless somebody chooses otherwise. These are real-shaped personal details. */
function shown(entry: SubmissionEntry): string {
  if (!entry.sensitive || entry.value.length === 0) return entry.value
  return '•'.repeat(Math.min(10, entry.value.length))
}

function Stat({ label, value }: { label: string; value: string | number }): ReactNode {
  return (
    <div>
      <p className="text-muted-foreground text-2xs tracking-wide uppercase">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Inspection({ data }: { data: FormInspection }): ReactNode {
  const { definition, collected, outstanding, submission } = data
  const reusedCount = collected.filter((item) => item.reused).length

  return (
    <div className="space-y-5">
      {/* 1. The definition, and the evidence it is the bank's rather than ours. */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{definition.version}</h2>
          <Badge variant="secondary" className="font-mono text-2xs">
            form {definition.formId}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 font-mono text-2xs break-all">
          {definition.source}
        </p>
        <p className="text-muted-foreground text-2xs">
          retrieved {new Date(definition.retrievedAt).toLocaleString()} · sha256{' '}
          {definition.sourceHash}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="fields" value={definition.fieldCount} />
          <Stat label="apply here" value={definition.activeCount} />
          <Stat label="questions" value={definition.questionCount} />
          <Stat label="required" value={definition.requiredCount} />
        </div>
      </Card>

      {/* 2. What Baz holds, and how much of it the customer never had to say. */}
      <Card className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">What Baz has collected</h2>
          <p className="text-muted-foreground text-xs">
            {collected.length} answered
            {reusedCount > 0 && `, ${String(reusedCount)} never asked for`} ·{' '}
            {outstanding.length} still needed
          </p>
        </div>

        <ul className="mt-3 divide-y">
          {collected.map((item) => (
            <li key={item.fieldId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 font-mono text-2xs font-semibold',
                  item.reused ? SOURCE_TONE.reused : SOURCE_TONE.answer,
                )}
              >
                {item.reused ? SOURCE_LABEL.reused : SOURCE_LABEL.answer}
              </span>
              <span className="min-w-0 flex-1 text-sm">{item.label || item.type}</span>
              <span className="text-muted-foreground font-mono text-2xs">
                {item.toscana ?? `field ${item.fieldId}`}
              </span>
            </li>
          ))}
        </ul>

        {outstanding.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="text-muted-foreground text-xs">
              Still required: {outstanding.slice(0, 6).map((item) => item.label || item.type).join(', ')}
              {outstanding.length > 6 && ` and ${String(outstanding.length - 6)} more`}
            </p>
          </>
        )}
      </Card>

      {/* 3. The packet, and the fact that it is going nowhere. */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FileJsonIcon className="size-4" />
            The packet this produces
          </h2>
          <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
            <ShieldOffIcon className="size-3" />
            {submission.status.replaceAll('_', ' ')}
          </Badge>
        </div>

        <p className="text-muted-foreground mt-1 font-mono text-2xs break-all">
          {submission.method} {submission.target}
        </p>
        <p className="text-muted-foreground text-2xs">
          {submission.encoding} · {submission.entries.length} entries · no request was made
        </p>

        {/* Monospace and in order, because the order is part of what is being shown. */}
        <div className="bg-muted/40 mt-3 overflow-x-auto rounded-md border p-3">
          <table className="w-full font-mono text-2xs">
            <tbody>
              {submission.entries.map((entry, index) => (
                <tr key={`${entry.key}-${String(index)}`} className="align-baseline">
                  <td className="py-0.5 pr-3 whitespace-nowrap">{entry.key}</td>
                  <td className="text-muted-foreground py-0.5 pr-3 break-all">
                    {shown(entry) || <span className="opacity-50">(empty)</span>}
                  </td>
                  <td className="py-0.5 text-right whitespace-nowrap">
                    <span className={cn('rounded px-1.5 py-0.5', SOURCE_TONE[entry.source])}>
                      {SOURCE_LABEL[entry.source]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function FormsScreen(): ReactNode {
  const { formApplicationId } = useParams<{ formApplicationId: string }>()

  const list = useQuery({
    queryKey: ['admin', 'form-applications'],
    queryFn: () => adminApi.listFormApplications(),
    enabled: formApplicationId === undefined,
  })

  const inspection = useQuery({
    queryKey: ['admin', 'form-application', formApplicationId ?? 'none'],
    queryFn: () => adminApi.inspectFormApplication(formApplicationId ?? ''),
    enabled: formApplicationId !== undefined,
  })

  if (formApplicationId !== undefined) {
    return (
      <div className="space-y-4">
        <Link
          to={routes.admin.forms}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          All form applications
        </Link>

        {inspection.isPending && <Skeleton className="h-96 w-full" />}
        {inspection.isError && (
          <Card className="p-4">
            <p className="text-destructive text-sm">{String(inspection.error.message)}</p>
          </Card>
        )}
        {inspection.data && <Inspection data={inspection.data} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Digital forms</h1>
        <p className="text-muted-foreground mt-1 max-w-[62ch] text-sm leading-relaxed">
          Applications collected against Bank of Ireland&rsquo;s own published form definitions.
          Open any of them, finished or not, to see the definition, what Baz has gathered, and
          the exact packet it would produce.
        </p>
      </div>

      {list.isPending && <Skeleton className="h-40 w-full" />}
      {list.isError && (
        <Card className="p-4">
          <p className="text-destructive text-sm">{String(list.error.message)}</p>
        </Card>
      )}

      {list.data?.applications.length === 0 && (
        <Card className="p-4">
          <p className="text-muted-foreground text-sm">
            Nothing collected yet. One appears as soon as a conversation starts filling in a
            form.
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {(list.data?.applications ?? []).map((item) => (
          <Link key={item.id} to={routes.admin.formApplication(item.id)} className="block">
            <Card className="hover:bg-accent/40 p-4 transition-colors">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{item.formVersion}</span>
                <span className="text-muted-foreground font-mono text-2xs">
                  form {item.formId}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {item.answered} answered
                {item.reused > 0 && `, ${String(item.reused)} carried over`} · updated{' '}
                {new Date(item.updatedAt).toLocaleString()}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
