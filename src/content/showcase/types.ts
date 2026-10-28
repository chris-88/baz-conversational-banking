import type { Card } from '@contracts/cards.ts'

/**
 * The shapes the showcase is built from.
 *
 * Three narrated chapters between a static opening and a static close. Everything on screen
 * during a chapter is a function of where the narration is, so the shapes here describe time:
 * a chapter has a track and a target length, and a cue is a window within it.
 */

export const CHAPTERS = ['opportunity', 'walkthrough', 'risk'] as const
export type ChapterId = (typeof CHAPTERS)[number]

export type ShowcaseStage = 'idle' | ChapterId | 'explore'

export type ChapterManifest = {
  readonly id: ChapterId
  /** What the header calls it while it plays. */
  readonly label: string
  /** The narration track, imported as a module so the URL is hashed and base-aware. */
  readonly src: string
  /**
   * The length the track is mastered to.
   *
   * Only a target: once the browser has read the file's metadata, its real duration takes
   * over. Nothing advances a chapter on this number; `ended` does that.
   */
  readonly durationTargetMs: number
  /** The captions, as WebVTT text. Parsed by the page rather than handed to a `<track>`. */
  readonly captions: string
}

/** What the presenter panel says during a cue. The limits are enforced by a test. */
export type Presenter = {
  readonly eyebrow?: string
  /** At most twelve words. */
  readonly title: string
  /** At most thirty-five words. */
  /** Absent where the chapter draws only the title, as the walkthrough does. */
  readonly body?: string
  /** At most three. */
  readonly bullets?: readonly string[]
  /** "Under the hood": which working capability this is, or what is simulated. */
  readonly technicalNote?: string
}

/**
 * A window of a chapter.
 *
 * `scene` is a chapter-specific union, narrowed by each chapter's cue file, so the component
 * that draws a chapter can switch on it exhaustively.
 */
export type ShowcaseCue<Scene extends string = string> = {
  readonly id: string
  readonly chapter: ChapterId
  readonly startMs: number
  readonly endMs: number
  readonly scene: Scene
  readonly presenter?: Presenter
}

export type OpportunityScene = 'headline' | 'fragments' | 'question' | 'meet' | 'capability'
export type WalkthroughScene =
  | 'arrive'
  | 'understand'
  | 'connect'
  | 'authenticate'
  | 'machinery'
  | 'action'
  | 'govern'
export type RiskScene = 'compress' | 'assistant' | 'ownership' | 'paths' | 'question'

export function nextChapter(chapter: ChapterId): ChapterId | 'explore' {
  const index = CHAPTERS.indexOf(chapter)
  const next = CHAPTERS[index + 1]
  return next ?? 'explore'
}

export function isChapter(stage: ShowcaseStage): stage is ChapterId {
  return (CHAPTERS as readonly string[]).includes(stage)
}

/* ---------------------------------------------------------------------------------------- */
/* The walkthrough's transcript, as events in chapter time.                                  */
/* ---------------------------------------------------------------------------------------- */

/** What replaces the phone during a cutaway. */
export type CutawayView =
  | {
      readonly kind: 'admin'
      readonly screen: 'cases' | 'case' | 'guardrails' | 'persona' | 'analytics'
    }
  | { readonly kind: 'payload' }

/**
 * One thing that happens on the phone, at a moment in the chapter.
 *
 * The transcript on screen at any time is a pure function of these and the clock, which is
 * what makes a seek to ninety-five seconds show exactly what continuous playback would.
 */
export type TranscriptEvent =
  | {
      readonly kind: 'customer'
      readonly id: string
      /** When the message is sent and becomes a bubble. */
      readonly atMs: number
      readonly text: string
      /** When the composer starts filling. Short: fast confident typing, not a typewriter. */
      readonly typeFromMs: number
    }
  | {
      readonly kind: 'baz'
      readonly id: string
      readonly atMs: number
      readonly text: string
      /** When the thinking bubble appears. */
      readonly thinkingFromMs: number
    }
  | {
      readonly kind: 'card'
      readonly id: string
      readonly atMs: number
      readonly card: Card
      /** When the customer taps, after which the card shows its settled state. */
      readonly settleAtMs?: number
      readonly settled?: { readonly label: string; readonly note?: string }
    }
  | {
      /** Time compression: everything before this leaves the screen. */
      readonly kind: 'cut'
      readonly id: string
      readonly atMs: number
    }
  | {
      readonly kind: 'cutaway'
      readonly id: string
      readonly atMs: number
      readonly untilMs: number
      readonly view: CutawayView
    }
