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
  readonly body: string
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
