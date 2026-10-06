import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BazAvatar } from '@/baz/BazAvatar'
import { BazChat } from '@/baz/BazChat'
import { OPENING_SUGGESTIONS } from '@/baz/suggestions'
import { routes } from '@/app/routes'
import { useViewportHeight } from '@/lib/useViewportHeight'

/**
 * Baz, and nothing else.
 *
 * The same screen in a browser tab and in the installed app, which is the point: there is no
 * signed-in version with more in it. Every visitor gets a case of their own and tells Baz what
 * it needs to know, the way they would tell a person.
 */
export function BazScreen(): ReactNode {
  const [searchParams] = useSearchParams()
  useViewportHeight()

  return (
    /*
     * A fixed box the exact height of what is on screen, with only the transcript scrolling
     * inside it.
     *
     * `min-h-dvh` let the page grow taller than the phone and scroll as a whole, so when the
     * keyboard opened the composer went behind it and Baz's reply went off the top. Nothing
     * here can exceed the box, so there is no page scroll to go wrong.
     */
    <div className="bg-background flex h-[var(--viewport-height)] flex-col overflow-hidden overscroll-none">
      <header className="bg-card/95 supports-[backdrop-filter]:bg-card/80 z-30 shrink-0 border-b backdrop-blur">
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
        className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col"
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
