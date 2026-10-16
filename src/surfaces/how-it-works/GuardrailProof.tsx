import { useState, type ReactNode } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { TONE_BUCKETS, refusalFor, type ToneBucket } from '@llm/refusals.ts'
import { guardrailCases } from '@/content/how-it-works/guardrails'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Claim, Surface, Tile } from './parts'

/**
 * The §57 demonstration, without a classifier call.
 *
 * Ten cases from the eval set, each with what the gate is expected to do and, for the blocked
 * ones, the exact sentence the customer gets, read from `refusals.ts` in whichever tone bucket
 * is selected. The allowed rows say only that the turn reaches Baz, because what Baz then says
 * is the model's and this page does not pretend otherwise.
 */
export function GuardrailProof(): ReactNode {
  const [bucket, setBucket] = useState<ToneBucket>('neutral')

  return (
    <Surface lift className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <Tile tone="code" size="sm">
          <ShieldCheckIcon />
        </Tile>
        <h4 className="min-w-0 flex-1 text-[14.5px] font-semibold">Guardrails: what gets through, and what does not</h4>
        <Claim kind="poc" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-muted-foreground text-[12.5px]">
          Refusals in the tone the persona collapses to. Pick one.
        </p>
        <ToggleGroup
          type="single"
          value={bucket}
          onValueChange={(value) => {
            if (TONE_BUCKETS.includes(value as ToneBucket)) setBucket(value as ToneBucket)
          }}
          className="gap-1"
          aria-label="Refusal tone"
        >
          {TONE_BUCKETS.map((tone) => (
            <ToggleGroupItem key={tone} value={tone} size="sm" className="rounded-full border px-3 text-[12px] capitalize">
              {tone}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ul className="divide-y">
        {guardrailCases.map((entry) => {
          const blocked = entry.expect === 'block'
          return (
            <li key={entry.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
              <div className="min-w-0">
                {entry.previousAssistantTurn !== undefined && (
                  <p className="text-muted-foreground mb-1 text-[11px] italic">
                    Baz had asked: {entry.previousAssistantTurn}
                  </p>
                )}
                <p className="bg-primary text-primary-foreground ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-sm px-3 py-1.5 text-[13px] leading-snug sm:ml-0">
                  {entry.input}
                </p>
                <p className="text-muted-foreground mt-1 text-right text-[10.5px] sm:text-left">
                  {entry.why} · <span className="font-mono">{entry.id}</span>
                </p>
              </div>

              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]',
                      blocked ? 'bg-warning-border/30 text-warning-foreground' : 'bg-success/10 text-success',
                    )}
                  >
                    {blocked ? 'blocked' : 'reaches Baz'}
                  </span>
                  <span className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-[10.5px]">{entry.category}</span>
                  {entry.sensitive === true && (
                    <span className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-[10.5px]">sensitive</span>
                  )}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed">
                  {blocked ? (
                    <>&ldquo;{refusalFor(entry.category, bucket)}&rdquo;</>
                  ) : entry.sensitive === true ? (
                    <span className="text-muted-foreground">
                      In scope. The turn reaches the model with humour, sarcasm, playfulness and poetic
                      forced to zero, and no product is offered on it.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      In scope. The turn reaches the model and Baz answers it.
                    </span>
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-muted-foreground border-t px-4 py-3 text-[11.5px] leading-relaxed">
        Expected classifications from evals/guardrails/cases.jsonl, checked against the live gate
        by npm run eval:guardrails before any presentation, not called from this page. The
        refusal copy is the product&rsquo;s own; a blocked turn never reaches the model, so there is
        nothing to generate the reply with.
      </p>
    </Surface>
  )
}
