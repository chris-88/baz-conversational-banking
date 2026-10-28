import { expect, test, type Page } from '@playwright/test'

/**
 * Every surface mounts, renders its own content, and carries the prototype disclosure.
 *
 * Runs against the local dev server by default, or against a deployment:
 *   E2E_BASE_URL=https://baz.chrisquinn.ie npm run e2e
 *
 * The list is the surfaces that exist. The replica public site, the simulated login and the
 * audience entry were deleted on 2026-10-06; their routes redirect to Baz and are checked as
 * redirects below, not as pages.
 */

const surfaces = [
  { route: '/#/', name: 'landing', expect: /tell baz what you.{0,3}re trying to do/i, discloses: true },
  { route: '/#/baz', name: 'Baz', expect: /what are you trying to do/i, discloses: false },
  { route: '/#/how-it-works', name: 'explainer', expect: /how baz works/i, discloses: true },
  { route: '/#/privacy', name: 'privacy notice', expect: /not a banking service/i, discloses: true },
  { route: '/#/showcase', name: 'showcase', expect: /what if banking started with a conversation/i, discloses: true },
  // An invalid invite is refused rather than showing a page: the token is the whole gate.
  { route: '/#/join/opaque-token', name: 'partner join', expect: /invitation link isn.{0,3}t valid/i, discloses: false },
  { route: '/#/admin', name: 'presenter console', expect: /sign in/i, discloses: false },
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

test('every surface with a footer discloses that it is not a banking service', async ({ page }) => {
  for (const surface of surfaces) {
    if (!surface.discloses) continue
    await page.goto(surface.route)
    await expect(page.getByText(/not a banking service/i).first(), surface.route).toBeVisible()
  }
})

test('the showcase starts on one click and either plays or asks to be resumed', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/#/showcase')

  // Nothing plays before the click: no controls, no clock.
  await expect(page.getByRole('button', { name: /pause/i })).toHaveCount(0)

  await page.getByRole('button', { name: /start the experience/i }).click()

  // Headless Chromium honours the click as a gesture and plays the silent track; a browser
  // that refuses shows the resume prompt instead. Either is the page doing its job.
  await expect(
    page.getByRole('button', { name: /^pause$/i }).or(page.getByRole('button', { name: /resume the experience/i })),
  ).toBeVisible({ timeout: 5_000 })

  expect(errors, 'console errors on /#/showcase after Start').toEqual([])
})

test('the old entry points land on Baz rather than breaking', async ({ page }) => {
  for (const route of ['/#/try', '/#/app/login', '/#/app']) {
    await page.goto(route)
    await expect(page).toHaveURL(/#\/baz$/)
    await expect(page.getByText(/what are you trying to do/i).first()).toBeVisible()
  }
})

test('a chapter of the explainer can be sent on its own', async ({ page }) => {
  await page.goto('/#/how-it-works/story')
  const chapter = page.locator('#story')
  await expect(chapter).toBeVisible()
  // The deep link scrolls once, to the chapter heading, and the stage buttons are already there.
  await expect(page.getByRole('heading', { name: /one customer, thirteen stages/i })).toBeInViewport()
  await expect(page.getByRole('button', { name: /partner participation/i })).toBeVisible()
})

test('an unknown route falls back rather than breaking', async ({ page }) => {
  await page.goto('/#/this-route-does-not-exist')
  await expect(page.getByText(/that page does not exist/i)).toBeVisible()
})
