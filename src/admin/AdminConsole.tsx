import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  MessagesSquareIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminLogin } from '@/admin/AdminLogin'
import { useAdminAuth } from '@/admin/useAdminAuth'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { BazAvatar } from '@/baz/BazAvatar'
import { routes } from '@/app/routes'
import { cn } from '@/lib/utils'

/**
 * Four screens: the conversations, and the three things that shape them.
 *
 * There were six, and the split between "overview", "cases" and "audience" was a distinction
 * only the person who built it could hold — all three were lists of the same conversations.
 */
const sections = [
  { to: routes.admin.root, label: 'Cases', icon: <MessagesSquareIcon />, end: false },
  { to: routes.admin.guardrails, label: 'Guardrails', icon: <ShieldAlertIcon />, end: false },
  { to: routes.admin.persona, label: 'Persona', icon: <SlidersHorizontalIcon />, end: false },
  { to: routes.admin.engine, label: 'Goals & needs', icon: <LayoutDashboardIcon />, end: false },
] as const

/**
 * §37 to §44 — the presenter console.
 *
 * Sidebar on a desk, a scrolling row on a phone. Signing in only decides what is drawn: the
 * server checks admin status on every call, which is what actually protects it.
 */
export function AdminConsole(): ReactNode {
  const auth = useAdminAuth()
  const { pathname } = useLocation()

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />

      <div className="mx-auto flex w-full max-w-6xl gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6 space-y-6">
            <Link to={routes.admin.root} className="flex items-center gap-2.5 px-2">
              <BazAvatar size="sm" />
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight">Baz</span>
                <span className="text-muted-foreground block text-2xs">Admin console</span>
              </span>
            </Link>

            {auth.email !== null && (
              <nav className="space-y-0.5">
                {sections.map((section) => (
                  <NavLink
                    key={section.to}
                    to={section.to}
                    end={section.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors [&>svg]:size-4',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted',
                      )
                    }
                  >
                    {section.icon}
                    {section.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 border-b backdrop-blur lg:border-0 lg:bg-transparent">
            <div className="flex items-center gap-3 px-4 py-3 lg:px-0">
              <BazAvatar size="sm" className="lg:hidden" />
              <div className="min-w-0 flex-1">
                <h1 className="text-h3 truncate font-semibold">Presenter console</h1>
                <p className="text-muted-foreground truncate text-xs">
                  {auth.email ?? 'Run the demonstration from here.'}
                </p>
              </div>
              {auth.email !== null && (
                <Button size="sm" variant="ghost" onClick={() => void auth.signOut()}>
                  Sign out
                </Button>
              )}
            </div>

            {auth.email !== null && (
              <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
                {sections.map((section) => (
                  <NavLink
                    key={section.to}
                    to={section.to}
                    end={section.end}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-1.5 text-xs whitespace-nowrap',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground',
                      )
                    }
                  >
                    {section.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </header>

          <main className="space-y-6 px-4 py-6 lg:px-0 lg:pt-4" key={pathname}>
            {auth.checking ? (
              <Skeleton className="h-40 w-full" />
            ) : auth.email === null ? (
              <AdminLogin onSignIn={auth.signIn} />
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
