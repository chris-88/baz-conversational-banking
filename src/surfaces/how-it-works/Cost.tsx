import type { ReactNode } from 'react'
import { Figures, Panel, Prose, Section } from './parts'

/**
 * What a conversation costs to run, and the four things we had wrong.
 *
 * The long form, kept current alongside the code, is
 * `docs/04-cost-of-running-a-conversational-assistant.md`. This is the version for somebody who
 * will read it once.
 */

const TURN: readonly { readonly part: string; readonly cost: string; readonly note?: string }[] = [
  { part: '18k cached prefix, read', cost: '€0.0050' },
  { part: '3.6k conversation history, uncached', cost: '€0.0099', note: 'the surprise' },
  { part: '~350 output tokens', cost: '€0.0048' },
  { part: 'Gate (small model)', cost: '€0.0004' },
]

export function Cost(): ReactNode {
  return (
    <div>
      <section className="border-border border-b py-8 sm:py-10">
        <p className="max-w-[62ch] font-serif text-lg leading-snug text-pretty sm:text-xl">
          The first question anyone asks about a conversational product is what it costs per
          conversation, and &ldquo;a few cents&rdquo; is a worse answer than a number.
        </p>
        <Figures
          items={[
            { value: '€0.59', label: 'per 12-turn conversation, before' },
            { value: '€0.31', label: 'after, with no change to quality' },
            { value: '17,285', label: 'tokens of system prompt' },
            { value: '66%', label: 'of it the product catalogue' },
          ]}
        />
      </section>

      <Section
        eyebrow="The anatomy"
        title="Where a turn's money goes"
        lede="Every customer message triggers two model calls: a small classifier that decides whether it is in scope, and the model that answers. A steady-state turn with a warm cache cost €0.021, split like this."
      >
        <div className="mt-6 overflow-hidden rounded-md border">
          {TURN.map((line) => (
            <div
              key={line.part}
              className="odd:bg-card even:bg-muted/40 flex items-baseline justify-between gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <span className="text-sm">
                {line.part}
                {line.note === undefined ? null : (
                  <span className="text-muted-foreground ml-2 font-mono text-[11px] tracking-wide uppercase">
                    {line.note}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{line.cost}</span>
            </div>
          ))}
        </div>

        <Prose className="mt-5">
          <p>
            <strong>The conversation history cost twice what the entire 17,000-token system prompt
            cost.</strong> The prompt was cached; the history was not. We had optimised the big
            obvious block and left the one that actually grows at full price.
          </p>
          <p>
            Output tokens cost as much as the whole cached prompt, because output is priced at five
            times input. A model that answers in three paragraphs where one would do is a cost
            decision as much as a style one.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Four findings" title="What we had wrong">
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Panel title="1 · Cache the conversation, not just the prompt">
            <Prose>
              <p>
                One cache breakpoint, on the system prompt. The history sat after it and was re-read
                at full price on every round of every turn — and a turn that renders a card is two
                rounds, so it was paid for twice.
              </p>
              <p>
                A second breakpoint on the last message fixed it. <strong>€0.021 → €0.012 per
                turn</strong>, in about fifteen lines.
              </p>
              <p className="text-foreground">
                Everyone caches the system prompt, because it is the block you wrote and can see.
                The conversation is the block that grows without anyone deciding it should.
              </p>
            </Prose>
          </Panel>

          <Panel title="2 · Match the cache lifetime to how people talk">
            <Prose>
              <p>
                Five minutes is a long time in a benchmark and a short time in a conversation. A
                customer reads a comparison and thinks; a presenter talks over it. Most gaps in a
                real demo exceed five minutes, so we paid the full prompt write on most turns.
              </p>
              <p>
                The larger effect we nearly missed:{' '}
                <strong>the cached prefix does not depend on the case.</strong> It is byte-identical
                for every customer, so one entry serves every session at once. With a one-hour
                lifetime, a demo day pays for that write once, not once per visitor.
              </p>
            </Prose>
          </Panel>

          <Panel title="3 · Volatile content belongs after the breakpoint">
            <Prose>
              <p>
                The persona block — 149 tokens of style instructions — sat inside the cached prefix.
                On any turn the gate marks sensitive, the system zeroes humour, which rewrites that
                block and invalidated all 17,285 tokens in front of it.
              </p>
              <p>
                The demo this was built for turns on life events. Sensitive turns are not an edge
                case here; they are the point. We were paying a premium precisely on the turns that
                matter most.
              </p>
              <p className="text-foreground">
                A volatile section does not cost its own size. It costs the size of everything it
                precedes.
              </p>
            </Prose>
          </Panel>

          <Panel title="4 · A timeout is not a cancellation">
            <Prose>
              <p>
                The gate gives up on the classifier after four seconds and fails closed. That
                behaviour is correct and we kept it. What was wrong is that giving up on the answer
                did not stop the request — it ran to completion and was billed in full, and a retry
                could bill it twice.
              </p>
              <p className="text-foreground">
                The amount is small. The shape of the bug is not: a deadline that abandons a request
                is not a deadline that ends one, and the difference is invisible in every metric
                except the invoice.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>

      <Section
        eyebrow="Just as useful"
        title="What we deliberately did not do"
        lede="The product catalogue is 66% of the prompt and the obvious target. Measurement said leave it alone."
      >
        <Prose className="mt-5">
          <p>
            Once caching works it costs about €0.003 a turn to carry all 61 products. The
            alternative — a compact index plus a lookup tool — adds a model round trip of roughly
            €0.015 to every turn that needs detail. At any realistic hit rate it costs more than it
            saves, and the product gets worse: the real rates are what make a savings comparison
            land.
          </p>
          <p>
            <strong>The obvious optimisation was the wrong one, and only measurement showed it.</strong>
          </p>
          <p>
            We also did not downgrade the model, because a cheaper model that answers worse fails
            the thing the POC exists to demonstrate. And we did not skip the gate on safe-looking
            messages: domain restriction is enforcement, not a suggestion, and €0.0004 is not a
            reason to put a hole in it.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Honestly" title="The largest cost was not the product">
        <Prose className="mt-5">
          <p>
            An accounting of the day this work was triggered: the API credit that ran out was spent
            mostly on <strong>development testing</strong>, not on customer conversations.
          </p>
          <p>
            Verifying that a badge wrapped correctly, that cards appeared in the right order, that a
            calculation used the right opening balance — each was checked by running a full live
            conversation against the production model. A fixture-backed provider existed for exactly
            this and was not being used.
          </p>
          <p className="text-foreground">
            Decide early which tests need a real model and which need a deterministic stand-in, and
            make the stand-in the default. Model behaviour needs the model. Layout does not.
          </p>
        </Prose>
      </Section>
    </div>
  )
}
