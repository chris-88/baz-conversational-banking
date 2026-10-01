import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { BoiHeader } from '@/shells/boi/BoiHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §30 — authenticated mobile banking shell, installable as a PWA. Mobile first at 390px. */
export function AppShell(): ReactNode {
  return (
    <div className="boi-theme bg-background flex min-h-dvh flex-col">
      <PrototypeBanner />
      <BoiHeader />
      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
