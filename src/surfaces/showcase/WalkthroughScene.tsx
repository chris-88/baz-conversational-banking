import type { ReactNode } from 'react'
import type { ShowcaseCue, WalkthroughScene as Scene } from '@/content/showcase/types'
import { Surface } from '@/components/Primitives'
import { PresenterPanel } from './PresenterPanel'

/**
 * The middle chapter. Provisional: the phone and its scripted transcript arrive in the
 * walkthrough slice. Until then the presenter panel stands beside an empty frame.
 */
export function WalkthroughScene({
  cue,
  localTimeMs,
  position,
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly localTimeMs: number
  readonly position: { readonly index: number; readonly total: number }
  readonly still: boolean
}): ReactNode {
  return (
    <div className="mx-auto grid h-full max-w-[1600px] items-center gap-10 px-6 py-8 lg:grid-cols-[2fr_3fr] lg:gap-16">
      <Surface className="aspect-[390/844] max-h-full grid place-items-center p-6">
        <p className="text-muted-foreground font-mono text-xs">
          {cue.scene} · {String(Math.round(localTimeMs / 1000))}s
        </p>
      </Surface>
      <PresenterPanel
        presenter={cue.presenter}
        cueId={cue.id}
        index={position.index}
        total={position.total}
        still={still}
      />
    </div>
  )
}
