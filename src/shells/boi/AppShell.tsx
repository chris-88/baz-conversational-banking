import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { PrototypeBanner } from '@/components/PrototypeBanner'

/** §30 — authenticated mobile shell, installable as a PWA. Mobile first at 390px. */
export function AppShell(): ReactNode {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <PrototypeBanner />
      <AppHeader subtitle="Simulated mobile banking" />
      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-6 pb-20">
        <Outlet />
      </main>
    </div>
  )
}
