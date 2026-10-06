import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { BazAvatar } from '@/baz/BazAvatar'
import { BazChat } from '@/baz/BazChat'
import { OPENING_SUGGESTIONS } from '@/baz/suggestions'
import { routes } from '@/app/routes'

/**
 * Baz, and nothing else.
 *
 * The same screen in a browser tab and in the installed app, which is the point: there is no
 * signed-in version with more in it. Every visitor gets a case of their own and tells Baz what
 * it needs to know, the way they would tell a person.
 */
export function BazScreen(): ReactNode {
  const [searchParams] = useSearchParams()

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <PrototypeBanner />

      <header className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-2.5">
          <Button asChild variant="ghost" className="-ml-2 h-auto gap-2.5 px-2 py-1.5">
            <Link to={routes.landing}>
              <BazAvatar />
              <span className="text-left leading-tight">
                <span className="block text-sm font-semibold">Baz</span>
                <span className="text-muted-foreground block text-2xs font-normal">
                  AI assistant
                </span>
              </span>
            </Link>
          </Button>
        </div>
      </header>

      <BazChat
        className="mx-auto flex w-full max-w-md flex-1 flex-col"
        suggestions={OPENING_SUGGESTIONS}
        openingMessage={searchParams.get('say')}
        mode="new"
        greeting={
          <div className="space-y-2">
            <p>Hi — I&rsquo;m Baz.</p>
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
