import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RefreshCwIcon } from 'lucide-react'
import { opportunity } from '@/content/how-it-works/copy'
import { scenarios } from '@/content/how-it-works/scenarios'
import { Claim, Eyebrow, Prose, Reveal } from './parts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BazWordmark } from '@/baz/BazWordmark'
import { cn } from '@/lib/utils'

/**
 * The opening argument, beside a turn that demonstrates it.
 *
 * The card is the first thing on the page that has to earn trust, so it is labelled as a
 * synthetic example and never pretends otherwise. What makes it worth showing is not the reply
 * but the three cells underneath: what was understood, what was already held, and what is
 * still missing. That is the product. The sentence is just how it talks.
 */
export function Opportunity(): ReactNode {
  return (
    <section id="opportunity" className="scroll-mt-20 border-b py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <div>
          <Eyebrow>{opportunity.eyebrow}</Eyebrow>
          <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {opportunity.title}
          </h2>
          <Prose className="mt-4">
            {opportunity.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>
        </div>

        <Reveal className="lg:sticky lg:top-20 lg:self-start">
          <ProofCard />
        </Reveal>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {opportunity.pillars.map((pillar, index) => (
          <Reveal key={pillar.title} delay={index * 0.05}>
            <Card className="h-full gap-1.5 p-4">
              <p className="text-sm font-semibold">{pillar.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{pillar.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ProofCard(): ReactNode {
  const [at, setAt] = useState(0)
  const still = useReducedMotion() === true
  const scenario = scenarios[at % scenarios.length] ?? scenarios[0]
  if (!scenario) return null

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">A turn, end to end</span>
          <Claim kind="synthetic" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 gap-1.5 text-xs"
          onClick={() => {
            setAt((current) => current + 1)
          }}
        >
          <RefreshCwIcon className="size-3" />
          Another
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          {...(still
            ? {}
            : {
                initial: { opacity: 0, y: 6 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -6 },
                transition: { duration: 0.22 },
              })}
          className="space-y-3 p-4"
        >
          <div className="flex justify-end">
            <p className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
              {scenario.customer}
            </p>
          </div>

          <div className="flex gap-2.5">
            <BazWordmark className="text-baz-primary mt-1 h-3.5 w-auto shrink-0" />
            <div className="min-w-0 space-y-2">
              {scenario.baz.map((line) => (
                <p
                  key={line}
                  className="bg-muted max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="bg-border grid gap-px border-t sm:grid-cols-3">
        {scenario.cells.map((cell, index) => (
          <motion.div
            key={`${scenario.id}-${cell.label}`}
            className="bg-card p-3"
            {...(still
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.3, delay: 0.25 + index * 0.12 },
                })}
          >
            <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.1em] uppercase">
              {cell.label}
            </p>
            <p className="mt-1 text-xs leading-snug font-medium">{cell.value}</p>
          </motion.div>
        ))}
      </div>

      <p
        className={cn(
          'text-muted-foreground border-t px-4 py-3 text-xs leading-relaxed',
          scenario.gate.sensitive && 'bg-amber-500/5',
        )}
      >
        {scenario.note}
      </p>
    </Card>
  )
}
