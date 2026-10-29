# The showcase: narration, cues and destinations

`/#/showcase` is a five-minute narrated presentation: a static opening, three chapters driven
by audio, a static close. This folder holds everything that is data rather than code.

## Swapping a narration track

Each chapter's audio lives in `src/assets/showcase/<chapter>.mp3` and is imported by
`config.ts`. Replace the file and nothing else changes: the browser reads the real duration
from the file and the chapter ends when the track ends. Keep `durationTargetMs` in `config.ts`
in step with the mastered length so the progress rail and cue bounds agree before the file
has loaded.

The opening (`opportunity.mp3`, 48.0 s, re-read 2026-10-29 with savings as the third
journey) and closing (`risk.mp3`, 50.6 s) tracks are the mastered narration. `walkthrough.mp3` (174.4 s) is the ElevenLabs read of the savings
story in `vault/docs/showcase/walkthrough-narration.md`, as spoken on 2026-10-29. Every cue in the three chapters, and every
event in `walkthrough.ts`, sits where its words are spoken: word timestamps were taken off
each track with a scratch run of faster-whisper (not a project dependency; the narration
document records how) and the times set from them. A new track means doing that again.

A silent placeholder of any length:

```
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 60 -c:a libmp3lame -b:a 32k out.mp3
```

## Captions

`captions/<chapter>.vtt`, plain WebVTT, parsed by the page rather than handed to a `<track>`.
All three are cut from the recognised words, one cue per sentence. Captions start off and the
`c` key or the button turns them on; the transcript drawer is built from the same files.

## Retiming cues

- `opportunity.ts`, `walkthrough-cues.ts`, `risk.ts`: one cue per window, contiguous, starting
  at zero and ending on or before the track. Each carries a name (`eyebrow`) and a `title`,
  which is all any chapter draws: the walkthrough puts the name on its rail, the other two
  above the title. A `body` is allowed and only the closing question uses one. The test in
  `cues.test.ts` enforces the shape and the word limits.
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

- Cards reuse the explainer's (`src/content/how-it-works/story.ts`) where they exist, and
  are built here otherwise, validated against `cardSchema`. The open banking cards are the
  engine's own output: `synthesiseAccounts` and `summariseAccounts` run at module load over
  the showcase customer's facts with a fixed seed and date, so the balances, the salary and
  the rent on the overview are what the product would compute. Cards cut to fit the phone's
  screen whole (plan milestones, the arrangement's watch lines, status steps) are checked
  row by row against their originals: the room cannot scroll, so a card it is meant to read
  has to fit under the line that introduces it, about 580 design pixels.
- `payload.ts` is the loan packet produced by the real form engine over the facts listed in
  it, pinned so the bundle does not carry the 444KB definition. `payload.test.ts` recomputes
  it. The savings story no longer shows the packet; the fixture stays until it is wanted again.
- `admin.ts` is console fixture data typed against the console's own contract, plus the
  bank's hand-moves and the plan with its watch for the two drawn console screens. The
  analytics figures are illustrative and labelled so on screen.
