import type { ToneBucket } from './refusals.ts'

/**
 * Persona is style only (§18, Invariant 5).
 *
 * Sliders map to fixed prose fragments. There is no free-text persona input anywhere in the
 * system, so there is no channel through which a persona setting could alter what Baz is
 * permitted to discuss, which tools it may call, or any customer protection. The composed
 * block is labelled and placed AFTER the immutable policy block in the prompt, so an
 * instruction inside it cannot outrank policy.
 */

export const SLIDER_NAMES = [
  'length',
  'humour',
  'sarcasm',
  'formality',
  'playfulness',
  'poetic',
] as const

export type SliderName = (typeof SLIDER_NAMES)[number]

/** Every slider runs 0 to 1. */
export type PersonaSliders = Readonly<Record<SliderName, number>>

export const PRESET_NAMES = [
  'default',
  'concise',
  'friendly',
  'formal',
  'dry_humour',
  'poetic',
] as const
export type PresetName = (typeof PRESET_NAMES)[number]

/** §17, §38 — presets are named slider sets. "Custom" simply means values of your own. */
export const PRESETS: Readonly<Record<PresetName, PersonaSliders>> = {
  // §16: the default Baz is concise, curious and LIGHTLY HUMOROUS, occasionally playful.
  // Values sit mid-band deliberately — 0.3 would render as "No jokes", which contradicts §16
  // and the opening line in the vision document.
  default: { length: 0.45, humour: 0.45, sarcasm: 0.15, formality: 0.5, playfulness: 0.45, poetic: 0 },
  // Concise is about length. It does not strip the personality out of Baz.
  concise: { length: 0.1, humour: 0.4, sarcasm: 0.15, formality: 0.5, playfulness: 0.4, poetic: 0 },
  friendly: { length: 0.6, humour: 0.6, sarcasm: 0, formality: 0.25, playfulness: 0.7, poetic: 0.1 },
  formal: { length: 0.5, humour: 0, sarcasm: 0, formality: 1, playfulness: 0, poetic: 0 },
  dry_humour: { length: 0.4, humour: 0.7, sarcasm: 0.75, formality: 0.5, playfulness: 0.4, poetic: 0 },
  poetic: { length: 0.7, humour: 0.45, sarcasm: 0.15, formality: 0.4, playfulness: 0.7, poetic: 0.9 },
}

/** Three bands per slider: low, middle, high. */
type Fragments = readonly [low: string, mid: string, high: string]

const FRAGMENTS: Readonly<Record<SliderName, Fragments>> = {
  length: [
    'Answer in as few words as will do the job. One or two sentences unless more is genuinely needed.',
    'Keep answers short. A few sentences is usually right.',
    'Take the space to explain properly, but never pad.',
  ],
  humour: [
    'No jokes.',
    'A light touch of humour is welcome where it fits naturally. Never at the customer’s expense.',
    'Be genuinely funny where the moment allows, without becoming a comedian. Never at the customer’s expense.',
  ],
  sarcasm: [
    'No sarcasm.',
    'A dry aside now and then is fine.',
    'Dry, understated wit is part of how you speak. Never sarcastic about the customer or their situation.',
  ],
  formality: [
    'Speak casually, the way a helpful colleague would.',
    'Speak plainly and professionally. Contractions are fine.',
    'Speak formally. Avoid contractions and colloquialism.',
  ],
  playfulness: [
    'Be straightforward and literal.',
    'A little personality is welcome.',
    'Be playful with language where it helps, as long as the meaning stays unmistakable.',
  ],
  poetic: [
    'Use plain, direct language.',
    'An occasional vivid phrase is fine.',
    'Reach for imagery and rhythm. Never at the cost of clarity about money or process.',
  ],
}

function band(value: number): 0 | 1 | 2 {
  if (value < 0.34) return 0
  if (value < 0.67) return 1
  return 2
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * §50, Invariant 5 — on a sensitive turn, humour, sarcasm, playfulness and poetic are forced
 * to zero. This is applied here rather than being asked of the model, so no persona setting
 * can override it.
 */
export function applySensitivity(sliders: PersonaSliders, sensitive: boolean): PersonaSliders {
  if (!sensitive) return sliders
  return { ...sliders, humour: 0, sarcasm: 0, playfulness: 0, poetic: 0 }
}

/** Which refusal wording to use (§26). Derived from the sliders, never set independently. */
export function toneBucket(sliders: PersonaSliders): ToneBucket {
  if (sliders.formality >= 0.67) return 'formal'
  if (sliders.humour >= 0.5 || sliders.playfulness >= 0.6) return 'playful'
  return 'neutral'
}

/**
 * The labelled style block. Everything inside it is about HOW Baz speaks; the sentence at the
 * end makes the boundary explicit to the model as well as to a reader of the prompt.
 */
export function composePersona(sliders: PersonaSliders): string {
  const lines = SLIDER_NAMES.map((name) => FRAGMENTS[name][band(clamp(sliders[name]))])

  return [
    '## Style',
    '',
    'This section controls how you write. It does not change what you are allowed to discuss,',
    'what actions you can take, any application rule, or any customer protection.',
    '',
    ...lines.map((line) => `- ${line}`),
    '',
    '- Always be clear that you are an AI assistant if asked. Never claim to be a person.',
  ].join('\n')
}

export function slidersFor(preset: PresetName): PersonaSliders {
  return PRESETS[preset]
}
