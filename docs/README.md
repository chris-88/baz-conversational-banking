# Baz documentation

A conversational orchestration layer over simulated Bank of Ireland product journeys. A proof of
concept — not a production banking service, and not connected to any real bank system.

## Start here

New to the repository, in this order:

1. [What is Baz?](start-here/what-is-baz.md) — the product in one page
2. [Quick start](start-here/quick-start.md) — running it
3. [The AI boundary](architecture/ai-boundary.md) — **the one idea everything else follows from**
4. [Architecture overview](architecture/overview.md) — the shape
5. [Project status](start-here/project-status.md) — what is built, what is deliberately not

[Glossary](start-here/glossary.md) for the words that mean something specific here.

## Build

| | |
|---|---|
| [Development principles](dev/development-principles.md) | The eleven invariants, the priority order, the standards |
| [Building POCs with AI](dev/building-pocs-with-ai.md) | The method, including what went wrong |
| [Repository structure](dev/repository-structure.md) | Where things are, and the enforced boundaries |
| [Local development](dev/local-development.md) | The three processes, and the loop |
| [Environment variables](dev/environment-variables.md) | Every one, including the dead ones |
| [Testing](dev/testing.md) | Three layers and one deliberate hole |
| [Debugging](dev/debugging.md) | There is no Sentry on the server |
| [Working with fixtures](dev/working-with-fixtures.md) | The canonical case, and live probes |
| [Repository inventory](dev/repository-inventory.md) | What is here, counted |

## Understand

| | |
|---|---|
| [Overview](architecture/overview.md) | SPA, six functions, 26 tables |
| [AI boundary](architecture/ai-boundary.md) | The model proposes, the engine decides |
| [Conversation runtime](architecture/conversation-runtime.md) | A turn, step by step |
| [Tool system](architecture/tool-system.md) | 15 tools, none of which change anything |
| [Guardrails](architecture/guardrails.md) | Domain restriction as enforcement |
| [Data model](architecture/data-model.md) | The schema, and why clients cannot write |
| [Authentication](architecture/authentication.md) | Anonymous first, identity attached later |
| [Customer context](architecture/customer-context.md) | Facts, reuse, and the digest |
| [Digital forms](architecture/digital-forms.md) | Reading the bank's own definitions |
| [Submission generation](architecture/submission-generation.md) | The packet that is never sent |
| [Deployment](architecture/deployment.md) | Pages, Supabase, CI |

## Change

| | |
|---|---|
| [Conversation](features/conversation.md) | The product |
| [Customer plans](features/customer-plans.md) | Goals that outlive applications |
| [Goals and needs](features/goals-and-needs.md) | Discovery without guessing |
| [Guardrails](features/guardrails.md) | What a presenter can see and do |
| [Persona studio](features/persona-studio.md) | Six sliders, style only |
| [Authentication](features/authentication.md) | What the customer meets |
| [Document upload](features/document-upload.md) | References, never signatures |
| [Admin console](features/admin-console.md) | Eight sections |
| [Digital forms integration](features/digital-forms-integration.md) | What is faithful, and what is a fixture |
| [How it works](features/how-it-works-site.md) | The explainer page |

## Design

[Principles](design/principles.md) · [Visual language](design/visual-language.md) ·
[Tokens](design/tokens.md) · [Typography](design/typography.md) ·
[Components](design/components.md) · [Conversation design](design/conversation-design.md) ·
[Motion](design/motion.md) · [Accessibility](design/accessibility.md)

## Follow a banking flow

| | |
|---|---|
| [Journeys](journeys/README.md) | The seven products. **All seven are `draft`** |
| [SuperSaver, form 1833](journeys/supersaver-1833.md) | 499 fields, 540 rules, no calculations |
| [Personal loan, form 1940](journeys/personal-loan-1940.md) | 418 fields, and it decides things |
| [Fixtures](journeys/fixtures/README.md) | Where the captured data lives |

## Understand why

| | |
|---|---|
| [Decisions log](decisions.md) | Every choice where the spec was silent. Dated. ~1,400 lines |
| [ADRs](decisions/README.md) | Eight records for the structural choices |
| [Learnings](learnings/README.md) | What turned out to be true whether we liked it or not |

## Operate safely

| | |
|---|---|
| [Threat model](security/threat-model.md) | What is defended, what is not |
| [Secrets and configuration](security/secrets-and-config.md) | `VITE_` is the whole boundary |
| [Synthetic data](security/synthetic-data.md) | Invariant 10 |
| [Responsible disclosure](security/responsible-disclosure.md) | How to report something |
| [Public repository review](security/public-repository-review.md) | **Open items. Read this one** |
| [Deployment](operations/deployment.md) · [Demo reset](operations/demo-reset.md) · [Troubleshooting](operations/troubleshooting.md) · [Runbooks](operations/runbooks.md) | Operational procedures |

## The two publications

Written to be read by people outside the project, and kept at the root for that reason:

- [**What a conversational assistant costs to run**](04-cost-of-running-a-conversational-assistant.md)
  — measured, with a changelog. **Living: re-measure, never revise from memory.**
- [**The return of relationship banking**](white-paper.md) — the argument for the product.

## Conventions

**Frontmatter.** Every document here carries `title`, `status`, `scope`, `last_verified` and
`sources`.

| `status` | |
|---|---|
| `current` | Describes the code as it is |
| `draft` | Being written |
| `historical` | Kept for the record. Does not describe the present |
| `superseded` | Replaced; the replacement is named |

`scope` is `poc` (this prototype), `production-direction` (what a real version would need) or
`shared` (true either way).

**Point at the implementation, do not copy it.** These documents explain mechanisms and link to
the files that prove the statement. The code in this repository is heavily commented at the point
of use, and those comments are the authoritative version — several of them record a bug that cost
a week.

**Never present an intention as an implementation.** If something is not built, say so. A document
that describes future work in the present tense costs the next person the time they spend looking
for something that was never there.

**`§N` cites the requirements document**, which is internal and not published here — see the note
below. `CLAUDE.md` carries enough of its substance to work from.

## The two unpublished source documents

| Document | Referred to as |
|---|---|
| Conversational Banking POC Vision | intent and tone |
| Baz Conversational Banking POC Requirements | the spec, cited as `§N` |

Both are gitignored from the working tree. **Both are nonetheless retrievable from this
repository's public git history**, which is an open item, not an intention — see
[the public repository review](security/public-repository-review.md).

## Numbered files

`01` and `03` are the two source documents above. `04` is the cost paper. The numbering is
historical; nothing depends on it except existing links, which is why `04` has not been renamed.

## Archive

[`archive/`](archive/README.md) holds the feature definitions the build was driven from, and the
superseded brand set. Nothing in there describes the current state.
