import { useState, type ReactNode } from 'react'
import {
  ArrowDownIcon,
  DatabaseIcon,
  LayersIcon,
  ReceiptIcon,
} from 'lucide-react'
import { economics as copy } from '@/content/how-it-works/copy'
import { headline, prefix, simulator, turns } from '@/content/how-it-works/economics'
import { Claim, Reveal, SectionHead, Stat, Surface } from './parts'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * What a turn costs, and where the money actually goes.
 *
 * Every figure carries its measurement, on the page rather than in a comment. The draft this
 * replaces had three of four numbers wrong, and the worst of them was a real statistic attached
 * to the wrong noun, which no amount of proofreading catches.
 */
export function Economics(): ReactNode {
  return (
    <section id="economics" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((item, index) => (
          <Reveal key={item.label} delay={index * 0.05}>
            <Stat
              value={item.value}
              label={item.label}
              basis={item.basis}
              tone={index === 1 ? 'success' : index === 0 ? 'warning' : 'primary'}
              icon={
                [<ReceiptIcon key="r" />, <ArrowDownIcon key="a" />, <LayersIcon key="l" />, <DatabaseIcon key="d" />][
                  index
                ]
              }
            />
          </Reveal>
        ))}
      </div>

      <TurnChart />
      <PrefixBreakdown />
      <Simulator />
    </section>
  )
}

/**
 * The shape of the saving.
 *
 * Turn one writes the whole prefix; every turn after it writes one message. That is a fivefold
 * drop, not a gentle decline, and a chart that smooths it is telling the wrong story about the
 * right system. The bars are proportional to cost so the cliff is the first thing seen.
 */
function TurnChart(): ReactNode {
  const most = Math.max(...turns.map((turn) => turn.cost))

  return (
    <Reveal className="mt-10">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold tracking-tight">Where a turn&rsquo;s money goes</h3>
        <Claim kind="measured" />
      </div>
      <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-relaxed">
        Three consecutive turns of one live conversation, every figure reported by the API
        itself. The second turn costs a fifth of the first, and the reason is in the cache-write
        column.
      </p>

      <div className="mt-4 space-y-3">
        {turns.map((turn) => (
          <Surface key={turn.turn} lift={turn.turn === 1} className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[14px] font-semibold">
                Turn {turn.turn}
                <span className="text-muted-foreground ml-2 font-normal">{turn.what}</span>
              </p>
              <p className="text-xl font-bold tabular-nums">€{turn.cost.toFixed(3)}</p>
            </div>

            <div
              className="bg-muted mt-3 h-2.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`Turn ${String(turn.turn)} cost €${turn.cost.toFixed(3)}`}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-700',
                  turn.turn === 1 ? 'bg-primary' : 'bg-success',
                )}
                style={{ width: `${String(Math.round((turn.cost / most) * 100))}%` }}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
              {(
                [
                  ['Cache write', turn.cacheWrite],
                  ['Cache read', turn.cacheRead],
                  ['New input', turn.uncachedInput],
                  ['Output', turn.output],
                  ['Gate', turn.gate],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground text-[11px]">{label}</dt>
                  <dd
                    className={cn(
                      'font-mono text-[12.5px] tabular-nums',
                      label === 'Cache write' && turn.turn > 1 && 'text-success font-bold',
                    )}
                  >
                    {value.toLocaleString('en-IE')}
                  </dd>
                </div>
              ))}
            </dl>
          </Surface>
        ))}
      </div>
    </Reveal>
  )
}

/** What the cached prefix is made of, which is where the obvious optimisation went wrong. */
function PrefixBreakdown(): ReactNode {
  const total = prefix.reduce((sum, section) => sum + section.tokens, 0)

  return (
    <Reveal className="mt-10">
      <h3 className="text-xl font-bold tracking-tight">What sits in the cached prefix</h3>
      <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-relaxed">
        The product catalogue is the biggest thing in it, and cutting it saved far less than
        expected: it is read from cache, and cache reads are cheap. The tool schemas were the
        surprise, at 18% and invisible in any billing breakdown.
      </p>

      <Surface className="mt-5 p-5">
        <ul className="space-y-2">
          {prefix.map((section, index) => (
            <li key={section.section} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[12.5px] sm:w-48">{section.section}</span>
              <span className="bg-muted h-5 flex-1 overflow-hidden rounded-md">
                <span
                  className={cn(
                    'block h-full rounded-md',
                    index === 0 ? 'bg-primary' : index === 1 ? 'bg-decides-model' : 'bg-primary/35',
                  )}
                  style={{ width: `${String(Math.round((section.tokens / total) * 100))}%` }}
                />
              </span>
              <span className="text-muted-foreground w-14 shrink-0 text-right font-mono text-[12px] tabular-nums">
                {section.tokens.toLocaleString('en-IE')}
              </span>
            </li>
          ))}
        </ul>
      </Surface>
    </Reveal>
  )
}

/**
 * Arithmetic, labelled as arithmetic.
 *
 * A measured cost per conversation multiplied by a number somebody typed. That is useful for
 * getting an order of magnitude and it is not a forecast, so it says so rather than being
 * dressed as a commercial model.
 */
function Simulator(): ReactNode {
  const [customers, setCustomers] = useState<number>(simulator.defaultCustomers)
  const [each, setEach] = useState<number>(simulator.defaultConversationsPerCustomer)

  const conversations = Math.max(0, customers) * Math.max(0, each)
  const cost = conversations * simulator.costPerConversation

  const fields = [
    { id: 'customers', label: 'Customers a month', value: customers, set: setCustomers },
    { id: 'each', label: 'Conversations each', value: each, set: setEach },
  ] as const

  return (
    <Reveal className="mt-10">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold tracking-tight">What that means at scale</h3>
        <Claim kind="illustrative" />
      </div>
      <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-relaxed">
        A measured {simulator.basis} multiplied out. Nothing here accounts for the people, the
        infrastructure or the half of conversations that never reach a model, so treat it as an
        order of magnitude rather than a budget.
      </p>

      <Surface className="mt-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id}>
              <Label htmlFor={field.id} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={field.id}
                type="number"
                min={0}
                inputMode="numeric"
                value={field.value}
                onChange={(event) => {
                  field.set(Number(event.target.value))
                }}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>

        <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
          {(
            [
              ['Conversations', conversations.toLocaleString('en-IE'), false],
              [
                `Turns, at ${String(simulator.defaultTurns)} each`,
                (conversations * simulator.defaultTurns).toLocaleString('en-IE'),
                false,
              ],
              [
                'Indicative model cost',
                `€${cost.toLocaleString('en-IE', { maximumFractionDigits: 0 })}`,
                true,
              ],
            ] as const
          ).map(([label, value, headline]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-[12px]">{label}</dt>
              <dd
                className={cn(
                  'mt-1 text-2xl font-bold tracking-tight tabular-nums',
                  headline && 'text-primary',
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Surface>
    </Reveal>
  )
}
