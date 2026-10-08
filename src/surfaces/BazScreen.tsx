import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BazChat } from '@/baz/BazChat'
import { BazWordmark } from '@/baz/BazWordmark'
import { routes } from '@/app/routes'
import { cn } from '@/lib/utils'
import { useViewportHeight } from '@/lib/useViewportHeight'

/**
 * Baz, and nothing else.
 *
 * The same screen in a browser tab and in the installed app, which is the point: there is no
 * signed-in version with more in it. Every visitor gets a case of their own and tells Baz what
 * it needs to know, the way they would tell a person.
 */
export function BazScreen(): ReactNode {
  const [started, setStarted] = useState(false)
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
      {/*
        Quiet while the screen is still asking the question, and settled once it is a
        conversation (spec §8).

        Centred, and the mark is set inside the word rather than beside it. A separate avatar up
        here would be a second copy of the thing sitting in the middle of the opening screen,
        waiting to move — and the whole point of that transition is that there is only one of it.
        As the `a` it is present without competing.
      */}
      <header
        className={cn(
          'bg-card/95 supports-[backdrop-filter]:bg-card/80 z-30 shrink-0 border-b backdrop-blur transition-opacity duration-200',
          started ? 'opacity-100' : 'opacity-75',
        )}
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-2.5">
          <Button asChild variant="ghost" className="h-auto px-3 py-1.5">
            <Link to={routes.landing}>
              <span className="text-center leading-tight">
                <BazWordmark className="text-base font-semibold" />
                <span
                  className={cn(
                    'text-muted-foreground block text-2xs font-normal transition-opacity duration-200',
                    started ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  AI banking assistant
                </span>
              </span>
            </Link>
          </Button>
        </div>
      </header>

      <BazChat
        onStarted={setStarted}
        className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col"
        openingMessage={searchParams.get('say')}
        mode="new"
        /*
         * The old greeting opened by denying it was another useless bot, which is a strange
         * thing to lead with: it raises the doubt before anyone had it, and then promises only
         * to "see if I can actually help". This says the one thing that is actually different
         * and asks for the thing it needs.
         */
      />
    </div>
  )
}
