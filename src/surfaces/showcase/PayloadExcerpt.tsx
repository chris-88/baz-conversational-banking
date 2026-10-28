import type { ReactNode } from 'react'
import { ShieldOffIcon } from 'lucide-react'
import { Claim } from '@/components/Primitives'
import { PAYLOAD, type PayloadEntrySource } from '@/content/showcase/payload'
import { cn } from '@/lib/utils'

const SOURCE: Readonly<Record<PayloadEntrySource, { readonly text: string; readonly tone: string }>> = {
  answer: { text: 'said', tone: 'bg-primary/10 text-primary' },
  reused: { text: 'held', tone: 'bg-success/10 text-success' },
  derived: { text: 'derived', tone: 'bg-decides-code/10 text-decides-code' },
  default: { text: 'default', tone: 'bg-muted text-muted-foreground' },
  consent: { text: 'consent', tone: 'bg-muted text-muted-foreground' },
  runtime: { text: 'runtime', tone: 'bg-muted text-muted-foreground' },
}

/**
 * The packet, legibly.
 *
 * Not a scrolling wall of JSON: the endpoint, a dozen lines with where each value came from,
 * and the counts. The badge is the point of the whole feature and sits where a room can read
 * it: the packet is complete and correctly shaped, and nothing sends it.
 */
export function PayloadExcerpt(): ReactNode {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
            Form {PAYLOAD.formId} · {PAYLOAD.formName}
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight">The application, as the bank’s own journey would send it</p>
          <p className="text-muted-foreground mt-1 font-mono text-[12px]">
            {PAYLOAD.method} {PAYLOAD.encoding} → {PAYLOAD.target}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            The endpoint is recorded as the intended destination and nothing more. {PAYLOAD.formVersion}.
          </p>
        </div>
        <span className="border-warning-border bg-warning/50 text-warning-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold tracking-tight">
          <ShieldOffIcon aria-hidden className="size-4" />
          Captured, not sent
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <table className="w-full text-left font-mono text-[12.5px]">
          <thead className="bg-muted/60 text-muted-foreground text-[11px] uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Key</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium">The form’s question</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {PAYLOAD.excerpt.map((line) => (
              <tr key={line.key} className={cn(line.note !== undefined && 'bg-warning/30')}>
                <td className="px-3 py-1.5 whitespace-nowrap">{line.key}</td>
                <td className="px-3 py-1.5 font-semibold">{line.value}</td>
                <td className="px-3 py-1.5">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase', SOURCE[line.source].tone)}>
                    {SOURCE[line.source].text}
                  </span>
                </td>
                <td className="text-muted-foreground px-3 py-1.5 font-sans">
                  {line.label}
                  {line.note !== undefined && <span className="text-warning-foreground block text-[11.5px]">{line.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]">
        <Count n={PAYLOAD.entries} label="entries, in the order a browser would send them" />
        <Count n={PAYLOAD.answered} label="answered" />
        <Count n={PAYLOAD.reusedFields} label="filled from what the bank held" />
        <Count n={PAYLOAD.outstanding} label="still to ask" />
        <Claim kind="poc" />
      </div>
    </div>
  )
}

function Count({ n, label }: { readonly n: number; readonly label: string }): ReactNode {
  return (
    <span>
      <span className="text-primary font-bold tabular-nums">{n}</span>{' '}
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
