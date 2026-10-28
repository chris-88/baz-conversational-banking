import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLinkIcon,
  FileTextIcon,
  HandshakeIcon,
  MessageCircleQuestionIcon,
  MessageSquareIcon,
  RotateCcwIcon,
  SmartphoneIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface, Tile } from '@/components/Primitives'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { showcaseConfig } from '@/content/showcase/config'
import openBazCode from '@/assets/qr/open-baz.svg'
import readArticleCode from '@/assets/qr/read-article.svg'
import askCode from '@/assets/qr/ask.svg'
import { ShowcaseFooter, ShowcaseHeader } from './ShowcaseHeader'

/**
 * The untimed close.
 *
 * Three cards of the same shape, each a code to scan and a button to tap, and nothing that
 * moves on its own: this screen stays until somebody acts. Each code encodes the address its
 * button opens, and `qr.test.ts` checks the configured URLs and the pictures still agree.
 * The third is the room's way back to the presenter: a question, or an offer to work on it.
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

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:py-12">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Eyebrow>The next step</Eyebrow>
            <h2
              ref={heading}
              tabIndex={-1}
              className="mt-3 text-[2.25rem] leading-[1.05] font-bold tracking-tight text-balance outline-none sm:text-5xl"
            >
              The conversation continues.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-[44ch] text-lg leading-snug text-pretty">
              Scan a code with your phone, or tap a button. Try Baz yourself, read the thinking
              behind it, or ask a question.
            </p>
          </div>
          <Button variant="outline" onClick={onRestart} className="gap-2">
            <RotateCcwIcon className="size-4" />
            Watch it again
          </Button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
          <ExploreCard
            icon={<SmartphoneIcon />}
            title="Try Baz yourself"
            blurb="The working conversational banking proof of concept, on your own phone."
            code={openBazCode}
            codeAlt="QR code linking to the live Baz demonstration"
            address={showcaseConfig.liveDemoShort}
            context={
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
                  <MessageSquareIcon aria-hidden className="size-3" />
                  Try saying
                </p>
                <p className="mt-1.5 text-sm italic">“{showcaseConfig.examplePrompt}”</p>
              </>
            }
            action={
              <Button asChild className="gap-2">
                <a href={showcaseConfig.liveDemoUrl} target="_blank" rel="noreferrer">
                  Launch Baz
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
            }
            footnote="Demonstration only. Use fictional details; no real banking instructions are submitted."
          />

          <ExploreCard
            icon={<FileTextIcon />}
            tone="deep"
            title="Read the thinking"
            blurb="Why conversational AI could reshape the relationship between banks and their customers."
            code={readArticleCode}
            codeAlt="QR code linking to the article"
            address={showcaseConfig.articleShort}
            context={
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
                  <FileTextIcon aria-hidden className="size-3" />
                  The article
                </p>
                <p className="mt-1.5 text-sm font-semibold">
                  Who owns the customer relationship in the age of AI?
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  The opportunity for conversational banking, the risk of disintermediation, and
                  why Baz explores both.
                </p>
              </>
            }
            action={
              <Button asChild className="gap-2">
                <Link to={showcaseConfig.articleHref.replace(/^#/, '')}>
                  Read the article
                  <ExternalLinkIcon className="size-4" />
                </Link>
              </Button>
            }
            footnote="A draft for discussion, with its sources listed. Under ten minutes to read."
          />

          <ExploreCard
            icon={<MessageCircleQuestionIcon />}
            tone="success"
            title="Ask, or work on this"
            blurb="A question the showcase raised, or an offer to take Baz further, in a bank or alongside one."
            code={askCode}
            codeAlt="QR code linking to the questions and collaboration form"
            address={showcaseConfig.askShort}
            context={
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
                  <HandshakeIcon aria-hidden className="size-3" />
                  Two short forms
                </p>
                <p className="mt-1.5 text-sm">
                  Questions are answered by a person, by email, after the session. Offers to
                  collaborate get a reply from the same person.
                </p>
              </>
            }
            action={
              <Button asChild className="gap-2">
                <Link to={showcaseConfig.askHref.replace(/^#/, '')}>
                  Ask or join in
                  <ExternalLinkIcon className="size-4" />
                </Link>
              </Button>
            }
            footnote="Your name and email, a sentence, and a box to tick. Nothing else is kept."
          />
        </div>
      </main>

      <ShowcaseFooter />
    </div>
  )
}

/** One destination: what it is, the code that reaches it, the button that does the same, and a line of context. */
function ExploreCard({
  icon,
  tone = 'primary',
  title,
  blurb,
  code,
  codeAlt,
  address,
  context,
  action,
  footnote,
}: {
  readonly icon: ReactNode
  readonly tone?: 'primary' | 'deep' | 'success'
  readonly title: string
  readonly blurb: string
  readonly code: string
  readonly codeAlt: string
  readonly address: string
  readonly context: ReactNode
  readonly action: ReactNode
  readonly footnote: string
}): ReactNode {
  return (
    <Surface lift className="flex flex-col p-6 sm:p-7">
      <div className="flex items-start gap-3.5">
        <Tile tone={tone}>{icon}</Tile>
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-muted-foreground mt-1 min-h-[3lh] text-sm leading-relaxed text-pretty">{blurb}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-2.5">
        <img
          src={code}
          alt={codeAlt}
          width={256}
          height={256}
          className="size-52 rounded-md border bg-white p-2 sm:size-56"
        />
        <p className="text-muted-foreground font-mono text-xs">{address}</p>
      </div>

      <div className="bg-muted/60 mt-5 rounded-lg border p-3.5">{context}</div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {action}
        <p className="text-muted-foreground max-w-[34ch] text-xs leading-relaxed sm:text-right">{footnote}</p>
      </div>
    </Surface>
  )
}
