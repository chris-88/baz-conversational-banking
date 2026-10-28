import { useMemo, type ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CHAPTERS } from '@/content/showcase/types'
import type { Manifests } from './playback'
import { parseVtt } from './vtt'
import { formatClock } from './format'

/**
 * The whole narration as text, chapter by chapter.
 *
 * Built from the caption files, so there is one source for what was said. A reader who
 * cannot hear the room gets everything the room heard, and in order.
 */
export function TranscriptDrawer({
  manifests,
  open,
  onOpenChange,
}: {
  readonly manifests: Manifests
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}): ReactNode {
  const chapters = useMemo(
    () =>
      CHAPTERS.map((chapter) => ({
        chapter,
        label: manifests[chapter].label,
        captions: parseVtt(manifests[chapter].captions),
      })),
    [manifests],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Transcript</SheetTitle>
          <SheetDescription>
            The narration, chapter by chapter, from the caption files.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-8 px-4 pb-8">
          {chapters.map(({ chapter, label, captions }) => (
            <section key={chapter} aria-labelledby={`transcript-${chapter}`}>
              <h3 id={`transcript-${chapter}`} className="text-base font-semibold">
                {label}
              </h3>
              {captions.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-sm">No captions for this chapter yet.</p>
              ) : (
                <dl className="mt-3 space-y-2">
                  {captions.map((caption) => (
                    <div key={`${String(caption.startMs)}-${caption.text}`} className="grid grid-cols-[4ch_1fr] gap-3">
                      <dt className="text-muted-foreground pt-0.5 font-mono text-[11px] tabular-nums">
                        {formatClock(caption.startMs)}
                      </dt>
                      <dd className="text-sm leading-relaxed whitespace-pre-line">{caption.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
