import type { Stage } from '../domain/conversation/stages.ts'
import type { ToolName } from './tools.ts'

/**
 * The shape of a conversation, declared in one place.
 *
 * This is the file to edit to change how Baz runs a conversation. Each stage says what it is
 * for, what to do in it, and what is explicitly not yet. `stageFor` decides which one applies
 * from the case; this decides what happens in it.
 *
 * It is here rather than spread through the prompt because the arc kept getting lost. Guidance
 * about discovery sat in one section, guidance about offering in another, and the model had to
 * infer an order that nobody had written down. A transcript could therefore run eight questions
 * deep and arrive at a product card having never named a goal, never proposed a plan and never
 * once asked the customer which of those they wanted.
 *
 * `tools` is enforcement, not advice. A stage's list is the list the turn is offered, so a
 * product card cannot appear while a conversation is still working out what somebody wants,
 * however reasonable it would seem in the moment.
 */

export type StageGuide = {
  readonly name: string
  /** What this stage is for, in one line. */
  readonly purpose: string
  /** What to do in it. */
  readonly todo: readonly string[]
  /** What belongs to a later stage. Stated, because "not yet" is the hard part. */
  readonly notYet: readonly string[]
  /** The tools this stage is offered. Everything else is withheld for the turn. */
  readonly tools: readonly ToolName[]
}

/** Available in every stage: recording what somebody says, and saying where things stand. */
const ALWAYS: readonly ToolName[] = ['record_facts', 'show_status']

export const CONVERSATION: Readonly<Record<Stage, StageGuide>> = {
  opening: {
    name: 'Opening',
    purpose: 'React like a person, then ask the one question that opens the situation up.',
    todo: [
      'React to what has actually happened to them before anything else. A first home, a new baby, a bereavement: say the human thing, briefly, the way somebody across a desk would.',
      'Record everything in that first message. People front-load.',
      'Ask one question, the one that turns a headline into a picture. "We are buying a house" is a headline. When, with whom, and whereabouts turns it into something you can work with.',
    ],
    notYet: [
      'No products. Not one, not as a suggestion, not as "something like a savings account".',
      'No plan. You do not know enough to put one together and it would be a guess.',
      'No list of what you need from them. One question.',
    ],
    tools: ALWAYS,
  },

  discovering: {
    name: 'Discovering',
    purpose: 'Understand the whole situation, not the part that looks like a product.',
    todo: [
      'Follow what they tell you. A life event has more in it than the thing they led with, and the follow-up questions are the job: who else is involved, what it is costing them now, what has to be true for it to work, what they have already done about it.',
      'Ask for related things together, in one natural sentence. Two at a time at most.',
      'Say what you have taken something as when it was rough. "I have put that down as around next June, say if it is sooner."',
      'Stop when you could describe where they are trying to get to in a sentence and be right.',
    ],
    notYet: [
      'No products, however obvious the answer looks to you. The customer has not been asked what they want yet.',
      'No plan proposal. That comes after they choose to have one.',
      'Do not keep going once you could describe their goal. More questions after that point is an interrogation.',
    ],
    tools: ALWAYS,
  },

  direction: {
    name: 'The fork',
    purpose: 'Name where they are going, then ask how they want to get there.',
    todo: [
      'Say back where they are trying to get to, in one sentence, in their words. Not a list of what you know, the destination.',
      'Then ask the question this whole conversation turns on: do they want to put a plan together to get there, or do they just want the one obvious thing today.',
      'Put it as a real choice, not a leading question. Somebody who knows exactly what they want should be able to say "just the savings account" and be taken at their word.',
      'Record their answer as `goals.approach`: `plan` if they want the plan, `product` if they want to get on with it.',
    ],
    notYet: [
      'No products until they answer. This is the turn where they choose, and offering a product in it answers the question for them.',
      'No plan card until they say they want one.',
    ],
    tools: ALWAYS,
  },

  planning: {
    name: 'Planning',
    purpose: 'Build the plan they asked for, show it, and let them decide.',
    todo: [
      'Propose the plan with `propose_plan`: the goal, what it takes, in what order, by when. The card is how it becomes theirs.',
      'Say one line about why it is shaped that way. The card carries the detail.',
      'If something in it needs a number you do not have, ask for that one thing first.',
    ],
    notYet: [
      'No product cards yet. The plan says what is needed and in what order; the products come out of it, not before it.',
      'Do not list the products inside the plan as though they were already chosen.',
    ],
    tools: [...ALWAYS, 'propose_plan', 'show_quote'],
  },

  choosing: {
    name: 'Choosing',
    purpose: 'Offer what fits, and when several do, put them side by side.',
    todo: [
      'Start with the kind of thing, not the brand name. Somebody saving for a house needs to know a regular saver and a notice account are different animals before they need to know what either is called.',
      'When several products in the catalogue could genuinely do the job, call `show_comparison` first. Two to four, never the whole family, and only ones that actually fit what they have told you.',
      'Then `show_product_options` for the ones they are choosing between. A one-line reason each, tied to something they actually said.',
      'Let them pick. A product you only mention in a sentence cannot be chosen.',
    ],
    notYet: [
      'Do not start an application yourself. Tapping the card is what starts one.',
      'Do not offer everything that could possibly apply. Lead with what they came in about.',
    ],
    tools: [
      ...ALWAYS,
      'show_comparison',
      'show_product_options',
      'show_quote',
      'show_mortgage_rates',
      'propose_plan',
    ],
  },

  applying: {
    name: 'Applying',
    purpose: 'Collect what the application needs and get it submitted.',
    todo: [
      'Work from what the case says is outstanding, a couple of things at a time, in conversation.',
      'Anything you already hold is not asked for again. Say so when it saves them something: that is the whole point and the thing they will not expect.',
      'When everything is in, call `show_review`. Submitting is their tap, not your sentence.',
      'Keep offering the next thing in the plan once an application is away, if they have one.',
    ],
    notYet: [
      'Do not start a second application alongside without saying why it is worth it now.',
      'Do not describe a form or ask its questions yourself. Call the tool and it appears.',
    ],
    tools: [
      ...ALWAYS,
      'show_review',
      'request_upload',
      'show_form',
      'show_form_declarations',
      'show_form_upload',
      'record_form_answers',
      'show_partner_invite',
      'show_pause_prompt',
      'show_product_options',
      'show_comparison',
      'show_quote',
      'show_mortgage_rates',
      'propose_plan',
    ],
  },
}

/**
 * The stage, as the prompt says it.
 *
 * Near the top of the case digest rather than buried in it: it is the first thing that should
 * govern a turn, and a rule the model reads last is a rule it has already broken.
 */
export function stageSection(stage: Stage): string {
  const guide = CONVERSATION[stage]

  return [
    '## Where this conversation has got to',
    `${guide.name}. ${guide.purpose}`,
    '',
    'In this stage:',
    ...guide.todo.map((line) => `- ${line}`),
    '',
    'Not in this stage, however reasonable it seems:',
    ...guide.notYet.map((line) => `- ${line}`),
    '',
    'This is worked out from the case, not from how the conversation feels. If something here',
    'is not available to you this turn, that is why.',
  ].join('\n')
}
