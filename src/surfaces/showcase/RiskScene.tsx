import type { ReactNode } from 'react'
import {
  BotIcon,
  ChevronRightIcon,
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
import { PresenterPanel } from './PresenterPanel'
import { Arrive, Link, Node, Visual, Wires } from './scene-parts'
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
  position,
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly progress: number
  readonly position: { readonly index: number; readonly total: number }
  readonly still: boolean
}): ReactNode {
  const p = still ? 1 : progress

  if (cue.scene === 'question') {
    return (
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-center px-6 py-8">
        <Visual cueId={cue.id} still={still} className="min-h-[60vh] lg:min-h-0">
          <div className="text-center">
            <Arrive order={0} still={still}>
              <h2 className="max-w-[16ch] text-[3rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
                {cue.presenter?.title}
              </h2>
            </Arrive>
            <Arrive order={3} still={still}>
              <p className="text-muted-foreground mx-auto mt-8 max-w-[40ch] text-lg text-pretty sm:text-2xl">
                {cue.presenter?.body}
              </p>
            </Arrive>
          </div>
        </Visual>
      </div>
    )
  }

  return (
    <div className="mx-auto grid h-full max-w-[1600px] grid-rows-[auto_auto] items-center gap-8 overflow-y-auto px-6 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:overflow-hidden lg:gap-16 lg:py-8">
      <PresenterPanel
        presenter={cue.presenter}
        cueId={cue.id}
        index={position.index}
        total={position.total}
        still={still}
        size="lg"
      />
      <Visual cueId={cue.id} still={still} className="min-h-[60vh] lg:min-h-0">
        <Picture scene={cue.scene} p={p} still={still} />
      </Visual>
    </div>
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

const PRODUCTS = [
  { icon: <PiggyBankIcon />, label: 'Savings' },
  { icon: <HomeIcon />, label: 'Mortgages' },
  { icon: <ShieldIcon />, label: 'Protection' },
  { icon: <WalletIcon />, label: 'Accounts' },
] as const

/** The conversation, zooming back until it is one surface in a wider financial environment. */
function Compress({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const zoom = settle(p)
  return (
    <div className="relative grid w-full max-w-3xl place-items-center">
      <div
        className="absolute inset-0 grid grid-cols-4 items-start gap-4 pt-2"
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
            <MessageText text="Three applications started. Your salary was used by all of them; nobody will ask for it again." />
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

/** A dashed line drawn left to right as `draw` rises, with what travels along it written above. */
function Connector({
  draw,
  label,
  detail,
  tone = 'muted',
}: {
  readonly draw: number
  readonly label: string
  readonly detail?: string
  readonly tone?: 'muted' | 'primary'
}): ReactNode {
  const d = settle(draw)
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-3" style={{ opacity: 0.2 + 0.8 * d }}>
      <span
        className={cn(
          'mb-1.5 text-center text-[11px] font-semibold tracking-wide uppercase',
          tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <div className="flex w-full items-center">
        <span
          aria-hidden
          className={cn(
            'h-0 flex-1 border-t-2 border-dashed',
            tone === 'primary' ? 'border-primary/60' : 'border-muted-foreground/40',
          )}
          style={{ transform: `scaleX(${String(d)})`, transformOrigin: 'left' }}
        />
        <ChevronRightIcon
          aria-hidden
          className={cn('-ml-1.5 size-4 shrink-0', tone === 'primary' ? 'text-primary/70' : 'text-muted-foreground/60')}
          style={{ opacity: d }}
        />
      </div>
      {detail !== undefined && (
        <span className="text-muted-foreground mt-1.5 max-w-[22ch] text-center text-[11.5px] leading-snug">{detail}</span>
      )}
    </div>
  )
}

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

      <div className="row-span-2">
        <Connector draw={p / 0.22} label="Asks first" tone="primary" />
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

      <Connector
        draw={(p - 0.3) / 0.3}
        label="PSD2 open banking"
        detail="Consented access, a legal duty since 2018"
        tone="primary"
      />
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

      <Connector draw={(p - 0.4) / 0.3} label="Public journeys" detail="A web form needs no API" />
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
    <div className="w-full max-w-3xl">
      <div className="relative">
        <Wires>
          <Link from={[0.22, 0.3]} to={[0.4, 0.3]} draw={Math.min(p / 0.3, 1)} tone="primary" arrow />
          <Link from={[0.6, 0.3]} to={[0.78, 0.3]} draw={Math.min(Math.max((p - 0.15) / 0.3, 0), 1)} arrow />
        </Wires>
        <div className="grid grid-cols-3 items-start gap-4 py-4">
          <Arrive order={0} still={still} className="justify-self-center pt-9">
            <Node icon={<UserIcon />} label="Customer" size="lg" tone="deep" />
          </Arrive>

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
      </div>
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
              The bank’s own assistant, on the bank’s own journeys. What you just watched. Built
              and running.
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
            <p className="mt-4 text-lg font-bold tracking-tight">Secure access through customer-chosen assistants</p>
            <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-relaxed">
              A strategic possibility. Baz already exposes itself as a tool another agent can
              call, with every guardrail unchanged; what a bank would need around that is the
              open question.
            </p>
          </Surface>
        </Arrive>
      </div>

      <div className="relative mt-6 h-16">
        <Wires>
          <Link from={[0.25, 0]} to={[0.5, 0.9]} draw={Math.min(Math.max((p - 0.3) / 0.4, 0), 1)} tone="primary" />
          <Link from={[0.75, 0]} to={[0.5, 0.9]} draw={Math.min(Math.max((p - 0.4) / 0.4, 0), 1)} />
        </Wires>
      </div>
      <Arrive order={4} still={still} className="flex justify-center">
        <Node icon={<LandmarkIcon />} label="The bank’s capabilities" detail="Either way, the products stay regulated and the bank’s" tone="deep" />
      </Arrive>
    </div>
  )
}
