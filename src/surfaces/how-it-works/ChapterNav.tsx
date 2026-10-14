import { useEffect, useRef, type ReactNode } from 'react'
import { NAV, type ChapterId } from '@/content/how-it-works/copy'
import { cn } from '@/lib/utils'

/**
 * Where you are in the argument.
 *
 * Sticky once the hero has gone, and it tracks the reader rather than the other way round:
 * scrolling updates the active chapter and the address bar, and a tap scrolls. Nothing here
 * hijacks a scroll or animates the page out from under somebody.
 *
 * The address uses the section route this page already had, `/how-it-works/discovery`, rather
 * than an anchor inside the hash. The app is hash-routed, so an anchor would mean a second `#`
 * in the URL and two mechanisms arguing over the same string. Replaced rather than pushed, or
 * the back button becomes a tour of everything the reader just scrolled past.
 */
export function ChapterNav({
  active,
  onJump,
}: {
  readonly active: ChapterId
  readonly onJump: (chapter: ChapterId) => void
}): ReactNode {
  const list = useRef<HTMLDivElement>(null)

  /* Keep the active chip in view on a narrow screen, where the nav scrolls horizontally. */
  useEffect(() => {
    const current = list.current?.querySelector<HTMLElement>(`[data-chapter="${active}"]`)
    current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  return (
    <div className="bg-background/85 sticky top-0 z-20 -mx-4 border-b px-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div
        ref={list}
        className="scrollbar-none flex gap-1 overflow-x-auto py-2"
        role="tablist"
        aria-label="Chapters"
      >
        {NAV.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            role="tab"
            data-chapter={chapter.id}
            aria-selected={active === chapter.id}
            onClick={() => {
              onJump(chapter.id)
            }}
            className={cn(
              'focus-visible:ring-ring shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none',
              active === chapter.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {chapter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
