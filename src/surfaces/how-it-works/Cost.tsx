import type { ReactNode } from 'react'
import { Figures, Panel, Prose, Section } from './parts'

/**
 * What a conversation costs to run, and the six things we had wrong.
 *
 * The long form, kept current alongside the code, is
 * `docs/04-cost-of-running-a-conversational-assistant.md`. This is the version for somebody who
 * will read it once.
 */

/** Measured from a live conversation. Every figure is one the API reported about itself. */
const TURN: readonly { readonly part: string; readonly cost: string; readonly note?: string }[] = [
  { part: 'Turn 1 — writes the whole 26,974-token prefix', cost: '€0.174', note: 'once an hour, shared' },
  { part: 'Turn 2 — writes 922 tokens, reads the rest', cost: '€0.031' },
  { part: 'Turn 3 — writes 1,064 tokens, reads the rest', cost: '€0.036' },
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
            { value: '€0.94', label: 'per 12-turn conversation, before' },
            { value: '€0.55', label: 'after, with no change to quality' },
            { value: '26,974', label: 'tokens in the cached prefix' },
            { value: '58%', label: 'of it the product catalogue' },
          ]}
        />
      </section>

      <Section
        eyebrow="The anatomy"
        title="Where a turn's money goes"
        lede="Every customer message triggers two model calls: a small classifier that decides whether it is in scope, and the model that answers. A turn that renders a card takes two rounds, so everything is read twice."
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
            The whole saving is visible in one column. Turn one writes 26,974 tokens; every turn
            after it writes <strong>fewer than 1,100</strong>, because the conversation now carries
            its own cache breakpoint. Before, the entire history was re-read at full price on every
            round of every turn.
          </p>
          <p>
            The first turn is the expensive one, and it is paid once an hour for everybody — the
            cached prefix is byte-identical for every customer, so one write covers a whole demo
            day rather than one visitor.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Six findings" title="What we had wrong">
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Panel title="1 · Cache the conversation, not just the prompt">
            <Prose>
              <p>
                One cache breakpoint, on the system prompt. The history sat after it and was re-read
                at full price on every round of every turn — and a turn that renders a card is two
                rounds, so it was paid for twice.
              </p>
              <p>
                A second breakpoint on the last message fixed it. The measured result:{' '}
                <strong>922 tokens written instead of 54,000 re-read</strong>, in about fifteen
                lines.
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
                The persona block — 178 tokens of style instructions — sat inside the cached prefix.
                On any turn the gate marks sensitive, the system zeroes humour, which rewrites that
                block and invalidated all 26,974 tokens in front of it.
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

          <Panel title="5 · The tool schemas are part of the prompt">
            <Prose>
              <p>
                The eleven tools carry <strong>4,739 tokens</strong> of JSON schema — 18% of
                everything sent, and more than the policy, the voice, the fact reference and the
                tool guidance put together.
              </p>
              <p>
                We had not counted them at all. The prompt was audited line by line; the schemas
                were invisible because nobody writes them as prose. They are generated from
                validators, they live in a different file, and they appear in no document called
                &ldquo;the prompt&rdquo;.
              </p>
              <p className="text-foreground">
                Count what is actually sent, not what you wrote.
              </p>
            </Prose>
          </Panel>

          <Panel title="6 · A cache instruction that silently did nothing">
            <Prose>
              <p>
                The gate&rsquo;s prompt carries a cache marker. Every measured turn reports zero
                cache reads and zero cache writes for it — the classifier prompt is around 1,200
                tokens, below the minimum length that model will cache. The marker is accepted, no
                error comes back, and nothing is cached.
              </p>
              <p>
                It had been there since the gate was written, and we assumed it worked because the
                code said so. We have left it uncached, because padding a prompt to reach a
                threshold costs more than it saves.
              </p>
              <p className="text-foreground">
                Caching fails open and silently. If you have not seen a non-zero cache read, you do
                not know it is cached.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>

      <Section
        eyebrow="Just as useful"
        title="What we deliberately did not do"
        lede="The product catalogue is 58% of the prompt and the obvious target. Measurement said leave it alone."
      >
        <Prose className="mt-5">
          <p>
            Once caching works it costs about €0.004 a turn to carry all 61 products. The
            alternative — a compact index plus a lookup tool — adds a model round trip of roughly
            €0.02 to every turn that needs detail. At any realistic hit rate it costs more than it
            saves, and the product gets worse: the real rates are what make a savings comparison
            land.
          </p>
          <p>
            <strong>The obvious optimisation was the wrong one, and only measurement showed it.</strong>
          </p>
          <p>
            We also did not downgrade the model, because a cheaper model that answers worse fails
            the thing the POC exists to demonstrate. And we did not skip the gate on safe-looking
            messages: domain restriction is enforcement, not a suggestion, and €0.0013 is not a
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
