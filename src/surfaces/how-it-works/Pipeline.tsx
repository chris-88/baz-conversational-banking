import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Decider, Figures, Legend, Panel, Prose, Section, type Decides } from './parts'

/**
 * How a turn actually runs, and what stops it going wrong.
 *
 * Written for somebody who did not build this and wants to know what the AI is doing. The
 * numbers in it are measured against the code, not rounded for effect.
 */

const STAGES: readonly {
  readonly n: string
  readonly name: string
  readonly what: string
  readonly who: string
  readonly decides: Decides
}[] = [
  {
    n: '01',
    name: 'Load',
    what: 'Pull the case: facts, applications, product interests, persona. Recompute what each application still needs.',
    who: 'Database + pure functions',
    decides: 'code',
  },
  {
    n: '02',
    name: 'Gate',
    what: 'Decide whether this message reaches the model at all. Fixed checks first, then a classifier, then routing.',
    who: 'Code + classifier',
    decides: 'code',
  },
  {
    n: '03',
    name: 'Generate',
    what: 'Compose a layered system prompt, call the model with a fixed tool set, stream the reply.',
    who: 'Language model',
    decides: 'model',
  },
  {
    n: '04',
    name: 'Persist',
    what: 'Validate everything the model claimed, write messages, facts and events. Recompute requirements.',
    who: 'Validation + database',
    decides: 'code',
  },
]

const CATEGORIES: readonly { readonly name: string; readonly reaches: boolean }[] = [
  { name: 'banking', reaches: true },
  { name: 'ambiguous', reaches: true },
  { name: 'general_knowledge', reaches: false },
  { name: 'competitor', reaches: false },
  { name: 'off_topic', reaches: false },
  { name: 'abusive', reaches: false },
  { name: 'prompt_injection', reaches: false },
  { name: 'unsupported', reaches: false },
]

/**
 * The system prompt, in the order it is assembled.
 *
 * Counted exactly through the token-counting API, not estimated from characters. The tool
 * schemas are in the list because they are sent with every request and are 18% of it, which is
 * not obvious from reading the prompt: nobody writes them as prose.
 */
const LAYERS: readonly {
  readonly name: string
  readonly gloss: string
  readonly tokens: string
  readonly cached: boolean
}[] = [
  { name: 'Policy', gloss: "What Baz may never do. Nothing below can override it.", tokens: '570', cached: true },
  { name: 'Voice', gloss: "How Baz writes, independent of persona settings.", tokens: '1,097', cached: true },
  { name: 'Domain', gloss: "What counts as in scope.", tokens: '158', cached: true },
  { name: 'Tool guidance', gloss: "When to reach for which card.", tokens: '1,806', cached: true },
  { name: 'How applying works', gloss: "What the bank actually does with an application.", tokens: '598', cached: true },
  { name: 'What we can do', gloss: "The honest limits of the service.", tokens: '522', cached: true },
  { name: 'Fact reference', gloss: "The 54 things that can be known, and their shapes.", tokens: '1,711', cached: true },
  { name: 'Tool definitions', gloss: "JSON schemas for the eleven tools. Sent every turn, and easy to forget.", tokens: '4,739', cached: true },
  { name: 'Product catalogue', gloss: "61 real products. Baz states product detail only from here.", tokens: '15,595', cached: true },
  { name: 'Persona', gloss: "Style sliders as prose. Cannot change scope, rules or protections.", tokens: '178', cached: false },
  { name: 'Case digest', gloss: "This customer's facts and applications, from the database.", tokens: '~700', cached: false },
  { name: 'This turn', gloss: "Today's date, and any flags the gate raised.", tokens: '~30', cached: false },
]

const TOOLS: readonly { readonly name: string; readonly what: string }[] = [
  {
    name: 'record_facts',
    what: 'The only tool that writes. Every key is checked against the catalogue, every value against its schema, and anything marked unextractable is rejected outright.',
  },
  { name: 'show_product_options', what: 'Renders products to choose from. The choosing happens in the card.' },
  { name: 'show_comparison', what: 'Puts several products in a family side by side.' },
  { name: 'show_quote', what: 'Illustrative figures, calculated server-side from case data.' },
  { name: 'propose_plan', what: 'Suggests a savings plan. Suggests.' },
  { name: 'show_review', what: 'Names an application. The server builds the review from the database, not from model text.' },
  { name: 'show_status', what: 'Renders the status card from the database, independently of anything the model said.' },
  { name: 'show_pause_prompt', what: 'Offers to pause. The customer confirms in the card.' },
  { name: 'show_form', what: 'Opens a structured form — the only route by which sensitive data is ever collected.' },
  { name: 'request_upload', what: 'Can only reference a document request that already exists.' },
  { name: 'show_partner_invite', what: 'Offers to invite a second person. Offers.' },
]

const LEDGER: readonly {
  readonly decision: string
  readonly decides: Decides
  readonly how: string
  readonly why: string
}[] = [
  {
    decision: 'Is this in scope?',
    decides: 'code',
    how: 'Fixed checks, then a classifier, then a routing table',
    why: 'A prompt instruction can be argued with. A branch cannot.',
  },
  {
    decision: 'What does this application still need?',
    decides: 'code',
    how: 'Pure function over requirements and facts, recomputed every turn',
    why: 'A model that forgets asks for the same document twice.',
  },
  {
    decision: 'How should I ask for it?',
    decides: 'model',
    how: 'Free generation within the composed prompt',
    why: 'This is the part a language model is genuinely better at.',
  },
  {
    decision: 'Which products suit this person?',
    decides: 'model',
    how: 'Proposed through a card, from a fixed catalogue',
    why: 'Inference from what someone said is the product. The catalogue stops it inventing.',
  },
  {
    decision: 'Can this application be submitted?',
    decides: 'code',
    how: 'State machine transition table, server-side',
    why: 'The model has no tool that could, so there is nothing to bypass.',
  },
  {
    decision: 'Should we warn about this combination?',
    decides: 'code',
    how: 'Deterministic advisory rules',
    why: 'Financial advice from model judgement is not advice.',
  },
  {
    decision: 'Can health data be collected here?',
    decides: 'code',
    how: 'Catalogue flag; the write tool rejects it',
    why: 'Special-category data gets an explicit form and consent, never inference from chat.',
  },
  {
    decision: 'What can the partner see?',
    decides: 'code',
    how: 'Scoped responses from a separate endpoint',
    why: 'They never read the tables. Their own tasks, and nothing of the primary conversation.',
  },
]

export function Pipeline(): ReactNode {
  return (
    <div>
      <section className="border-border border-b py-8 sm:py-10">
        <p className="font-serif text-xl leading-snug text-pretty sm:text-2xl">
          The model is given <span className="text-decides-model font-semibold">language</span>,
          never <span className="text-decides-code font-semibold">authority</span>.
        </p>
        <Legend />
      </section>

      <Section
        eyebrow="The shape of it"
        title="Four stages, and only one of them is the AI"
        lede="A customer sends a message. Before any model produces a word of reply, the system has already loaded the case, decided whether the message is in scope, and assembled exactly what the model is allowed to know. Afterwards it validates and records what happened. The model occupies the third box."
      >
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <Panel key={stage.n} decides={stage.decides}>
              <span className="text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.1em]">
                {stage.n}
              </span>
              <h3 className="mt-1.5 text-base font-semibold">{stage.name}</h3>
              <p className="text-muted-foreground mt-1.5 text-[13px] leading-snug">{stage.what}</p>
              <span className="mt-3 block">
                <Decider decides={stage.decides}>{stage.who}</Decider>
              </span>
            </Panel>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Stage 01"
        title="What the model is allowed to know"
        lede="The model does not query the database and has no memory of its own. It receives a digest — a rendered summary built from controlled data, rebuilt from scratch on every turn."
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Panel title="Facts carry provenance">
            <Prose>
              <p>
                Every fact is a typed value about a named subject, with a source: stated by the
                customer, stated by their partner, held by the bank, extracted from a document, or
                derived. Nothing is a loose string.
              </p>
              <p>
                The subject matters. The primary applicant&rsquo;s income never satisfies the
                partner&rsquo;s income requirement, because they are different subjects of the same
                key.
              </p>
            </Prose>
          </Panel>
          <Panel title="Outstanding is computed, never remembered">
            <Prose>
              <p>
                What an application still needs is calculated fresh each turn by running the
                product&rsquo;s requirements against the facts that exist. The model is never asked
                to track progress, because a model that forgets is a customer asked for their PPS
                number twice.
              </p>
              <p>
                The model decides only <em>how</em> to ask.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>

      <Section
        eyebrow="Stage 02 — the controls"
        title="The gate"
        lede="Domain restriction is not an instruction in a prompt asking the model nicely to stay on topic. It is a separate decision made in front of the model, and a blocked message never reaches it."
      >
        <div className="mt-7 divide-y">
          <GateStep
            decides="code"
            tag="Check"
            note="no model call"
            title="Fixed checks run first"
          >
            <p>
              Empty input, and anything over 1,000 characters, is turned away before a single token
              is spent. Eight regular expressions look for known prompt-injection shapes —
              &ldquo;ignore your previous instructions&rdquo;, &ldquo;you are now&rdquo;,
              &ldquo;reveal your system prompt&rdquo;.
            </p>
            <p>
              A regex match <em>flags</em> the message rather than deciding it: the classifier still
              runs, so the operator console can show what each one thought. But a message the
              patterns are certain about never reaches the model, whatever the classifier says.
            </p>
          </GateStep>

          <GateStep decides="model" tag="Classify" note="small model" title="A small, fast classifier">
            <p>
              A cheaper model than the one that answers, doing one job: put the message in a
              category and flag two things about it. It receives the previous assistant turn as
              context, so a short reply like &ldquo;about 92k&rdquo; or &ldquo;yes&rdquo; classifies
              against the question that prompted it rather than in isolation.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category.name}
                  variant="outline"
                  className={cn(
                    'font-mono text-[11px] font-normal',
                    category.reaches
                      ? 'border-decides-model/50 bg-decides-model/10 text-decides-model'
                      : 'text-muted-foreground',
                  )}
                >
                  {category.name}
                  {category.reaches ? ' → model' : ''}
                </Badge>
              ))}
            </div>
          </GateStep>

          <GateStep
            decides="code"
            tag="Route"
            note="fixed table"
            title="Routing is a lookup, not a judgement"
          >
            <p>
              Two categories reach the model. The other six return a short written-in-advance
              response, selected by category and tone. Those responses never contain the thing being
              refused — a blocked trivia question gets a redirect, not the answer with an apology
              attached.
            </p>
            <p>
              Swearing with a genuine banking question behind it is <em>banking</em>. Someone
              frustrated about their mortgage is a customer, not an abuse case.
            </p>
            <p>
              A <strong>sensitive</strong> flag — bereavement, illness, financial distress, a
              declined application — forces humour and playfulness to zero for that turn and
              suppresses product offers entirely.
            </p>
          </GateStep>

          <GateStep
            decides="code"
            tag="Fail"
            note="closed"
            title="When the classifier cannot answer, nothing gets through"
          >
            <p>
              The gate waits four seconds. If the classifier times out, errors, or returns something
              unparseable, the turn is blocked with a short retry message rather than waved through.
              An unavailable control is a closed one.
            </p>
            <p>
              The deadline also cancels the request rather than merely stopping waiting for it, and
              the reason is recorded — a timeout, an upstream error and a malformed response are
              three different incidents and used to look identical.
            </p>
          </GateStep>
        </div>
      </Section>

      <Section
        eyebrow="Stage 03"
        title="What the model is actually sent"
        lede="The system prompt is assembled in a fixed order, immutable parts first. That order is not stylistic: everything above the break is identical for every customer and every conversation, which is what makes it cacheable — and what makes it impossible for anything downstream to edit."
      >
        <div className="mt-7 space-y-0.5">
          {LAYERS.map((layer, index) => (
            <div key={layer.name}>
              {index === 9 ? (
                <div className="flex items-center gap-3 py-2.5">
                  <span className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground font-mono text-[10.5px] tracking-[0.09em] whitespace-nowrap uppercase">
                    cache breakpoint · 26,974 tokens above
                  </span>
                  <span className="bg-border h-px flex-1" />
                </div>
              ) : null}
              <div
                className={cn(
                  'flex items-center justify-between gap-4 border border-l-[3px] px-3.5 py-2.5',
                  layer.cached ? 'border-l-decides-code bg-card' : 'border-l-decides-model bg-muted',
                )}
              >
                <div className="min-w-0">
                  <span className="block text-sm font-semibold">{layer.name}</span>
                  <span className="text-muted-foreground block text-xs leading-snug">
                    {layer.gloss}
                  </span>
                </div>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {layer.tokens}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Panel title="Persona is style, and only style" className="mt-5">
          <Prose>
            <p>
              Six sliders — length, humour, sarcasm, formality, playfulness, poetic — map to fixed
              prose fragments through a function with snapshot tests. There is no free-text persona
              field anywhere in the system, because a free-text persona field is a prompt injection
              point with a friendly label on it.
            </p>
            <p>
              Persona composes <em>after</em> policy, so it cannot reach back and alter it.
            </p>
          </Prose>
        </Panel>
      </Section>

      <Section
        eyebrow="Stage 03 — the boundary"
        title="Eleven tools, none of which can do anything"
        lede="The model has a fixed tool set. Ten of the eleven render something on screen. Exactly one writes data, and it is the most constrained of the lot."
      >
        <div className="mt-6 space-y-1.5">
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="bg-card grid gap-1 rounded-[3px] border px-3.5 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4"
            >
              <code className="text-decides-model font-mono text-[13px] font-medium">
                {tool.name}
              </code>
              <span className="text-muted-foreground text-[13px] leading-snug">{tool.what}</span>
            </div>
          ))}
        </div>

        <div className="border-destructive bg-destructive/8 mt-5 rounded-md border p-5">
          <h3 className="text-destructive mb-2 text-base font-semibold">
            There is no tool for any of this
          </h3>
          <p className="text-muted-foreground text-sm">
            Not restricted, not permission-checked — simply absent from the list the model is given:
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-0.5 pl-5 text-sm">
            <li>creating, submitting, pausing or resuming an application</li>
            <li>granting consent on the customer&rsquo;s behalf</li>
            <li>inviting a partner</li>
            <li>making a declaration</li>
            <li>changing the state of anything</li>
          </ul>
        </div>
      </Section>

      <Section
        eyebrow="The central rule"
        title="The model proposes. The interface commits."
        lede="This is the line the whole design is organised around. A model can be wrong, and it can be persuaded. So nothing it says causes anything to happen."
      >
        <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
          <Panel className="lg:rounded-r-none">
            <h3 className="text-decides-model mb-2 text-base font-semibold">
              The model renders a card
            </h3>
            <Prose>
              <p>
                It decides that a review card is the right thing to show, and calls the tool naming
                the application.
              </p>
              <p>
                That is the entire extent of its involvement. The card&rsquo;s contents are built by
                the server from database rows. Nothing has changed. Nothing has been submitted.
              </p>
            </Prose>
          </Panel>
          <div className="bg-foreground h-1 w-full lg:h-auto lg:w-1" />
          <Panel className="lg:rounded-l-none">
            <h3 className="text-decides-code mb-2 text-base font-semibold">
              The customer&rsquo;s tap commits it
            </h3>
            <Prose>
              <p>
                Tapping calls a separate endpoint the model cannot reach. It validates session
                access, the current state, the required information and the business rules, then
                runs the transition through a state machine with a fixed table of legal moves.
              </p>
              <p>
                Baz reports that something happened only <em>after</em> that endpoint confirms it
                did.
              </p>
            </Prose>
          </Panel>
        </div>

        <p className="text-muted-foreground mt-6 max-w-[62ch] text-sm leading-relaxed">
          The same principle governs what Baz says about status. Every state it can state comes from
          the digest, built from controlled data — and the status card beside the text renders
          straight from the database, so the two can be compared on screen. If the model ever
          invented a status, the card next to it would contradict it.
        </p>
      </Section>

      <Section
        eyebrow="Stage 04"
        title="Everything significant leaves a record"
        lede="Each meaningful occurrence writes an event row naming its actor: customer, partner, model, admin or system. Metrics are derived from those events rather than counted separately, so the number and the audit trail cannot disagree."
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Panel title="Including the refusals">
            <Prose>
              <p>
                A blocked request records its category, the reason, whether the injection patterns
                flagged it, and the first 200 characters of what was asked.
              </p>
              <p>
                A log of categories and timestamps proves nothing. &ldquo;Count to 10,000 — off
                topic&rdquo; proves the control works, and the request never reached the model
                either way.
              </p>
            </Prose>
          </Panel>
          <Panel title="And the reuse">
            <Prose>
              <p>
                When a requirement is satisfied by a fact that was already held — from the bank, or
                captured for a different application — that writes its own event. The count of those
                is the questions the customer was not asked a second time.
              </p>
            </Prose>
          </Panel>
        </div>
      </Section>

      <Section eyebrow="Summary" title="Which decisions are the model's">
        <div className="mt-6 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-border border-b">
                {['Decision', 'Made by', 'How it is implemented', 'Why that way'].map((head) => (
                  <th
                    key={head}
                    className="text-muted-foreground px-3 py-2.5 text-left font-mono text-[11px] font-medium tracking-[0.09em] uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((row) => (
                <tr key={row.decision} className="border-border/60 border-b align-top">
                  <th className="px-3 py-3 text-left font-semibold">{row.decision}</th>
                  <td className="px-3 py-3">
                    <Decider decides={row.decides}>
                      {row.decides === 'code' ? 'Code' : 'Model'}
                    </Decider>
                  </td>
                  <td className="text-muted-foreground px-3 py-3">{row.how}</td>
                  <td className="text-muted-foreground px-3 py-3">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Figures
          items={[
            { value: '8', label: 'categories the gate can return' },
            { value: '2', label: 'that reach the model' },
            { value: '11', label: 'tools, 1 of which writes' },
            { value: '0', label: 'tools that change state' },
            { value: '54', label: 'fact keys in the catalogue' },
            { value: '12', label: 'application states' },
            { value: '1,024', label: 'max tokens per reply' },
            { value: '3', label: 'tool rounds per turn, hard capped' },
          ]}
        />
      </Section>
    </div>
  )
}

function GateStep({
  decides,
  tag,
  note,
  title,
  children,
}: {
  readonly decides: Decides
  readonly tag: string
  readonly note: string
  readonly title: string
  readonly children: ReactNode
}): ReactNode {
  return (
    <div className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[112px_1fr] sm:gap-5">
      <div
        className={cn(
          'font-mono text-[11px] font-semibold tracking-[0.08em] uppercase',
          decides === 'code' ? 'text-decides-code' : 'text-decides-model',
        )}
      >
        {tag}
        <span className="text-muted-foreground mt-0.5 block font-normal tracking-[0.04em] normal-case">
          {note}
        </span>
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
        <Prose>{children}</Prose>
      </div>
    </div>
  )
}
