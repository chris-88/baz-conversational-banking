import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  MessageSquareIcon,
  SmartphoneIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { BazAvatar } from '@/baz/BazAvatar'
import { InstallButton } from '@/surfaces/InstallButton'
import { routes } from '@/app/routes'
import qrCode from '@/assets/qr/open-baz.svg'

/**
 * The way in.
 *
 * It used to be a replica of a bank's website with Baz tucked inside it, which meant the first
 * thing anyone saw was a lot of scaffolding around the only part worth looking at. There is one
 * claim on this page and two ways to act on it.
 */
export function Landing(): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-6">
        <BazAvatar />
        <span className="text-xl font-bold tracking-tight">Baz</span>
        <span className="bg-border hidden h-5 w-px sm:block" />
        <span className="text-muted-foreground hidden text-sm sm:block">
          A personal banker for everyone.
        </span>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-16">
        <section className="py-10 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            A personal banker for everyone.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
            Tell Baz what you&rsquo;re trying to do and it will help you work through it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InstallButton />
            <Button asChild size="lg" variant="outline">
              <Link to={routes.baz}>
                Try in browser
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to={routes.howItWorks}>How it works</Link>
            </Button>
          </div>

          <OpenOnPhone />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<MessageSquareIcon />}
            title="Say it in your own words"
            description="No menus and no forms to find. Describe what is going on and Baz works out what it means."
          />
          <Feature
            icon={<DownloadIcon />}
            title="Install it, or don't"
            description="Add Baz to your home screen for an app-like experience, or just open it in a browser."
          />
          <Feature
            icon={<SmartphoneIcon />}
            title="It remembers"
            description="Plans, decisions and what you already told it carry across every conversation."
          />
        </section>
      </main>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly description: string
}): ReactNode {
  return (
    <Card>
      <CardContent className="px-0">
        {/* Stacked, and unclamped: three short sentences are the whole of the page's argument
            and truncating them to two lines made each one stop mid-point. */}
        <Item variant="muted" className="flex-col items-start gap-3 bg-transparent">
          <ItemMedia variant="icon">{icon}</ItemMedia>
          <ItemContent>
            <ItemTitle>{title}</ItemTitle>
            <ItemDescription className="line-clamp-none">{description}</ItemDescription>
          </ItemContent>
        </Item>
      </CardContent>
    </Card>
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
    <Card className="mt-10 max-w-lg">
      <CardContent className="flex gap-5">
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
          className="hidden size-30 shrink-0 self-start rounded-md sm:block"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="font-medium">Open Baz on your phone</p>
            <p className="text-muted-foreground text-sm">
              <span className="hidden sm:inline">Scan the code, or copy the link. </span>
              Install it to your home screen, or just try it in the browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 text-sm">
              {url}
            </code>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
