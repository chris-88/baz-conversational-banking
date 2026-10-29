import { Fragment, type ReactNode } from 'react'
import {
  BabyIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HomeIcon,
  LandmarkIcon,
  LightbulbIcon,
  LinkIcon,
  PiggyBankIcon,
  SearchIcon,
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
import { ChapterStage } from './ChapterStage'
import { Arrive, Arrow, Bus, Chip, JourneyCard, Node } from './scene-parts'
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
  still,
}: {
  readonly cue: ShowcaseCue<Scene>
  readonly progress: number
  readonly still: boolean
}): ReactNode {
  const p = still ? 1 : progress

  return (
    <ChapterStage
      cueId={cue.id}
      presenter={cue.presenter}
      designWidth={768}
      maxScale={1.45}
      still={still}
    >
      <Picture scene={cue.scene} p={p} still={still} />
    </ChapterStage>
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
      return <LifeEvents p={p} />
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
  {
    icon: <HeartIcon />,
    label: 'Marriage',
    detail: 'Married in the spring',
    brings: ['Two incomes', 'One household'],
    /** "get married", "have children", "first home": 3.6, 4.7 and 6.4 s of a 7.8 s cue. */
    at: 0.46,
  },
  {
    icon: <BabyIcon />,
    label: 'Family',
    detail: 'A baby in August',
    brings: ['Someone to provide for', 'New costs'],
    at: 0.6,
  },
  {
    icon: <HomeIcon />,
    label: 'First home',
    detail: 'Renting, and want to buy',
    brings: ['A deposit', 'What they can afford'],
    at: 0.82,
  },
] as const

/** Shows at `at` of the cue, rising into place; before that, faint. Progress-driven, so a seek lands it. */
function Reveal({
  at,
  p,
  span = 0.08,
  children,
  className,
}: {
  readonly at: number
  readonly p: number
  readonly span?: number
  readonly children: ReactNode
  readonly className?: string
}): ReactNode {
  const r = settle((p - at) / span)
  return (
    <div
      className={className}
      style={{ opacity: 0.18 + 0.82 * r, transform: `translateY(${String(10 * (1 - r))}px)` }}
    >
      {children}
    </div>
  )
}

/**
 * Three moments in a life, each arriving as the narrator names it. The frames are there from
 * the first word, empty: life, before anyone has put a product name on it.
 */
function LifeEvents({ p }: { readonly p: number }): ReactNode {
  return (
    <div className="grid w-full max-w-3xl grid-cols-3 gap-5">
      {EVENTS.map((event) => (
        <Reveal key={event.label} at={event.at} p={p}>
          <Surface lift className="flex flex-col overflow-hidden">
            <div className="bg-primary/5 relative flex h-36 items-center justify-center overflow-hidden">
              <span
                aria-hidden
                className="text-primary/10 absolute -right-5 -bottom-6 [&>svg]:size-32 [&>svg]:stroke-[1.25]"
              >
                {event.icon}
              </span>
              <span className="bg-card text-primary grid size-16 place-items-center rounded-2xl shadow-xs [&>svg]:size-7">
                {event.icon}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xl font-bold tracking-tight">{event.label}</p>
              <p className="text-muted-foreground mt-1 text-[13.5px]">{event.detail}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {event.brings.map((item) => (
                  <Chip key={item} tone="muted" className="text-[11.5px]">
                    {item}
                  </Chip>
                ))}
              </div>
            </div>
          </Surface>
        </Reveal>
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
    /** "a mortgage", "an account", "savings": 12.0, 12.9 and 13.7 s of a 14.0 s cue from 7.8 s. */
    at: 0.3,
  },
  {
    icon: <WalletIcon />,
    title: 'Accounts',
    steps: ['Identity', 'Account setup', 'Features', 'Confirmation'],
    tone: 'deep',
    at: 0.37,
  },
  {
    icon: <PiggyBankIcon />,
    title: 'Savings',
    steps: ['Account choice', 'Identity', 'Declarations', 'Funding'],
    tone: 'success',
    at: 0.42,
  },
] as const

const REPEATED = ['Name', 'Address', 'Income']

/**
 * The same three moments, and the three journeys the bank turns them into, one per word.
 * The journeys drift apart on "the customer experiences life" and their forms light up with
 * the same three facts on "they need to know the products".
 */
function Fragments({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  const spread = settle((p - 0.52) / 0.2)
  const typed = settle((p - 0.7) / 0.12)
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <Arrive order={0} still={still}>
        <div className="flex flex-wrap justify-center gap-2">
          {EVENTS.map((event) => (
            <Chip key={event.label} tone="primary" icon={event.icon}>
              {event.detail}
            </Chip>
          ))}
        </div>
      </Arrive>
      <div className="flex items-start justify-center gap-4">
        {JOURNEYS.map((journey, index) => (
          <Reveal key={journey.title} at={journey.at} p={p}>
            <JourneyCard
              icon={journey.icon}
              title={journey.title}
              steps={journey.steps}
              fields={REPEATED}
              fieldsOn={typed}
              tone={journey.tone}
              style={{ transform: `translateX(${String((index - 1) * 22 * spread)}px)` }}
            />
          </Reveal>
        ))}
      </div>
      <p className="text-muted-foreground text-center text-sm" style={{ opacity: typed }}>
        One life. Three processes. The same facts, typed three times.
      </p>
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
          <JourneyCard
            key={journey.title}
            icon={journey.icon}
            title={journey.title}
            steps={journey.steps}
            tone={journey.tone}
            ghost
          />
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
            <Chip tone="primary" icon={<HeartIcon />}>
              Married · spring
            </Chip>
            <Chip tone="primary" icon={<BabyIcon />}>
              Baby · August
            </Chip>
            <Chip tone="primary" icon={<HomeIcon />}>
              Renting → buying
            </Chip>
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

const NEEDS = ['Mortgage', 'Joint account', 'Savings'] as const

/** Baz's name, its three verbs with an arrow between each, and the needs they find. */
function MeetBaz({ p, still }: { readonly p: number; readonly still: boolean }): ReactNode {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-10">
      <Arrive order={0} still={still}>
        <BazWordmark className="h-16" />
      </Arrive>

      <div className="grid w-full grid-cols-[1fr_5.5rem_1fr_5.5rem_1fr] items-start">
        {VERBS.map((verb, index) => (
          <Fragment key={verb.label}>
            {index > 0 && <Arrow draw={(p - (index - 1) * 0.15) / 0.4} className="pt-[33px]" />}
            <Arrive order={1 + index * 2} still={still}>
              <Node icon={verb.icon} label={verb.label} detail={verb.detail} size="lg" />
            </Arrive>
          </Fragment>
        ))}
      </div>

      <Arrive order={7} still={still}>
        <div
          className="flex flex-wrap justify-center gap-2"
          style={{ opacity: Math.min(Math.max((p - 0.55) / 0.3, 0), 1) }}
        >
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
        <Arrive order={0} still={still} className="w-2/3">
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

        <Arrive order={1} still={still} className="-mt-6 w-full">
          <div className="w-full">
            <Bus columns={CAPABILITIES.length} direction="spread" draw={p / 0.6} />
            <div className="grid grid-cols-5 gap-3 pt-1">
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
