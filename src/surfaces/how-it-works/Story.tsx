import { Fragment, type ReactNode } from 'react'
import { storyChapter as copy } from '@/content/how-it-works/copy'
import { STAGE_NAMES, story, type SpecStage } from '@/content/how-it-works/story'
import { useStill } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Claim, Reveal, SectionHead, StepBadge } from './parts'
import { ChannelMark } from './ChannelMark'
import { StoryBeat } from './StoryBeat'

/**
 * The §67 story, every beat of it on the page.
 *
 * A timeline rather than a stepper. A stepper shows one beat at a time and hides the rest
 * behind a control, which breaks the first rule of this page: nothing may be legible only once
 * something has happened. So all nineteen beats are in the document, grouped under the thirteen
 * §6 stage headings, and the row of stage buttons at the top is navigation over content that is
 * already there. Somebody who never touches it reads the whole story by scrolling.
 *
 * A channel divider appears wherever the story moves between surfaces: a browser tab, the
 * installed app, the spouse's phone, the console, a lock screen. The transcript column stays
 * one phone wide throughout, because the case does not notice the move and the page should not
 * make a drama of it either.
 */
export function Story(): ReactNode {
  const still = useStill()
  const stages = [...new Set(story.map((beat) => beat.stage))]

  const jump = (stage: SpecStage): void => {
    document
      .getElementById(stageAnchor(stage))
      ?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section id="story" className="scroll-mt-[68px] border-t pt-14 pb-14 sm:pt-20 sm:pb-20 lg:scroll-mt-[84px]">
      <SectionHead
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Claim kind="synthetic" />
        <p className="text-muted-foreground text-[12.5px]">{copy.caption}</p>
      </div>

      <nav aria-label="Stages of the story" className="mt-5">
        <ol className="flex flex-wrap gap-1.5">
          {stages.map((stage) => (
            <li key={stage}>
              <button
                type="button"
                onClick={() => {
                  jump(stage)
                }}
                className="bg-card text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="font-mono text-[10.5px] tabular-nums">{String(stage).padStart(2, '0')}</span>
                {STAGE_NAMES[stage]}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <ol className="mt-8 space-y-4">
        {story.map((beat, index) => {
          const previous = index === 0 ? null : story[index - 1]
          const newStage = previous === null || previous === undefined || beat.stage !== previous.stage
          const newChannel =
            previous === null || previous === undefined || beat.channel !== previous.channel

          return (
            <Fragment key={beat.id}>
              {newStage && (
                <li
                  id={stageAnchor(beat.stage)}
                  className={cn(
                    'scroll-mt-[68px] flex items-center gap-2.5 lg:scroll-mt-[84px]',
                    index > 0 && 'pt-6',
                  )}
                  aria-label={`Stage ${String(beat.stage)}: ${STAGE_NAMES[beat.stage]}`}
                >
                  <StepBadge n={beat.stage} />
                  <h3 className="text-[15px] font-semibold tracking-tight">
                    {STAGE_NAMES[beat.stage]}
                  </h3>
                  <span className="text-muted-foreground font-mono text-[10.5px]">§6</span>
                </li>
              )}

              {newChannel && (
                <li>
                  <ChannelMark channel={beat.channel} />
                </li>
              )}

              <li>
                <Reveal>
                  <StoryBeat beat={beat} n={index + 1} />
                </Reveal>
              </li>
            </Fragment>
          )
        })}
      </ol>

      <p className="text-muted-foreground mt-8 max-w-[62ch] text-[14px] leading-relaxed">
        {copy.close}
      </p>
    </section>
  )
}

function stageAnchor(stage: SpecStage): string {
  return `story-stage-${String(stage)}`
}
