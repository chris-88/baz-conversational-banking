import { useState, type ReactNode } from 'react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CheckIcon, CopyIcon, PlayIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { Surface } from '@/components/Primitives'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { PhoneFrame } from '@/surfaces/showcase/PhoneFrame'
import { InstallButton } from '@/surfaces/InstallButton'
import { Collaborate } from '@/surfaces/Collaborate'
import { PLAN_CARD } from '@/content/how-it-works/story'
import { showcaseConfig } from '@/content/showcase/config'
import { routes } from '@/app/routes'
import qrCode from '@/assets/qr/open-baz.svg'

/**
 * The way in.
 *
 * It used to be a replica of a bank's website with Baz tucked inside it, which meant the first
 * thing anyone saw was a lot of scaffolding around the only part worth looking at. Now there
 * is one claim, the product itself on a phone beside it, and the ways to act: open it, watch
 * the five-minute showcase, or read how it works. The phone shows the product's own bubbles
 * and a card it really produces, not a drawing of them.
 */
export function Landing(): ReactNode {
  useDocumentTitle(null)
  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <BazWordmark className="h-7" transitionName="baz-wordmark" />
          <span className="bg-border hidden h-5 w-px sm:block" />
          <span className="text-muted-foreground hidden text-sm sm:block">A proof of concept</span>
        </div>
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={routes.howItWorks}>How it works</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={routes.article}>The article</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={routes.baz} viewTransition>
              Open Baz
              <ArrowRightIcon />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 sm:px-6">
        <section className="grid items-center gap-10 py-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:py-16">
          <div>
            <Eyebrow>Conversational banking</Eyebrow>
            <h1 className="mt-4 max-w-[14ch] text-[2.75rem] leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
              A personal banker for everyone.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-[44ch] text-lg leading-snug text-pretty sm:text-2xl">
              Tell Baz what you&rsquo;re trying to do and it will help you work through it. One
              conversation, not a product menu, and nothing you say is asked for twice.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <InstallButton />
              <Button asChild size="lg" variant="outline">
                <Link to={routes.baz} viewTransition>
                  Try in browser
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2">
                <Link to={routes.showcase}>
                  <PlayIcon className="size-4 fill-current" />
                  Watch the showcase
                </Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-5 text-sm">
              A working prototype. Use made-up details; nothing you do here reaches a bank.
            </p>
          </div>

          <Preview />
        </section>

        <section className="grid gap-8 border-t py-12 sm:grid-cols-3 sm:gap-10 lg:py-16" aria-label="What Baz does">
          <Point
            number="01"
            title="Start with your life, not a product."
            body="Married, a baby on the way, hoping to buy. Say what is going on and Baz works out what it involves and which of the bank’s products fit."
          />
          <Point
            number="02"
            title="Say it once."
            body="What you tell it is kept, with where it came from, and reused across every application. Three applications, one set of answers."
          />
          <Point
            number="03"
            title="Pick up where you left off."
            body="Close the tab, change phones, come back next week. The conversation, and what the bank did in between, are waiting."
          />
        </section>

        <ShowcaseBand />

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <OpenOnPhone />
          <Surface className="flex flex-col p-6 sm:p-7">
            <Eyebrow>The thinking</Eyebrow>
            <p className="mt-3 text-xl font-bold tracking-tight text-balance">
              Who owns the customer relationship in the age of AI?
            </p>
            <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed text-pretty">
              The opportunity for conversational banking, the risk of disintermediation, and why
              Baz explores both. A short article, with its sources.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={routes.article}>Read the article</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={routes.howItWorks}>How Baz works</Link>
              </Button>
            </div>
          </Surface>
        </section>

        {/* After the argument: somebody who has read this far is the somebody this is for. */}
        <Collaborate page="landing" className="mt-14" />

        {/*
          The one persistent way to the notice. Not in the chat header, which is the wordmark
          and nothing else — a legal link there would be the first thing a new customer reads,
          and the notice has a better moment: the first time Baz records anything.
        */}
        <footer className="text-muted-foreground mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm">
          <p className="max-w-[60ch]">
            A prototype, not a banking service, and not operated by Bank of Ireland.{' '}
            <Link className="underline underline-offset-4" to={routes.privacy}>
              How your data is used
            </Link>
          </p>
          <div className="flex gap-4">
            <Link className="hover:text-foreground" to={routes.howItWorks}>How it works</Link>
            <Link className="hover:text-foreground" to={routes.article}>The article</Link>
            <Link className="hover:text-foreground" to={routes.showcase}>The showcase</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}

/** The product on a phone: one exchange and a plan kept, drawn with its own components. */
function Preview(): ReactNode {
  return (
    <div className="mx-auto h-[560px] w-full max-w-[340px] sm:h-[640px] lg:h-[680px]" aria-label="Baz, as it looks on a phone">
      <PhoneFrame>
        <div className="space-y-3 overflow-hidden px-4 py-4 [&_div]:text-[13px] [&_div]:leading-snug">
          <ChatBubble author="customer">{showcaseConfig.examplePrompt}</ChatBubble>
          <ChatBubble author="baz">
            <MessageText text="Congratulations. That is a lot at once, and most of it connects. Before we get to products, when would you like to buy, and what have you put aside so far?" />
          </ChatBubble>
          <ChatBubble author="customer">Next summer, ideally. We have about €32,000 saved.</ChatBubble>
          <div className="pl-10">
            <CardRenderer
              card={PLAN_CARD}
              actions={{}}
              disabled
              settled={{ label: PLAN_CARD.type === 'plan_proposal' ? PLAN_CARD.title : 'Plan kept', note: 'Saved. You can change or stop it any time.' }}
            />
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}

function Point({
  number,
  title,
  body,
}: {
  readonly number: string
  readonly title: string
  readonly body: string
}): ReactNode {
  return (
    <div>
      <p className="text-primary font-mono text-[11px] font-medium tracking-[0.18em] uppercase">{number}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance">{title}</h2>
      <p className="text-muted-foreground mt-3 max-w-[36ch] leading-relaxed text-pretty">{body}</p>
    </div>
  )
}

/** The five-minute version, for anybody who would rather be shown than told. */
function ShowcaseBand(): ReactNode {
  return (
    <section className="bg-brand-deep text-brand-deep-foreground grid gap-8 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase opacity-70">
          The showcase · five minutes
        </p>
        <h2 className="mt-3 max-w-[20ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          What if banking started with a conversation?
        </h2>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-pretty opacity-85 sm:text-lg">
          A narrated run through the opportunity, the product working, and what is changing
          around it. Built for a room, fine on a phone. Sound on.
        </p>
        <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-80">
          <li><span className="mr-1.5 font-mono tabular-nums opacity-70">1</span>Opportunity</li>
          <li><span className="mr-1.5 font-mono tabular-nums opacity-70">2</span>Product</li>
          <li><span className="mr-1.5 font-mono tabular-nums opacity-70">3</span>Change</li>
        </ol>
      </div>
      <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 h-12 gap-2.5 px-6 text-base">
        <Link to={routes.showcase}>
          <PlayIcon className="size-4 fill-current" />
          Start the showcase
        </Link>
      </Button>
    </section>
  )
}

/**
 * Getting Baz onto a phone from a laptop.
 *
 * The QR is a static asset rather than something rendered here: it was generated once, so there
 * is no encoder in the bundle and nothing to go wrong at runtime. The address and the copy
 * button stay, because a code is no use to somebody already holding the phone.
 *
 * The code and the copy button go to the same place, straight into the conversation. It encodes
 * the address directly rather than a short link, so there is no third party between the scan and
 * the site, nothing to expire, and no way for it to be quietly repointed. It is a picture of a
 * URL though, so if the domain or the route moves it has to be regenerated —
 * `docs/qr-code/README.md` has the command.
 */
function OpenOnPhone(): ReactNode {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${window.location.pathname}#${routes.baz}`

  const copy = () => {
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => undefined)
  }

  return (
    <Surface className="flex gap-5 p-6 sm:p-7">
      {/*
        Hidden on phones, where it is useless: somebody reading this on the device they would
        scan it with is already where the code would send them. It earns its space on a laptop
        or a projector, which is the only time "open this on your phone" is a real problem.
      */}
      <img
        src={qrCode}
        alt="QR code linking to Baz"
        width={120}
        height={120}
        className="hidden size-28 shrink-0 self-start rounded-md border bg-white p-1 sm:block"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Eyebrow>On your phone</Eyebrow>
        <p className="mt-3 text-xl font-bold tracking-tight">Open Baz where you&rsquo;ll use it</p>
        <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
          <span className="hidden sm:inline">Scan the code, or copy the link. </span>
          Install it to your home screen, or just try it in the browser.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 text-xs">{url}</code>
          <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
    </Surface>
  )
}
