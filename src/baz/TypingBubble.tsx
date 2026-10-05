import type { ReactNode } from 'react'
import { ChatBubble } from '@/baz/ChatBubble'

/**
 * Baz, thinking.
 *
 * In the same bubble the answer will arrive in, so the reply grows out of it rather than
 * appearing somewhere else on screen. The label is for screen readers, which cannot see three
 * dots moving; `aria-live` announces it once rather than on every frame.
 */
export function TypingBubble(): ReactNode {
  return (
    <ChatBubble author="baz">
      <span className="flex items-center gap-1 py-1" aria-live="polite" aria-label="Baz is typing">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            aria-hidden
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: `${String(dot * 150)}ms`, animationDuration: '1s' }}
          />
        ))}
      </span>
    </ChatBubble>
  )
}
