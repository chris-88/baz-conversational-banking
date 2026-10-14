import { useCallback, useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { routes } from '@/app/routes'
import { CHAPTERS, type ChapterId } from '@/content/how-it-works/copy'
import { ChapterBar, ChapterRail } from './how-it-works/ChapterNav'
import { scrollToChapter, useActiveChapter } from './how-it-works/useActiveChapter'
import { Hero } from './how-it-works/Hero'
import { Opportunity } from './how-it-works/Opportunity'
import { Experience } from './how-it-works/Experience'
import { Architecture } from './how-it-works/Architecture'
import { Discovery } from './how-it-works/Discovery'
import { Build } from './how-it-works/Build'
import { Lessons } from './how-it-works/Lessons'
import { Economics } from './how-it-works/Economics'
import { FullReplay } from './how-it-works/FullReplay'

/**
 * The explainer: what this is, how it works, how it got here, and what it costs.
 *
 * Written for somebody evaluating the work rather than somebody using the product, which is why
 * it is at its own address and reads as a case study rather than a dashboard. Each chapter pairs
 * a claim with the evidence for it, and the evidence is real: published definitions, measured
 * token counts, commits counted out of git.
 *
 * Three rules hold the page together. Nothing is only legible once it has animated. Every number
 * carries where it came from, because the draft this replaces had three of four headline figures
 * wrong. And anything the prototype does not actually do is labelled as a direction rather than
 * described in the present tense.
 *
 * The page sits on a tinted surface with the evidence on white cards above it. That is not
 * decoration: the first build of this had everything at one elevation, in one weight, at one
 * size, and the result was unreadable however good the sentences were.
 */
export function HowItWorks(): ReactNode {
  useDocumentTitle('How Baz works')

  const { section } = useParams<{ section: string }>()
  const { active, progress, beginJump } = useActiveChapter(CHAPTERS)

  /** A deep link lands on its chapter, once, without fighting later scrolling. */
  useEffect(() => {
    if (section === undefined) return
    if (!CHAPTERS.some((chapter) => chapter === section)) return
    scrollToChapter(section)
  }, [section])

  const jump = useCallback(
    (chapter: ChapterId) => {
      beginJump(chapter)
      scrollToChapter(chapter)
    },
    [beginJump],
  )

  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 hidden border-b backdrop-blur-sm lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <BazWordmark className="h-5 w-auto" />
            <span aria-hidden className="bg-border h-4 w-px" />
            <span className="text-muted-foreground text-sm">How it works</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to={routes.baz}>
              <ArrowLeftIcon className="size-4" />
              Back to Baz
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The narrow-screen header is part of the scroll, so the sticky bar below it is the
            only thing pinned and the reading area stays as tall as possible. */}
        <div className="flex items-center justify-between gap-4 py-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <BazWordmark className="h-4 w-auto" />
            <span aria-hidden className="bg-border h-3.5 w-px" />
            <span className="text-muted-foreground text-xs">How it works</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs">
            <Link to={routes.baz}>
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Link>
          </Button>
        </div>

        <ChapterBar active={active} progress={progress} onJump={jump} />

        <Hero />

        <div className="grid gap-10 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-14">
          <ChapterRail active={active} progress={progress} onJump={jump} />

          <main className="min-w-0 pb-16">
            <Opportunity />
            <Experience />
            <Architecture />
            <Discovery />
            <Build />
            <Lessons />
            <Economics />
            <FullReplay />
          </main>
        </div>
      </div>

      <footer className="bg-background border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <p className="text-muted-foreground max-w-[52ch] text-xs leading-relaxed">
            A Bank of Ireland prototype. Not a banking service, it holds no real accounts, and
            nothing anybody does in it reaches a bank.
          </p>
          <Button asChild size="sm" className="gap-1.5">
            <Link to={routes.baz}>
              Try it
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}
