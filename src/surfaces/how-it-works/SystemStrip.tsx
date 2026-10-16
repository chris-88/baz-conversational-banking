import type { ReactNode } from 'react'
import { CONVERSATION } from '@llm/conversation.ts'
import type { Beat } from '@/content/how-it-works/story'
import { Decider } from './parts'

/**
 * What the system did on a beat, beside what the customer saw.
 *
 * The tools are read from `CONVERSATION`, the same object a live turn is handed, so the list
 * here is the list that was enforced and not a description of it. Everything else is the
 * script's account of the facts, transitions and events the beat wrote, in the vocabulary the
 * engine uses: real fact keys, real state names, real event types.
 */
export function SystemStrip({ beat }: { readonly beat: Beat }): ReactNode {
  const guide = beat.engineStage === undefined ? null : CONVERSATION[beat.engineStage]
  const { system } = beat

  return (
    <dl className="space-y-3.5 text-[12.5px] leading-relaxed">
      {guide !== null && beat.engineStage !== undefined && (
        <Row label="Stage" decides="code">
          <span className="font-medium">{guide.name}</span>
          <span className="text-muted-foreground"> · {beat.engineStage}</span>
          <span className="text-muted-foreground mt-0.5 block">{guide.purpose}</span>
        </Row>
      )}

      {guide !== null && (
        <Row label="Tools offered" decides="code">
          <ul className="mt-0.5 flex flex-wrap gap-1">
            {guide.tools.map((tool) => (
              <li
                key={tool}
                className="bg-muted text-foreground/80 rounded-md px-1.5 py-0.5 font-mono text-[11px]"
              >
                {tool}
              </li>
            ))}
          </ul>
        </Row>
      )}

      {system.facts !== undefined && (
        <Row label="Facts" decides="model">
          <List items={system.facts} mono />
        </Row>
      )}

      {system.reused !== undefined && (
        <Row label="Questions avoided" decides="code">
          <span className="font-medium tabular-nums">{system.reused}</span>
          <span className="text-muted-foreground"> context_reused events</span>
        </Row>
      )}

      {system.transitions !== undefined && (
        <Row label="State" decides="code">
          <List items={system.transitions} mono />
        </Row>
      )}

      {system.events !== undefined && (
        <Row label="Events">
          <ul className="mt-0.5 flex flex-wrap gap-1">
            {system.events.map((event) => (
              <li key={event} className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-[11px]">
                {event}
              </li>
            ))}
          </ul>
        </Row>
      )}

      {system.note !== undefined && (
        <Row label="Why">
          <span className="text-muted-foreground">{system.note}</span>
        </Row>
      )}
    </dl>
  )
}

function Row({
  label,
  decides,
  children,
}: {
  readonly label: string
  readonly decides?: 'code' | 'model'
  readonly children: ReactNode
}): ReactNode {
  return (
    <div>
      <dt className="flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
          {label}
        </span>
        {decides !== undefined && (
          <Decider decides={decides}>{decides === 'code' ? 'Deterministic' : 'Model records'}</Decider>
        )}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function List({ items, mono }: { readonly items: readonly string[]; readonly mono?: boolean }): ReactNode {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item} className={mono === true ? 'font-mono text-[11.5px]' : undefined}>
          {item}
        </li>
      ))}
    </ul>
  )
}
