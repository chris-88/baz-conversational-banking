import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/shells/boi/Wordmark'
import { routes } from '@/app/routes'
import { cn } from '@/lib/utils'

/**
 * These sections do not exist in the prototype, so rather than rendering dead text each one
 * opens the conversation with what someone clicking it is probably after.
 */
const navigation = [
  { label: 'Everyday banking', opener: 'I want to sort out my day-to-day banking' },
  { label: 'Borrowing', opener: 'I am thinking about borrowing some money' },
  { label: 'Saving & investing', opener: 'I want to start saving' },
  { label: 'Insurance', opener: 'I want to protect my family' },
  { label: 'Help & support', opener: 'I need help with something' },
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
            <Link
              key={item.label}
              to={`${routes.baz}?say=${encodeURIComponent(item.opener)}`}
              className="text-sm whitespace-nowrap opacity-90 transition-opacity hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to={routes.baz}>Chat to Baz</Link>
          </Button>

          <Link
            to={routes.baz}
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full opacity-80 transition-opacity hover:opacity-100"
          >
            <SearchIcon aria-hidden className="size-4" />
          </Link>

          <Button asChild size="sm" className="rounded-full px-5">
            <Link to={routes.app.login}>Log in</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
