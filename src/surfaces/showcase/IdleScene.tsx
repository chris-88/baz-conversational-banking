import type { ReactNode } from 'react'
import { ClockIcon, HeartIcon, HomeIcon, PlayIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface, Tile } from '@/components/Primitives'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { showcaseConfig } from '@/content/showcase/config'
import { ShowcaseFooter, ShowcaseHeader } from './ShowcaseHeader'

/**
 * The room-ready frame.
 *
 * It may sit on a meeting-room screen for a quarter of an hour before anybody presses
 * anything, so it is finished rather than waiting: a claim, one sentence, one button. The
 * companion is the product's own bubbles with one customer message and one reply, and the
 * three needs the reply found. It hints at the demonstration without playing it.
 *
 * Nothing moves, nothing ticks, nothing starts on its own.
 */
export function IdleScene({ onStart }: { readonly onStart: () => void }): ReactNode {
  return (
    <div className="bg-muted/40 flex min-h-dvh flex-col">
      <ShowcaseHeader />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 items-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <div>
            <Eyebrow>Baz / The showcase</Eyebrow>
            <h1 className="mt-4 max-w-[16ch] text-[2.75rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
              What if banking started with a conversation?
            </h1>
            <p className="text-muted-foreground mt-6 max-w-[44ch] text-lg leading-snug text-pretty sm:text-2xl">
              Five minutes on what conversational banking could change, for customers and for
              the banks that serve them.
            </p>

            <div className="mt-10">
              <Button size="lg" className="h-12 gap-2.5 px-6 text-base" onClick={onStart}>
                <PlayIcon className="size-4 fill-current" />
                Start the experience
              </Button>
            </div>

            <p className="text-muted-foreground mt-5 flex items-center gap-2 text-sm">
              <ClockIcon aria-hidden className="size-3.5" />
              5 minutes · Sound on · Automatically guided
            </p>
          </div>

          <Companion />
        </div>
      </main>

      <ShowcaseFooter />
    </div>
  )
}

/** One exchange, and what it found. The product's bubbles, not a drawing of them. */
function Companion(): ReactNode {
  return (
    <Surface lift className="mx-auto w-full max-w-[420px] p-5 sm:p-6">
      <div className="space-y-3">
        <ChatBubble author="customer">{showcaseConfig.examplePrompt}</ChatBubble>
        <ChatBubble author="baz">
          <MessageText text="Congratulations. That is a lot at once, and most of it connects. Before we get to products, how are your finances arranged between you at the moment?" />
        </ChatBubble>
      </div>

      <div className="mt-5 border-t pt-4">
        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.12em] uppercase">
          What one message involves
        </p>
        <ul className="mt-3 grid gap-2">
          <Need icon={<HomeIcon />} label="A first home" detail="Mortgage, and the rate that fits" />
          <Need icon={<UsersIcon />} label="Married in the spring" detail="A joint account, if they want one" />
          <Need icon={<ShieldIcon />} label="A new baby" detail="Protection, now there is a child" />
        </ul>
      </div>

      <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-[11px]">
        <HeartIcon aria-hidden className="size-3" />
        Synthetic customer. Nothing here was processed by a live model.
      </p>
    </Surface>
  )
}

function Need({
  icon,
  label,
  detail,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly detail: string
}): ReactNode {
  return (
    <li className="flex items-center gap-3">
      <Tile size="sm">{icon}</Tile>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{label}</span>
        <span className="text-muted-foreground block text-[12px]">{detail}</span>
      </span>
    </li>
  )
}
