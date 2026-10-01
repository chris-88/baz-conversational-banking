import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GridIcon, HomeIcon, LifeBuoyIcon, WalletIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'

type Tab = { to: string; label: string; icon: ReactNode; enabled: boolean }

const tabs: readonly Tab[] = [
  { to: routes.app.root, label: 'Home', icon: <HomeIcon />, enabled: true },
  { to: routes.app.products, label: 'Products', icon: <WalletIcon />, enabled: false },
  { to: '#support', label: 'Support', icon: <LifeBuoyIcon />, enabled: false },
  { to: '#more', label: 'More', icon: <GridIcon />, enabled: false },
]

/**
 * The app's bottom navigation, with Baz raised in the centre.
 *
 * Baz sitting in the middle of the tab bar is the whole proposition in one piece of UI: the
 * conversation is not a help widget bolted to the corner, it is the primary way through.
 */
export function BottomTabBar(): ReactNode {
  const { pathname } = useLocation()

  const left = tabs.slice(0, 2)
  const right = tabs.slice(2)
  const bazActive = pathname === routes.app.baz

  return (
    <nav
      aria-label="Main"
      className="bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-5 items-end px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {left.map((tab) => (
          <TabButton key={tab.label} tab={tab} active={pathname === tab.to} />
        ))}

        <div className="flex justify-center">
          <Link
            to={routes.app.baz}
            aria-label="Baz"
            aria-current={bazActive ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring -mt-5 grid size-12 place-items-center rounded-full shadow-md transition-transform focus-visible:ring-2 focus-visible:outline-none active:scale-95',
              bazActive ? 'bg-brand-deep text-brand-deep-foreground' : 'bg-primary text-primary-foreground',
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 9a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H9l-4 3z" />
              <path d="M9.5 11h.01M14.5 11h.01" />
            </svg>
          </Link>
        </div>

        {right.map((tab) => (
          <TabButton key={tab.label} tab={tab} active={pathname === tab.to} />
        ))}
      </div>
    </nav>
  )
}

function TabButton({ tab, active }: { tab: Tab; active: boolean }): ReactNode {
  const className = cn(
    'flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-2xs [&>svg]:size-5',
    active ? 'text-primary font-medium' : 'text-muted-foreground',
    !tab.enabled && 'opacity-45',
  )

  if (!tab.enabled) {
    return (
      <span className={className} aria-disabled>
        {tab.icon}
        {tab.label}
      </span>
    )
  }

  return (
    <Link to={tab.to} className={className} aria-current={active ? 'page' : undefined}>
      {tab.icon}
      {tab.label}
    </Link>
  )
}
