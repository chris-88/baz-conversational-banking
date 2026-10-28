import type { ReactNode } from 'react'
import {
  BabyIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HomeIcon,
  LandmarkIcon,
  LightbulbIcon,
  LinkIcon,
  SearchIcon,
  ShieldIcon,
  TableIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import type { OpportunityScene as Scene, ShowcaseCue } from '@/content/showcase/types'
import { showcaseConfig } from '@/content/showcase/config'
import { ChatBubble } from '@/baz/ChatBubble'
import { MessageText } from '@/baz/MessageText'
import { BazMark } from '@/baz/BazMark'
import { BazWordmark } from '@/baz/BazWordmark'
import { Surface, Tile } from '@/components/Primitives'
import { PresenterPanel } from './PresenterPanel'
import { Arrive, Chip, JourneyCard, Link, Node, Visual, Wires } from './scene-parts'
import { settle } from './ease'

/**
 * The first sixty seconds, drawn.
 *
 * Text-led, from the product's own parts: life events as tiles, journeys as cards that drift
 * apart, one message in the customer's bubble, Baz's three verbs, and the capability layer
 * the bank already owns. Nothing here was processed by a model and the last frame says so.
 */
export function OpportunityScene({
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
  readonly scene: Scene
  readonly p: number
  readonly still: boolean
}): ReactNode {
  switch (scene) {
    case 'headline':
      return <LifeEvents still={still} />
    case 'fragments':
      return <Fragments p={p} still={still} />
    case 'question':
      return <OneMessage p={p} still={still} />
    case 'meet':
      return <MeetBaz p={p} still={still} />
    case 'capability':
      return <Capabilities p={p} still={still} />
  }
}

const EVENTS = [
  { icon: <HeartIcon />, label: 'Marriage', detail: 'Married in the spring' },
  { icon: <BabyIcon />, label: 'Family', detail: 'A baby in August' },
  { icon: <HomeIcon />, label: 'First home', detail: 'Renting, and want to buy' },
] as const

function LifeEvents({ still }: { readonly still: boolean }): ReactNode {
  return (
    <div className="grid w-full max-w-3xl grid-cols-3 gap-5">
      {EVENTS.map((event, index) => (
        <Arrive key={event.label} order={index * 2} still={still}>
          <Surface lift className="flex aspect-[4/5] flex-col justify-end p-5">
            <Tile size="md">{event.icon}</Tile>
            <p className="mt-4 text-xl font-bold tracking-tight">{event.label}</p>
            <p className="text-muted-foreground mt-1 text-[13.5px]">{event.detail}</p>
          </Surface>
        </Arrive>
      ))}
    </div>
  )
}

const JOURNEYS = [
  {
    icon: <HomeIcon />,
    title: 'Mortgage',
    steps: ['Application', 'Affordability', 'Documents', 'Assessment'],
    tone: 'primary',
  },
  {
    icon: <WalletIcon />,
    title: 'Accounts',
    steps: ['Identity', 'Account setup', 'Features', 'Confirmation'],
    tone: 'deep',
  },
  {
    icon: <ShieldIcon />,
    title: 'Protection',
    steps: ['Health questions', 'Cover options', 'Underwriting', 'Confirmation'],
    tone: 'success',
  },
] as const

const REPEATED = ['Name', 'Address', 'Income']

/** Three journeys, drifting apart as the narrator says "separate", each asking the same facts. */
function Fragments({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const spread = settle(p)
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <div className="flex items-start justify-center gap-4">
        {JOURNEYS.map((journey, index) => (
          <Arrive key={journey.title} order={index} still={still}>
            <JourneyCard
              icon={journey.icon}
              title={journey.title}
              steps={journey.steps}
              tone={journey.tone}
              style={{
                transform: `translateX(${String((index - 1) * 28 * spread)}px) translateY(${String(Math.abs(index - 1) * 14 * spread)}px)`,
              }}
            />
          </Arrive>
        ))}
      </div>
      <Arrive order={4} still={still} className="w-full">
        <div
          className="grid grid-cols-3 gap-4 transition-opacity"
          style={{ opacity: Math.min(Math.max((p - 0.45) / 0.3, 0), 1) }}
        >
          {JOURNEYS.map((journey) => (
            <div key={journey.title} className="flex flex-wrap justify-center gap-1.5">
              {REPEATED.map((fact) => (
                <Chip key={fact} tone="muted" className="text-[11.5px]">
                  {fact}
                </Chip>
              ))}
            </div>
          ))}
        </div>
      </Arrive>
      <Arrive order={6} still={still}>
        <p
          className="text-muted-foreground text-center text-sm"
          style={{ opacity: Math.min(Math.max((p - 0.6) / 0.3, 0), 1) }}
        >
          The same facts, typed three times.
        </p>
      </Arrive>
    </div>
  )
}

/** The journeys recede; one message, in the customer's own words, comes forward. */
function OneMessage({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const recede = settle(Math.min(p / 0.4, 1))
  return (
    <div className="relative flex w-full max-w-3xl flex-col items-center">
      <div
        aria-hidden
        className="flex items-start justify-center gap-4"
        style={{
          opacity: 0.35 * (1 - recede),
          transform: `scale(${String(1 - 0.08 * recede)}) translateY(${String(-24 * recede)}px)`,
        }}
      >
        {JOURNEYS.map((journey) => (
          <JourneyCard key={journey.title} icon={journey.icon} title={journey.title} steps={journey.steps} tone={journey.tone} ghost />
        ))}
      </div>

      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5 px-4">
        <Arrive order={0} still={still} className="w-full max-w-[520px]">
          <div className="[&_div]:text-base [&_div]:leading-relaxed">
            <ChatBubble author="customer">{showcaseConfig.examplePrompt}</ChatBubble>
          </div>
        </Arrive>
        <Arrive order={2} still={still}>
          <div className="flex flex-wrap justify-center gap-2">
            <Chip tone="primary" icon={<HeartIcon />}>Married · spring</Chip>
            <Chip tone="primary" icon={<BabyIcon />}>Baby · August</Chip>
            <Chip tone="primary" icon={<HomeIcon />}>Renting → buying</Chip>
          </div>
        </Arrive>
        <Arrive order={3} still={still}>
          <p className="text-muted-foreground text-center text-sm">
            Everything the bank needs to know is in it.
          </p>
        </Arrive>
      </div>
    </div>
  )
}

const VERBS = [
  { icon: <SearchIcon />, label: 'Discover', detail: 'What this life event involves' },
  { icon: <LightbulbIcon />, label: 'Understand', detail: 'Ask only what it doesn’t know' },
  { icon: <LinkIcon />, label: 'Connect', detail: 'To the products that fit' },
] as const

const NEEDS = ['Mortgage', 'Joint account', 'Protection'] as const

/** Baz's mark, its three verbs, and the needs they find. */
function MeetBaz({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-8">
      <Arrive order={0} still={still}>
        <div className="flex items-center gap-4">
          <span className="text-baz-primary size-16">
            <BazMark title="Baz" />
          </span>
          <BazWordmark className="h-10" />
        </div>
      </Arrive>

      <div className="relative w-full">
        <Wires>
          <Link from={[0.27, 0.24]} to={[0.42, 0.24]} draw={Math.min(p / 0.5, 1)} tone="primary" arrow />
          <Link from={[0.6, 0.24]} to={[0.75, 0.24]} draw={Math.min((p - 0.15) / 0.5, 1)} tone="primary" arrow />
        </Wires>
        <div className="grid grid-cols-3 gap-6">
          {VERBS.map((verb, index) => (
            <Arrive key={verb.label} order={1 + index * 2} still={still}>
              <Node icon={verb.icon} label={verb.label} detail={verb.detail} size="lg" />
            </Arrive>
          ))}
        </div>
      </div>

      <Arrive order={7} still={still}>
        <div className="flex flex-wrap justify-center gap-2" style={{ opacity: Math.min(Math.max((p - 0.55) / 0.3, 0), 1) }}>
          {NEEDS.map((need) => (
            <Chip key={need} tone="primary">
              {need}
            </Chip>
          ))}
        </div>
      </Arrive>
    </div>
  )
}

const CAPABILITIES = [
  { icon: <FileTextIcon />, label: 'Published forms' },
  { icon: <TableIcon />, label: 'Rate tables' },
  { icon: <CreditCardIcon />, label: 'Product journeys' },
  { icon: <UsersIcon />, label: 'Identity' },
  { icon: <LandmarkIcon />, label: 'Rules and controls' },
] as const

/** The layer underneath, and the conversation settling into a phone for the next chapter. */
function Capabilities({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const phone = settle(Math.max((p - 0.55) / 0.45, 0))
  return (
    <div className="relative flex w-full max-w-3xl flex-col items-center gap-6">
      <div
        className="flex w-full flex-col items-center gap-6"
        style={{ opacity: 1 - 0.85 * phone, transform: `scale(${String(1 - 0.04 * phone)})` }}
      >
      <Arrive order={0} still={still} className="w-full">
        <Surface lift className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-baz-primary size-8">
              <BazMark />
            </span>
            <p className="text-lg font-bold tracking-tight">The conversation</p>
          </div>
          <Chip tone="primary">New</Chip>
        </Surface>
      </Arrive>

      <Arrive order={1} still={still} className="w-full">
        <div className="relative w-full">
          <Wires>
            {CAPABILITIES.map((capability, index) => (
              <Link
                key={capability.label}
                from={[0.5, 0]}
                to={[(index + 0.5) / CAPABILITIES.length, 0.35]}
                draw={Math.min(Math.max((p - index * 0.05) / 0.45, 0), 1)}
                tone="primary"
              />
            ))}
          </Wires>
          <div className="grid grid-cols-5 gap-3 pt-12">
            {CAPABILITIES.map((capability, index) => (
              <Arrive key={capability.label} order={2 + index} still={still}>
                <Surface className="flex flex-col items-center gap-2 px-2 py-4 text-center">
                  <Tile tone="deep" size="sm">
                    {capability.icon}
                  </Tile>
                  <p className="text-[12.5px] font-semibold">{capability.label}</p>
                </Surface>
              </Arrive>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-center text-[12.5px]">
            Already built. Already regulated. Already the bank’s.
          </p>
        </div>
      </Arrive>
      </div>

      {/* The hand-off: the phone the next chapter plays in, arriving over the diagram. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center"
        style={{ opacity: phone, transform: `scale(${String(0.9 + 0.1 * phone)})` }}
      >
        <div className="bg-background w-[300px] rounded-[2.25rem] border-[8px] border-foreground/90 p-3 shadow-2xl">
          <div className="flex items-center gap-2 border-b pb-2">
            <BazWordmark className="h-4" />
          </div>
          <div className="space-y-2 py-3 [&_div]:text-[12px] [&_div]:leading-snug">
            <ChatBubble author="customer" showAvatar={false}>
              {showcaseConfig.examplePrompt}
            </ChatBubble>
            <ChatBubble author="baz" showAvatar={false}>
              <MessageText text="Congratulations. Let’s start with what is going on, not with a product." />
            </ChatBubble>
          </div>
        </div>
      </div>
    </div>
  )
}
