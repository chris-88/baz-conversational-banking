import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { BazAvatar } from '@/baz/BazAvatar'
import { BazChat } from '@/baz/BazChat'
import { OPENING_SUGGESTIONS } from '@/baz/suggestions'
import { ContinueInApp } from '@/shells/boi/ContinueInApp'
import { routes } from '@/app/routes'

/**
 * §6 Stage 1 — the conversation on the public website, before anyone signs in.
 *
 * The same `BazChat` the app renders; only the chrome differs (§32).
 */
export function PublicBaz(): ReactNode {
  const [searchParams] = useSearchParams()

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <PrototypeBanner />

      <header className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-2 py-2.5">
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link to={routes.public}>
              <ArrowLeftIcon />
            </Link>
          </Button>
          <BazAvatar />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Baz</p>
            <p className="text-muted-foreground text-2xs">Bank of Ireland · AI assistant</p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={routes.app.login}>Log in</Link>
          </Button>
        </div>
      </header>

      <BazChat
        className="mx-auto flex w-full max-w-md flex-1 flex-col"
        suggestions={OPENING_SUGGESTIONS}
        openingMessage={searchParams.get('say')}
        /**
         * The public conversation knows nothing about the visitor until they sign in (§6
         * Stage 1), so every visitor gets a case of their own.
         *
         * `?demo=1` is the exception, and it exists because §55 opens on the public website
         * while §67 ends with the bank moving an application and the customer being notified.
         * A fresh case is an audience case, and the presenter console's moves act on the
         * presenter case — so without this the two halves of the story could not happen in
         * one take. Only the console hands out this link; an ordinary visitor never sees it,
         * and audience isolation is unchanged.
         */
        mode={searchParams.get('demo') === '1' ? 'demo' : 'fresh'}
        footer={() => <ContinueInApp />}
        greeting={
          <div className="space-y-2">
            <p>
              Hi — I&rsquo;m Baz, Bank of Ireland&rsquo;s AI assistant.
            </p>
            <p>
              Before you ask: no, I&rsquo;m not another bot whose greatest achievement is finding
              the Contact Us page.
            </p>
            <p>Tell me what you&rsquo;re trying to do and I&rsquo;ll see if I can actually help.</p>
          </div>
        }
      />
    </div>
  )
}
