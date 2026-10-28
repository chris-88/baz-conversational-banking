import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 639px)'

/**
 * Whether the showcase is on a phone-width screen.
 *
 * Read as the external store it is, like `useIsMobile`, but guarded: jsdom has no
 * `matchMedia`, and the showcase's surface tests render without one. Below this width the
 * walkthrough shows the product's screen edge to edge rather than a drawn phone inside a
 * real one.
 */
export function useNarrow(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}

function query(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void): () => void {
  const list = query()
  if (list === null) return () => undefined
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

function snapshot(): boolean {
  return query()?.matches ?? false
}
