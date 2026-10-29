import { useMemo, type ReactNode } from 'react'
import type { ChapterManifest } from '@/content/showcase/types'
import { activeCaption, parseVtt } from './vtt'

/**
 * The caption line.
 *
 * Derived from the same clock as the scenes, so a seek lands on the right words. Not a live
 * region: the transcript drawer is the accessible route, and reading every caption aloud
 * over the narration would be the opposite of help.
 *
 * Positioned over the bottom of the stage; the stage pads for it only while captions are on,
 * so with them off (the default) the pictures have the whole height, and with them on the
 * line never covers the phone's composer.
 */
export function Captions({
  manifest,
  localTimeMs,
  on,
}: {
  readonly manifest: ChapterManifest
  readonly localTimeMs: number
  readonly on: boolean
}): ReactNode {
  const captions = useMemo(() => parseVtt(manifest.captions), [manifest.captions])
  const caption = on ? activeCaption(captions, localTimeMs) : null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center px-4 pb-2 sm:h-16">
      {caption !== null && (
        <p
          aria-live="off"
          className="bg-foreground/85 text-background max-w-[70ch] rounded-md px-3 py-1.5 text-center text-sm leading-snug whitespace-pre-line sm:text-base lg:text-lg"
        >
          {caption.text}
        </p>
      )}
    </div>
  )
}
