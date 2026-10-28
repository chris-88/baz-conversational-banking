import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLinkIcon, FileTextIcon, MessageSquareIcon, RotateCcwIcon, SmartphoneIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface, Tile } from '@/components/Primitives'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { showcaseConfig } from '@/content/showcase/config'
import qrCode from '@/assets/qr/open-baz.svg'
import { ShowcaseFooter, ShowcaseHeader } from './ShowcaseHeader'

/**
 * The untimed close.
 *
 * Two cards and nothing that moves on its own: this screen stays until somebody acts. The
 * QR code is the one printed on the slides, which encodes the live demo, and the test beside
 * the landing page's copy of it checks that the configured URL and the picture still agree.
 */
export function ExploreScene({ onRestart }: { readonly onRestart: () => void }): ReactNode {
  const heading = useRef<HTMLHeadingElement>(null)

  /* Focus lands on the heading when the narration hands over, so a keyboard user is not lost. */
  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <div className="bg-muted/40 flex min-h-dvh flex-col">
      <ShowcaseHeader />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 items-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full items-start gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,4fr)] lg:gap-8 xl:gap-12">
          <div className="lg:pr-6">
            <Eyebrow>The next step</Eyebrow>
            <h2
              ref={heading}
              tabIndex={-1}
              className="mt-4 max-w-[12ch] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance outline-none sm:text-6xl"
            >
              The conversation continues.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-[36ch] text-lg leading-snug text-pretty sm:text-xl">
              Experience Baz yourself, or explore the thinking behind it.
            </p>
            <Button variant="outline" onClick={onRestart} className="mt-8 gap-2">
              <RotateCcwIcon className="size-4" />
              Watch it again
            </Button>
          </div>

          <Surface lift className="p-6 sm:p-7">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start">
              <img
                src={qrCode}
                alt="QR code linking to the live Baz demonstration"
                width={224}
                height={224}
                className="size-44 shrink-0 rounded-md border bg-white p-1.5 sm:size-56"
              />
              <div className="min-w-0">
                <Tile>
                  <SmartphoneIcon />
                </Tile>
                <h3 className="mt-3 text-xl font-bold tracking-tight">Try Baz yourself</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  Explore the working conversational banking proof of concept.
                </p>
                <Button asChild className="mt-4 gap-2">
                  <a href={showcaseConfig.liveDemoUrl} target="_blank" rel="noreferrer">
                    Launch Baz
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
                <p className="text-muted-foreground mt-3 font-mono text-xs">
                  {showcaseConfig.liveDemoShort}
                </p>
              </div>
            </div>

            <div className="bg-muted/60 mt-5 rounded-lg border p-3.5">
              <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
                <MessageSquareIcon aria-hidden className="size-3" />
                Try saying
              </p>
              <p className="mt-1.5 text-sm italic">“{showcaseConfig.examplePrompt}”</p>
            </div>

            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
              Demonstration only. Use fictional details; no real banking instructions are
              submitted.
            </p>
          </Surface>

          <Surface lift className="p-6 sm:p-7">
            <Tile tone="deep">
              <FileTextIcon />
            </Tile>
            <h3 className="mt-3 text-xl font-bold tracking-tight">Read the thinking</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              Why conversational AI could reshape the relationship between banks and their
              customers.
            </p>

            <div className="bg-brand-deep text-primary-foreground mt-5 rounded-lg p-5">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] uppercase opacity-80">
                Article
              </p>
              <p className="mt-2 text-lg leading-snug font-bold tracking-tight text-balance">
                Who owns the customer relationship in the age of AI?
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-85">
                The opportunity for conversational banking, the risk of disintermediation, and
                why Baz explores both.
              </p>
            </div>

            <Button asChild variant="outline" className="mt-5 gap-2">
              <Link to={showcaseConfig.articleHref.replace(/^#/, '')}>
                Read the article
                <ExternalLinkIcon className="size-4" />
              </Link>
            </Button>
          </Surface>
        </div>
      </main>

      <ShowcaseFooter />
    </div>
  )
}
