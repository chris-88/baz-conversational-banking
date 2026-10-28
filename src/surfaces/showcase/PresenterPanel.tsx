import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { CheckIcon } from 'lucide-react'
import { fade, useStill } from '@/lib/motion'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import type { Presenter } from '@/content/showcase/types'
import { cn } from '@/lib/utils'

/**
 * What the narrator is saying, as a panel rather than a transcript.
 *
 * A chapter label, one statement, one paragraph, at most three points, and an optional line
 * about what is really running underneath. The limits are enforced in the content tests so
 * this never becomes a slide.
 */
export function PresenterPanel({
  presenter,
  cueId,
  index,
  total,
  still: stillOverride,
  className,
  size = 'md',
}: {
  readonly presenter: Presenter | undefined
  readonly cueId: string
  readonly index: number
  readonly total: number
  /** Render the end state with no cross-fade, as after a seek. */
  readonly still?: boolean
  readonly className?: string
  readonly size?: 'md' | 'lg'
}): ReactNode {
  const still = useStill() || stillOverride === true
  const counter = `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  const body = (
    <div>
      <Eyebrow>
        <span className="text-primary tabular-nums">{counter}</span>
        {presenter?.eyebrow !== undefined && (
          <>
            <span aria-hidden className="mx-2 opacity-50">·</span>
            {presenter.eyebrow}
          </>
        )}
      </Eyebrow>
      {presenter !== undefined && (
        <>
          <h2
            className={cn(
              'mt-4 max-w-[18ch] leading-[1.1] font-bold tracking-tight text-balance',
              size === 'lg' ? 'text-[2.25rem] xl:text-[2.75rem]' : 'text-[1.75rem] xl:text-[2.25rem]',
            )}
          >
            {presenter.title}
          </h2>
          {presenter.body !== undefined && (
            <p
              className={cn(
                'text-muted-foreground mt-4 max-w-[46ch] leading-relaxed text-pretty',
                size === 'lg' ? 'text-lg xl:text-xl' : 'text-[15px] xl:text-lg',
              )}
            >
              {presenter.body}
            </p>
          )}
          {presenter.bullets !== undefined && presenter.bullets.length > 0 && (
            <ul className="mt-6 space-y-3">
              {presenter.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="bg-primary/10 text-primary mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span className={cn('leading-snug', size === 'lg' ? 'text-base xl:text-lg' : 'text-[15px]')}>
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {presenter.technicalNote !== undefined && (
            <p className="text-muted-foreground mt-6 max-w-[52ch] border-t pt-4 font-mono text-[11.5px] leading-relaxed">
              <span className="text-foreground font-semibold">Under the hood.</span>{' '}
              {presenter.technicalNote}
            </p>
          )}
        </>
      )}
    </div>
  )

  if (still) return <div className={className}>{body}</div>

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={cueId} {...fade}>
          {body}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
