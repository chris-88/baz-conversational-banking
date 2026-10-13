import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Decider, Figures, Panel, Prose, Section, type Decides } from './parts'
import { Difference } from './Difference'

/**
 * What Baz can actually do, and one conversation showing it.
 *
 * The transcript is real. It was run against the live system and the replies are Baz's own
 * words, not an illustration of what it might say — which matters, because the easiest thing
 * to fake on a page like this is the part everything else is claiming.
 */

const FEATURES: readonly {
  readonly name: string
  readonly what: string
  readonly how: string
  readonly decides: Decides
}[] = [
  {
    name: 'Works out what you are trying to do',
    what: 'You describe a situation (moving in together, a baby coming, wanting to stop renting) and Baz works out which products that implies, rather than asking you to pick from a menu.',
    how: 'Conditions over facts, scored and combined. A goal is worth mentioning at 0.5 and established at 0.75. The model never matches on phrases.',
    decides: 'code',
  },
  {
    name: 'Quotes the bank’s real mortgage rates',
    what: 'Published rates for your buyer type, BER, amount and term, with the repayment worked out and the cashback trade-off spelled out in euro.',
    how: '133 published rows. Which ones you are entitled to see is decided in code, including refusing to price a BER the bank has not published.',
    decides: 'code',
  },
  {
    name: 'Compares products side by side',
    what: 'Several accounts in a family on one card, with their rates, so three savings accounts that look interchangeable stop looking interchangeable.',
    how: 'Every word read from Bank of Ireland’s own published catalogue. 61 real products.',
    decides: 'code',
  },
  {
    name: 'Runs several applications at once',
    what: 'A mortgage, a joint account and a credit card progressing together. You answer each question once.',
    how: 'Facts carry a subject and a provenance. What each application still needs is recomputed every turn, never remembered.',
    decides: 'code',
  },
  {
    name: 'Takes documents',
    what: 'A payslip photographed on a phone, attached to the requirement it satisfies.',
    how: 'Only against a document request that already exists. Baz cannot invent one.',
    decides: 'code',
  },
  {
    name: 'Makes a plan when you are not ready',
    what: 'Eighteen months short of a deposit is not a dead end. Baz sets a target, works out the monthly figure, and keeps it.',
    how: 'The plan engine does the arithmetic. Baz describes it and never recalculates it.',
    decides: 'code',
  },
  {
    name: 'Comes back to you',
    what: 'A notification on your phone when the target is hit or an application moves, not an email you have to go looking for.',
    how: 'Web Push, straight to the browser’s push service. No per-message charge and nothing to register.',
    decides: 'code',
  },
  {
    name: 'Brings in a second person',
    what: 'A partner joins on their own link, answers their own questions, and one answer satisfies every application they are on.',
    how: 'They never read the primary’s conversation or facts. Scoped responses, built by selection rather than by removing things.',
    decides: 'code',
  },
  {
    name: 'Stays in its lane',
    what: 'Trivia, competitors, jokes and attempts to talk it out of its role are turned away before the model sees them.',
    how: 'Fixed checks, then a classifier, then a routing table. Enforcement in front of the model, not an instruction to it.',
    decides: 'code',
  },
  {
    name: 'Says it in a way a person would',
    what: 'Plain sentences, one question at a time, and a tone an operator can set without touching what Baz is allowed to do.',
    how: 'This is the part a language model is actually for.',
    decides: 'model',
  },
]

/** The transcript, verbatim, with what happened underneath each turn. */
const TRANSCRIPT: readonly {
  readonly customer: string
  readonly baz: string
  readonly beneath: readonly { readonly decides: Decides; readonly text: string }[]
}[] = [
  {
    customer: 'Myself and my partner are hoping to buy our first place next year',
    baz: 'Good year to be doing it. I’ve put the timing down as around mid-2027, so say if it’s sooner. What sort of price are you looking at, and how much have you two saved so far?',
    beneath: [
      {
        decides: 'code',
        text: 'The gate classifies the message as banking and lets it through. Nothing out of scope ever reaches this point.',
      },
      {
        decides: 'model',
        text: '"Next year" becomes a date, because the prompt carries today’s date. Without it this is a clarifying question the case believes was never answered.',
      },
      {
        decides: 'code',
        text: 'Two facts written, each checked against the catalogue and its schema. The first write triggers the notice about what is kept.',
      },
    ],
  },
  {
    customer: 'I earn 62k, she earns 48k. We’ve about 40k saved and we’re putting away 1,500 a month',
    baz: '1,500 a month on top of 40k is a strong start. What price range are you looking at, and where do your salaries get paid?',
    beneath: [
      {
        decides: 'code',
        text: 'Four more facts. Two incomes with different subjects: hers will never satisfy a requirement that wants his.',
      },
      {
        decides: 'model',
        text: 'Asks where the salary is paid, because that is what decides whether the bank can read income from the account instead of asking for it.',
      },
    ],
  },
  {
    customer: 'What rate could we get from Bank of Ireland on about 420k?',
    baz: 'I can pull that up. Is 420k what you’d be borrowing, or the price of the place? And do you know the BER yet? It can move the rate by a letter or two.',
    beneath: [
      {
        decides: 'code',
        text: 'The rate table is indexed by four things and prices each separately, so it returns nothing until it has all four.',
      },
      {
        decides: 'model',
        text: 'Asks for the two it is missing rather than guessing or quoting a range. "I can pull that up" is true: it holds the bank’s published table.',
      },
    ],
  },
  {
    customer: 'The BER is A and we’d want it over 30 years',
    baz: 'I’ve taken 420k as the amount you’d borrow. Say so if it’s the price of the place instead.\n\nThose are the published rates as at 26 November 2025. The lowest, 3.1%, pays no cashback, while the 2-year fixed pays €8,400 back. Which works out cheaper depends on how long you’d stay on the rate, so it’s your call. None of this is an offer, because what you can borrow still goes through a full assessment.',
    beneath: [
      {
        decides: 'code',
        text: 'Four rates selected from 133 and put on a card, with every repayment calculated server-side. The model never reads the table.',
      },
      {
        decides: 'code',
        text: '€8,400 is 2% of the drawdown, worked out rather than estimated. The as-of date travels with every figure.',
      },
      {
        decides: 'model',
        text: 'Explains the trade-off the pack asks for by name: the lowest rate carries no cashback, so the cheaper one depends on how long they stay.',
      },
    ],
  },
]

export function WhatItDoes(): ReactNode {
  return (
    <div>
      <section className="border-border border-b py-8 sm:py-10">
        <p className="max-w-[62ch] font-serif text-lg leading-snug text-pretty sm:text-xl">
          You do not have to know which banking product you need. Working that out is the
          product.
        </p>
        <Figures
          items={[
            { value: '61', label: 'real products in the catalogue' },
            { value: '133', label: 'published mortgage rates' },
            { value: '57', label: 'things it can know about you' },
            { value: '7', label: 'product journeys' },
          ]}
        />
      </section>

      <Section
        eyebrow="What it does"
        title="Ten things, and only one of them is the writing"
        lede="Almost everything below is ordinary code. The model is what makes it sound like a person asking, which is the part it is genuinely best at, and the part that would be hardest to replace."
      >
        <div className="mt-7 space-y-2">
          {FEATURES.map((feature) => (
            <div key={feature.name} className="bg-card rounded-md border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold">{feature.name}</h3>
                <Decider decides={feature.decides}>
                  {feature.decides === 'code' ? 'Mostly code' : 'The model'}
                </Decider>
              </div>
              <p className="text-muted-foreground mt-1.5 max-w-[62ch] text-sm leading-relaxed">
                {feature.what}
              </p>
              <p
                className={cn(
                  'mt-2 max-w-[62ch] border-l-2 pl-3 text-sm leading-relaxed',
                  feature.decides === 'code'
                    ? 'border-l-decides-code text-decides-code'
                    : 'border-l-decides-model text-decides-model',
                )}
              >
                {feature.how}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/*
        Placed after the feature list and before the transcript: the reader has just been told
        what it does, and "is this a chatbot?" is the next thing they think. Answering it here
        means the conversation below is read as evidence rather than as a demonstration.
      */}
      <Difference />

      <Section
        eyebrow="A real conversation"
        title="Four messages, from hello to priced options"
        lede="This was run against the live system. Every reply is Baz's own words. Nothing here is an illustration of what it might have said. Underneath each turn is what actually happened."
      >
        <div className="mt-7 space-y-5">
          {TRANSCRIPT.map((turn, index) => (
            <div key={turn.customer} className="bg-card rounded-md border p-4 sm:p-5">
              <span className="text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.1em]">
                {String(index + 1).padStart(2, '0')}
              </span>

              <p className="bg-primary text-primary-foreground mt-2 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-relaxed">
                {turn.customer}
              </p>

              <p className="bg-muted text-foreground mt-2 w-fit max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                {turn.baz}
              </p>

              <ul className="mt-3.5 space-y-1.5 border-t pt-3">
                {turn.beneath.map((item) => (
                  <li key={item.text} className="flex gap-2.5 text-sm leading-relaxed">
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-[2px]',
                        item.decides === 'code' ? 'bg-decides-code' : 'bg-decides-model',
                      )}
                    />
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Panel className="mt-5">
          <Prose>
            <p>
              <strong>Four messages.</strong> No forms, no product menu, no sign-in, and no
              question asked twice. The customer never named a product — they described a
              situation, and the rates came back priced for the one they turned out to need.
            </p>
            <p>
              The same conversation, as four application forms, would have asked for both incomes
              four times.
            </p>
          </Prose>
        </Panel>
      </Section>

      <Section
        eyebrow="Honest about"
        title="What it cannot do"
        lede="A prototype that only lists what works is a prototype nobody can judge."
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Panel title="Nobody is signed in">
            <Prose>
              <p>
                Every fact Baz holds is one the customer typed. Nothing comes from the bank
                already knowing them — so the strongest version of &ldquo;you have told us this
                before&rdquo; is not in the demo yet.
              </p>
            </Prose>
          </Panel>
          <Panel title="The partner fills in forms">
            <Prose>
              <p>
                The second applicant gets a task list rather than a conversation. The scoped data
                layer behind their version of Baz is built and tested; the conversation itself is
                not finished.
              </p>
            </Prose>
          </Panel>
          <Panel title="The journeys are drafts">
            <Prose>
              <p>
                What each product asks for is modelled, not yet translated from Bank of
                Ireland&rsquo;s own recorded journeys. The shape is right; the specifics will
                move.
              </p>
            </Prose>
          </Panel>
          <Panel title="The rates are a snapshot">
            <Prose>
              <p>
                Read from the published table and dated on every card. A real deployment would
                query a rate service at the moment of answering rather than carry a copy.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>
    </div>
  )
}
