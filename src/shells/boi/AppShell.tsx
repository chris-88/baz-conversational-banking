import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PrototypeBanner } from '@/components/PrototypeBanner'
import { BottomTabBar } from '@/shells/boi/BottomTabBar'
import { routes } from '@/app/routes'

/** §30 — the authenticated mobile shell, installable as a PWA. Mobile first at 390px. */
export function AppShell(): ReactNode {
  const { pathname } = useLocation()

  // The login screen is pre-authentication, so it gets no app navigation.
  const showTabs = pathname !== routes.app.login

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <PrototypeBanner />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Outlet />
      </div>

      {showTabs && <BottomTabBar />}
    </div>
  )
}
