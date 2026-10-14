import { useEffect, useState } from 'react'
import type { ChapterId } from '@/content/how-it-works/copy'

/**
 * Which chapter the reader is in, from where the sections are on screen.
 *
 * The section nearest the top of the viewport wins, which behaves correctly for a short last
 * section that can never fill the screen: an observer keyed on "most visible" leaves the nav
 * stuck on the second-to-last chapter at the bottom of the page.
 */
export function useActiveChapter(ids: readonly ChapterId[]): ChapterId {
  const [active, setActive] = useState<ChapterId>(ids[0] ?? 'opportunity')

  useEffect(() => {
    const onScroll = (): void => {
      let nearest: ChapterId = ids[0] ?? 'opportunity'
      let smallest = Number.POSITIVE_INFINITY

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue

        // Measured from a line a third of the way down, so a heading counts as arrived at
        // when it reaches the reading position rather than when it first appears.
        const distance = Math.abs(element.getBoundingClientRect().top - window.innerHeight / 3)
        if (distance < smallest) {
          smallest = distance
          nearest = id
        }
      }

      setActive((current) => (current === nearest ? current : nearest))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [ids])

  return active
}
