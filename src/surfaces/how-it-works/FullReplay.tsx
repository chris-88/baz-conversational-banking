import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { PlayIcon, ShieldOffIcon } from 'lucide-react'
import { generated } from '@/content/how-it-works/forms'
import { future } from '@/content/how-it-works/copy'
import { Claim, Reveal, Surface } from './parts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The whole journey, compressed.
 *
 * One sentence to a submission packet, in the order it actually happens. The last frame is the
 * point of the entire feature: a complete, correctly shaped application that is deliberately
 * not sent anywhere.
 *
 * The entry count is this prototype's, not the bank's capture: forty-three is what Baz
 * generated on a live case. The captured browser submission carried seventy-four, and using
 * that number here would be claiming to have produced something we did not.
 */
const FRAMES: readonly { readonly label: string; readonly detail: string }[] = [
  { label: '“I need €20,000 for a car.”', detail: 'One sentence, in their own words' },
  { label: 'Gate: banking', detail: 'In scope, not sensitive. The model sees it' },
  { label: 'Two facts recorded', detail: 'Amount and purpose, validated against the catalogue' },
  { label: 'Loan definition loaded', detail: '418 published controls, read not written' },
  { label: 'What applies, resolved', detail: 'Page gates, branches and defaults settle' },
  { label: 'Known facts filled in', detail: 'Name, PPS number, income, address: never asked again' },
  { label: 'The rest asked for', detail: 'A couple at a time, in conversation' },
  { label: 'Total calculated', detail: '{:179}+{:218}+… nobody is asked for it' },
  { label: 'Repayment computed', detail: '€903.63, standard amortisation at a published rate' },
  { label: 'Eligibility: stand-in', detail: 'A credit decision is not ours to make' },
  { label: 'Document attached', detail: 'A reference, with no fabricated signature' },
  { label: 'Declarations ticked', detail: 'The bank’s wording, an explicit tap each' },
  { label: `${String(generated.entries)}-entry packet generated`, detail: 'In the order a browser would send it' },
]

const FRAME_MS = 850

export function FullReplay(): ReactNode {
  const [at, setAt] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const still = useReducedMotion() === true

  const play = useCallback(() => {
    clearTimeout(timer.current)
    setPlaying(true)
    setAt(0)

    const step = (index: number): void => {
      if (index >= FRAMES.length - 1) {
        setPlaying(false)
        return
      }
      timer.current = setTimeout(() => {
        setAt(index + 1)
        step(index + 1)
      }, FRAME_MS)
    }

    step(0)
  }, [])

  useEffect(() => () => {
    clearTimeout(timer.current)
  }, [])

  /* Reduced motion gets the finished list, which is the same information without the theatre. */
  const reached = still ? FRAMES.length - 1 : at

  return (
    <section id="future" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 sm:pt-20">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-[20ch] text-[1.75rem] leading-[1.15] font-bold tracking-tight text-balance sm:text-[2.25rem]">
            One conversation, a whole banking journey underneath
          </h2>
          {!still && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={play} disabled={playing}>
              <PlayIcon className="size-3.5" />
              {playing ? 'Playing…' : 'Watch it in eleven seconds'}
            </Button>
          )}
        </div>
      </Reveal>

      <ol className="mt-7 space-y-1" aria-label="What happens across one conversation">
        {FRAMES.map((frame, index) => {
          const shown = index <= reached
          return (
            <motion.li
              key={frame.label}
              {...(still ? {} : { animate: { opacity: shown ? 1 : 0.25 } })}
              transition={{ duration: 0.25 }}
              className={cn(
                'relative flex items-baseline gap-3 rounded-lg px-3 py-2.5 transition-colors',
                index === at && !still && 'bg-primary/5 ring-primary/20 ring-1',
                index === FRAMES.length - 1 && 'bg-success/5',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full font-mono text-[9.5px] font-semibold tabular-nums',
                  index <= reached ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium">{frame.label}</span>
                <span className="text-muted-foreground block text-[12px] leading-snug">
                  {frame.detail}
                </span>
              </span>
            </motion.li>
          )
        })}
      </ol>

      <motion.div
        {...(still ? {} : { animate: { opacity: reached >= FRAMES.length - 1 ? 1 : 0.3 } })}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <Surface lift className="border-warning-border bg-warning/50 p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-warning-border/40 text-warning-foreground grid size-8 place-items-center rounded-lg">
              <ShieldOffIcon aria-hidden className="size-4" />
            </span>
            <p className="text-lg font-bold tracking-tight">{generated.status}</p>
            <Claim kind="poc" />
          </div>
          <p className="text-muted-foreground mt-3 max-w-[62ch] text-[13.5px] leading-relaxed">
            The packet is complete and correctly shaped, and there is no code path in this
            prototype that sends it. The endpoint is recorded as the intended destination and
            nothing more.
          </p>
        </Surface>
      </motion.div>

      <Reveal className="mt-16 border-t pt-12">
        <p className="text-muted-foreground max-w-[62ch] text-[15px] leading-relaxed">
          {future.body[0]}
        </p>
        <p className="text-muted-foreground mt-3 max-w-[62ch] text-[15px] leading-relaxed">
          {future.body[1]}
        </p>

        <div className="mt-10">
          {future.close.map((line, index) => (
            <p
              key={line}
              className={cn(
                'text-2xl tracking-tight text-balance sm:text-3xl',
                index === future.close.length - 1
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground',
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
