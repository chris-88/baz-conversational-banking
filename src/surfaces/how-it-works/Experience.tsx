import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { experience } from '@/content/how-it-works/copy'
import { scenarios } from '@/content/how-it-works/scenarios'
import { Claim, Eyebrow, Prose } from './parts'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * The same turn, told twice.
 *
 * The customer view is the product. The system view is what the engine knew while producing
 * it: a gate decision in the gate's own vocabulary, counts that come from the database, and
 * the list of tools the model was actually handed.
 *
 * What is deliberately absent is any notion of the model's reasoning. Nothing stores it and
 * nothing displays it, and an earlier draft of this section carried a confidence score, which
 * does not exist anywhere in this system. Inventing a property to look rigorous, on the page
 * arguing for rigour, is the exact trap.
 */
export function Experience(): ReactNode {
  const [view, setView] = useState<'customer' | 'system'>('customer')
  const [at, setAt] = useState(0)
  const still = useReducedMotion() === true

  const scenario = scenarios[at % scenarios.length] ?? scenarios[0]
  if (!scenario) return null

  return (
    <section id="experience" className="scroll-mt-20 border-b py-10 sm:py-14">
      <Eyebrow>{experience.eyebrow}</Eyebrow>
      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {experience.title}
      </h2>
      <Prose className="mt-4">
        {experience.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Prose>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div
          className="bg-muted inline-flex rounded-md p-0.5"
          role="tablist"
          aria-label="View the turn as"
        >
          {(['customer', 'system'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={view === option}
              onClick={() => {
                setView(option)
              }}
              className={cn(
                'focus-visible:ring-ring rounded-[5px] px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                view === option
                  ? 'bg-background text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option === 'customer' ? 'Customer view' : 'System view'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {scenarios.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setAt(index)
              }}
              className={cn(
                'focus-visible:ring-ring rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none',
                scenario.id === option.id
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${scenario.id}-${view}`}
          {...(still
            ? {}
            : {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -8 },
                transition: { duration: 0.2 },
              })}
          className="mt-4"
        >
          {view === 'customer' ? (
            <Card className="space-y-3 p-5">
              <p className="bg-primary text-primary-foreground ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
                {scenario.customer}
              </p>
              {scenario.baz.map((line) => (
                <p
                  key={line}
                  className="bg-muted max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </Card>
          ) : (
            <Card className="gap-0 overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <span className="text-sm font-semibold">What the engine knew</span>
                <Claim kind="poc" />
              </div>

              <dl className="bg-border grid gap-px sm:grid-cols-2">
                {scenario.system.map((row) => (
                  <div key={row.label} className="bg-card flex justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground text-xs">{row.label}</dt>
                    <dd className="text-right font-mono text-xs font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-t px-4 py-3">
                <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.1em] uppercase">
                  Tools offered this turn
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {scenario.toolsOffered.map((tool) => (
                    <code
                      key={tool}
                      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px]"
                    >
                      {tool}
                    </code>
                  ))}
                </div>
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                  None of these creates, submits or consents to anything. The ones that could
                  offer a product are not on the list when the turn is sensitive.
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
