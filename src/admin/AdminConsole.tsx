import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'

const tabs = [
  { to: routes.admin.root, label: 'Overview', end: true },
  { to: routes.admin.cases, label: 'Cases', end: false },
  { to: routes.admin.persona, label: 'Persona', end: false },
  { to: routes.admin.domain, label: 'Domain', end: false },
  { to: routes.admin.audience, label: 'Audience', end: false },
] as const

/** §37 to §44 — presenter console. Real Supabase email auth plus an `admin` role. */
export function AdminConsole(): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold">Baz presenter console</h1>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm whitespace-nowrap',
                isActive ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/60',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-3xl space-y-6 p-4">
        <Outlet />
      </main>
    </div>
  )
}
