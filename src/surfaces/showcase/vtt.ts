/**
 * WebVTT, read by the page.
 *
 * A `<track>` on an `<audio>` element draws nothing, `::cue` cannot be styled with the
 * site's tokens, and jsdom has no `TextTrack`, so the file is parsed here and the caption on
 * screen is derived from the same clock as everything else. A seek lands on the right line
 * for the same reason it lands on the right scene.
 *
 * Supports what a caption file needs and nothing it does not: the header, optional cue
 * identifiers, `hh:mm:ss.mmm` or `mm:ss.mmm` timestamps, multi-line text, NOTE blocks.
 * Styling tags are stripped rather than interpreted.
 */

export type Caption = {
  readonly startMs: number
  readonly endMs: number
  readonly text: string
}

const TIMING = /^(\S+)\s+-->\s+(\S+)/

export function parseTimestamp(stamp: string): number | null {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/.exec(stamp.trim())
  if (match === null) return null
  const hours = match[1] === undefined ? 0 : Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  const millis = match[4] === undefined ? 0 : Number(match[4].padEnd(3, '0'))
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis
}

export function parseVtt(source: string): readonly Caption[] {
  const captions: Caption[] = []
  const blocks = source.replace(/\r\n?/g, '\n').split(/\n{2,}/)

  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.length > 0)
    if (lines.length === 0) continue
    const head = lines[0]
    if (head === undefined || head.startsWith('WEBVTT') || head.startsWith('NOTE')) continue

    // A cue's timing line is the first or, when the cue carries an identifier, the second.
    const timingAt = lines.findIndex((line) => TIMING.test(line))
    if (timingAt < 0 || timingAt > 1) continue
    const timing = TIMING.exec(lines[timingAt] ?? '')
    if (timing === null) continue
    const startMs = parseTimestamp(timing[1] ?? '')
    const endMs = parseTimestamp(timing[2] ?? '')
    if (startMs === null || endMs === null || endMs < startMs) continue

    const text = lines
      .slice(timingAt + 1)
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .join('\n')
      .trim()
    if (text.length === 0) continue

    captions.push({ startMs, endMs, text })
  }

  return captions
}

export function activeCaption(captions: readonly Caption[], timeMs: number): Caption | null {
  for (const caption of captions) {
    if (caption.startMs <= timeMs && timeMs < caption.endMs) return caption
  }
  return null
}

export function countCaptions(source: string): number {
  return parseVtt(source).length
}
