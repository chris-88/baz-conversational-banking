import type { ReactNode } from 'react'
import {
  BotIcon,
  HomeIcon,
  LandmarkIcon,
  LockIcon,
  PiggyBankIcon,
  ShieldIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react'
import type { RiskScene as Scene, ShowcaseCue } from '@/content/showcase/types'
import { showcaseConfig } from '@/content/showcase/config'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { BazMark } from '@/baz/BazMark'
import { BazWordmark } from '@/baz/BazWordmark'
import { Claim, Surface, Tile } from '@/components/Primitives'
import { ChapterStage } from './ChapterStage'
import { Arrive, Arrow, Bus, Node } from './scene-parts'
import { settle } from './ease'
import { cn } from '@/lib/utils'

/**
 * The last sixty seconds, drawn.
 *
 * Relationship diagrams: the conversation shrinking back into one surface among many, a
 * neutral assistant arriving beside the customer, the conversational layer pulled apart from
 * the regulated one, two responses, and one question on an otherwise empty screen.
 *
 * No third-party logos. The assistant is "any platform" and drawn as such.
 */
export function RiskScene({
  cue,
  progress,
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly progress: number
  readonly still: boolean
}): ReactNode {
  const p = still ? 1 : progress

  if (cue.scene === 'question') {
    return (
      <div className="bg-brand-deep text-brand-deep-foreground flex h-full w-full items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <Arrive order={0} still={still}>
            <span className="block size-24 sm:size-32 xl:size-40">
              <BazMark title="Baz" breathing={!still} />
            </span>
          </Arrive>
          <Arrive order={1} still={still}>
            <h2 className="mt-8 max-w-[16ch] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
              {cue.presenter?.title}
            </h2>
          </Arrive>
          <Arrive order={4} still={still}>
            <p className="mx-auto mt-8 max-w-[40ch] text-lg text-pretty opacity-70 sm:text-2xl">
              {cue.presenter?.body}
            </p>
          </Arrive>
        </div>
      </div>
    )
  }

  return (
    <ChapterStage cueId={cue.id} presenter={cue.presenter} designWidth={896} maxScale={1.35} still={still}>
      <Picture scene={cue.scene} p={p} still={still} />
    </ChapterStage>
  )
}

function Picture({
  scene,
  p,
  still,
}: {
  readonly scene: Exclude<Scene, 'question'>
  readonly p: number
  readonly still: boolean
}): ReactNode {
  switch (scene) {
    case 'compress':
      return <Compress p={p} still={still} />
    case 'assistant':
      return <Assistant p={p} still={still} />
    case 'ownership':
      return <Ownership p={p} still={still} />
    case 'paths':
      return <Paths p={p} still={still} />
  }
}

/** The opening's three journeys again, so the room sees the same products it was shown first. */
const PRODUCTS = [
  { icon: <HomeIcon />, label: 'Mortgages' },
  { icon: <WalletIcon />, label: 'Accounts' },
  { icon: <PiggyBankIcon />, label: 'Savings' },
] as const

/** The conversation, zooming back until it is one surface in a wider financial environment. */
function Compress({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const zoom = settle(p)
  return (
    <div className="relative grid w-full max-w-3xl place-items-center">
      <div
        className="absolute inset-x-0 top-0 mx-auto grid max-w-xl grid-cols-3 items-start gap-4 pt-2"
        style={{ opacity: Math.min(Math.max((p - 0.35) / 0.4, 0), 1) }}
      >
        {PRODUCTS.map((product) => (
          <Node key={product.label} icon={product.icon} label={product.label} tone="deep" />
        ))}
      </div>

      <div
        className="bg-background relative mt-28 w-[300px] rounded-[2.25rem] border-[8px] border-foreground/90 p-3 shadow-2xl"
        style={{ transform: `scale(${String(1 - 0.32 * zoom)})`, transformOrigin: 'center 30%' }}
      >
        <div className="flex items-center gap-2 border-b pb-2">
          <BazWordmark className="h-4" />
        </div>
        <div className="space-y-2 py-3 [&_div]:text-[12px] [&_div]:leading-snug">
          <ChatBubble author="customer" showAvatar={false}>
            {showcaseConfig.examplePrompt}
          </ChatBubble>
          <ChatBubble author="baz" showAvatar={false}>
            <MessageText text="Your Advantage Fixed Term Deposit Account is open and the €32,000 from AIB has arrived. When the deposit reaches €40,000 I will come back to you about the mortgage." />
          </ChatBubble>
        </div>
      </div>

      <Arrive order={2} still={still}>
        <p className="text-muted-foreground mt-6 text-center text-sm" style={{ opacity: Math.min(Math.max((p - 0.6) / 0.3, 0), 1) }}>
          One interaction surface. The question is where it sits.
        </p>
      </Arrive>
    </div>
  )
}

/** The asks, in the narrator's order and at the words that name them (10.5, 11.7, 12.8 and 14.1 s of a 13.6 s cue from 5.7 s). */
const ASKS = [
  { text: 'Compare mortgages', at: 0.35 },
  { text: 'Manage savings', at: 0.44 },
  { text: 'Arrange protection', at: 0.52 },
  { text: 'Plan ahead', at: 0.62 },
] as const

/**
 * Customer, assistant, and the two ways in. The assistant reaches accounts and payments
 * through the access PSD2 already makes banks provide, and everything else through the
 * bank's own public application journeys. Neither route needs the bank's permission.
 */
function Assistant({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  /** "won't necessarily belong to banks", at 16.7 s. */
  const notABank = settle((p - 0.8) / 0.1)
  return (
    <div className="grid w-full max-w-4xl grid-cols-[auto_minmax(88px,1fr)_auto_minmax(150px,1.2fr)_minmax(0,17rem)] grid-rows-2 items-center gap-y-5">
      <Arrive order={0} still={still} className="row-span-2 justify-self-center pr-2">
        <Node icon={<UserIcon />} label="Customer" size="lg" tone="deep" />
      </Arrive>

      <div className="row-span-2 px-3">
        <Arrow draw={p / 0.22} label="Asks first" />
      </div>

      <Arrive order={1} still={still} className="row-span-2">
        <Surface
          lift
          className={cn('w-[248px] p-5 transition-shadow', p > 0.22 && 'ring-primary/40 ring-2 ring-offset-2')}
        >
          <Node icon={<BotIcon />} label="Personal AI assistant" detail="Any platform" size="lg" />
          <div className="mt-4 space-y-1.5">
            {ASKS.map((ask) => {
              const r = settle((ask.at < p ? p - ask.at : -1) / 0.08)
              return (
                <div
                  key={ask.text}
                  className="bg-primary text-primary-foreground ml-auto w-fit rounded-2xl rounded-br-sm px-3 py-1.5 text-[12.5px]"
                  style={{ opacity: r, transform: `translateY(${String(6 * (1 - r))}px)` }}
                >
                  {ask.text}
                </div>
              )
            })}
          </div>
          <p
            className="text-muted-foreground mt-4 border-t pt-3 text-center text-[12.5px] font-medium"
            style={{ opacity: notABank }}
          >
            Not necessarily a bank’s.
          </p>
        </Surface>
      </Arrive>

      <Arrow draw={(p - 0.3) / 0.3} label="PSD2 open banking" detail="Consented access, a legal duty since 2018" className="px-3" />
      <Arrive order={2} still={still}>
        <Surface className="p-4">
          <div className="flex items-center gap-2.5">
            <Tile tone="deep" size="sm">
              <WalletIcon />
            </Tile>
            <p className="text-[15px] font-semibold">Accounts and payments</p>
          </div>
          <p className="text-muted-foreground mt-2 text-[12.5px] leading-snug">
            Balances, transactions and payments at every bank the customer uses.
          </p>
        </Surface>
      </Arrive>

      <Arrow draw={(p - 0.4) / 0.3} label="Public journeys" detail="A web form needs no API" className="px-3" />
      <Arrive order={3} still={still}>
        <Surface className="p-4">
          <div className="flex items-center gap-1.5">
            <Tile tone="deep" size="sm">
              <HomeIcon />
            </Tile>
            <Tile tone="deep" size="sm">
              <PiggyBankIcon />
            </Tile>
            <Tile tone="deep" size="sm">
              <ShieldIcon />
            </Tile>
            <p className="ml-1 text-[15px] font-semibold">Everything else</p>
          </div>
          <p className="text-muted-foreground mt-2 text-[12.5px] leading-snug">
            Mortgages, savings, protection: any provider’s own application, filled in on the customer’s behalf.
          </p>
        </Surface>
      </Arrive>
    </div>
  )
}

/** Customer → assistant → bank, with the conversational layer pulled apart from the regulated one. */
function Ownership({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const split = settle(Math.max((p - 0.3) / 0.5, 0))
  return (
    <div className="grid w-full max-w-3xl grid-cols-[auto_5rem_auto_5rem_auto] items-start justify-center py-4">
      <Arrive order={0} still={still} className="justify-self-center pt-9">
        <Node icon={<UserIcon />} label="Customer" size="lg" tone="deep" />
      </Arrive>

      <Arrow draw={p / 0.3} className="px-2 pt-[70px]" />

      <Arrive order={1} still={still} className="justify-self-center">
        <Layer label="Conversation layer" tone="primary" strength={split}>
          <Node icon={<BotIcon />} label="AI assistant" detail="Whoever the customer talks to" size="lg" />
          <ul className="mt-3 space-y-1 text-center text-[12.5px]">
            {['Context', 'Relationship', 'Pricing power'].map((item) => (
              <li key={item} className="text-primary font-medium" style={{ opacity: 0.5 + 0.5 * split }}>
                {item}
              </li>
            ))}
          </ul>
        </Layer>
      </Arrive>

      <Arrow draw={(p - 0.15) / 0.3} className="px-2 pt-[70px]" />

      <Arrive order={2} still={still} className="justify-self-center">
        <Layer label="Regulated products" tone="muted" strength={split}>
          <Node icon={<LandmarkIcon />} label="Bank" detail="Products, infrastructure, risk" size="lg" tone="deep" />
          <ul className="text-muted-foreground mt-3 space-y-1 text-center text-[12.5px]">
            {['Products', 'Infrastructure', 'Balance sheet'].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Layer>
      </Arrive>
    </div>
  )
}

function Layer({
  label,
  tone,
  strength,
  children,
}: {
  readonly label: string
  readonly tone: 'primary' | 'muted'
  readonly strength: number
  readonly children: ReactNode
}): ReactNode {
  return (
    <div
      className={cn(
        'rounded-2xl border px-5 pt-3 pb-5 transition-colors',
        tone === 'primary' ? 'border-primary/30 bg-primary/5' : 'bg-card',
      )}
      style={{ borderColor: tone === 'primary' ? `color-mix(in oklch, var(--primary) ${String(20 + 40 * strength)}%, transparent)` : undefined }}
    >
      <p
        className={cn(
          'mb-3 text-center text-[10.5px] font-semibold tracking-[0.12em] uppercase',
          tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
        )}
        style={{ opacity: 0.4 + 0.6 * strength }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

/** Two responses: a direct relationship, and secure access for assistants the customer chose. */
function Paths({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-2 gap-5">
        <Arrive order={0} still={still}>
          <Surface lift className="h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-baz-primary size-9">
                <BazMark />
              </span>
              <Claim kind="poc" />
            </div>
            <p className="mt-4 text-lg font-bold tracking-tight">A direct Baz relationship</p>
            <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-relaxed">
              The bank’s own assistant, on its own journeys. What you just watched.
            </p>
          </Surface>
        </Arrive>
        <Arrive order={2} still={still}>
          <Surface lift className="h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="bg-muted text-foreground grid size-9 place-items-center rounded-lg">
                <LockIcon className="size-4" />
              </span>
              <Claim kind="production" />
            </div>
            <p className="mt-4 text-lg font-bold tracking-tight">Secure access for other assistants</p>
            <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-relaxed">
              Baz is already an MCP server: any assistant can call it, every guardrail unchanged.
            </p>
          </Surface>
        </Arrive>
      </div>

      <Bus columns={2} direction="gather" draw={(p - 0.25) / 0.5} className="mt-2" />

      <Arrive order={4} still={still} className="flex justify-center pt-2">
        <Node icon={<LandmarkIcon />} label="The bank’s capabilities" detail="Either way, regulated and the bank’s" tone="deep" />
      </Arrive>
    </div>
  )
}
