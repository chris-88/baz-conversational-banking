import { CreditCardIcon, HomeIcon, MessageCircleIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import type { Suggestion } from '@/baz/SuggestionList'

/**
 * The openers Baz offers before the customer has typed anything.
 *
 * Written as the customer would say it, not as the bank would label it: tapping one is exactly
 * the same as typing it, so it has to read like something a person would actually send.
 */
export const OPENING_SUGGESTIONS: readonly Suggestion[] = [
  { id: 'buy-home', label: 'I want to buy my first home', icon: <HomeIcon /> },
  { id: 'joint-account', label: 'Open a joint account with my partner', icon: <UsersIcon /> },
  { id: 'credit-card', label: 'Get a credit card', icon: <CreditCardIcon /> },
  { id: 'loan', label: 'Explore a personal loan', icon: <MessageCircleIcon /> },
  { id: 'protection', label: 'Look at life insurance', icon: <ShieldIcon /> },
]
