import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

/**
 * The explainer, read with every animation off.
 *
 * Rendered under `prefers-reduced-motion: reduce`, which is the page's own first rule made into
 * a test: everything on it has to be legible with nothing moving. jsdom has no `matchMedia`, no
 * `IntersectionObserver` and no `scrollIntoView`, so the stubs here are what a browser with
 * motion switched off would provide, and nothing the page needs beyond that.
 */
describe('the explainer', () => {
  const withStillPage = async (path: string): Promise<void> => {
    const { LazyMotion, domAnimation } = await import('motion/react')
    const { HowItWorks } = await import('@/surfaces/HowItWorks')

    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList
    Element.prototype.scrollIntoView = () => undefined

    renderSurface(
      <LazyMotion features={domAnimation}>
        <Routes>
          <Route path="/how-it-works/:section?" element={<HowItWorks />} />
        </Routes>
      </LazyMotion>,
      [path],
    )
  }

  it('tells the §67 story, every beat on the page, with nothing startable', async () => {
    const { story, STAGE_NAMES } = await import('@/content/how-it-works/story')
    await withStillPage('/how-it-works/story')

    for (const beat of story) {
      expect(screen.getByRole('heading', { name: beat.title })).toBeInTheDocument()
    }
    for (const name of Object.values(STAGE_NAMES)) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }

    // The real cards, with every control disabled: the page shows the product and starts nothing.
    const chapter = document.getElementById('story')
    expect(chapter).not.toBeNull()
    const live = Array.from(chapter?.querySelectorAll('button') ?? []).filter(
      (button) => !button.disabled && button.closest('nav') === null,
    )
    expect(live.map((button) => button.textContent)).toEqual([])
  })

  it('shows what is built, with every unbuilt thing labelled a direction', async () => {
    const { GROUPS, capabilities } = await import('@/content/how-it-works/capabilities')
    await withStillPage('/how-it-works/capabilities')

    for (const group of GROUPS) {
      expect(screen.getByRole('heading', { name: group.title })).toBeInTheDocument()
    }
    for (const capability of capabilities) {
      expect(screen.getByRole('heading', { name: capability.title })).toBeInTheDocument()
    }
    // Scoped to the chapter: the discovery chapter labels two channels the same way.
    const chapter = document.getElementById('capabilities')
    expect(chapter).not.toBeNull()
    if (chapter === null) return
    expect(within(chapter).getAllByText('Production direction').length).toBe(
      capabilities.filter((capability) => capability.claim === 'production').length,
    )

    // The three proofs run the product's own code: the composer's words are on the page.
    expect(screen.getByText(/## Style/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /which tools exist, stage by stage/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /guardrails: what gets through/i })).toBeInTheDocument()
  })
})

/**
 * The showcase, with the sound stubbed.
 *
 * jsdom has no media pipeline, so the page takes its audio element from a factory and the
 * test hands it one that records what it was asked to do. The questions are the brief's: does
 * nothing play before the click, does one click start it, does the close persist.
 */
describe('the showcase', () => {
  class FakeAudio extends EventTarget {
    src = ''
    currentTime = 0
    duration = Number.NaN
    muted = false
    ended = false
    paused = true
    preload = ''
    error: MediaError | null = null
    playCalls = 0
    play(): Promise<void> {
      this.playCalls += 1
      this.paused = false
      return Promise.resolve()
    }
    pause(): void {
      this.paused = true
    }
    load(): void {
      this.ended = false
    }
    finish(): void {
      this.ended = true
      this.paused = true
      this.dispatchEvent(new Event('pause'))
      this.dispatchEvent(new Event('ended'))
    }
  }

  const renderShowcase = async (): Promise<FakeAudio> => {
    const { LazyMotion, domAnimation } = await import('motion/react')
    const { Showcase } = await import('@/surfaces/Showcase')

    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList
    window.requestAnimationFrame = (): number => 0
    window.cancelAnimationFrame = (): void => undefined

    const main = new FakeAudio()
    let handed = 0
    const createAudio = (): HTMLAudioElement => {
      handed += 1
      return (handed === 1 ? main : new FakeAudio()) as unknown as HTMLAudioElement
    }

    renderSurface(
      <LazyMotion features={domAnimation}>
        <Routes>
          <Route path="/showcase" element={<Showcase createAudio={createAudio} />} />
        </Routes>
      </LazyMotion>,
      ['/showcase'],
    )
    return main
  }

  it('opens finished and silent: a claim, one button, nothing playing', async () => {
    const audio = await renderShowcase()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /what if banking started with a conversation/i,
    )
    expect(screen.getByRole('button', { name: /start the experience/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^pause$/i })).not.toBeInTheDocument()
    expect(audio.playCalls).toBe(0)
    expect(screen.getByText(/not a banking service/i)).toBeInTheDocument()
  })

  it('one click starts the first chapter and plays it once', async () => {
    const { act, fireEvent } = await import('@testing-library/react')
    const audio = await renderShowcase()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start the experience/i }))
      await Promise.resolve()
    })

    expect(audio.playCalls).toBe(1)
    expect(audio.src).toMatch(/opportunity/)
    expect(screen.getByRole('button', { name: /^pause$/i })).toBeInTheDocument()
    expect(screen.getAllByText(/the opportunity/i).length).toBeGreaterThan(0)
  })

  it('three tracks ending in turn reach the close, which stays put', async () => {
    const { act, fireEvent } = await import('@testing-library/react')
    const audio = await renderShowcase()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start the experience/i }))
      await Promise.resolve()
    })
    for (let i = 0; i < 3; i += 1) {
      await act(async () => {
        audio.finish()
        await Promise.resolve()
      })
    }

    expect(screen.getByRole('heading', { name: /the conversation continues/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /launch baz/i })).toHaveAttribute(
      'href',
      'https://baz.chrisquinn.ie/#/baz',
    )
    expect(screen.getByRole('link', { name: /read the article/i })).toBeInTheDocument()
    // Nothing on the close is on a timer.
    expect(audio.playCalls).toBe(3)
  })
})
