import { useState, type ReactNode } from 'react'
import { AlertTriangleIcon, CheckIcon, CopyIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AdminCase } from '@contracts/admin.ts'

/**
 * What a person reads before picking up the phone.
 *
 * The point of the whole system, from the customer's side, is not having to start again. That
 * only holds if the person who answers can see what was agreed — so this is first on the screen,
 * ahead of the engine's reasoning and the raw conversation, and it is composed from the case
 * rather than written by a model. Somebody is going to act on it.
 */
export function HandoffNote({ handoff }: { readonly handoff: AdminCase['handoff'] }): ReactNode {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard
      .writeText(handoff.text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      // Clipboard access is refused often enough that failing loudly would be worse than the
      // button quietly doing nothing; the note is on screen either way.
      .catch(() => undefined)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Handover note</h2>
        <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <Card className="gap-0 divide-y p-0">
        <div className="flex items-baseline gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 text-sm font-semibold">{handoff.who}</span>
          <span className="text-muted-foreground tabular text-2xs">
            {handoff.turns} {handoff.turns === 1 ? 'message' : 'messages'}
            {handoff.lastSeen !== null && ` · last spoke ${handoff.lastSeen.slice(0, 10)}`}
          </span>
        </div>

        {handoff.sections.map((section) => (
          <div
            key={section.heading}
            className={section.caution ? 'bg-destructive/5 space-y-1 px-4 py-3' : 'space-y-1 px-4 py-3'}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              {section.caution && <AlertTriangleIcon className="text-destructive size-3.5" />}
              {section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.lines.map((line) => (
                <li
                  key={line}
                  className="text-muted-foreground text-xs"
                  // Nested detail — a check-in agenda under its check-in — is indented in the
                  // source rather than restructured, so the text and the screen stay identical.
                  style={{ paddingLeft: `${String(indentOf(line) * 0.75)}rem` }}
                >
                  {line.trimStart()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
    </section>
  )
}

function indentOf(line: string): number {
  return (line.length - line.trimStart().length) / 2
}
