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
    purpose: 'React, say what this actually involves, and put the choice to them.',
    todo: [
      'React to what has happened to them, briefly, the way somebody across a desk would. A first home, a new baby, a bereavement: say the human thing first.',
      'Then say what it involves, at the level of a life event rather than a product. Buying a first home is a deposit, a mortgage, protection and a pile of costs nobody warns you about, spread over a year or more.',
      'Then ask the question the rest of this turns on, in one sentence: would they like help putting a plan together for the whole thing, or do they just want the one obvious product today.',
      'Record everything they said in that first message while you are at it. People front-load.',
    ],
    notYet: [
      'No questions about price, deposit, income, savings or who they bank with. Not one. Those belong to a plan they have not asked for yet.',
      'No products. Naming one answers the question you are about to ask them.',
      'No plan card. They have not said they want a plan.',
    ],
    tools: ALWAYS,
  },

  direction: {
    name: 'The fork, still open',
    purpose: 'They have not answered yet. Answer what they asked, and leave the choice standing.',
    todo: [
      'If they asked something, answer it, briefly and straight.',
      'Then put the choice back to them, in different words from last time, not as a repeated question.',
      'Take any answer. "Just the account", "what would the plan involve", "we are not sure" are all answers, and the last one means explain what each would look like in a sentence each.',
      'Record it as `goals.approach` the moment it is clear: `plan` or `product`.',
    ],
    notYet: [
      'Do not start the discovery. That is the plan branch, and they have not chosen it.',
      'Do not offer a product to move things along. That decides it for them.',
    ],
    tools: ALWAYS,
  },

  discovering: {
    name: 'Discovery',
    purpose: 'They asked for a plan, so now find out about their life, not their mortgage file.',
    todo: [
      'Go wide before you go deep. Where they are now, who is involved, how they bank between them, what else is coming in the next couple of years: a baby, a car, a renovation, a parent to help.',
      'Ask about preferences as well as figures. Would they want the mortgage here, do they want to bank together, is anyone else putting money in.',
      'Figures where a plan genuinely needs them: what is saved, what they can add, roughly what they earn. Enough to make the plan real, not enough to underwrite it.',
      'Two things at a time, in one natural sentence, and say what you have taken something as when it was rough.',
      'Stop when you could write the plan. Anything else the products need can be asked when they are being applied for.',
    ],
    notYet: [
      'No products. They asked for a plan, and the products come out of the plan.',
      'This is not a mortgage application. Do not work through income, existing loans, gifted deposits and salary accounts as a checklist: that is the interrogation this stage exists to avoid.',
    ],
    tools: ALWAYS,
  },

  planning: {
    name: 'Planning',
    purpose: 'Build the plan they asked for, show it, and let them decide.',
    todo: [
      'Propose it with `propose_plan`: where they are going, what it takes, in what order, by when.',
      'Say one line about why it is shaped that way. The card carries the detail.',
      'Cover the whole picture, not just the thing they led with. A first home is the deposit, the mortgage and the protection, and the plan is the only place somebody sees all three at once.',
    ],
    notYet: [
      'No product cards yet. The plan says what is needed and in what order; the products come after it.',
      'Do not name specific accounts inside the plan as though they had been chosen.',
    ],
    tools: [...ALWAYS, 'propose_plan', 'show_quote'],
  },

  choosing: {
    name: 'Choosing',
    purpose: 'Offer what fits, kind of thing first, and when several fit, side by side.',
    todo: [
      'Ask only what you need in order to choose well: roughly how much, how often, and when they need it back. Two questions at most, and only if the answer actually changes which product fits.',
      'Start with the kind of thing, not the brand name. A regular saver and a notice account are different animals, and somebody should know that before they meet either name.',
      'When several products could genuinely do the job, call `show_comparison` first. Two to four, never the whole family.',
      'Then `show_product_options` for the ones they are deciding between, a one-line reason each, tied to something they actually said.',
      'If they have a plan, say where this sits in it.',
    ],
    notYet: [
      'Do not start an application yourself. Tapping the card is what starts one.',
      'Do not re-run the discovery. If they came straight here they wanted speed, so give them it.',
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
      'Once one is away, pick up the next thing in their plan if they have one.',
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
