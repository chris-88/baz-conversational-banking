/**
 * Eases progress so a thing that travels settles rather than stops.
 *
 * The same curve as the motion tokens, as a function of a cue's progress rather than of
 * wall time: pausing freezes it and seeking lands it.
 */
export function settle(progress: number): number {
  const p = Math.min(Math.max(progress, 0), 1)
  return 1 - Math.pow(1 - p, 3)
}
