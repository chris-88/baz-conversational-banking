import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCardIcon, HomeIcon, MessageCircleIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { BazAvatar } from '@/baz/BazAvatar'
import { ChatBubble } from '@/baz/ChatBubble'
import { Composer } from '@/baz/Composer'
import { SuggestionList, type Suggestion } from '@/baz/SuggestionList'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { useConversation } from '@/baz/useConversation'
import { startSession } from '@/lib/session'
import { isBackendConfigured } from '@/lib/env'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TriangleAlertIcon } from 'lucide-react'

const suggestions: readonly Suggestion[] = [
  { id: 'buy-home', label: 'Buy a home', icon: <HomeIcon /> },
  { id: 'joint-account', label: 'Open a joint account', icon: <UsersIcon /> },
  { id: 'loan', label: 'Explore a loan', icon: <CreditCardIcon /> },
  { id: 'insurance', label: 'Look at insurance', icon: <ShieldIcon /> },
  { id: 'something-else', label: 'Something else', icon: <MessageCircleIcon /> },
]

const SUGGESTION_MESSAGE: Readonly<Record<string, string>> = {
  'buy-home': 'I’m looking to buy a home.',
  'joint-account': 'I’d like to open a joint account.',
  loan: 'I’m thinking about a loan.',
  insurance: 'I’d like to look at insurance.',
  'something-else': 'I have something else in mind.',
}

/** §6 Stage 1 — the conversation, live. */
export function AppBaz(): ReactNode {
  const [caseId, setCaseId] = useState<string | null>(null)
  // Starts false with no backend, so the effect never has to set it synchronously.
  const [joining, setJoining] = useState(isBackendConfigured)
  const [joinError, setJoinError] = useState<string | null>(null)
  const { entries, streaming, error, send } = useConversation(caseId)
  const bottom = useRef<HTMLDivElement>(null)
  const [searchParams] = useSearchParams()
  // An opening line typed on the public site, carried across rather than retyped (§6 Stage 1).
  const opening = searchParams.get('say')
  const openingSent = useRef(false)

  useEffect(() => {
    if (!isBackendConfigured) return

    let cancelled = false
    startSession('demo')
      .then((session) => {
        if (!cancelled) setCaseId(session.caseId)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setJoinError(caught instanceof Error ? caught.message : 'Could not start a conversation.')
        }
      })
      .finally(() => {
        if (!cancelled) setJoining(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (caseId === null || opening === null || openingSent.current) return
    openingSent.current = true
    void send(opening)
  }, [caseId, opening, send])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries, streaming])

  const started = entries.length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-20">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur">
        <BazAvatar />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Baz</p>
          <p className="text-muted-foreground text-2xs">
            {joining ? 'Connecting…' : streaming ? 'Typing…' : 'AI assistant'}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <ChatBubble author="baz">
          <div className="space-y-2">
            <p className="font-medium">Hi, I&rsquo;m Baz 👋</p>
            <p>I&rsquo;m an AI assistant. I can help with your banking and get things done.</p>
            <p>What are you looking to do today?</p>
          </div>
        </ChatBubble>

        {entries.map((entry, index) => {
          if (entry.kind === 'card') {
            return (
              <div key={entry.id} className="pl-10">
                <CardRenderer card={entry.card} disabled />
              </div>
            )
          }

          // Only the last bubble in a run of same-author messages carries the avatar.
          const next = entries[index + 1]
          const endsRun = next === undefined || next.kind !== 'message' || next.author !== entry.author

          return (
            <ChatBubble key={entry.id} author={entry.author} showAvatar={endsRun}>
              <span className="whitespace-pre-wrap">{entry.text}</span>
            </ChatBubble>
          )
        })}

        {!started && !joining && caseId !== null && (
          <SuggestionList
            suggestions={suggestions}
            className="pt-1 pl-10"
            disabled={streaming}
            onSelect={(suggestion) => {
              void send(SUGGESTION_MESSAGE[suggestion.id] ?? suggestion.label)
            }}
          />
        )}

        {(joinError ?? error) !== null && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{joinError ?? error}</AlertDescription>
          </Alert>
        )}

        {!isBackendConfigured && (
          <Alert>
            <TriangleAlertIcon />
            <AlertDescription>Not connected to a backend.</AlertDescription>
          </Alert>
        )}

        <div ref={bottom} />
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
        <Composer
          disabled={joining || streaming || caseId === null}
          onSend={(message) => void send(message)}
        />
      </div>
    </div>
  )
}
