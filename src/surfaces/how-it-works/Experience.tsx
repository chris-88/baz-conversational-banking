import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EyeIcon, TerminalIcon } from 'lucide-react'
import { experience } from '@/content/how-it-works/copy'
import { scenarios } from '@/content/how-it-works/scenarios'
import { Claim, Reveal, SectionHead, Surface } from './parts'
import { BazWordmark } from '@/baz/BazWordmark'
import { cn } from '@/lib/utils'

/**
 * The same turn, told twice.
 *
 * The customer view is the product. The system view is what the engine knew while producing it:
 * a gate decision in the gate's own vocabulary, counts that come from the database, and the
 * tools the model was actually handed.
 *
 * What is deliberately absent is any notion of the model's reasoning. Nothing stores it and
 * nothing shows it. An earlier draft of this section carried a confidence score, which does not
 * exist anywhere in this system: inventing a property to look rigorous, on the page arguing for
 * rigour, is the exact trap.
 */
export function Experience(): ReactNode {
  const [view, setView] = useState<'customer' | 'system'>('customer')
  const [at, setAt] = useState(0)
  const still = useReducedMotion() === true

  const scenario = scenarios[at % scenarios.length] ?? scenarios[0]
  if (!scenario) return null

  return (
    <section id="experience" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={experience.eyebrow}
        title={experience.title}
        lede={experience.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div
          className="bg-muted inline-flex rounded-lg p-1"
          role="tablist"
          aria-label="View the turn as"
        >
          {(
            [
              ['customer', 'Customer view', EyeIcon],
              ['system', 'System view', TerminalIcon],
            ] as const
          ).map(([option, label, Icon]) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={view === option}
              onClick={() => {
                setView(option)
              }}
              className={cn(
                'focus-visible:ring-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                view === option
                  ? 'bg-background text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
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
                'focus-visible:ring-ring rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                scenario.id === option.id
                  ? 'border-primary/40 bg-primary/5 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground bg-card',
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
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.2 },
              })}
          className="mt-5"
        >
          {view === 'customer' ? (
            <Surface lift className="space-y-3 p-6">
              <p className="bg-primary text-primary-foreground ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[14.5px] leading-relaxed">
                {scenario.customer}
              </p>
              <div className="flex gap-2.5">
                <span className="bg-muted mt-0.5 grid size-7 shrink-0 place-items-center rounded-full">
                  <BazWordmark className="text-baz-primary h-2.5 w-auto" />
                </span>
                <div className="min-w-0 space-y-2">
                  {scenario.baz.map((line) => (
                    <p
                      key={line}
                      className="bg-muted w-fit max-w-[92%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14.5px] leading-relaxed"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </Surface>
          ) : (
            <Surface lift className="overflow-hidden">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <span className="text-[13px] font-semibold">What the engine knew</span>
                <Claim kind="poc" />
              </div>

              <dl className="bg-border grid gap-px sm:grid-cols-2">
                {scenario.system.map((row) => (
                  <div key={row.label} className="bg-card flex justify-between gap-3 px-5 py-3">
                    <dt className="text-muted-foreground text-[12.5px]">{row.label}</dt>
                    <dd className="text-right font-mono text-[12.5px] font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-t px-5 py-4">
                <p className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
                  Tools offered this turn
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {scenario.toolsOffered.map((tool) => (
                    <code
                      key={tool}
                      className="bg-muted text-code-key rounded-md px-2 py-1 font-mono text-[11.5px]"
                    >
                      {tool}
                    </code>
                  ))}
                </div>
                <p className="text-muted-foreground mt-3.5 max-w-[62ch] text-[12.5px] leading-relaxed">
                  None of these creates, submits or consents to anything. The ones that could put
                  a product in front of somebody are not on the list when the turn is sensitive.
                </p>
              </div>
            </Surface>
          )}
        </motion.div>
      </AnimatePresence>

      <Reveal className="mt-4">
        <p className="text-muted-foreground border-primary/30 border-l-2 pl-4 text-[13px] leading-relaxed">
          {scenario.note}
        </p>
      </Reveal>
    </section>
  )
}
