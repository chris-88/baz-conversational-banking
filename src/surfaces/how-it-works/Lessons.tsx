import { useState, type ReactNode } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { lessons as copy } from '@/content/how-it-works/copy'
import { engineeringNotes, lessons } from '@/content/how-it-works/pivots'
import { Eyebrow, Prose, Reveal } from './parts'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Four mistakes, with what settled each one.
 *
 * Four rather than six. A page that lists every lesson at the same size is a notebook, and the
 * two that are genuinely narrow live behind a disclosure for the readers who want them.
 *
 * Each card is an assumption first, because that is the part a reader recognises: everybody has
 * believed something obvious about caching or timeouts. The measurement is what turns a war
 * story into evidence.
 */
export function Lessons(): ReactNode {
  const [open, setOpen] = useState(false)

  return (
    <section id="lessons" className="scroll-mt-20 border-b py-10 sm:py-14">
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {copy.title}
      </h2>
      <Prose className="mt-4">
        {copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Prose>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {lessons.map((lesson, index) => (
          <Reveal key={lesson.id} delay={index * 0.04}>
            <LessonCard lesson={lesson} />
          </Reveal>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
          }}
          aria-expanded={open}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronDownIcon
            aria-hidden
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
          More engineering lessons
        </button>

        {open && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {engineeringNotes.map((note) => (
              <Card key={note.title} className="gap-1 p-4">
                <p className="text-sm font-semibold">{note.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{note.body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function LessonCard({ lesson }: { readonly lesson: (typeof lessons)[number] }): ReactNode {
  const [shown, setShown] = useState(false)

  return (
    <Card className="h-full gap-0 p-5">
      <h3 className="text-base font-semibold text-pretty">{lesson.title}</h3>

      <dl className="mt-3 space-y-2.5">
        {(
          [
            ['We assumed', lesson.assumption],
            ['What happened', lesson.whatHappened],
            ['What changed', lesson.whatChanged],
          ] as const
        ).map(([label, body]) => (
          <div key={label}>
            <dt className="text-muted-foreground font-mono text-[10.5px] tracking-[0.1em] uppercase">
              {label}
            </dt>
            <dd className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{body}</dd>
          </div>
        ))}
      </dl>

      <p className="border-primary/40 mt-4 border-l-2 pl-3 text-sm leading-snug font-medium">
        {lesson.lesson}
      </p>

      {lesson.measurement !== undefined && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setShown(!shown)
            }}
            aria-expanded={shown}
            className="text-primary focus-visible:ring-ring rounded text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            {shown ? 'Hide measurement' : 'See the measurement'}
          </button>
          {shown && (
            <p className="text-muted-foreground bg-muted/50 mt-2 rounded-md p-3 text-xs leading-relaxed">
              {lesson.measurement}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
