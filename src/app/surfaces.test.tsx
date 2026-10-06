import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Landing } from '@/surfaces/Landing'
import { BazScreen } from '@/surfaces/BazScreen'
import { PartnerJoin } from '@/partner/PartnerJoin'
import { AdminConsole } from '@/admin/AdminConsole'

/** Surfaces need the query client, so they are rendered the way the app renders them. */
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

/**
 * Three customer surfaces, where there were five.
 *
 * The replica bank website and the app behind a simulated login are gone: they were scaffolding
 * around the only thing worth showing, and a signed-in version that knows more about you is a
 * claim this prototype no longer makes.
 */
describe('surfaces', () => {
  it('the landing page makes one claim and offers two ways to act on it', () => {
    renderSurface(<Landing />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /personal banker for everyone/i,
    )
    expect(screen.getByRole('link', { name: /try in browser/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /install baz/i })).toBeInTheDocument()
  })

  it('offers no way to sign in, because there is nothing to sign in to', () => {
    renderSurface(<Landing />)
    expect(screen.queryByRole('link', { name: /log in|sign in/i })).not.toBeInTheDocument()

    renderSurface(<BazScreen />)
    expect(screen.queryByRole('link', { name: /log in|sign in/i })).not.toBeInTheDocument()
  })

  it('Baz is the whole screen, with the composer ready', () => {
    renderSurface(<BazScreen />)
    expect(screen.getByRole('textbox', { name: /message baz/i })).toBeInTheDocument()
  })

  it('the partner surface shows nothing about the case until the invite is redeemed', () => {
    renderSurface(
      <Routes>
        <Route path="/join/:token" element={<PartnerJoin />} />
      </Routes>,
      ['/join/opaque-token'],
    )

    // §33, Invariant 7: a partner sees their own tasks and nothing else — and before the token
    // is redeemed, not even those.
    expect(screen.queryByText(/your tasks/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('the admin console asks for a sign-in before showing anything (§37)', () => {
    renderSurface(<AdminConsole />)
    // The server checks admin status on every call regardless, but the console must not present
    // controls to someone who has not signed in.
    expect(screen.queryByText(/rebuild the sample customer/i)).not.toBeInTheDocument()
  })
})
