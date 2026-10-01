import type { ReactNode } from 'react'
import { ChatBubble } from '@/baz/ChatBubble'
import { Composer } from '@/baz/Composer'
import { SuggestionList, type Suggestion } from '@/baz/SuggestionList'

export type ConversationTurn = {
  readonly id: string
  readonly author: 'baz' | 'customer'
  readonly content: ReactNode
}

/**
 * The portable conversation surface: turns, whatever Baz is currently offering, and the
 * composer.
 *
 * Knows nothing about Bank of Ireland or any shell — the host supplies the chrome and the
 * content (Invariant 11, §32).
 */
export function BazConversation({
  turns,
  suggestions = [],
  onSend,
  onSelectSuggestion,
  disabled,
}: {
  turns: readonly ConversationTurn[]
  suggestions?: readonly Suggestion[] | undefined
  onSend?: ((message: string) => void) | undefined
  onSelectSuggestion?: ((suggestion: Suggestion) => void) | undefined
  disabled?: boolean | undefined
}): ReactNode {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.map((turn, index) => (
          <ChatBubble
            key={turn.id}
            author={turn.author}
            showAvatar={turns[index + 1]?.author !== turn.author}
          >
            {turn.content}
          </ChatBubble>
        ))}

        {suggestions.length > 0 && (
          <SuggestionList
            suggestions={suggestions}
            onSelect={onSelectSuggestion}
            disabled={disabled}
            className="pt-1 pl-10"
          />
        )}
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
        <Composer onSend={onSend} disabled={disabled} />
      </div>
    </div>
  )
}
