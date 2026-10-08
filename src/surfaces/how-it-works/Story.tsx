import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Figures, Panel, Prose, Section } from './parts'

/**
 * How Baz changed while it was being built, from the commit log.
 *
 * Every quotation here is a real commit subject. The dates are the dates they landed.
 */

const DAY_ONE = Date.parse('2026-09-30')
const LAST_DAY = Date.parse('2026-10-08')

/**
 * Where a date sits along the nine days, as a percentage.
 *
 * Over 82% rather than the full width: each mark prints its date to its right, and a mark on
 * the last day with the track running to 100% pushed "8 Oct" off the end, where it wrapped to
 * two lines and took the page with it.
 */
function at(date: string): number {
  return ((Date.parse(date) - DAY_ONE) / (LAST_DAY - DAY_ONE)) * 82
}

const TRACK: readonly {
  readonly name: string
  readonly start: string
  readonly end?: string
  readonly when: string
  readonly accent?: boolean
}[] = [
  { name: 'Planned milestones', start: '2026-09-30', end: '2026-10-05', when: '30 Sep – 5 Oct' },
  { name: 'Pivot 1 · needs engine', start: '2026-10-05', when: '5 Oct', accent: true },
  { name: 'Pivot 2 · customer plans', start: '2026-10-05', when: '5 Oct' },
  { name: 'Pivot 3 · stripped back', start: '2026-10-06', when: '6 Oct' },
  { name: 'Real BOI catalogue', start: '2026-10-08', when: '8 Oct' },
  { name: 'Reliability and cost', start: '2026-10-08', when: '8 Oct' },
]

export function Story(): ReactNode {
  return (
    <div>
      <section className="border-border border-b py-8 sm:py-10">
        <p className="max-w-[62ch] font-serif text-lg leading-snug text-pretty sm:text-xl">
          Baz was built in nine days and 143 commits. The build order held exactly as planned; the
          product definition did not.
        </p>
        <p className="text-muted-foreground mt-3 max-w-[62ch] text-sm leading-relaxed">
          Three pivots turned a conversational front end for product applications into something
          that works out what a customer needs, makes a plan for the ones who are not ready yet, and
          comes back when they are.
        </p>
      </section>

      <Section
        eyebrow="Nine days at a glance"
        title="Every pivot came after the plan was finished"
      >
        <div className="mt-7">
          <div>
            {TRACK.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-1 items-center gap-1 py-2 sm:grid-cols-[170px_1fr] sm:gap-4"
              >
                <span
                  className={cn(
                    'text-sm',
                    item.accent === true ? 'font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {item.name}
                </span>
                <div className="relative flex h-6 items-center">
                  {/*
                   * The day the plan ran out, drawn inside each row rather than over the block:
                   * the track's left edge is a grid column, so anything positioned against the
                   * outer container has to guess where that edge is, and guessed wrong. The
                   * negative insets close the gap between rows so the segments read as one line.
                   */}
                  <span
                    className="border-decides-model/50 absolute -top-2 -bottom-2 border-l border-dashed"
                    style={{ left: `${String(at('2026-10-05'))}%` }}
                    aria-hidden="true"
                  />
                  {item.end === undefined ? (
                    <span
                      className={cn(
                        'absolute size-3 rotate-45',
                        item.accent === true ? 'bg-decides-model' : 'bg-muted-foreground/50',
                      )}
                      style={{ left: `calc(${String(at(item.start))}% - 6px)` }}
                    />
                  ) : (
                    <span
                      className="border-muted-foreground/40 bg-muted-foreground/15 absolute h-3.5 rounded-full border"
                      style={{
                        left: `${String(at(item.start))}%`,
                        width: `${String(at(item.end) - at(item.start))}%`,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      'absolute text-xs tabular-nums',
                      item.accent === true ? 'font-semibold' : 'text-muted-foreground',
                    )}
                    style={{ left: `calc(${String(at(item.end ?? item.start))}% + 14px)` }}
                  >
                    {item.when}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 max-w-[62ch] text-sm">
            Every milestone in the plan was finished by 5 October. Everything that changed what Baz
            is for happened after that date.
          </p>
        </div>
      </Section>

      <Section eyebrow="Days 1 to 3" title="The build went to plan, and that was the problem">
        <Prose className="mt-5">
          <p>
            Every milestone in the plan was finished inside three working days. The domain core, the
            gate, persona, applications, the partner experience, return, audience mode — all of it,
            in the order it was written down.
          </p>
          <p>
            Day one was the skeleton and the domain: facts, journeys, the requirement engine, the
            state machine, the seed. Day two put Baz live and talking, with the gate in front of the
            model and an adversarial eval set at 100% on both the must-block and must-allow halves.
            One deliberate stop on the way: <em>&ldquo;Align on a real design system before building
            further on top.&rdquo;</em>
          </p>
          <p>
            Day three opened with a correction worth keeping:{' '}
            <em>&ldquo;Give Baz a voice, because 32 prohibitions produced a compliance
            officer.&rdquo;</em> The guardrails worked, and had made Baz unpleasant to talk to. We
            had written down everything Baz must never do and nothing about who Baz was.
          </p>
          <p>
            It closed with the commit the whole project turns on:{' '}
            <em>&ldquo;Fix what hands-on use exposed: pacing, leaked seed data, stacked
            invites.&rdquo;</em> The plan was complete. The product had not started.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Pivot one" title="From applications to needs">
        <Prose className="mt-5">
          <p>
            <em>&ldquo;Build the Needs Engine&rdquo;</em> was not in the plan, and it changed what
            Baz was for. Until then Baz helped you apply for a product you had already named — a
            faster form with a conversation on top. The engine made Baz work out what someone needed
            from what they said, and track whether it had enough to be confident about it.
          </p>
          <p>
            Two commits over the following day show what it cost to get right.{' '}
            <em>&ldquo;Finish discovery before offering anything&rdquo;</em> stopped Baz reaching for
            a product the moment one became plausible.{' '}
            <em>&ldquo;Never assume a detail you have not been given&rdquo;</em> stopped it filling
            the gaps itself.
          </p>
          <p>
            A week later the same instinct had to be tempered:{' '}
            <em>&ldquo;The discovery gate has no say over what was asked for.&rdquo;</em> Someone who
            says &ldquo;can I open a current account&rdquo; should not be interviewed first.
            Discovery earns its place everywhere except where the customer has already been clear.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Pivot two" title="From products to a trajectory">
        <Prose className="mt-5">
          <p>
            The largest change of the nine days was realising that a customer who cannot buy yet is
            not a failed lead.{' '}
            <em>&ldquo;Offer savings, and plan for a customer who is not ready yet&rdquo;</em> landed
            on day three, and{' '}
            <em>&ldquo;Customer Plans: the trajectory, not just the products&rdquo;</em> followed the
            same evening.
          </p>
          <p>
            Someone eighteen months short of a deposit had previously been a conversation that ended
            politely. Now they get a savings plan with a date on it, and Baz knows what has to be
            true before the mortgage conversation is worth having.{' '}
            <em>&ldquo;Check-ins that fire, and needs that come back when they said they
            would&rdquo;</em> made that a commitment rather than a note.
          </p>
          <p>
            It reframed the product. Not a channel for applications — a relationship that persists
            between them, where the gap between products is the thing being served rather than dead
            time.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Pivot three" title="Back to just the conversation">
        <Prose className="mt-5">
          <p>
            We built an authenticated mobile banking shell — accounts, navigation, the lot — and
            then deleted it. <em>&ldquo;Strip the customer side back to Baz&rdquo;</em> is a one-line
            commit that removed a milestone&rsquo;s worth of work.
          </p>
          <p>
            The reasoning was that the thesis and the interface were arguing with each other. If the
            claim is that you should not have to know which product you need, then a product menu
            contradicts it before anyone types a word. What survived was a conversation and the
            cards it raises. Old links redirect rather than break.
          </p>
          <p>
            The same instinct kept going. The composer took the bottom of the screen, the prototype
            banner went, and finally a tagline we had written and liked —{' '}
            <em>&ldquo;Jarvis, but for banking&rdquo;</em> went in on day seven and came out on day
            nine, along with the scripted introduction Baz used to open with. An opening that
            explains the product is an opening that admits it needs explaining.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Throughout" title="What ran underneath">
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <Panel title="Work kept moving off the model">
            <Prose>
              <p>
                <em>&ldquo;Quote engine: the arithmetic Baz was doing in prose.&rdquo;</em>{' '}
                <em>&ldquo;Steer to the product that suits, by rule rather than by noticing.&rdquo;</em>{' '}
                <em>&ldquo;Refuse a plan whose target has already been passed.&rdquo;</em>
              </p>
              <p>
                Every time we found the model doing something that could be computed, we computed it
                — and left the model the part it is actually better at, which is knowing how to say
                it.
              </p>
            </Prose>
          </Panel>
          <Panel title="Real data changed the product">
            <Prose>
              <p>
                Replacing the invented catalogue with Bank of Ireland&rsquo;s real one, 61 products,
                immediately exposed that rates are the whole story for deposit accounts.
              </p>
              <p>
                Comparison cards, rates on the cards and product combinations all followed from that
                one swap. It did not just improve fidelity; it changed what the product had to do.
              </p>
            </Prose>
          </Panel>
          <Panel title="The last day was not features">
            <Prose>
              <p>
                A deploy landing on an open page, an audience cap that counted a lifetime instead of
                a burst, a purge that locked the database while it ran, a gate that failed closed
                without ever saying why, and caching that took a conversation from &euro;0.59 to
                &euro;0.31.
              </p>
              <p>
                The POC had to stop being something that works when you are careful with it.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>

      <Section eyebrow="Summary" title="What Baz turned out to be">
        <div className="mt-6 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-border border-b">
                {['', 'Planned', 'Built'].map((head, index) => (
                  <th
                    key={head.length === 0 ? `blank-${String(index)}` : head}
                    className="text-muted-foreground px-3 py-2.5 text-left font-mono text-[11px] font-medium tracking-[0.09em] uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  row: 'What it does',
                  planned: 'Takes applications for products a customer names',
                  built: 'Works out what they need, then takes the applications',
                },
                {
                  row: 'Who it serves',
                  planned: 'Customers ready to apply',
                  built: 'Including the ones who are eighteen months away',
                },
                {
                  row: 'Where it lives',
                  planned: 'A conversation inside a mobile banking app',
                  built: 'A conversation, with the app removed',
                },
                {
                  row: 'What it leaves behind',
                  planned: 'A submitted application',
                  built: 'A plan, with a date it will come back on',
                },
              ].map((entry) => (
                <tr key={entry.row} className="border-border/60 border-b align-top">
                  <th className="px-3 py-3 text-left font-semibold">{entry.row}</th>
                  <td className="text-muted-foreground px-3 py-3">{entry.planned}</td>
                  <td className="px-3 py-3">{entry.built}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Prose className="mt-6">
          <p>
            The build order was right and held all the way through. The product definition was
            wrong, and nothing in the plan could have shown that — only using the thing did.
          </p>
          <p>
            The pattern is worth naming for the next one: the milestones were finished on day three
            and the product was not finished on day nine. Everything that made Baz worth
            demonstrating came from the six days after the plan ran out.
          </p>
        </Prose>

        <Figures
          items={[
            { value: '9', label: 'days, 30 Sep to 8 Oct 2026' },
            { value: '143', label: 'commits' },
            { value: '3', label: 'pivots, all after the plan was done' },
            { value: '1', label: 'milestone deliberately deleted' },
          ]}
        />
      </Section>
    </div>
  )
}
