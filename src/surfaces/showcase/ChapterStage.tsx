import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { fade } from '@/lib/motion'
import type { Presenter } from '@/content/showcase/types'
import { FitWidth } from './FitWidth'
import { Visual } from './scene-parts'

/**
 * A word or two, one line, and the picture.
 *
 * The opening and closing chapters had a panel of prose beside each picture, and the room
 * was asked to read it, watch the picture and listen at once. The voice carries the
 * argument; the screen now carries only the cue's name and its title, and the picture gets
 * the rest of the stage, growing past its design width on a big screen.
 */
export function ChapterStage({
  cueId,
  presenter,
  designWidth,
  maxScale,
  still,
  children,
}: {
  readonly cueId: string
  readonly presenter: Presenter | undefined
  readonly designWidth: number
  readonly maxScale: number
  readonly still: boolean
  readonly children: ReactNode
}): ReactNode {
  const heading = (
    <div className="text-center">
      {presenter?.eyebrow !== undefined && (
        <p className="text-primary font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
          {presenter.eyebrow}
        </p>
      )}
      <h2 className="mx-auto mt-2 max-w-[28ch] text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl">
        {presenter?.title}
      </h2>
    </div>
  )

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:gap-6 lg:overflow-hidden lg:py-6">
      {still ? (
        heading
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={cueId} {...fade}>
            {heading}
          </m.div>
        </AnimatePresence>
      )}
      <Visual cueId={cueId} still={still} className="max-lg:h-auto lg:flex-1">
        <FitWidth designWidth={designWidth} maxScale={maxScale}>
          {children}
        </FitWidth>
      </Visual>
    </div>
  )
}
