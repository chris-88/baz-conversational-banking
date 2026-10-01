import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/shells/boi/Wordmark'
import { routes } from '@/app/routes'
import { cn } from '@/lib/utils'

const navigation = [
  'Everyday banking',
  'Borrowing',
  'Saving & investing',
  'Insurance',
  'Help & support',
] as const

/**
 * The public site header. Sits over the hero on desktop, so it is transparent against the dark
 * panel and the links inherit its foreground colour.
 */
export function SiteHeader({ className }: { className?: string }): ReactNode {
  return (
    <header className={cn('relative z-20', className)}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 lg:px-8">
        <Link to={routes.public} className="shrink-0" aria-label="Bank of Ireland, home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <span
              key={item}
              // Not links: these pages do not exist in the prototype, and a link that goes
              // nowhere is worse than plain text.
              className="cursor-default text-sm whitespace-nowrap opacity-90"
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to={routes.baz}>Chat to Baz</Link>
          </Button>

          <button
            type="button"
            disabled
            aria-label="Search (not available in this prototype)"
            className="grid size-9 place-items-center rounded-full opacity-70 disabled:cursor-default"
          >
            <SearchIcon aria-hidden className="size-4" />
          </button>

          <Button asChild size="sm" className="rounded-full px-5">
            <Link to={routes.app.login}>Log in</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
