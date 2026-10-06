import { expect, test, type Page } from '@playwright/test'

/**
 * Every surface mounts, renders its own content, and carries the prototype disclosure.
 *
 * Runs against the local dev server by default, or against a deployment:
 *   E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e
 */

const surfaces = [
  { route: '/#/', name: 'public site', expect: /For whatever life brings next/i },
  { route: '/#/app/login', name: 'simulated login', expect: /simulated sign-in for demonstration/i },
  // An invalid invite is refused rather than showing a page: the token is the whole gate.
  { route: '/#/join/opaque-token', name: 'partner join', expect: /invitation link isn.{0,3}t valid/i },
  { route: '/#/try', name: 'audience entry', expect: /Try Baz/i },
  { route: '/#/admin', name: 'presenter console', expect: /presenter console/i },
] as const

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    // A refused request logs a browser network error. That is the server doing its job, not
    // the app failing, so only genuine script errors count.
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(message.text())
    }
  })
  return errors
}

for (const surface of surfaces) {
  test(`${surface.name} renders with no console errors`, async ({ page }) => {
    const errors = collectErrors(page)

    await page.goto(surface.route)

    // React actually mounted, rather than the shell merely being served.
    await expect(page.locator('#root').locator('*').first()).toBeVisible()
    await expect(page.getByText(surface.expect).first()).toBeVisible()

    expect(errors, `console errors on ${surface.route}`).toEqual([])
  })
}

test('every surface discloses that it is not a real banking service', async ({ page }) => {
  for (const surface of surfaces) {
    await page.goto(surface.route)
    const note = page.getByRole('note').first()
    await expect(note, surface.route).toContainText(/not a real banking service/i)
    await expect(note, surface.route).toContainText(/never enter real personal/i)
  }
})

test('an unknown route falls back rather than breaking', async ({ page }) => {
  await page.goto('/#/this-route-does-not-exist')
  await expect(page.getByText(/that page does not exist/i)).toBeVisible()
})
