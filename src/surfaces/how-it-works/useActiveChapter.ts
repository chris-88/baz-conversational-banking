import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChapterId } from '@/content/how-it-works/copy'

/**
 * Which chapter is being read, and how far through the article we are.
 *
 * Two rules, both learned from the version that flickered.
 *
 * A chapter becomes current when its heading reaches the reading line, a third of the way down
 * the viewport, not when it first appears. Measuring "most visible" leaves the tracker stuck on
 * the second-to-last chapter at the foot of the page, because a short final section can never
 * fill a screen.
 *
 * And while a tap is scrolling the page, the tracker says nothing. A smooth scroll crosses every
 * heading between here and there, and a tracker that reacts to each one highlights three
 * chapters in a row on the way to the one that was actually asked for.
 */
export function useActiveChapter(ids: readonly ChapterId[]): {
  readonly active: ChapterId
  readonly progress: number
  /** Call before a programmatic scroll; the tracker resumes when the page stops moving. */
  readonly beginJump: (to: ChapterId) => void
} {
  const [active, setActive] = useState<ChapterId>(ids[0] ?? 'opportunity')
  const [progress, setProgress] = useState(0)
  const jumping = useRef(false)
  const resume = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const onScroll = (): void => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / scrollable)))

      if (jumping.current) return

      const line = window.innerHeight / 3
      let nearest = ids[0] ?? 'opportunity'
      let best = Number.POSITIVE_INFINITY

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue

        const { top, bottom } = element.getBoundingClientRect()
        // Only sections that have reached the line and not yet left it entirely.
        if (bottom < line) continue

        const distance = Math.abs(top - line)
        if (distance < best) {
          best = distance
          nearest = id
        }
      }

      setActive((current) => (current === nearest ? current : nearest))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  useEffect(
    () => () => {
      clearTimeout(resume.current)
    },
    [],
  )

  const beginJump = useCallback((to: ChapterId) => {
    jumping.current = true
    setActive(to)

    clearTimeout(resume.current)
    /*
     * There is no event for "the smooth scroll finished". A timeout longer than any scroll this
     * page can produce is cruder than watching the position settle and has one advantage that
     * matters: it cannot get stuck. The worst case is that the tracker resumes slightly early.
     */
    resume.current = setTimeout(() => {
      jumping.current = false
    }, 800)
  }, [])

  return { active, progress, beginJump }
}

/**
 * Smooth scroll to a chapter.
 *
 * The browser does the offsetting, through `scroll-margin-top` on each section, rather than
 * arithmetic here. Three attempts at computing it by hand all worked at one width and failed at
 * another, and the last one landed the same heading at 22 pixels one time and 236 the next,
 * because what is pinned at the top of the viewport changes as the page moves. The platform
 * already knows how to do this and it is not subject to when anything is measured.
 */
export function scrollToChapter(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
