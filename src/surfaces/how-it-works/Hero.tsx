import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hero } from '@/content/how-it-works/copy'

/**
 * The opening.
 *
 * Deliberately plain. Everything below it is evidence, and a hero that performs before the
 * argument starts sets the wrong expectation about which parts of this page are decoration.
 */
export function Hero(): ReactNode {
  const still = useReducedMotion() === true

  return (
    <header className="pt-10 pb-8 sm:pt-16 sm:pb-12">
      <motion.h1
        className="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
        {...(still
          ? {}
          : {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
            })}
      >
        {hero.title}
      </motion.h1>

      <motion.p
        className="text-muted-foreground mt-4 max-w-[58ch] text-base leading-relaxed text-pretty sm:text-lg"
        {...(still
          ? {}
          : {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] },
            })}
      >
        {hero.standfirst}
      </motion.p>
    </header>
  )
}
