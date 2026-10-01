import { describe, expect, it } from 'vitest'
import {
  PRESETS,
  PRESET_NAMES,
  SLIDER_NAMES,
  applySensitivity,
  composePersona,
  slidersFor,
  toneBucket,
  type PersonaSliders,
} from './persona.ts'

const at = (value: number): PersonaSliders => ({
  length: value,
  humour: value,
  sarcasm: value,
  formality: value,
  playfulness: value,
  poetic: value,
})

describe('presets', () => {
  it('defines every slider for every preset', () => {
    for (const preset of PRESET_NAMES) {
      for (const slider of SLIDER_NAMES) {
        const value = PRESETS[preset][slider]
        expect(value, `${preset}.${slider}`).toBeGreaterThanOrEqual(0)
        expect(value, `${preset}.${slider}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('formal has no humour, sarcasm, playfulness or poetry', () => {
    const formal = slidersFor('formal')
    expect([formal.humour, formal.sarcasm, formal.playfulness, formal.poetic]).toEqual([0, 0, 0, 0])
  })

  it('dry humour is humorous and sarcastic without being playful or poetic', () => {
    const dry = slidersFor('dry_humour')
    expect(dry.humour).toBeGreaterThan(0.5)
    expect(dry.sarcasm).toBeGreaterThan(0.5)
    expect(dry.poetic).toBe(0)
  })
})

describe('composePersona()', () => {
  it('is stable for a given set of sliders', () => {
    expect(composePersona(slidersFor('default'))).toMatchInlineSnapshot(`
      "## Style

      This section controls how you write. It does not change what you are allowed to discuss,
      what actions you can take, any application rule, or any customer protection.

      - Keep answers short. A few sentences is usually right.
      - A light touch of humour is welcome where it fits naturally. Never at the customer’s expense.
      - No sarcasm.
      - Speak plainly and professionally. Contractions are fine.
      - A little personality is welcome.
      - Use plain, direct language.

      - Always be clear that you are an AI assistant if asked. Never claim to be a person."
    `)
  })

  it('changes wording when a slider moves between bands', () => {
    const quiet = composePersona(at(0))
    const loud = composePersona(at(1))

    expect(quiet).not.toEqual(loud)
    expect(quiet).toContain('No jokes.')
    expect(loud).toContain('genuinely funny')
  })

  it('clamps values outside 0 to 1 rather than throwing', () => {
    expect(() => composePersona(at(-5))).not.toThrow()
    expect(() => composePersona(at(99))).not.toThrow()
    expect(composePersona(at(-5))).toEqual(composePersona(at(0)))
    expect(composePersona(at(99))).toEqual(composePersona(at(1)))
  })

  it('always states the style block cannot change scope, rules or protections', () => {
    for (const preset of PRESET_NAMES) {
      const block = composePersona(slidersFor(preset))
      expect(block, preset).toContain('does not change what you are allowed to discuss')
      expect(block, preset).toContain('customer protection')
    }
  })

  it('always carries the AI disclosure, whatever the persona (§16)', () => {
    for (const preset of PRESET_NAMES) {
      expect(composePersona(slidersFor(preset)), preset).toContain('Never claim to be a person')
    }
  })

  it('contains no instruction about tools, products or permissions', () => {
    for (const preset of PRESET_NAMES) {
      const block = composePersona(slidersFor(preset)).toLowerCase()
      for (const forbidden of ['tool', 'record_facts', 'submit', 'approve', 'you may now']) {
        expect(block, `${preset} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })
})

describe('applySensitivity() (§50, Invariant 5)', () => {
  it('forces humour, sarcasm, playfulness and poetic to zero', () => {
    const sensitive = applySensitivity(slidersFor('poetic'), true)

    expect(sensitive.humour).toBe(0)
    expect(sensitive.sarcasm).toBe(0)
    expect(sensitive.playfulness).toBe(0)
    expect(sensitive.poetic).toBe(0)
  })

  it('leaves length and formality alone: brevity is not a protection', () => {
    const original = slidersFor('poetic')
    const sensitive = applySensitivity(original, true)

    expect(sensitive.length).toBe(original.length)
    expect(sensitive.formality).toBe(original.formality)
  })

  it('does nothing when the turn is not sensitive', () => {
    expect(applySensitivity(slidersFor('dry_humour'), false)).toEqual(slidersFor('dry_humour'))
  })

  it('silences even the most playful persona', () => {
    const block = composePersona(applySensitivity(at(1), true))
    expect(block).toContain('No jokes.')
    expect(block).toContain('No sarcasm.')
  })
})

describe('toneBucket()', () => {
  it('picks formal wording for a formal persona', () => {
    expect(toneBucket(slidersFor('formal'))).toBe('formal')
  })

  it('picks playful wording for a friendly persona', () => {
    expect(toneBucket(slidersFor('friendly'))).toBe('playful')
  })

  it('picks neutral wording for the default persona', () => {
    expect(toneBucket(slidersFor('default'))).toBe('neutral')
  })
})

/**
 * §16 — the default persona is concise, helpful, curious, competent and LIGHTLY HUMOROUS.
 * An earlier default put humour and playfulness at 0.3, which fell into the lowest band and
 * rendered as "No jokes" — the opposite of what §16 asks for.
 */
describe('the default persona matches §16', () => {
  const block = composePersona(slidersFor('default'))

  it('allows light humour', () => {
    expect(block).toContain('light touch of humour')
    expect(block).not.toContain('No jokes.')
  })

  it('allows a little personality', () => {
    expect(block).not.toContain('Be straightforward and literal.')
  })

  it('keeps answers short', () => {
    expect(block).toMatch(/few words|Keep answers short/)
  })

  it('does not make the default sarcastic', () => {
    expect(block).toContain('No sarcasm.')
  })
})
