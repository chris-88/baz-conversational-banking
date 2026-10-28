import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, PlayIcon } from 'lucide-react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Button } from '@/components/ui/button'
import { BazWordmark } from '@/baz/BazWordmark'
import { Surface } from '@/components/Primitives'
import { Eyebrow } from '@/surfaces/how-it-works/parts'
import { routes } from '@/app/routes'
import { article } from '@/content/article/copy'

/**
 * The executive article: the thinking behind the showcase, for somebody with eight minutes.
 *
 * The same canvas as the explainer and the showcase, at a reading measure. Every number
 * carries a footnote and every footnote carries a link, because a claim without a source on
 * a page a bank executive might forward is a liability. The draft label stays until the
 * copy is approved.
 */
export function Article(): ReactNode {
  useDocumentTitle(article.title)

  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link to={routes.landing} aria-label="Baz">
              <BazWordmark className="h-5 w-auto" />
            </Link>
            <span aria-hidden className="bg-border h-4 w-px" />
            <span className="text-muted-foreground text-sm">Article</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to={routes.baz}>
              <ArrowLeftIcon className="size-4" />
              Back to Baz
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        <Eyebrow>{article.eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-[20ch] text-[2.25rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
          {article.title}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-[52ch] text-lg leading-snug text-pretty sm:text-xl">
          {article.standfirst}
        </p>
        <p className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span>{article.byline}</span>
          <span className="flex items-center gap-1.5">
            <ClockIcon aria-hidden className="size-3.5" />
            {article.readingTime}
          </span>
        </p>

        <article className="mt-12 space-y-12">
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`} className="text-[1.5rem] leading-[1.15] font-bold tracking-tight text-balance sm:text-[1.75rem]">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-[16px] leading-relaxed sm:text-[17px]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>
                    <Footnoted text={paragraph} />
                  </p>
                ))}
              </div>
              {section.columns !== undefined && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {section.columns.map((column, index) => (
                    <Surface key={column.title} className="p-5" accent={index === 0 ? 'code' : 'model'}>
                      <p className="text-[15px] font-semibold">{column.title}</p>
                      <ul className="mt-3 space-y-2.5">
                        {column.items.map((item) => (
                          <li key={item.slice(0, 40)} className="text-muted-foreground flex gap-2.5 text-[14px] leading-relaxed">
                            <span aria-hidden className="bg-muted-foreground/40 mt-2 size-1.5 shrink-0 rounded-full" />
                            <span>
                              <Footnoted text={item} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Surface>
                  ))}
                </div>
              )}
            </section>
          ))}
        </article>

        <section aria-labelledby="sources-heading" className="mt-14 border-t pt-8">
          <h2 id="sources-heading" className="text-base font-semibold">
            Sources
          </h2>
          <ol className="mt-4 space-y-2.5">
            {article.sources.map((source) => (
              <li key={source.n} id={`source-${String(source.n)}`} className="text-muted-foreground flex gap-3 text-[13px] leading-relaxed">
                <span className="w-5 shrink-0 font-mono tabular-nums">{source.n}</span>
                <span className="min-w-0">
                  {source.text}{' '}
                  <a href={source.url} className="text-primary break-all underline underline-offset-2" target="_blank" rel="noreferrer">
                    {source.url}
                  </a>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <Surface lift className="p-5">
            <p className="text-[15px] font-semibold">Watch the five minutes</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              The narrated showcase: why, what, and so what, with the product on a phone.
            </p>
            <Button asChild size="sm" className="mt-4 gap-1.5">
              <Link to={routes.showcase}>
                <PlayIcon className="size-3.5 fill-current" />
                Start the showcase
              </Link>
            </Button>
          </Surface>
          <Surface lift className="p-5">
            <p className="text-[15px] font-semibold">Read how it works</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              The explainer: the story beat by beat, what is built, and what it costs.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 gap-1.5">
              <Link to={routes.howItWorks}>
                How Baz works
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </Button>
          </Surface>
        </div>
      </main>

      <footer className="bg-background border-t py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <p className="text-muted-foreground max-w-[60ch] text-xs leading-relaxed">
            A Bank of Ireland prototype. Not a banking service, it holds no real accounts, and
            nothing anybody does in it reaches a bank. This article is a draft for discussion.
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link to={routes.privacy}>How your data is used</Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}

/** Text with `[^n]` markers rendered as footnote links. */
function Footnoted({ text }: { readonly text: string }): ReactNode {
  const parts = text.split(/(\[\^\d+\])/)
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\[\^(\d+)\]$/.exec(part)
        if (match === null) return <Fragment key={index}>{part}</Fragment>
        const n = match[1] ?? ''
        return (
          <sup key={index} className="ml-0.5">
            <a
              href={`#source-${n}`}
              className="text-primary font-medium no-underline hover:underline"
              aria-label={`Source ${n}`}
            >
              {n}
            </a>
          </sup>
        )
      })}
    </>
  )
}
