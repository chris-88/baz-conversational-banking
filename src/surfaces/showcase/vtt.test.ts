import { describe, expect, it } from 'vitest'
import { activeCaption, parseTimestamp, parseVtt } from './vtt'

const SAMPLE = `WEBVTT

NOTE Cut from the mastered narration.

1
00:00:00.000 --> 00:00:04.500
People don't experience life
in banking products.

intro-2
00:04.500 --> 00:12.000
They get <b>married</b>.

00:12.000 --> 00:25.000
Those moments become separate journeys.
`

describe('WebVTT parsing', () => {
  it('reads timestamps in both forms', () => {
    expect(parseTimestamp('00:00:04.500')).toBe(4_500)
    expect(parseTimestamp('01:02.250')).toBe(62_250)
    expect(parseTimestamp('1:00:00.000')).toBe(3_600_000)
    expect(parseTimestamp('00:00:04,5')).toBe(4_500)
    expect(parseTimestamp('nonsense')).toBeNull()
  })

  it('parses cues with and without identifiers, joining lines and stripping tags', () => {
    const captions = parseVtt(SAMPLE)
    expect(captions).toEqual([
      { startMs: 0, endMs: 4_500, text: 'People don\'t experience life\nin banking products.' },
      { startMs: 4_500, endMs: 12_000, text: 'They get married.' },
      { startMs: 12_000, endMs: 25_000, text: 'Those moments become separate journeys.' },
    ])
  })

  it('an empty or header-only file has no cues', () => {
    expect(parseVtt('')).toEqual([])
    expect(parseVtt('WEBVTT\n')).toEqual([])
  })

  it('tolerates Windows line endings', () => {
    expect(parseVtt(SAMPLE.replace(/\n/g, '\r\n'))).toHaveLength(3)
  })

  it('finds the caption on at a time, with the end exclusive', () => {
    const captions = parseVtt(SAMPLE)
    expect(activeCaption(captions, 0)?.text).toMatch(/^People/)
    expect(activeCaption(captions, 4_499)?.text).toMatch(/^People/)
    expect(activeCaption(captions, 4_500)?.text).toBe('They get married.')
    expect(activeCaption(captions, 25_000)).toBeNull()
  })
})
