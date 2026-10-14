import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
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
import { Claim, Eyebrow, Prose, Reveal } from './parts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <section id="discovery" className="scroll-mt-20 border-b py-10 sm:py-14">
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {copy.title}
      </h2>
      <Prose className="mt-4">
        {copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Prose>

      <WorkedExample lit={lit} onLight={setLit} />

      <p className="text-muted-foreground mt-4 max-w-[62ch] text-sm leading-relaxed">
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
        <Panel step={1} title="Conversation" subtitle="Plain language, their words">
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
        <Panel step={2} title="Journey definition" subtitle="GET /api/forms/1940">
          <pre className="bg-muted/60 max-h-56 overflow-auto rounded-md p-3 text-[11.5px] leading-relaxed">
            <code>{definitionExtract}</code>
          </pre>
          {mapping !== null && (
            <div className="border-primary/40 bg-primary/5 mt-3 rounded-md border p-3">
              <p className="font-mono text-[11px]">
                field {mapping.fieldId} · {mapping.fieldType}
              </p>
              <p className="mt-1 text-xs font-medium">{mapping.fieldLabel}</p>
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                toscana: {mapping.toscana}
              </p>
            </div>
          )}
        </Panel>

        {/* 3. What would be sent. */}
        <Panel step={3} title="Submission contract" subtitle="POST /api/forms/1940">
          <div className="space-y-1.5">
            {workedExample.mappings.flatMap((candidate) =>
              candidate.entries.map((entry) => (
                <code
                  key={entry.key}
                  className={cn(
                    'block rounded px-2 py-1 font-mono text-[11.5px] transition-colors',
                    lit === candidate.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/60 text-muted-foreground',
                  )}
                >
                  {entry.key} = &quot;{entry.value}&quot;
                </code>
              )),
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Claim kind="poc" />
            <p className="text-muted-foreground text-[11px] leading-snug">
              Generated for inspection. Nothing is ever sent there.
            </p>
          </div>
        </Panel>
      </div>

      {mapping !== null && (
        <Reveal className="mt-3">
          <p className="text-muted-foreground border-primary/40 border-l-2 pl-3 text-sm leading-relaxed">
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
  children,
}: {
  readonly step: number
  readonly title: string
  readonly subtitle: string
  readonly children: ReactNode
}): ReactNode {
  return (
    <Card className="min-w-0 gap-0 p-4">
      <div className="flex items-baseline gap-2">
        <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px]">
          {step}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground truncate font-mono text-[11px]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

/** The two journeys, with the counts that belong to each kept apart. */
function JourneyCards(): ReactNode {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold">Real journeys, real complexity</h3>
      <p className="text-muted-foreground mt-1 max-w-[62ch] text-sm leading-relaxed">
        Two products, read from the same platform. The loan is the harder one: it describes
        calculations and an eligibility verdict as well as questions.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {forms.map((form) => (
          <Reveal key={form.id}>
            <Card className="h-full gap-0 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">{form.name}</h4>
                <Badge variant="secondary" className="font-mono text-[10.5px]">
                  form {form.id}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">{form.version}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground text-[11px]">Objects in the definition</dt>
                  <dd className="text-lg font-bold tabular-nums">{form.fieldCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[11px]">Entries in the capture</dt>
                  <dd className="text-lg font-bold tabular-nums">{form.capturedEntries}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px]"
                  >
                    {capability}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(open === form.id ? null : form.id)
                }}
                className="text-primary focus-visible:ring-ring mt-4 self-start rounded text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
              >
                {open === form.id ? 'Hide detail' : 'Inspect journey'}
              </button>

              {open === form.id && (
                <div className="text-muted-foreground mt-3 space-y-2 border-t pt-3 text-xs leading-relaxed">
                  <p>{form.capturedBasis}.</p>
                  <p>
                    The capture is what a browser sent when a person completed the genuine
                    journey. It is not what Baz produced.
                  </p>
                  {form.id === generated.formId && (
                    <p className="text-foreground">
                      On a live case holding twenty facts, Baz had {generated.collected} answers
                      filled in, {generated.outstanding} questions left, and generated a{' '}
                      {generated.entries}-entry packet marked {generated.status}.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </Reveal>
        ))}
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
  const tone: Readonly<Record<string, string>> = {
    source_faithful: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    fixture: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    unsupported: 'bg-muted text-muted-foreground',
  }
  const label: Readonly<Record<string, string>> = {
    source_faithful: 'computed here',
    fixture: 'stand-in',
    unsupported: 'cannot be computed',
  }

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold">What the form decides, and what we may decide</h3>
      <p className="text-muted-foreground mt-1 max-w-[62ch] text-sm leading-relaxed">
        Four calculating controls, and they are not the same kind of thing. Treating them as if
        they were is how an assistant ends up inventing a lending decision.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {calculations.map((calculation) => (
          <Reveal key={calculation.fieldId}>
            <Card className="h-full gap-0 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{calculation.label}</p>
                <span
                  className={cn(
                    'rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.07em] uppercase',
                    tone[calculation.fidelity],
                  )}
                >
                  {label[calculation.fidelity]}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold tabular-nums">{calculation.result}</p>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                {calculation.why}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/** One definition, three renderers, with the third honestly labelled. */
function Channels(): ReactNode {
  const still = useReducedMotion() === true

  return (
    <Reveal className="mt-10">
      <h3 className="text-lg font-semibold">One digital journey, several channels</h3>

      <div className="mt-4">
        <Card className="mx-auto max-w-sm p-4 text-center">
          <p className="text-sm font-semibold">{channels.source}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {channels.sourceDetail}
          </p>
        </Card>

        <div aria-hidden className="bg-border mx-auto h-6 w-px" />

        <div className="grid gap-3 sm:grid-cols-3">
          {channels.renderers.map((renderer, index) => (
            <motion.div
              key={renderer.name}
              {...(still
                ? {}
                : {
                    initial: { opacity: 0, y: 8 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.3, delay: index * 0.12 },
                  })}
            >
              <Card className="h-full gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{renderer.name}</p>
                  <Claim kind={renderer.status === 'POC' ? 'poc' : 'production'} />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{renderer.detail}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="text-muted-foreground mt-4 text-center text-sm">{channels.caption}</p>
      </div>
    </Reveal>
  )
}
