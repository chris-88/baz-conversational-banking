import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PublicSite } from '@/shells/boi/PublicSite'
import { AppLogin } from '@/shells/boi/AppLogin'
import { PartnerJoin } from '@/partner/PartnerJoin'
import { AudienceEntry } from '@/audience/AudienceEntry'
import { AppShell } from '@/shells/boi/AppShell'
import { AdminConsole } from '@/admin/AdminConsole'

/**
 * Surfaces increasingly need the query client, so they are rendered the way the app renders
 * them rather than each test discovering the missing provider for itself.
 */
function renderSurface(element: ReactNode, initialEntries: string[] = ['/']): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{element}</MemoryRouter>
    </QueryClientProvider>,
  )
}

/** M0: every surface is routed and renders. */
describe('surfaces', () => {
  it('the public site leads with the Baz entry point, not a product menu', () => {
    renderSurface(<PublicSite />)
    // The proposition is "tell us what you're trying to do", so the composer is the hero.
    expect(screen.getByRole('textbox', { name: /message baz/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/life brings next/i)
  })

  it('the simulated login discloses that it is not a real banking system', () => {
    renderSurface(<AppLogin />)
    expect(screen.getByText(/simulated sign-in for demonstration purposes/i)).toBeInTheDocument()
    expect(screen.getByText(/connects to no real banking system/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('the partner surface shows nothing about the case until the invite is redeemed', () => {
    renderSurface(
      <Routes>
        <Route path="/join/:token" element={<PartnerJoin />} />
      </Routes>,
      ['/join/opaque-token'],
    )

    // §33, Invariant 7: a partner sees their own tasks and nothing else — and before the
    // token is redeemed, not even those.
    expect(screen.queryByText(/your tasks/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('offers the choice that actually changes the conversation', () => {
    // New versus existing customer is the difference §53 exists to show: one is asked
    // everything, the other almost nothing.
    renderSurface(<AudienceEntry />)
    expect(screen.getByRole('button', { name: /new to the bank/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /already a customer/i })).toBeInTheDocument()
  })

  it('the admin console asks for a sign-in before showing anything (§37)', () => {
    renderSurface(<AdminConsole />)
    // The server checks admin status on every call regardless, but the console must not
    // present controls to someone who has not signed in.
    expect(screen.queryByText(/reset this case/i)).not.toBeInTheDocument()
  })
})

/**
 * The site carries Bank of Ireland branding on a public personal domain. Every surface must
 * say plainly that it is not a real banking service, so nobody who lands on it cold is misled.
 */
describe('prototype disclosure', () => {
  const surfaces = {
    'public site': <PublicSite />,
    'app shell': <AppShell />,
    'partner join': <PartnerJoin />,
    'audience entry': <AudienceEntry />,
    'admin console': <AdminConsole />,
  }

  for (const [name, element] of Object.entries(surfaces)) {
    it(`${name} states it is not a real banking service`, () => {
      renderSurface(element)

      expect(screen.getByRole('note')).toHaveTextContent(/not a real banking service/i)
      expect(screen.getByRole('note')).toHaveTextContent(/never enter real personal/i)
    })
  }
})
