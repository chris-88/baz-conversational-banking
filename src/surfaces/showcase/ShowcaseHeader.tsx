import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { routes } from '@/app/routes'

/**
 * The same bar the explainer wears: wordmark, a divider, the page's name, and a way back.
 *
 * While a chapter plays the right-hand action reads "Exit showcase" and returns to the
 * opening screen with the sound stopped, ready for the next Start, rather than leaving the
 * page: in a meeting room the thing somebody wants after an interruption is the room-ready
 * frame, not the product. The middle of the bar carries the chapter and the overall progress
 * so the room can see where it is.
 */
export function ShowcaseHeader({
  playing,
  onExit,
  children,
}: {
  readonly playing?: boolean
  /** What "Exit showcase" does while playing. */
  readonly onExit?: () => void
  /** The chapter readout and global progress, only while playing. */
  readonly children?: ReactNode
}): ReactNode {
  return (
    <header className="bg-background/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <BazWordmark className="h-5 w-auto" />
          <span aria-hidden className="bg-border h-4 w-px" />
          <span className="text-muted-foreground text-sm">Showcase</span>
        </div>

        {children !== undefined && (
          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">{children}</div>
        )}

        {playing === true ? (
          <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onExit}>
            <XIcon className="size-4" />
            Exit showcase
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5">
            <Link to={routes.baz}>
              <ArrowLeftIcon className="size-4" />
              Back to Baz
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}

/** The prototype disclosure every public surface carries. */
export function ShowcaseFooter(): ReactNode {
  return (
    <footer className="bg-background border-t py-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
        <p className="text-muted-foreground max-w-[60ch] text-xs leading-relaxed">
          A Bank of Ireland prototype. Not a banking service, it holds no real accounts, and
          nothing anybody does in it reaches a bank. The customer in the demonstration is
          synthetic.
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link to={routes.howItWorks}>How Baz works</Link>
        </Button>
      </div>
    </footer>
  )
}
