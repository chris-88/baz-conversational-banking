import { BabyIcon, HomeIcon, MessageCircleIcon, UsersIcon, WalletIcon } from 'lucide-react'
import type { Suggestion } from '@/baz/SuggestionList'

/**
 * The openers Baz offers before the customer has typed anything.
 *
 * Situations, not products. A menu of five products is the thing this is meant to replace —
 * it makes the customer choose the answer before anyone has worked out the question, and it
 * contradicts the promise that knowing which product you need is Baz's job, not theirs. Each
 * of these is somewhere a conversation can start and several products might come out of it.
 */
export const OPENING_SUGGESTIONS: readonly Suggestion[] = [
  { id: 'buying', label: 'We’re hoping to buy a place', icon: <HomeIcon /> },
  { id: 'baby', label: 'We’ve just had a baby', icon: <BabyIcon /> },
  { id: 'together', label: 'We’re moving in together', icon: <UsersIcon /> },
  { id: 'spending', label: 'I’ve got something big coming up', icon: <WalletIcon /> },
  { id: 'unsure', label: 'I’m not sure — can we talk it through?', icon: <MessageCircleIcon /> },
]
