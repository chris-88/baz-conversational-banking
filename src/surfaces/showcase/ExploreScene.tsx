import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, RotateCcwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { showcaseConfig } from '@/content/showcase/config'
import openBazCode from '@/assets/qr/open-baz.svg'
import readArticleCode from '@/assets/qr/read-article.svg'
import askCode from '@/assets/qr/ask.svg'
import { ShowcaseFooter, ShowcaseHeader } from './ShowcaseHeader'

/**
 * The untimed close.
 *
 * Three codes for a room, set the way the opening screen is set: one claim, a line, and the
 * thing to act on. Each code is a large white tile with a number, a name, one sentence and
 * one button under it, and nothing else; the small print is the footer's job. Nothing moves
 * on its own: this screen stays until somebody acts. Each code encodes the address its
 * button opens, and `qr.test.ts` checks the configured URLs and the pictures still agree.
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

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-[52rem] text-center">
          <Eyebrow>The next step</Eyebrow>
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-4 text-[2.75rem] leading-[1.05] font-bold tracking-tight text-balance outline-none sm:text-6xl"
          >
            The conversation continues.
          </h2>
          <p className="text-muted-foreground mt-5 text-lg leading-snug text-pretty sm:text-2xl">
            Scan a code with your phone.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid w-full max-w-[1240px] gap-10 md:grid-cols-3 md:gap-8 lg:mt-14">
          <Destination
            number="01"
            code={openBazCode}
            codeAlt="QR code linking to the live Baz demonstration"
            address={showcaseConfig.liveDemoShort}
            title="Try Baz"
            line="The working prototype, on your own phone. Use made-up details; nothing reaches a bank."
            action={
              <Button asChild size="lg" className="h-12 gap-2.5 px-6 text-base">
                <a href={showcaseConfig.liveDemoUrl} target="_blank" rel="noreferrer">
                  Launch Baz
                  <ArrowRightIcon className="size-4" />
                </a>
              </Button>
            }
          />
          <Destination
            number="02"
            code={readArticleCode}
            codeAlt="QR code linking to the article"
            address={showcaseConfig.articleShort}
            title="Read the thinking"
            line="Who owns the customer relationship in the age of AI? A short article, with its sources."
            action={
              <Button asChild size="lg" className="h-12 gap-2.5 px-6 text-base">
                <Link to={showcaseConfig.articleHref.replace(/^#/, '')}>
                  Read the article
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            }
          />
          <Destination
            number="03"
            code={askCode}
            codeAlt="QR code linking to the questions and collaboration form"
            address={showcaseConfig.askShort}
            title="Ask, or work on this"
            line="A question for after the session, or an offer to take Baz further. A person replies."
            action={
              <Button asChild size="lg" className="h-12 gap-2.5 px-6 text-base">
                <Link to={showcaseConfig.askHref.replace(/^#/, '')}>
                  Ask or join in
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            }
          />
        </ol>

        <div className="mt-12 flex justify-center lg:mt-14">
          <Button variant="ghost" onClick={onRestart} className="text-muted-foreground gap-2">
            <RotateCcwIcon className="size-4" />
            Watch it again
          </Button>
        </div>
      </main>

      <ShowcaseFooter />
    </div>
  )
}

/** One place to go: the code, the address, a number and a name, one sentence, one button. */
function Destination({
  number,
  code,
  codeAlt,
  address,
  title,
  line,
  action,
}: {
  readonly number: string
  readonly code: string
  readonly codeAlt: string
  readonly address: string
  readonly title: string
  readonly line: string
  readonly action: ReactNode
}): ReactNode {
  return (
    <li className="flex flex-col items-center text-center">
      <div className="bg-card rounded-3xl border p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_18px_44px_-18px_rgba(16,24,40,0.28)]">
        <img src={code} alt={codeAlt} width={256} height={256} className="size-56 lg:size-64" />
      </div>
      <p className="text-muted-foreground mt-3 font-mono text-xs">{address}</p>

      <p className="text-primary mt-7 font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
        {number}
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-[30ch] text-base leading-snug text-pretty">{line}</p>
      <div className="mt-5">{action}</div>
    </li>
  )
}
