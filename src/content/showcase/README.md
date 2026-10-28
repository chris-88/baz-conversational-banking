# The showcase: narration, cues and destinations

`/#/showcase` is a five-minute narrated presentation: a static opening, three chapters driven
by audio, a static close. This folder holds everything that is data rather than code.

## Swapping a narration track

Each chapter's audio lives in `src/assets/showcase/<chapter>.mp3` and is imported by
`config.ts`. Replace the file and nothing else changes: the browser reads the real duration
from the file and the chapter ends when the track ends. Keep `durationTargetMs` in `config.ts`
in step with the mastered length so the progress rail and cue bounds agree before the file
has loaded.

The opening (`opportunity.mp3`, 47.0 s) and closing (`risk.mp3`, 50.6 s) tracks are the
mastered HeyGen narration. `walkthrough.mp3` (129.2 s) is the ElevenLabs read of the script
in `vault/docs/showcase/walkthrough-narration.md`; every time in `walkthrough-cues.ts` and
`walkthrough.ts` was mapped to its word timestamps, and that document records how.

A silent placeholder of any length:

```
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 60 -c:a libmp3lame -b:a 32k out.mp3
```

## Captions

`captions/<chapter>.vtt`, plain WebVTT, parsed by the page rather than handed to a `<track>`.
The walkthrough's is cut from the recorded words, one cue per sentence. The opening and
closing files are placeholders with one cue each until their scripts are to hand; the
transcript drawer is built from the same files.

## Retiming cues

- `opportunity.ts`, `walkthrough-cues.ts`, `risk.ts`: one cue per window, contiguous, starting
  at zero and ending on or before the track. Each carries the presenter panel's copy. The test
  in `cues.test.ts` enforces the shape and the word limits.
- `walkthrough.ts`: what happens on the phone, as events in chapter milliseconds. A customer
  line types from `typeFromMs` and sends at `atMs`; a Baz line thinks from `thinkingFromMs`;
  a card arrives at `atMs` and settles at `settleAtMs`; a `cut` clears the screen; a `cutaway`
  replaces the phone with a desktop window. `walkthrough.test.ts` checks every card against
  the product's contract and every time against the chapter.
- In development, `/#/showcase?at=walkthrough:95` followed by Start lands at that point. The
  backtick key shows the timeline inspector.

## Destinations

`config.ts` holds the live demo URL (which `src/surfaces/qr.test.ts` checks against the QR
picture), the article route, the example prompt and the chapter labels.

## Fixtures

- Cards reuse the explainer's (`src/content/how-it-works/story.ts`); the three new ones are
  built here and validated against `cardSchema`.
- `payload.ts` is the loan packet produced by the real form engine over the facts listed in
  it, pinned so the bundle does not carry the 444KB definition. `payload.test.ts` recomputes
  it. Re-pin by running the same pipeline (the test shows the calls) and copying the counts.
- `admin.ts` is console fixture data typed against the console's own contract. The analytics
  figures are illustrative and labelled so on screen.
