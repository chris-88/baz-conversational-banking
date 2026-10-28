import { describe, expect, it } from 'vitest'
import { CHAPTERS } from './types'
import { CUES_BY_CHAPTER } from './chapters'
import { showcaseConfig } from './config'

/**
 * The cue files are data, and the contract they keep is what makes `activeCue` honest: every
 * chapter starts at zero, no window overlaps or leaves a gap, nothing runs past the track,
 * and the presenter panel never grows into a slide.
 */
const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length

describe('showcase cues', () => {
  for (const chapter of CHAPTERS) {
    const cues = CUES_BY_CHAPTER[chapter]
    const manifest = showcaseConfig.chapters[chapter]

    describe(chapter, () => {
      it('has at least one cue, starting at zero', () => {
        expect(cues.length).toBeGreaterThan(0)
        expect(cues[0]?.startMs).toBe(0)
      })

      it('is contiguous, in order, with no empty windows', () => {
        cues.forEach((cue, index) => {
          expect(cue.chapter).toBe(chapter)
          expect(cue.endMs, cue.id).toBeGreaterThan(cue.startMs)
          const previous = cues[index - 1]
          if (previous !== undefined) {
            expect(cue.startMs, `${previous.id} → ${cue.id}`).toBe(previous.endMs)
          }
        })
      })

      it('ends on or before the track', () => {
        const last = cues[cues.length - 1]
        expect(last?.endMs).toBeLessThanOrEqual(manifest.durationTargetMs)
      })

      it('keeps the presenter panel short', () => {
        for (const cue of cues) {
          if (cue.presenter === undefined) continue
          expect(words(cue.presenter.title), `${cue.id} title`).toBeLessThanOrEqual(12)
          expect(words(cue.presenter.body), `${cue.id} body`).toBeLessThanOrEqual(35)
          expect(cue.presenter.bullets?.length ?? 0, `${cue.id} bullets`).toBeLessThanOrEqual(3)
        }
      })
    })
  }

  it('cue ids are unique across every chapter', () => {
    const ids = CHAPTERS.flatMap((chapter) => CUES_BY_CHAPTER[chapter].map((cue) => `${chapter}/${cue.id}`))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('the walkthrough has the seven windows the brief lays out, in order', () => {
    expect(CUES_BY_CHAPTER.walkthrough.map((cue) => cue.scene)).toEqual([
      'arrive',
      'understand',
      'connect',
      'authenticate',
      'machinery',
      'action',
      'govern',
    ])
  })
})
