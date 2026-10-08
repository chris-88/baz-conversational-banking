/**
 * A shared-element transition, where the browser can do one.
 *
 * The opening animation is one object moving: the mark waiting in the middle of the screen
 * becomes the avatar beside Baz's first reply (spec §5). The View Transitions API does exactly
 * that from two `view-transition-name` declarations and no library — the browser takes a
 * snapshot either side of the DOM change and tweens between them.
 *
 * Where it is missing, or where somebody has asked for less motion, the update still happens.
 * It just happens at once, which is the documented fallback (§14) rather than a degraded path
 * worth apologising for.
 */
export function withViewTransition(update: () => void): void {
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced || typeof document.startViewTransition !== 'function') {
    update()
    return
  }

  document.startViewTransition(update)
}
