import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/routes'
import { showcaseConfig } from '@/content/showcase/config'

/**
 * The QR code is a picture of a URL.
 *
 * Nothing in the build knows what it encodes, so if the domain or the route moves, the code goes
 * on pointing at the old one and keeps scanning — it just lands somewhere that no longer exists.
 * That is the worst kind of broken, because it looks fine on the page and fails in somebody
 * else's hand.
 *
 * Decoding it here would need an image decoder in the test suite. These two assertions catch the
 * same drift for nothing: if either fails, regenerate the code. `docs/qr-code/README.md` has the
 * command.
 */
describe('the QR code on the landing page', () => {
  const ENCODES = 'https://baz.chrisquinn.ie/#/baz'

  it('still points at the domain the site is served from', () => {
    const cname = readFileSync('public/CNAME', 'utf8').trim()

    expect(ENCODES, `CNAME is ${cname}; regenerate the QR`).toContain(cname)
  })

  it('still points at the route Baz lives on', () => {
    expect(ENCODES, `routes.baz is ${routes.baz}; regenerate the QR`).toContain(`#${routes.baz}`)
  })

  it('is the same address the showcase offers under the same picture', () => {
    // The explore screen shows this code next to a Launch button. If the configured URL moved
    // and the picture did not, the two would disagree on the one screen built to be scanned.
    expect(showcaseConfig.liveDemoUrl).toBe(ENCODES)
  })

  it('goes straight to the conversation rather than the page it is printed on', () => {
    // The copy button beside it does the same. A code that costs an extra tap is a worse code.
    expect(ENCODES).not.toMatch(/#\/$/)
  })
})
