import type { ShowcaseCue, WalkthroughScene } from './types'

/**
 * The middle three minutes: what.
 *
 * Seven windows, from the brief's cue map, with its two corrections applied: sign-in here is
 * an email code, not Google, and the console has no Settings screen. Times are provisional
 * until the narration is mastered. The transcript the phone replays during these windows is
 * in `walkthrough.ts`.
 */
export const WALKTHROUGH_CUES: readonly ShowcaseCue<WalkthroughScene>[] = [
  {
    id: 'arrive',
    chapter: 'walkthrough',
    startMs: 0,
    endMs: 18_600,
    scene: 'arrive',
    presenter: {
      eyebrow: 'Life context',
      title: 'Start with the person, not a product.',
      body: 'Context and goals come before product selection. The customer says what is going on; Baz asks one question at a time and records what it learns.',
      technicalNote:
        'Scripted synthetic customer. The gate, the stage and the fact catalogue are the real ones.',
    },
  },
  {
    id: 'understand',
    chapter: 'walkthrough',
    startMs: 18_600,
    endMs: 37_400,
    scene: 'understand',
    presenter: {
      eyebrow: 'Discovery',
      title: 'One conversation builds understanding.',
      body: 'The customer should never repeat the same facts in every journey. What is said once is kept, with where it came from, and reused wherever it is needed.',
      bullets: [
        'Facts recorded against a catalogue, never free text',
        'A goal kept with one tap',
        'Reuse shown, not assumed',
      ],
      technicalNote: 'The reuse shown is what the prototype does today.',
    },
  },
  {
    id: 'connect',
    chapter: 'walkthrough',
    startMs: 37_400,
    endMs: 54_800,
    scene: 'connect',
    presenter: {
      eyebrow: 'Recommendations',
      title: 'Multiple needs, connected.',
      body: 'The recommendations come from the same circumstances. The customer chooses; three applications start at once and share what is already known.',
      technicalNote:
        'Options are indicative, not personal financial advice. Rates come from the published table.',
    },
  },
  {
    id: 'authenticate',
    chapter: 'walkthrough',
    startMs: 54_800,
    endMs: 74_500,
    scene: 'authenticate',
    presenter: {
      eyebrow: 'Authentication',
      title: 'Authenticate when it matters.',
      body: 'Signing in attaches the conversation to an identity, and the bank’s own records fill in what it already held. Nothing is asked twice.',
      technicalNote:
        'Email code sign-in on a prototype, with synthetic bank-held data. Not production KYC.',
    },
  },
  {
    id: 'machinery',
    chapter: 'walkthrough',
    startMs: 74_500,
    endMs: 95_300,
    scene: 'machinery',
    presenter: {
      eyebrow: 'Existing forms',
      title: 'Use the machinery we already have.',
      body: 'The bank publishes its form definitions. Baz reads one, maps what it knows into the fields, asks for the rest in conversation, and collects documents the same way.',
      bullets: [
        'Published definition, read not written',
        'Known facts filled in',
        'Documents attached, declarations ticked',
      ],
      technicalNote: 'Nothing is submitted. The packet is built for inspection only.',
    },
  },
  {
    id: 'action',
    chapter: 'walkthrough',
    startMs: 95_300,
    endMs: 112_300,
    scene: 'action',
    presenter: {
      eyebrow: 'Orchestration',
      title: 'From conversation towards action.',
      body: 'The structured output of one conversation can feed several downstream processes at once: applications, a plan, a partner’s tasks.',
      technicalNote: 'Packet captured, never sent. The endpoint is recorded as metadata.',
    },
  },
  {
    id: 'govern',
    chapter: 'walkthrough',
    startMs: 112_300,
    endMs: 129_200,
    scene: 'govern',
    presenter: {
      eyebrow: 'Governance',
      title: 'Governance is part of the design.',
      body: 'Operations, monitoring and controls matter as much as the chat. The console shows every case with provenance, the guardrails, the persona and what the numbers say.',
      bullets: ['Cases with provenance', 'Guardrails and persona', 'Analytics from events'],
      technicalNote:
        'Working console screens, shown with fixture data. Bank-side events are simulated.',
    },
  },
]
