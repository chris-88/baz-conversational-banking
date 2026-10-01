import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublicSite } from '@/shells/boi/PublicSite'
import { AppLogin } from '@/shells/boi/AppLogin'
import { PartnerJoin } from '@/partner/PartnerJoin'
import { AudienceEntry } from '@/audience/AudienceEntry'
import { AdminOverview } from '@/admin/AdminOverview'
import { AppShell } from '@/shells/boi/AppShell'
import { AdminConsole } from '@/admin/AdminConsole'

/** M0: every surface is routed and renders. */
describe('surfaces', () => {
  it('the public site offers the Baz entry point', () => {
    render(
      <MemoryRouter>
        <PublicSite />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /chat to baz/i })).toBeInTheDocument()
  })

  it('the simulated login discloses that it is not a real banking system', () => {
    render(
      <MemoryRouter>
        <AppLogin />
      </MemoryRouter>,
    )
    expect(screen.getByText(/simulated bank of ireland login/i)).toBeInTheDocument()
  })

  it('the partner surface reads the invite token from the path', () => {
    render(
      <MemoryRouter initialEntries={['/join/opaque-token']}>
        <Routes>
          <Route path="/join/:token" element={<PartnerJoin />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(/invite token present: yes/i)).toBeInTheDocument()
  })

  it('the audience surface offers both starting options', () => {
    render(
      <MemoryRouter>
        <AudienceEntry />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /start fresh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use the demo customer/i })).toBeInTheDocument()
  })

  it('the admin console renders a section per tab', () => {
    render(
      <MemoryRouter>
        <AdminOverview section="persona" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/persona controls/i)).toBeInTheDocument()
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
      render(<MemoryRouter>{element}</MemoryRouter>)

      expect(screen.getByRole('note')).toHaveTextContent(/not a real banking service/i)
      expect(screen.getByRole('note')).toHaveTextContent(/never enter real personal/i)
    })
  }
})
