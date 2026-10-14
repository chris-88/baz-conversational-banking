import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  CalculatorIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  FileJsonIcon,
  MessageSquareIcon,
  PiggyBankIcon,
  SendIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  WalletIcon,
} from 'lucide-react'
import { discovery as copy } from '@/content/how-it-works/copy'
import { channels } from '@/content/how-it-works/architecture'
import {
  calculations,
  definitionExtract,
  forms,
  generated,
  workedExample,
  type Mapping,
} from '@/content/how-it-works/forms'
import {
  Claim,
  Code,
  Reveal,
  SectionHead,
  StepBadge,
  Surface,
  Tile,
} from './parts'
import { cn } from '@/lib/utils'

/**
 * The technical centre of the page.
 *
 * The claim is that the bank already publishes its product journeys in a form a machine can
 * read, and that Baz is another renderer of the same document rather than an imitation of it.
 * Prose can assert that. What demonstrates it is highlighting a phrase in a sentence somebody
 * said and watching the field and the wire entry light up with it.
 */
export function Discovery(): ReactNode {
  const [lit, setLit] = useState<Mapping['id'] | null>(null)

  return (
    <section id="discovery" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <WorkedExample lit={lit} onLight={setLit} />

      <p className="text-muted-foreground mt-5 max-w-[62ch] text-[14px] leading-relaxed">
        {copy.afterExample}
      </p>

      <JourneyCards />
      <Calculations />
      <Channels />
    </section>
  )
}

/**
 * Conversation, definition, submission, with one highlight running through all three.
 *
 * Hover and focus both work, and so does tapping, because the spec is explicit that nothing on
 * this page may be hover-only. The highlight is a shared id rather than three coordinated
 * animations: one piece of state, three readers.
 */
function WorkedExample({
  lit,
  onLight,
}: {
  readonly lit: Mapping['id'] | null
  readonly onLight: (id: Mapping['id'] | null) => void
}): ReactNode {
  const mapping = workedExample.mappings.find((candidate) => candidate.id === lit) ?? null

  return (
    <div className="mt-7">
      <div className="grid gap-3 lg:grid-cols-3">
        {/* 1. What somebody said. */}
        <Panel
          step={1}
          title="Conversation"
          subtitle="Plain language, their words"
          icon={<MessageSquareIcon />}
        >
          <p className="bg-primary text-primary-foreground ml-auto w-fit rounded-2xl rounded-br-sm px-3 py-2 text-sm leading-relaxed">
            <Sentence lit={lit} onLight={onLight} />
          </p>
          <p className="bg-muted mt-2 w-fit rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed">
            A car loan, then. Before I can show you what it would cost, I need a couple of
            things: how long you would like to pay it back over, and what you take home a month.
          </p>
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Tap a highlighted phrase to follow it through the other two panels.
          </p>
        </Panel>

        {/* 2. The bank's own document. */}
        <Panel
          step={2}
          title="Journey definition"
          subtitle="GET /api/forms/1940"
          icon={<FileJsonIcon />}
        >
          <div className="bg-muted/50 max-h-60 overflow-auto rounded-lg">
            <Code text={definitionExtract} language="json" className="p-3" />
          </div>
          {mapping !== null && (
            <div className="border-primary/40 bg-primary/5 mt-3 rounded-lg border p-3">
              <p className="text-primary font-mono text-[11px] font-medium">
                field {mapping.fieldId} · {mapping.fieldType}
              </p>
              <p className="mt-1 text-[12.5px] font-medium">{mapping.fieldLabel}</p>
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                toscana: {mapping.toscana}
              </p>
            </div>
          )}
        </Panel>

        {/* 3. What would be sent. */}
        <Panel
          step={3}
          title="Submission contract"
          subtitle="POST /api/forms/1940"
          icon={<SendIcon />}
        >
          <div className="space-y-1.5">
            {workedExample.mappings.flatMap((candidate) =>
              candidate.entries.map((entry) => (
                <code
                  key={entry.key}
                  className={cn(
                    'block rounded-md px-2.5 py-1.5 font-mono text-[11.5px] transition-colors',
                    lit === candidate.id
                      ? 'bg-primary/10 ring-primary/30 ring-1'
                      : 'bg-muted/50',
                  )}
                >
                  <span className="text-code-key">{entry.key}</span>
                  <span className="text-muted-foreground"> = </span>
                  <span className="text-code-string">&quot;{entry.value}&quot;</span>
                </code>
              )),
            )}
          </div>
          <div className="mt-3.5 flex items-start gap-2 border-t pt-3">
            <Claim kind="poc" />
            <p className="text-muted-foreground text-[11px] leading-snug">
              Generated for inspection. Nothing is ever sent there.
            </p>
          </div>
        </Panel>
      </div>

      {mapping !== null && (
        <Reveal className="mt-3">
          <p className="text-muted-foreground border-primary/40 border-l-2 pl-4 text-[13.5px] leading-relaxed">
            {mapping.note}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** The customer's sentence, with the mappable phrases as controls. */
function Sentence({
  lit,
  onLight,
}: {
  readonly lit: Mapping['id'] | null
  readonly onLight: (id: Mapping['id'] | null) => void
}): ReactNode {
  const amount = workedExample.mappings.find((candidate) => candidate.id === 'amount')
  const purpose = workedExample.mappings.find((candidate) => candidate.id === 'purpose')
  if (!amount || !purpose) return null

  const phrase = (mapping: Mapping): ReactNode => (
    <button
      type="button"
      onMouseEnter={() => {
        onLight(mapping.id)
      }}
      onFocus={() => {
        onLight(mapping.id)
      }}
      onClick={() => {
        onLight(lit === mapping.id ? null : mapping.id)
      }}
      className={cn(
        'focus-visible:ring-ring -mx-0.5 rounded px-0.5 underline decoration-dotted underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none',
        lit === mapping.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
      )}
    >
      {mapping.phrase}
    </button>
  )

  return (
    <>
      I need {phrase(amount)} {phrase(purpose)}.
    </>
  )
}

function Panel({
  step,
  title,
  subtitle,
  icon,
  children,
}: {
  readonly step: number
  readonly title: string
  readonly subtitle: string
  readonly icon: ReactNode
  readonly children: ReactNode
}): ReactNode {
  return (
    <Surface lift className="flex min-w-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <StepBadge n={step} />
        <Tile tone="primary" size="sm">
          {icon}
        </Tile>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold">{title}</p>
          <p className="text-muted-foreground truncate font-mono text-[11px]">{subtitle}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 p-4">{children}</div>
    </Surface>
  )
}

/** The two journeys, with the counts that belong to each kept apart. */
function JourneyCards(): ReactNode {
  const [open, setOpen] = useState<string | null>(null)
  const icons = [PiggyBankIcon, WalletIcon]
  const tones = ['savings', 'loan'] as const

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold tracking-tight">Real journeys, real complexity</h3>
      <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-relaxed">
        Two products, read from the same platform. The loan is the harder one: it describes
        calculations and an eligibility verdict as well as questions.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {forms.map((form, index) => {
          const Icon = icons[index] ?? PiggyBankIcon
          return (
            <Reveal key={form.id} delay={index * 0.06}>
              <Surface lift className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Tile tone={tones[index] ?? 'primary'}>
                      <Icon />
                    </Tile>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold">{form.name}</h4>
                      <p className="text-muted-foreground truncate font-mono text-[11px]">
                        {form.version}
                      </p>
                    </div>
                  </div>
                  <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px]">
                    {form.id}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  {(
                    [
                      ['Objects in the definition', form.fieldCount],
                      ['Entries in the capture', form.capturedEntries],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-3">
                      <dd className="text-xl font-bold tracking-tight tabular-nums">{value}</dd>
                      <dt className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
                        {label}
                      </dt>
                    </div>
                  ))}
                </dl>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {form.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="bg-card flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]"
                    >
                      <CheckCircle2Icon aria-hidden className="text-success size-3" />
                      {capability}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(open === form.id ? null : form.id)
                  }}
                  className="text-primary focus-visible:ring-ring mt-4 self-start rounded text-[12.5px] font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  {open === form.id ? 'Hide detail' : 'Inspect journey'}
                </button>

                {open === form.id && (
                  <div className="text-muted-foreground mt-3 space-y-2 border-t pt-3 text-[12.5px] leading-relaxed">
                    <p>{form.capturedBasis}.</p>
                    <p>
                      The capture is what a browser sent when a person completed the genuine
                      journey. It is not what Baz produced.
                    </p>
                    {form.id === generated.formId && (
                      <p className="text-foreground bg-primary/5 rounded-lg p-3">
                        On a live case holding twenty facts, Baz had{' '}
                        <strong className="font-semibold">{generated.collected}</strong> answers
                        filled in, <strong className="font-semibold">{generated.outstanding}</strong>{' '}
                        questions left, and generated a{' '}
                        <strong className="font-semibold">{generated.entries}-entry</strong> packet
                        marked {generated.status}.
                      </p>
                    )}
                  </div>
                )}
              </Surface>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The fidelity scale, which is the honest part.
 *
 * The loan form describes decision machinery. Some of it is arithmetic anybody can do from
 * published numbers; one of it is a credit decision made by systems nobody here has seen. The
 * page shows all four and says which is which, because that distinction is the difference
 * between a demonstration and a claim.
 */
function Calculations(): ReactNode {
  const look: Readonly<
    Record<string, { readonly label: string; readonly tone: string; readonly icon: ReactNode }>
  > = {
    source_faithful: {
      label: 'computed here',
      tone: 'bg-success/10 text-success',
      icon: <CheckCircle2Icon />,
    },
    fixture: {
      label: 'stand-in',
      tone: 'bg-warning-border/30 text-warning-foreground',
      icon: <TriangleAlertIcon />,
    },
    unsupported: {
      label: 'cannot be computed',
      tone: 'bg-muted text-muted-foreground',
      icon: <CircleSlashIcon />,
    },
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold tracking-tight">
        What the form decides, and what we may decide
      </h3>
      <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-relaxed">
        Four calculating controls, and they are not the same kind of thing. Treating them as if
        they were is how an assistant ends up inventing a lending decision.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {calculations.map((calculation, index) => {
          const style = look[calculation.fidelity]
          return (
            <Reveal key={calculation.fieldId} delay={index * 0.04}>
              <Surface className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Tile
                      tone={
                        calculation.fidelity === 'source_faithful'
                          ? 'success'
                          : calculation.fidelity === 'fixture'
                            ? 'warning'
                            : 'primary'
                      }
                      size="sm"
                    >
                      <CalculatorIcon />
                    </Tile>
                    <p className="text-[14px] font-semibold">{calculation.label}</p>
                  </div>
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase [&>svg]:size-3',
                      style?.tone,
                    )}
                  >
                    {style?.icon}
                    {style?.label}
                  </span>
                </div>

                <p className="mt-3 text-lg font-bold tracking-tight tabular-nums">
                  {calculation.result}
                </p>
                <p className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">
                  {calculation.why}
                </p>
              </Surface>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

/** One definition, three renderers, with the third honestly labelled. */
function Channels(): ReactNode {
  const still = useReducedMotion() === true
  const icons = [SmartphoneIcon, SmartphoneIcon, MessageSquareIcon]

  return (
    <Reveal className="mt-12">
      <h3 className="text-xl font-bold tracking-tight">One digital journey, several channels</h3>

      <div className="mt-5">
        <Surface lift className="mx-auto max-w-sm p-5 text-center">
          <div className="flex justify-center">
            <Tile tone="deep">
              <FileJsonIcon />
            </Tile>
          </div>
          <p className="mt-3 text-[15px] font-semibold">{channels.source}</p>
          <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
            {channels.sourceDetail}
          </p>
        </Surface>

        <div aria-hidden className="bg-border mx-auto h-8 w-px" />

        <div className="grid gap-3 sm:grid-cols-3">
          {channels.renderers.map((renderer, index) => {
            const Icon = icons[index] ?? MessageSquareIcon
            const isBaz = renderer.status === 'POC'
            return (
              <motion.div
                key={renderer.name}
                {...(still
                  ? {}
                  : {
                      initial: { opacity: 0, y: 10 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.35, delay: index * 0.12 },
                    })}
              >
                <Surface
                  className={cn('h-full p-4', isBaz && 'border-primary/40 bg-primary/[0.03]')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Tile tone={isBaz ? 'primary' : 'deep'} size="sm">
                        <Icon />
                      </Tile>
                      <p className="text-[14px] font-semibold">{renderer.name}</p>
                    </div>
                    <Claim kind={isBaz ? 'poc' : 'production'} />
                  </div>
                  <p className="text-muted-foreground mt-2.5 text-[12.5px] leading-relaxed">
                    {renderer.detail}
                  </p>
                </Surface>
              </motion.div>
            )
          })}
        </div>

        <p className="text-muted-foreground mt-5 text-center text-[14px]">{channels.caption}</p>
      </div>
    </Reveal>
  )
}
