import { expect, test, type Page } from '@playwright/test'

/**
 * Every surface mounts, renders its own content, and carries the prototype disclosure.
 *
 * Runs against the local dev server by default, or against a deployment:
 *   E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e
 */

const surfaces = [
  { route: '/#/', name: 'public site', expect: /Tell us what you.{0,3}re trying to do/i },
  { route: '/#/app/login', name: 'simulated login', expect: /simulated sign-in for demonstration/i },
  { route: '/#/join/opaque-token', name: 'partner join', expect: /You.{0,3}ve been invited/i },
  { route: '/#/try', name: 'audience entry', expect: /Try Baz/i },
  { route: '/#/admin', name: 'presenter console', expect: /presenter console/i },
] as const

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
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

/** TEMPORARY: the branch badge. Remove this test when BuildBadge goes. */
test('every surface shows which branch is deployed', async ({ page }) => {
  for (const surface of surfaces) {
    await page.goto(surface.route)
    const badge = page.getByTestId('build-badge')
    await expect(badge, surface.route).toBeVisible()
    // branch · sha · timestamp
    await expect(badge, surface.route).toContainText(/\S+ · [0-9a-f]{7} · \d{4}-\d{2}-\d{2}/)
  }
})

test('the branch badge never swallows a tap meant for the page', async ({ page }) => {
  await page.goto('/#/')

  // The badge is fixed to the bottom of the viewport, directly over this nav row. If it were
  // not pointer-events-none, this tap would hit the badge and nothing would happen.
  await page.getByRole('link', { name: /presenter console/i }).click()

  await expect(page).toHaveURL(/#\/admin/)
  await expect(page.getByText(/presenter console/i).first()).toBeVisible()
})
