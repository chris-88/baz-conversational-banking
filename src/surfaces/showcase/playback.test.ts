import { describe, expect, it } from 'vitest'
import {
  INITIAL,
  globalTimeMs,
  reduce,
  snapshot,
  type Manifests,
  type PlaybackAction,
  type PlaybackState,
} from './playback'

const manifests: Manifests = {
  opportunity: { id: 'opportunity', label: 'a', src: 'a.mp3', durationTargetMs: 60_000, captions: '' },
  walkthrough: { id: 'walkthrough', label: 'b', src: 'b.mp3', durationTargetMs: 180_000, captions: '' },
  risk: { id: 'risk', label: 'c', src: 'c.mp3', durationTargetMs: 60_000, captions: '' },
}

function run(actions: readonly PlaybackAction[], from: PlaybackState = INITIAL): PlaybackState {
  return actions.reduce((state, action) => reduce(state, action, manifests), from)
}

const started = run([{ type: 'start' }])

describe('the playback machine', () => {
  it('starts only from idle, and only into the first chapter', () => {
    expect(started.stage).toBe('opportunity')
    expect(started.status).toBe('playing')
    expect(reduce(started, { type: 'start' }, manifests)).toBe(started)
  })

  it('starts at a deep seek for rehearsal, settling into the end state', () => {
    const state = run([{ type: 'start', at: { chapter: 'walkthrough', ms: 95_000 } }])
    expect(state.stage).toBe('walkthrough')
    expect(state.localTimeMs).toBe(95_000)
    expect(state.settling).toBe(true)
    expect(state.seekSerial).toBe(1)
  })

  it('advances a chapter only when that chapter ends, through to explore', () => {
    const afterFirst = reduce(started, { type: 'chapter_ended', chapter: 'opportunity' }, manifests)
    expect(afterFirst.stage).toBe('walkthrough')
    expect(afterFirst.status).toBe('playing')
    expect(afterFirst.localTimeMs).toBe(0)

    const afterSecond = reduce(afterFirst, { type: 'chapter_ended', chapter: 'walkthrough' }, manifests)
    expect(afterSecond.stage).toBe('risk')

    const done = reduce(afterSecond, { type: 'chapter_ended', chapter: 'risk' }, manifests)
    expect(done.stage).toBe('explore')
    expect(done.status).toBe('ready')
  })

  it('ignores an ended event from a track that is no longer loaded', () => {
    const inWalkthrough = run([{ type: 'chapter_ended', chapter: 'opportunity' }], started)
    const late = reduce(inWalkthrough, { type: 'chapter_ended', chapter: 'opportunity' }, manifests)
    expect(late).toBe(inWalkthrough)
  })

  it('explore is terminal: nothing ends it but a restart or a seek', () => {
    const done = run([
      { type: 'chapter_ended', chapter: 'opportunity' },
      { type: 'chapter_ended', chapter: 'walkthrough' },
      { type: 'chapter_ended', chapter: 'risk' },
    ], started)
    expect(reduce(done, { type: 'tick', ms: 5_000 }, manifests)).toBe(done)
    expect(reduce(done, { type: 'chapter_ended', chapter: 'risk' }, manifests)).toBe(done)

    const again = reduce(done, { type: 'restart' }, manifests)
    expect(again.stage).toBe('opportunity')
    expect(again.status).toBe('playing')
    expect(again.localTimeMs).toBe(0)

    const back = reduce(done, { type: 'seek', chapter: 'risk', ms: 30_000 }, manifests)
    expect(back.stage).toBe('risk')
    expect(back.status).toBe('playing')
  })

  it('returns the same object for a tick that moved less than a frame', () => {
    const moved = reduce(started, { type: 'tick', ms: 1_000 }, manifests)
    expect(moved.localTimeMs).toBe(1_000)
    expect(reduce(moved, { type: 'tick', ms: 1_010 }, manifests)).toBe(moved)
    expect(reduce(moved, { type: 'tick', ms: 1_020 }, manifests).localTimeMs).toBe(1_020)
  })

  it('does not tick while paused', () => {
    const paused = reduce(started, { type: 'paused', byUser: true }, manifests)
    expect(paused.status).toBe('paused')
    expect(paused.needsResume).toBe(false)
    expect(reduce(paused, { type: 'tick', ms: 9_000 }, manifests)).toBe(paused)
  })

  it('a pause nobody asked for wants an explicit resume', () => {
    const hidden = reduce(started, { type: 'paused', byUser: false }, manifests)
    expect(hidden.needsResume).toBe(true)
    // A second pause event changes nothing.
    expect(reduce(hidden, { type: 'paused', byUser: false }, manifests)).toBe(hidden)
    const resumed = reduce(hidden, { type: 'play_started' }, manifests)
    expect(resumed.status).toBe('playing')
    expect(resumed.needsResume).toBe(false)
  })

  it('a refused play becomes a resume prompt, not an error', () => {
    const blocked = reduce(started, { type: 'play_blocked', reason: 'NotAllowedError' }, manifests)
    expect(blocked.status).toBe('paused')
    expect(blocked.needsResume).toBe(true)
    expect(blocked.error).toBeNull()
  })

  it('buffers on waiting and only leaves buffering on canplay', () => {
    const buffering = reduce(started, { type: 'waiting' }, manifests)
    expect(buffering.status).toBe('buffering')
    expect(reduce(buffering, { type: 'tick', ms: 2_000 }, manifests)).toBe(buffering)
    expect(reduce(started, { type: 'can_play' }, manifests)).toBe(started)
    expect(reduce(buffering, { type: 'can_play' }, manifests).status).toBe('playing')
  })

  it('a seek changes chapter, settles, and keeps the status it had', () => {
    const paused = reduce(started, { type: 'paused', byUser: true }, manifests)
    const sought = reduce(paused, { type: 'seek', chapter: 'risk', ms: 20_000 }, manifests)
    expect(sought.stage).toBe('risk')
    expect(sought.localTimeMs).toBe(20_000)
    expect(sought.status).toBe('paused')
    expect(sought.settling).toBe(true)
    expect(sought.seekSerial).toBe(paused.seekSerial + 1)
    expect(reduce(sought, { type: 'seeked' }, manifests).settling).toBe(false)
  })

  it('clamps a seek to the chapter, using the real duration once known', () => {
    const known = reduce(started, { type: 'metadata', chapter: 'opportunity', durationMs: 61_500 }, manifests)
    const sought = reduce(known, { type: 'seek', chapter: 'opportunity', ms: 90_000 }, manifests)
    expect(sought.localTimeMs).toBe(61_499)
    expect(reduce(known, { type: 'seek', chapter: 'opportunity', ms: -5 }, manifests).localTimeMs).toBe(0)
  })

  it('ignores metadata that is not a duration', () => {
    expect(reduce(started, { type: 'metadata', chapter: 'risk', durationMs: Number.NaN }, manifests)).toBe(started)
    expect(reduce(started, { type: 'metadata', chapter: 'risk', durationMs: Number.POSITIVE_INFINITY }, manifests)).toBe(started)
  })

  it('an error is retried in place', () => {
    const atTime = reduce(started, { type: 'tick', ms: 30_000 }, manifests)
    const failed = reduce(atTime, { type: 'failed', message: 'decode' }, manifests)
    expect(failed.status).toBe('error')
    const retried = reduce(failed, { type: 'retry' }, manifests)
    expect(retried.status).toBe('playing')
    expect(retried.error).toBeNull()
    expect(retried.localTimeMs).toBe(30_000)
    expect(retried.seekSerial).toBe(failed.seekSerial + 1)
  })

  it('reports global time across chapters, from known or target durations', () => {
    expect(globalTimeMs(INITIAL, manifests)).toBe(0)
    const inRisk = run([
      { type: 'metadata', chapter: 'opportunity', durationMs: 58_000 },
      { type: 'chapter_ended', chapter: 'opportunity' },
      { type: 'chapter_ended', chapter: 'walkthrough' },
      { type: 'tick', ms: 10_000 },
    ], started)
    expect(globalTimeMs(inRisk, manifests)).toBe(58_000 + 180_000 + 10_000)
    const snap = snapshot(inRisk, manifests)
    expect(snap.chapterDurationMs).toBe(60_000)
    expect(snap.stage).toBe('risk')
  })

  it('exit returns to the opening screen with nothing playing, keeping what the viewer set', () => {
    const muted = run([{ type: 'set_muted', muted: true }, { type: 'tick', ms: 20_000 }], started)
    const exited = reduce(muted, { type: 'exit' }, manifests)
    expect(exited.stage).toBe('idle')
    expect(exited.status).toBe('ready')
    expect(exited.localTimeMs).toBe(0)
    expect(exited.muted).toBe(true)
    expect(reduce(exited, { type: 'exit' }, manifests)).toBe(exited)
    // And Start works again from there.
    expect(reduce(exited, { type: 'start' }, manifests).stage).toBe('opportunity')
  })

  it('mute and captions are plain toggles that do not touch time', () => {
    const muted = reduce(started, { type: 'set_muted', muted: true }, manifests)
    expect(muted.muted).toBe(true)
    expect(reduce(muted, { type: 'set_muted', muted: true }, manifests)).toBe(muted)
    expect(reduce(started, { type: 'set_captions', on: false }, manifests).captionsOn).toBe(false)
  })
})
