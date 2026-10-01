import type { ReactNode } from 'react'
import { CreditCardIcon, HomeIcon, MessageCircleIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { BazAvatar } from '@/baz/BazAvatar'
import { BazConversation, type ConversationTurn } from '@/baz/BazConversation'
import type { Suggestion } from '@/baz/SuggestionList'

/**
 * The Baz screen inside the BOI app shell.
 *
 * Everything here is static until M2 wires `baz-turn`. The opening turn is written to match
 * §13 of the vision: disclose that it is AI, then ask what the customer is trying to do.
 */
const opening: readonly ConversationTurn[] = [
  {
    id: 'opening',
    author: 'baz',
    content: (
      <div className="space-y-2">
        <p className="font-medium">Hi, I’m Baz 👋</p>
        <p>
          I’m here to help with your banking, answer your questions, and get things done.
        </p>
        <p>What are you looking to do today?</p>
      </div>
    ),
  },
]

const suggestions: readonly Suggestion[] = [
  { id: 'buy-home', label: 'Buy a home', icon: <HomeIcon /> },
  { id: 'joint-account', label: 'Open a joint account', icon: <UsersIcon /> },
  { id: 'loan', label: 'Explore a loan', icon: <CreditCardIcon /> },
  { id: 'insurance', label: 'Look at insurance', icon: <ShieldIcon /> },
  { id: 'something-else', label: 'Something else', icon: <MessageCircleIcon /> },
]

export function AppBaz(): ReactNode {
  return (
    <div className="flex min-h-0 flex-1 flex-col pb-20">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur">
        <BazAvatar />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Baz</p>
          <p className="text-muted-foreground text-2xs">AI assistant</p>
        </div>
      </header>

      <BazConversation turns={opening} suggestions={suggestions} disabled />

      <p className="text-muted-foreground px-4 pb-2 text-center text-2xs">
        The conversation is wired up in M2. These are the real components.
      </p>
    </div>
  )
}
