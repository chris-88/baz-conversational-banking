import type { ReactNode } from 'react'
import { ChatBubble } from '@/baz/ChatBubble'

/**
 * Baz, thinking (spec §6).
 *
 * In the same bubble the answer arrives in, so the reply grows out of it rather than appearing
 * somewhere else on the screen. Opacity only — the spec rules out vertical bouncing, and it is
 * right: three dots hopping reads as a toy, three dots breathing reads as someone thinking.
 *
 * Nothing is announced from here. A node that unmounts the moment the answer begins is the
 * wrong place for a live region, so the announcement lives in a stable one in `BazChat`.
 */
export function TypingBubble(): ReactNode {
  return (
    <ChatBubble author="baz">
      {/*
        Exactly one line of text tall (§7). The dots used to sit in a shorter bubble, so when
        the answer replaced them it arrived fourteen pixels higher — the hard gap the spec asks
        to avoid. At the same height the text simply appears where the dots were.
      */}
      <span aria-hidden className="flex h-6 items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="bg-muted-foreground/60 baz-typing-dot size-1.5 rounded-full"
            style={{ animationDelay: `${String(dot * 110)}ms` }}
          />
        ))}
      </span>
    </ChatBubble>
  )
}
