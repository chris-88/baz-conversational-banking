import { CHAPTERS, type ChapterId } from '@/content/showcase/types'

/** `m:ss`, for the clock beside the rail. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`
}

/**
 * A rehearsal deep link: `?at=walkthrough:95` means the walkthrough, ninety-five seconds in.
 *
 * Read only in development and only when Start is clicked, so a shared link can never make
 * the page play by itself.
 */
export function parseAt(
  value: string | null,
): { readonly chapter: ChapterId; readonly ms: number } | undefined {
  if (value === null) return undefined
  const [chapter, seconds] = value.split(':')
  if (chapter === undefined || !(CHAPTERS as readonly string[]).includes(chapter)) return undefined
  const ms = seconds === undefined ? 0 : Number(seconds) * 1000
  if (!Number.isFinite(ms) || ms < 0) return undefined
  return { chapter: chapter as ChapterId, ms }
}
