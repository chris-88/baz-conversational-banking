import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ListIcon } from 'lucide-react'
import { CHAPTERS, NAV, type ChapterId } from '@/content/how-it-works/copy'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The nav entry a chapter belongs under.
 *
 * Eight sections, six of them listed: the lessons and the closing replay are read on the way
 * past rather than navigated to. Without this, reaching either one unmarked every entry in the
 * rail, so the last third of the article had no "you are here" at all.
 */
function railEntry(active: ChapterId): ChapterId {
  const at = CHAPTERS.indexOf(active)
  let found: ChapterId = NAV[0]?.id ?? active

  for (const chapter of NAV) {
    if (CHAPTERS.indexOf(chapter.id) <= at) found = chapter.id
  }

  return found
}

/**
 * Where you are in the argument, and how much of it is left.
 *
 * The first version was a row of pills across the top. It had two problems and the second was
 * the real one. Tapping a pill scrolled the heading underneath the sticky bar that had just been
 * tapped, and the chapter tracker kept reassigning the active chapter while the smooth scroll
 * was still travelling, so the highlight flickered through three chapters on the way to the one
 * that was asked for.
 *
 * So: a rail down the left of a wide screen, which is where a long read wants its contents, with
 * a line that fills as the page is read. On a narrow screen it collapses to one line of chrome
 * and a progress bar, with the full list a tap away. Nothing hides behind a hover, and
 * underneath it is a list of buttons that scroll to headings.
 */
export function ChapterRail({
  active,
  progress,
  onJump,
}: {
  readonly active: ChapterId
  /** 0 to 1, how far through the article the reader is. */
  readonly progress: number
  readonly onJump: (chapter: ChapterId) => void
}): ReactNode {
  const still = useReducedMotion() === true
  const here = railEntry(active)

  return (
    <nav
      aria-label="Chapters"
      /*
       * `self-start` is what makes the sticky work.
       *
       * A grid item stretches to the height of its row by default, and this row is the whole
       * article. The nav was therefore thirteen thousand pixels tall, which gives a sticky box
       * nowhere to travel: it scrolled away with the page and looked exactly like a nav that
       * was never sticky at all. Sized to its own content, it pins.
       */
      className="sticky top-24 hidden self-start lg:block"
    >
      <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.14em] uppercase">
        Contents
      </p>

      <ol className="relative mt-4 space-y-0.5">
        <span aria-hidden className="bg-border absolute top-1 bottom-1 left-0 w-px" />
        <span
          aria-hidden
          className="bg-primary/40 absolute top-1 left-0 w-px"
          style={{ height: `${String(Math.round(progress * 100))}%` }}
        />

        {NAV.map((chapter) => (
          <li key={chapter.id}>
            <button
              type="button"
              aria-current={here === chapter.id ? 'true' : undefined}
              onClick={() => {
                onJump(chapter.id)
              }}
              className={cn(
                'focus-visible:ring-ring relative block w-full rounded-r-md py-1.5 pr-2 pl-4 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                here === chapter.id
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {here === chapter.id &&
                (still ? (
                  <span aria-hidden className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full" />
                ) : (
                  <motion.span
                    aria-hidden
                    layoutId="rail-marker"
                    className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full"
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              {chapter.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** The narrow-screen counterpart: one line, a progress bar, and the list behind a tap. */
export function ChapterBar({
  active,
  progress,
  onJump,
}: {
  readonly active: ChapterId
  readonly progress: number
  readonly onJump: (chapter: ChapterId) => void
}): ReactNode {
  const [open, setOpen] = useState(false)
  const here = railEntry(active)
  const current = NAV.find((chapter) => chapter.id === here)
  const at = NAV.findIndex((chapter) => chapter.id === here)

  return (
    <div className="bg-background/90 sticky top-0 z-30 -mx-4 border-b backdrop-blur-sm sm:-mx-6 lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <p className="min-w-0 truncate text-[13px] font-medium">
          <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
            {String(Math.max(at, 0) + 1)}/{String(NAV.length)}
          </span>
          <span className="ml-2">{current?.label ?? ''}</span>
        </p>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1.5 px-2 text-xs">
              <ListIcon className="size-3.5" />
              Contents
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Contents</SheetTitle>
            </SheetHeader>
            <ol className="space-y-1 px-4 pb-6">
              {NAV.map((chapter, index) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      /*
                       * After the sheet, not with it.
                       *
                       * The sheet locks the body while it is open and releases on the way out.
                       * Scrolling into that lock lands somewhere arbitrary: the same tap put a
                       * heading at 22 pixels one time and 236 the next. Waiting for the close
                       * to finish is the whole fix.
                       */
                      window.setTimeout(() => {
                        onJump(chapter.id)
                      }, 260)
                    }}
                    className={cn(
                      'focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none',
                      here === chapter.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted',
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {chapter.label}
                  </button>
                </li>
              ))}
            </ol>
          </SheetContent>
        </Sheet>
      </div>

      <div aria-hidden className="bg-border h-0.5">
        <div
          className="bg-primary h-full transition-[width] duration-150"
          style={{ width: `${String(Math.round(progress * 100))}%` }}
        />
      </div>
    </div>
  )
}
