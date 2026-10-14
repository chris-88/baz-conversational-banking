import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hero } from '@/content/how-it-works/copy'

/**
 * The opening: a title and one sentence.
 *
 * It carried a label, four figures and a line of disclaimer before this, and all of it was
 * answering questions nobody had asked yet. The numbers belong to the chapters that earn them,
 * where there is something to compare them against; up here they were a scoreboard in front of
 * a story. What the page needs at the top is the claim, said once.
 */
export function Hero(): ReactNode {
  const still = useReducedMotion() === true

  const rise = (delay: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
        }

  return (
    <header className="pt-10 pb-12 sm:pt-16 sm:pb-16">
      <motion.h1
        className="max-w-[18ch] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl"
        {...rise(0)}
      >
        {hero.title}
      </motion.h1>

      <motion.p
        className="text-muted-foreground mt-5 max-w-[46ch] text-lg leading-snug text-pretty sm:text-2xl"
        {...rise(0.07)}
      >
        {hero.standfirst}
      </motion.p>
    </header>
  )
}
