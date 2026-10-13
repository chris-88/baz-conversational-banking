import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Panel, Prose, Section } from './parts'

/**
 * What a customer gets, set against the two things people assume this is.
 *
 * "Is it a chatbot?" and "why not just a form?" are the first two questions in any room, and
 * the answer to both is the same: a form needs you to already know what you need, and a chatbot
 * can talk about it but cannot start it. The comparison is deliberately fair to both — a form
 * is the better tool when the customer knows exactly what they want, and that is said here
 * rather than argued around.
 *
 * Every claim in the Baz column is something that works today. Where it does not, it is in
 * "What it cannot do" further down the page instead.
 */

type Row = {
  readonly moment: string
  readonly form: string
  readonly chatbot: string
  readonly baz: string
}

const ROWS: readonly Row[] = [
  {
    moment: 'Working out what you need',
    form: 'You choose the product first, from a menu, before anyone has asked what you are trying to do.',
    chatbot: 'It can explain the products if you name one, and ask you which you meant if you do not.',
    baz: 'You describe the situation — buying a place, a baby coming, wanting to stop renting — and what you need is worked out from it.',
  },
  {
    moment: 'Wanting more than one thing',
    form: 'One form per product. Three products is three forms, started separately and tracked separately.',
    chatbot: 'It can tell you about all three. Starting them is a link to three forms.',
    baz: 'Three applications progress together, in one conversation, in whatever order suits.',
  },
  {
    moment: 'Being asked the same thing twice',
    form: 'Every form asks for your income. Four forms ask four times.',
    chatbot: 'Nothing it is told survives the conversation, so the forms still ask.',
    baz: 'Said once. An answer given for one application satisfies the others that need it, and the count of questions avoided is on the record.',
  },
  {
    moment: 'Saying something unexpected',
    form: 'There is no field for it.',
    chatbot: 'It answers, and nothing happens as a result.',
    baz: 'It changes what you are asked next, because what is still outstanding is recomputed from what is now known.',
  },
  {
    moment: 'Stopping halfway',
    form: 'Start again, or find the reference number in an email.',
    chatbot: 'The conversation is gone.',
    baz: 'Close the tab and come back. The conversation, the applications and everything you said are where you left them.',
  },
  {
    moment: 'Someone else being involved',
    form: 'They fill in their own copy of the same form, from the beginning.',
    chatbot: 'There is no second person.',
    baz: 'They get their own link and answer only their own questions. One answer counts for every application they are on, and they never see yours.',
  },
  {
    moment: 'Something changing later',
    form: 'A letter, or an email you have to go looking for.',
    chatbot: 'It does not know anything changed.',
    baz: 'A notification on your phone, and when you open it Baz says what moved while you were away.',
  },
  {
    moment: 'Asking what it costs',
    form: 'A rates page, separate from the form, that you work out yourself.',
    chatbot: 'A range, or a link to the rates page.',
    baz: 'The bank’s published rates for your case, with the repayment worked out and the cashback trade-off in euro.',
  },
]

/** Where each of the three is genuinely the right tool. Said plainly, because it is true. */
const HONEST: readonly { readonly title: string; readonly body: string }[] = [
  {
    title: 'A form is better when you already know',
    body: 'Somebody who wants a specific credit card and nothing else should be given that form. It is quicker, it works without a network round trip, and it never misunderstands them. Baz is for the much more common case of knowing the situation but not the product.',
  },
  {
    title: 'A chatbot is cheaper',
    body: 'Answering questions from a help centre costs a fraction of this, because it holds no state, starts nothing and carries no consequence. Every expensive part of Baz is a part that does something.',
  },
  {
    title: 'Baz earns it by acting',
    body: 'The difference is not that it talks. It is that the conversation moves real applications through real states, and that what you said in it is still true tomorrow, on another device, to a second person.',
  },
]

function Column({
  label,
  text,
  tone,
}: {
  readonly label: string
  readonly text: string
  readonly tone: 'muted' | 'baz'
}): ReactNode {
  return (
    <div
      className={cn(
        'rounded-md border p-3',
        tone === 'baz' ? 'border-l-primary bg-card border-l-[3px]' : 'bg-muted/40',
      )}
    >
      <p
        className={cn(
          'font-mono text-[11px] font-semibold tracking-[0.1em] uppercase',
          tone === 'baz' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-sm leading-relaxed',
          tone === 'baz' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {text}
      </p>
    </div>
  )
}

export function Difference(): ReactNode {
  return (
    <Section
      eyebrow="What it is not"
      title="Not a form, and not a chatbot"
      lede="Both of those exist and both are good at something. The difference is what happens after you say what you want: a form needs you to have known already, a chatbot can discuss it but cannot start it, and Baz does it."
    >
      <div className="mt-7 space-y-4">
        {ROWS.map((row) => (
          <div key={row.moment} className="bg-card rounded-md border p-4 sm:p-5">
            <h3 className="text-base font-semibold text-balance">{row.moment}</h3>
            {/*
              Stacked on a phone and side by side once there is room. Three columns at 390px
              would be three columns of two words each, which compares nothing.
            */}
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              <Column label="A form" text={row.form} tone="muted" />
              <Column label="A chatbot" text={row.chatbot} tone="muted" />
              <Column label="Baz" text={row.baz} tone="baz" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {HONEST.map((item) => (
          <Panel key={item.title} title={item.title}>
            <Prose>
              <p>{item.body}</p>
            </Prose>
          </Panel>
        ))}
      </div>
    </Section>
  )
}
