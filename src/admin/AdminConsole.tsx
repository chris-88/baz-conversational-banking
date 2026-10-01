import type { ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { routes } from '@/app/routes'

const tabs = [
  { to: routes.admin.root, label: 'Overview' },
  { to: routes.admin.cases, label: 'Cases' },
  { to: routes.admin.persona, label: 'Persona' },
  { to: routes.admin.domain, label: 'Domain' },
  { to: routes.admin.audience, label: 'Audience' },
] as const

/** §37 to §44 — presenter console. Real Supabase email auth plus an `admin` role. */
export function AdminConsole(): ReactNode {
  const { pathname } = useLocation()

  // Tabs here are routes, so selection comes from the URL rather than Radix state. The
  // triggers render as links (`asChild`) so they behave like navigation, not like buttons.
  const active = tabs.find((tab) => tab.to === pathname)?.to ?? routes.admin.root

  return (
    <div className="bg-background min-h-dvh">
      <PrototypeBanner />

      <header className="sticky top-0 z-40 border-b">
        <div className="bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl space-y-3 px-4 pt-3 pb-2">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="bg-brand-deep text-brand-deep-foreground grid size-7 shrink-0 place-items-center rounded-lg text-2xs font-bold"
              >
                B
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight">Presenter console</h1>
                <p className="text-muted-foreground text-2xs">Baz · conversational banking</p>
              </div>
            </div>

            <Tabs value={active}>
              <TabsList variant="line" className="w-full justify-start gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.to} value={tab.to} asChild className="px-2 text-xs sm:px-3 sm:text-sm">
                    <Link to={tab.to}>{tab.label}</Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
