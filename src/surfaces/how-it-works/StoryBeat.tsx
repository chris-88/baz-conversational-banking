import type { ReactNode } from 'react'
import { CheckIcon, LinkIcon } from 'lucide-react'
import type { Beat, Line } from '@/content/how-it-works/story'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { BazMark } from '@/baz/BazMark'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { Claim, MiniRow, StepBadge, Surface } from './parts'
import { SystemStrip } from './SystemStrip'

/**
 * One beat of the story: what the customer saw, beside what the system did.
 *
 * The left column is the product's own transcript pieces. `ChatBubble` and `MessageText` are
 * the ones the conversation uses, and every card goes through `CardRenderer` with no actions
 * and every control disabled, so what is on this page is what is on a phone and nothing can be
 * started from it. Where the story has moved on, the card is shown settled, with the same
 * wording the product uses the moment a tap lands.
 *
 * The three beats with no card, the partner's task list, the console and the lock screen, are
 * drawn as rows rather than faked as screens, and each says where the real one is.
 */
export function StoryBeat({ beat, n }: { readonly beat: Beat; readonly n: number }): ReactNode {
  return (
    <Surface className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <StepBadge n={n} tone="primary" />
        <h4 className="min-w-0 flex-1 text-[14.5px] font-semibold">{beat.title}</h4>
        <Claim kind={beat.claim} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="mx-auto max-w-[390px] space-y-3 lg:mx-0">
            {beat.lines.map((line) => (
              <Bubble key={line.text} line={line} />
            ))}

            {beat.tasks !== undefined && <PartnerTasks tasks={beat.tasks} />}
            {beat.console !== undefined && <ConsoleActions actions={beat.console} />}
            {beat.notification !== undefined && <LockScreen notification={beat.notification} />}

            {beat.tasks !== undefined && beat.cards.length > 0 && (
              <p className="text-muted-foreground pt-1 text-[11.5px]">
                On Aoife&rsquo;s phone, a moment later, over Realtime:
              </p>
            )}

            {beat.cards.map(({ card, settled }, index) => (
              // Cards do not reorder within a beat; the index is the identity.
              <div key={`${card.type}-${String(index)}`} className="pl-10">
                <CardRenderer card={card} actions={{}} disabled settled={settled} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/40 border-t p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <SystemStrip beat={beat} />
          <p className="text-muted-foreground mt-4 border-t pt-3 font-mono text-[10.5px]">
            Source: {beat.source}
          </p>
        </div>
      </div>
    </Surface>
  )
}

function Bubble({ line }: { readonly line: Line }): ReactNode {
  const author = line.actor === 'baz' ? 'baz' : 'customer'
  return (
    <div>
      <ChatBubble author={author}>
        {author === 'baz' ? <MessageText text={line.text} /> : line.text}
      </ChatBubble>
      {line.quoted !== undefined && (
        <p
          className={
            author === 'baz'
              ? 'text-muted-foreground mt-1 pl-10 text-[10.5px]'
              : 'text-muted-foreground mt-1 pr-10 text-right text-[10.5px]'
          }
        >
          Quoted from {line.quoted}
        </p>
      )}
    </div>
  )
}

/** Emma's task list, as rows. The real screen is `/#/join/:token`, which needs a live case. */
function PartnerTasks({
  tasks,
}: {
  readonly tasks: NonNullable<Beat['tasks']>
}): ReactNode {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-[13px] font-semibold">Your tasks</p>
      <p className="text-muted-foreground mt-0.5 text-[11.5px]">
        Emma sees these and nothing else: no conversation, no facts but her own.
      </p>
      <ul className="mt-2.5 divide-y">
        {tasks.map((task) => (
          <li key={task.label} className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[12.5px]">
              <CheckIcon aria-hidden className="text-success size-3.5" />
              {task.label}
            </span>
            <span className="text-muted-foreground shrink-0 text-[10.5px]">{task.on}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2.5 border-t pt-2 text-[10.5px]">
        Drawn as rows. The real screen is the partner surface at /#/join/:token, which needs a
        live case behind it.
      </p>
    </div>
  )
}

/** The presenter's buttons, each a transition the state machine has already agreed to. */
function ConsoleActions({ actions }: { readonly actions: readonly string[] }): ReactNode {
  return (
    <div className="space-y-1.5">
      {actions.map((action) => (
        <MiniRow key={action} label={action} tone="primary" />
      ))}
      <p className="text-muted-foreground pt-1 text-[10.5px]">
        Two presses in the console&rsquo;s event simulator. The real screen is /#/admin, behind a
        sign-in.
      </p>
    </div>
  )
}

/** What a lock screen shows, with the fixed copy the admin function sends. */
function LockScreen({
  notification,
}: {
  readonly notification: NonNullable<Beat['notification']>
}): ReactNode {
  return (
    <div className="space-y-2">
      <div className="bg-card flex items-start gap-3 rounded-2xl border p-3 shadow-xs">
        <span className="text-baz-primary bg-muted grid size-9 shrink-0 place-items-center rounded-xl">
          <BazMark />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">{notification.title}</p>
          <p className="text-[12.5px] leading-snug">{notification.body}</p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1 font-mono text-[10.5px]">
            <LinkIcon aria-hidden className="size-3" />
            {notification.link}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground text-[10.5px]">
        A real Web Push, confirmed arriving on a phone. Drawn here rather than screenshotted.
      </p>
    </div>
  )
}
