import type { ReactNode } from 'react'
import {
  BellIcon,
  CheckIcon,
  GaugeIcon,
  LayoutGridIcon,
  MessageSquareIcon,
  MonitorIcon,
  SmartphoneIcon,
} from 'lucide-react'
import { capabilitiesChapter as copy } from '@/content/how-it-works/copy'
import { GROUPS, MEASURED, capabilities, type CapabilityGroup } from '@/content/how-it-works/capabilities'
import { gallery } from '@/content/how-it-works/gallery'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Claim, Reveal, SectionHead, Surface, Tile } from './parts'
import { PersonaProof } from './PersonaProof'
import { GuardrailProof } from './GuardrailProof'
import { GatingTable } from './GatingTable'

const GROUP_ICON: Readonly<Record<CapabilityGroup, ReactNode>> = {
  conversation: <MessageSquareIcon />,
  around: <SmartphoneIcon />,
  bank: <MonitorIcon />,
}

const GROUP_TONE: Readonly<Record<CapabilityGroup, 'primary' | 'success' | 'deep'>> = {
  conversation: 'primary',
  around: 'success',
  bank: 'deep',
}

/**
 * What is built, shown rather than listed where showing is possible.
 *
 * Three grids of tiles, one per audience, each tile labelled POC or a production direction. A
 * gallery of six real cards rendered through `CardRenderer` with every control disabled. Then
 * three proofs built from the product's own code rather than from copy about it: the persona
 * composer, the refusal set and the stage-to-tool table. A reader who trusts none of the
 * sentences can still read those three, because they are the running code.
 */
export function Capabilities(): ReactNode {
  return (
    <section
      id="capabilities"
      className="scroll-mt-[68px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20 lg:scroll-mt-[84px]"
    >
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      {GROUPS.map((group, groupIndex) => (
        <div key={group.id} className={cn('mt-10', groupIndex === 0 && 'mt-8')}>
          <div className="flex items-center gap-3">
            <Tile tone={GROUP_TONE[group.id]}>{GROUP_ICON[group.id]}</Tile>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{group.title}</h3>
              <p className="text-muted-foreground text-[13px]">{group.lede}</p>
            </div>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities
              .filter((capability) => capability.group === group.id)
              .map((capability, index) => (
                <li key={capability.title}>
                  <Reveal delay={Math.min(index, 5) * 0.04} className="h-full">
                    <Surface
                      className={cn(
                        'flex h-full flex-col p-4',
                        capability.claim === 'production' && 'border-dashed bg-transparent shadow-none',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[14px] leading-snug font-semibold text-pretty">{capability.title}</h4>
                        <Claim kind={capability.claim} />
                      </div>
                      <p className="text-muted-foreground mt-2 flex-1 text-[12.5px] leading-relaxed">
                        {capability.body}
                      </p>
                      <p className="text-muted-foreground mt-3 truncate font-mono text-[10px]">{capability.source}</p>
                    </Surface>
                  </Reveal>
                </li>
              ))}
          </ul>
        </div>
      ))}

      <Gallery />

      <div className="mt-12">
        <div className="flex items-center gap-3">
          <Tile tone="code">
            <GaugeIcon />
          </Tile>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Three things you can poke</h3>
            <p className="text-muted-foreground text-[13px]">
              Each one runs the product&rsquo;s own code on this page. Nothing here is a sentence about the code.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-5">
          <Reveal>
            <PersonaProof />
          </Reveal>
          <Reveal>
            <GuardrailProof />
          </Reveal>
          <Reveal>
            <GatingTable />
          </Reveal>
        </div>
      </div>

      <p className="text-muted-foreground mt-8 flex items-start gap-2 text-[12px] leading-relaxed">
        <BellIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Counts measured on {MEASURED.measuredAt}. The ones a test can recompute, the cards, the tools,
          the rate rows, the decision records and the eval cases, are recomputed in the test suite;
          the test count itself is from {MEASURED.tests.basis} on that date.
        </span>
      </p>
    </section>
  )
}

/** Six real cards, one tab each. Every control disabled; nothing can be started from here. */
function Gallery(): ReactNode {
  const first = gallery[0]
  if (first === undefined) return null

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3">
        <Tile tone="primary">
          <LayoutGridIcon />
        </Tile>
        <div>
          <h3 className="text-xl font-bold tracking-tight">Six of the cards, as rendered</h3>
          <p className="text-muted-foreground text-[13px]">
            The same components the conversation uses, with their buttons disabled.
          </p>
        </div>
      </div>

      <Tabs defaultValue={first.id} className="mt-5">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {gallery.map((entry) => (
            <TabsTrigger
              key={entry.id}
              value={entry.id}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full border px-3 py-1 text-[12px] data-[state=active]:shadow-none"
            >
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {gallery.map((entry) => (
          <TabsContent key={entry.id} value={entry.id} className="mt-4">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[390px] lg:mx-0">
                <CardRenderer card={entry.card} actions={{}} disabled />
              </div>
              <Surface className="p-4">
                <div className="flex items-center gap-2">
                  <CheckIcon aria-hidden className="text-success size-3.5" />
                  <p className="text-[13.5px] font-semibold">{entry.label}</p>
                  <Claim kind={entry.claim} />
                </div>
                <p className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">{entry.oneLine}</p>
                <p className="text-muted-foreground mt-3 border-t pt-2.5 font-mono text-[10.5px]">
                  Source: {entry.source}
                </p>
              </Surface>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
