import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BracesIcon, MessageSquareIcon } from 'lucide-react'
import { experience } from '@/content/how-it-works/copy'
import { scenarios } from '@/content/how-it-works/scenarios'
import { Claim, Code, Reveal, SectionHead, Surface, Tile } from './parts'
import { BazWordmark } from '@/baz/BazWordmark'
import { cn } from '@/lib/utils'

/**
 * The same turn, both sides at once.
 *
 * This was a toggle, and a toggle was the wrong shape for the argument. The point is not that a
 * system view exists; it is that the sentence on the left and the state on the right are the
 * same event. A reader who has to click to see the second half never puts the two together, and
 * anybody presenting this would have to narrate the switch.
 *
 * The right side is JSON because that is what it is: the gate's own output, counts read from the
 * database, the persona sliders in force, and the exact list of tools the model was handed.
 * Rendered from a real object through `JSON.stringify`, so what is on screen cannot drift into
 * a prettier shape than the system actually has.
 *
 * What is deliberately absent is any notion of the model's reasoning. Nothing stores it and
 * nothing shows it. An earlier draft carried a confidence score, which does not exist anywhere
 * in this system: inventing a property to look rigorous, on the page arguing for rigour, is the
 * exact trap.
 */
export function Experience(): ReactNode {
  const [at, setAt] = useState(0)
  const still = useReducedMotion() === true

  const scenario = scenarios[at % scenarios.length] ?? scenarios[0]
  if (!scenario) return null

  return (
    <section
      id="experience"
      className="scroll-mt-[68px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20 lg:scroll-mt-[84px]"
    >
      <SectionHead
        eyebrow={experience.eyebrow}
        title={experience.title}
        lede={experience.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 flex flex-wrap gap-1.5">
        {scenarios.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setAt(index)
            }}
            className={cn(
              'focus-visible:ring-ring rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
              scenario.id === option.id
                ? 'border-primary/40 bg-primary/5 text-primary font-medium'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          {...(still
            ? {}
            : {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.2 },
              })}
          className="mt-4 grid items-stretch gap-4 lg:grid-cols-2"
        >
          {/* Left: what the customer meets. */}
          <Surface lift className="flex min-w-0 flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 border-b px-4 py-3">
              <Tile tone="primary" size="sm">
                <MessageSquareIcon />
              </Tile>
              <span className="text-[13px] font-semibold">Customer view</span>
              <Claim kind="synthetic" />
            </div>

            <div className="flex-1 space-y-3 p-5">
              <p className="bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[14.5px] leading-relaxed">
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
                      className="bg-muted w-fit max-w-[94%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14.5px] leading-relaxed"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          {/* Right: the same turn, as the engine had it. */}
          <Surface lift className="flex min-w-0 flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 border-b px-4 py-3">
              <Tile tone="code" size="sm">
                <BracesIcon />
              </Tile>
              <span className="text-[13px] font-semibold">System view</span>
              <Claim kind="poc" />
            </div>

            <div className="bg-muted/40 min-w-0 flex-1">
              <Code
                text={JSON.stringify(scenario.state, null, 2)}
                language="json"
                className="p-4"
              />
            </div>
          </Surface>
        </motion.div>
      </AnimatePresence>

      <Reveal className="mt-4">
        <p className="text-muted-foreground border-primary/30 max-w-[72ch] border-l-2 pl-4 text-[13.5px] leading-relaxed">
          {scenario.note}
        </p>
      </Reveal>
    </section>
  )
}
