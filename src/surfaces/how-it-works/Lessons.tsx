import { useState, type ReactNode } from 'react'
import { ChevronDownIcon, LightbulbIcon } from 'lucide-react'
import { lessons as copy } from '@/content/how-it-works/copy'
import { engineeringNotes, lessons } from '@/content/how-it-works/pivots'
import { Reveal, SectionHead, Surface, Tile } from './parts'
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
    <section id="lessons" className="scroll-mt-[68px] lg:scroll-mt-[84px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
              <Surface key={note.title} className="p-4">
                <p className="text-[13.5px] font-semibold">{note.title}</p>
                <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
                  {note.body}
                </p>
              </Surface>
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
    <Surface className="h-full p-5">
      <div className="flex items-start gap-2.5">
        <Tile tone="warning" size="sm">
          <LightbulbIcon />
        </Tile>
        <h3 className="text-[15px] leading-snug font-semibold text-pretty">{lesson.title}</h3>
      </div>

      <dl className="mt-4 space-y-3">
        {(
          [
            ['We assumed', lesson.assumption],
            ['What happened', lesson.whatHappened],
            ['What changed', lesson.whatChanged],
          ] as const
        ).map(([label, body]) => (
          <div key={label} className="border-t pt-2.5 first:border-t-0 first:pt-0">
            <dt className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
              {label}
            </dt>
            <dd className="text-muted-foreground mt-1 text-[12.5px] leading-relaxed">{body}</dd>
          </div>
        ))}
      </dl>

      <p className="bg-primary/5 text-primary mt-4 rounded-lg px-3.5 py-2.5 text-[13.5px] leading-snug font-medium">
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
            <p className="text-muted-foreground bg-muted/50 mt-2 rounded-lg p-3 text-[12.5px] leading-relaxed">
              {lesson.measurement}
            </p>
          )}
        </div>
      )}
    </Surface>
  )
}
