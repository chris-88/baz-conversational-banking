import type { ReactNode } from 'react'
import { LayersIcon } from 'lucide-react'
import { STAGES } from '@domain/conversation/stages.ts'
import { CONVERSATION } from '@llm/conversation.ts'
import { Claim, Decider, Surface, Tile } from './parts'

/**
 * Which tools each stage of a conversation is offered, from the object that decides it.
 *
 * Rendered from `CONVERSATION` directly rather than copied into content, so this table is the
 * enforcement and not a description of it. The three form tools are withheld further, until a
 * case has a form, by `toolsForTurn` in the turn function; that rule lives in Deno and is cited
 * rather than imported.
 */
export function GatingTable(): ReactNode {
  return (
    <Surface lift className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <Tile tone="code" size="sm">
          <LayersIcon />
        </Tile>
        <h4 className="min-w-0 flex-1 text-[14.5px] font-semibold">
          Which tools exist, stage by stage
        </h4>
        <Decider decides="code">Deterministic</Decider>
        <Claim kind="poc" />
      </div>

      <ol className="divide-y">
        {STAGES.map((stage, index) => {
          const guide = CONVERSATION[stage]
          return (
            <li key={stage} className="grid gap-2 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <span className="text-muted-foreground font-mono text-[10.5px] tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {guide.name}
                  <span className="text-muted-foreground font-mono text-[10.5px] font-normal">{stage}</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">{guide.purpose}</p>
              </div>
              <ul className="flex flex-wrap content-start gap-1">
                {guide.tools.map((tool) => (
                  <li key={tool} className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-[11px]">
                    {tool}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      <p className="text-muted-foreground border-t px-4 py-3 text-[11.5px] leading-relaxed">
        The stage is computed from the case every turn, in order of precedence, first match wins,
        and is never stored or chosen by the model, so correcting a fact can move a conversation
        back by itself. The three form tools are further withheld until the case has a form
        (toolsForTurn, in the turn function). Withholding a tool is enforcement; telling the model
        not to use one is advice.
      </p>
    </Surface>
  )
}
