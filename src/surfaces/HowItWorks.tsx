import { useCallback, useEffect, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { routes } from '@/app/routes'
import { CHAPTERS, type ChapterId } from '@/content/how-it-works/copy'
import { ChapterNav } from './how-it-works/ChapterNav'
import { useActiveChapter } from './how-it-works/useActiveChapter'
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
 * it is at its own address and reads as an article rather than a dashboard. Each chapter pairs
 * a claim with the evidence for it, and the evidence is real: published definitions, measured
 * token counts, commits counted out of git.
 *
 * Three rules hold the whole page together. Nothing is only legible once it has animated, so
 * everything works with motion switched off. Every number carries where it came from, because
 * the draft this replaces had three of four headline figures wrong. And anything the prototype
 * does not actually do is labelled as a direction rather than described in the present tense.
 */
export function HowItWorks(): ReactNode {
  useDocumentTitle('How Baz works')

  const { section } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const active = useActiveChapter(CHAPTERS)

  /** A deep link lands on its chapter. One-time, so later scrolling is not fought. */
  useEffect(() => {
    if (section === undefined) return
    if (!CHAPTERS.some((chapter) => chapter === section)) return
    document.getElementById(section)?.scrollIntoView({ block: 'start' })
  }, [section])

  /* The address follows the reader, replacing rather than pushing: the back button should
   * leave the page, not walk back through it. */
  useEffect(() => {
    if (section === active) return
    void navigate(`${routes.howItWorks}/${active}`, { replace: true })
  }, [active, navigate, section])

  const jump = useCallback((chapter: ChapterId) => {
    document.getElementById(chapter)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <Hero />
        <ChapterNav active={active} onJump={jump} />

        <Opportunity />
        <Experience />
        <Architecture />
        <Discovery />
        <Build />
        <Lessons />
        <Economics />
        <FullReplay />
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <p className="text-muted-foreground text-xs">
            A Bank of Ireland prototype. Not a banking service, and nothing in it reaches a bank.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={routes.baz}>Try it</Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}
