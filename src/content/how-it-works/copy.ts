/**
 * The page's editorial copy, out of the components.
 *
 * Here so that changing what the page says is a text edit rather than a hunt through JSX, and
 * so the whole argument can be read in one file to check it still holds together.
 */

export const CHAPTERS = [
  'opportunity',
  'experience',
  'architecture',
  'discovery',
  'build',
  'lessons',
  'economics',
  'future',
] as const

export type ChapterId = (typeof CHAPTERS)[number]

/** The six in the top nav. Lessons and the close are read on the way past. */
export const NAV: readonly { readonly id: ChapterId; readonly label: string }[] = [
  { id: 'opportunity', label: 'The opportunity' },
  { id: 'experience', label: 'The experience' },
  { id: 'architecture', label: 'The architecture' },
  { id: 'discovery', label: 'The discovery' },
  { id: 'build', label: 'The build' },
  { id: 'economics', label: 'The economics' },
]

export const hero = {
  title: 'How Baz works',
  standfirst:
    'A conversational banking layer built on top of capabilities the bank already owns.',
} as const

export const opportunity = {
  eyebrow: 'The opportunity',
  title: 'A personal banker for everyone',
  body: [
    'People with money worth managing get someone to talk to. Everyone else gets an app, a product list and the job of working out which parts apply to them.',
    'The gap is not information. The bank publishes everything. The gap is that nobody turns it into a conversation about your life, remembers what you said, and picks it up again a month later.',
    'Baz is an attempt at that: understand what somebody is actually trying to do, hold on to it, and get it done through the bank’s own machinery rather than around it.',
  ],
  pillars: [
    {
      title: 'Understand me',
      body: 'Knows the situation, the goal and the constraints, and never asks for the same thing twice.',
    },
    {
      title: 'Help me get things done',
      body: 'Products are applied for through the bank’s published journeys, with every commitment made by a tap.',
    },
    {
      title: 'Stay with me',
      body: 'The case survives the session, the channel, the second applicant and the month in between.',
    },
  ],
} as const

export const experience = {
  eyebrow: 'The experience',
  title: 'The same turn, from both sides',
  body: [
    'A customer sees a sentence. Underneath it, the turn is a gate decision, a set of facts read out of a database, a computed list of what is still outstanding, and a bounded set of tools.',
    'Both views below are the same turn. The system view is what the engine knew, not what the model was thinking: raw reasoning is never stored and never shown.',
  ],
} as const

export const architecture = {
  eyebrow: 'The architecture',
  title: 'The model talks. The platform does the banking.',
  body: [
    'Every turn runs the same five stages. Only one of them is the model, and it is the only one allowed to be approximately right.',
    'What is outstanding is computed from the data. A rate comes from a published table. A repayment is arithmetic. A state change goes through a transition table. None of those are things a language model should be asked to get right every time, so none of them are.',
  ],
} as const

export const discovery = {
  eyebrow: 'The discovery',
  title: 'Then we found the bank already spoke machine',
  body: [
    'The plan was to write a conversational version of each product journey, and keep it in step with the real one by hand. That plan survived until somebody opened the network tab on the SuperSaver page.',
    'The existing journey fetches its own definition from an API: every question, every branch, every validation rule, every consent and the exact shape of the submission. It is a document, and documents can be read by something other than a web page.',
    'So Baz is not a conversational imitation of a product journey. It is another renderer of the same definition the website renders.',
  ],
  afterExample:
    'The customer does not need to know any of that, and the bank’s own journey stays authoritative underneath.',
} as const

export const build = {
  eyebrow: 'The build',
  title: 'Baz was not designed this way. We found our way here.',
  body: [
    'It started as an applications assistant and became something else five times over. Each change is here with what it replaced, because a product that arrived fully formed would be a less honest story and a less useful one.',
  ],
} as const

export const buildingWithAi = {
  eyebrow: 'The build',
  title: 'Building this way changes the build too',
  body: [
    'A person set the direction, the constraints and the quality bar. The model wrote a great deal of the code, the tests and the documentation, and was wrong often enough that every claim on this page is checked against something that can be measured.',
  ],
  human: {
    title: 'The person owns',
    items: [
      'The product thesis',
      'Architecture and the boundaries',
      'What must never happen',
      'Acceptance criteria',
      'Taste, and when to stop',
      'Anything involving risk',
    ],
  },
  ai: {
    title: 'The model accelerates',
    items: [
      'Implementation',
      'Repetitive and boilerplate code',
      'Refactoring',
      'Tests and fixtures',
      'Documentation',
      'Interface iteration',
    ],
  },
} as const

export const lessons = {
  eyebrow: 'What we got wrong',
  title: 'Four things that cost something to learn',
  body: [
    'Each of these was a confident assumption, and each was settled by a measurement rather than an argument.',
  ],
} as const

export const economics = {
  eyebrow: 'The economics',
  title: 'Relationship banking only matters if it scales',
  body: [
    'Every turn of a conversation has a marginal cost, which is unusual for a digital channel and makes the economics visible in a way a web page never has to be.',
    'The numbers below are measured, not modelled, with one exception that says so. The useful finding was that the big savings came from architecture rather than from picking a cheaper model, and that the obvious target was the wrong one.',
  ],
} as const

export const future = {
  eyebrow: 'What it could be',
  title: 'A personal banker for everyone',
  body: [
    'What this prototype demonstrates is narrow and specific: two published journeys, read and completed conversationally, with a packet at the end that nobody sends.',
    'What it suggests is wider. The bank may already own far more of the architecture for conversational banking than it looks like from outside, because the journeys are already written down in a form a machine can read.',
  ],
  close: ['The chatbot is not the product.', 'The relationship is the product.'],
} as const

/**
 * The labels that keep the page honest about what is real.
 *
 * Used wherever a claim could be read as more than it is. Spec §26: a reader must always be
 * able to tell what the prototype does from what a production system would do.
 */
export const LABELS = {
  poc: 'POC',
  production: 'Production direction',
  illustrative: 'Illustrative estimate',
  synthetic: 'Synthetic example',
  measured: 'Measured',
} as const
