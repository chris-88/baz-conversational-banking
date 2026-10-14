import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hero } from '@/content/how-it-works/copy'
import { forms, generated } from '@/content/how-it-works/forms'
import { headline } from '@/content/how-it-works/economics'
import metrics from '@/content/how-it-works/build-metrics.json'
import { cn } from '@/lib/utils'

/**
 * The opening.
 *
 * Four numbers under the standfirst, because the fastest way to say this is a serious piece of
 * work is to put the countable parts of it in front of somebody before the first paragraph.
 * Each one is linked to the chapter that proves it.
 */
export function Hero(): ReactNode {
  const still = useReducedMotion() === true

  const facts = [
    { value: String(forms.length), label: 'published bank journeys, read not rebuilt' },
    { value: String(forms[1]?.fieldCount ?? 0), label: 'controls in the loan definition' },
    { value: `€${String(headline[1]?.value.replace('€', '') ?? '')}`, label: 'a 12-turn conversation' },
    { value: String(metrics.commits), label: `commits over ${String(metrics.workingDays)} days` },
  ]

  const rise = (delay: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
        }

  return (
    <header className="pt-8 pb-10 sm:pt-14 sm:pb-14">
      <motion.p
        className="text-primary font-mono text-[11px] font-medium tracking-[0.14em] uppercase"
        {...rise(0)}
      >
        Bank of Ireland · prototype
      </motion.p>

      <motion.h1
        className="mt-4 max-w-[18ch] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl"
        {...rise(0.05)}
      >
        {hero.title}
      </motion.h1>

      <motion.p
        className="text-muted-foreground mt-5 max-w-[56ch] text-base leading-relaxed text-pretty sm:text-lg"
        {...rise(0.1)}
      >
        {hero.standfirst}
      </motion.p>

      <motion.dl
        className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4"
        {...rise(0.18)}
      >
        {facts.map((fact, index) => (
          <div key={fact.label} className={cn(index > 0 && 'sm:border-l sm:pl-6')}>
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <span className="block text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]">
                {fact.value}
              </span>
              <span className="text-muted-foreground mt-1.5 block text-[12.5px] leading-snug">
                {fact.label}
              </span>
            </dd>
          </div>
        ))}
      </motion.dl>

      <motion.p
        className="text-muted-foreground mt-8 border-t pt-5 text-[12.5px]"
        {...rise(0.24)}
      >
        Everything below is measured or published. The one estimate on the page says so, and the
        packet at the end of it has never been sent anywhere: {generated.status.toLowerCase()}.
      </motion.p>
    </header>
  )
}
