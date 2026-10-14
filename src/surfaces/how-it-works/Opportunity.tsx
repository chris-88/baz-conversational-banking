import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  CheckCircle2Icon,
  ClockIcon,
  DatabaseIcon,
  RefreshCwIcon,
  UserRoundIcon,
  ZapIcon,
} from 'lucide-react'
import { opportunity } from '@/content/how-it-works/copy'
import { scenarios } from '@/content/how-it-works/scenarios'
import { Claim, Eyebrow, Reveal, Surface, Tile } from './parts'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { cn } from '@/lib/utils'

/**
 * The opening argument, beside a turn that demonstrates it.
 *
 * The card is the first thing on the page that has to earn trust, so it says it is synthetic.
 * What makes it worth showing is not the reply but the three cells underneath: what was
 * understood, what was already held, and what is still missing. That is the product; the
 * sentence is only how it talks.
 */
export function Opportunity(): ReactNode {
  const pillarIcons = [UserRoundIcon, ZapIcon, ClockIcon]
  const tones = ['primary', 'success', 'deep'] as const

  return (
    <section id="opportunity" className="scroll-mt-[68px] lg:scroll-mt-[84px] pb-14 sm:pb-20">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <div>
          <Eyebrow>{opportunity.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[1.75rem] leading-[1.1] font-bold tracking-tight text-balance sm:text-[2.25rem]">
            {opportunity.title}
          </h2>
          <div className="text-muted-foreground mt-5 max-w-[54ch] space-y-3 text-[15px] leading-relaxed">
            {opportunity.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <Reveal className="lg:sticky lg:top-24">
          <ProofCard />
        </Reveal>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {opportunity.pillars.map((pillar, index) => {
          const Icon = pillarIcons[index] ?? UserRoundIcon
          return (
            <Reveal key={pillar.title} delay={index * 0.06}>
              <Surface className="h-full p-5">
                <Tile tone={tones[index] ?? 'primary'}>
                  <Icon />
                </Tile>
                <p className="mt-3.5 text-[15px] font-semibold">{pillar.title}</p>
                <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
                  {pillar.body}
                </p>
              </Surface>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function ProofCard(): ReactNode {
  const [at, setAt] = useState(0)
  const still = useReducedMotion() === true
  const scenario = scenarios[at % scenarios.length] ?? scenarios[0]
  if (!scenario) return null

  const cellIcons = [CheckCircle2Icon, DatabaseIcon, ClockIcon]
  const cellTones = ['success', 'primary', 'warning'] as const

  return (
    <Surface lift className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="bg-success size-1.5 shrink-0 rounded-full" />
          <span className="truncate text-[13px] font-semibold">A turn, end to end</span>
          <Claim kind="synthetic" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 shrink-0 gap-1.5 px-2 text-xs"
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
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -8 },
                transition: { duration: 0.22 },
              })}
          className="space-y-3 px-4 py-5"
        >
          <p className="bg-primary text-primary-foreground ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[14px] leading-relaxed">
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
                  className="bg-muted w-fit max-w-[94%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[14px] leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="bg-border grid gap-px border-t sm:grid-cols-3">
        {scenario.cells.map((cell, index) => {
          const Icon = cellIcons[index] ?? CheckCircle2Icon
          return (
            <motion.div
              key={`${scenario.id}-${cell.label}`}
              className="bg-card p-3.5"
              {...(still
                ? {}
                : {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { duration: 0.3, delay: 0.3 + index * 0.14 },
                  })}
            >
              <div className="flex items-center gap-2">
                <Tile tone={cellTones[index] ?? 'primary'} size="sm">
                  <Icon />
                </Tile>
                <p className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
                  {cell.label}
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-snug font-medium">{cell.value}</p>
            </motion.div>
          )
        })}
      </div>

      <p
        className={cn(
          'text-muted-foreground border-t px-4 py-3 text-[12.5px] leading-relaxed',
          scenario.gate.sensitive && 'bg-warning/40',
        )}
      >
        {scenario.note}
      </p>
    </Surface>
  )
}
