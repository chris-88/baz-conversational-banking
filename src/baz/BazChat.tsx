import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChatBubble } from '@/baz/ChatBubble'
import { Composer } from '@/baz/Composer'
import { SuggestionList, type Suggestion } from '@/baz/SuggestionList'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { useConversation } from '@/baz/useConversation'
import { startSession } from '@/lib/session'
import { loadHistory } from '@/baz/history'
import { runCaseAction } from '@/lib/caseActions'
import type { CardActions } from '@/baz/cards/CardRenderer'
import type { Product } from '@domain/journey.ts'
import { isBackendConfigured } from '@/lib/env'

/**
 * The conversation itself: joins a case, shows the turns, offers openers, takes input.
 *
 * Both the public website and the app render this — the only difference is the chrome around
 * it, which is the point of §32: Baz is the same capability wherever it is placed.
 */
export function BazChat({
  suggestions,
  openingMessage,
  greeting,
  mode = 'demo',
  footer,
  className,
}: {
  suggestions: readonly Suggestion[]
  /** A line typed elsewhere and carried in, sent automatically on arrival. */
  openingMessage?: string | null
  greeting: ReactNode
  /** `fresh` knows nothing about the visitor; `demo` joins the seeded customer (§46). */
  mode?: 'demo' | 'fresh'
  /** Shown once there is something worth carrying into the app (§29). */
  footer?: (caseId: string) => ReactNode
  className?: string | undefined
}): ReactNode {
  const [caseId, setCaseId] = useState<string | null>(null)
  const [joining, setJoining] = useState(isBackendConfigured)
  const [joinError, setJoinError] = useState<string | null>(null)
  const { entries, streaming, error, send, loadFrom } = useConversation(caseId)
  const [loadingHistory, setLoadingHistory] = useState(isBackendConfigured)

  const bottom = useRef<HTMLDivElement>(null)
  const openingSent = useRef(false)
  const [actionError, setActionError] = useState<string | null>(null)

  /**
   * Runs an action, then tells Baz what happened so it can react. The follow-up is phrased as
   * the customer, because from the model's point of view the customer did it — which is true.
   */
  const commit = async (action: Parameters<typeof runCaseAction>[0], followUp: string) => {
    setActionError(null)
    try {
      const result = await runCaseAction(action)
      await send(`${result.summary} ${followUp}`)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'That did not work.')
    }
  }

  useEffect(() => {
    if (!isBackendConfigured) return

    let cancelled = false
    startSession(mode)
      .then(async (session) => {
        if (cancelled) return
        setCaseId(session.caseId)

        // Show what was said before, so the screen matches what the model remembers.
        try {
          const history = await loadHistory(session.caseId)
          if (!cancelled) loadFrom(history)
        } finally {
          if (!cancelled) setLoadingHistory(false)
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setJoinError(caught instanceof Error ? caught.message : 'Could not start a conversation.')
          setLoadingHistory(false)
        }
      })
      .finally(() => {
        if (!cancelled) setJoining(false)
      })

    return () => {
      cancelled = true
    }
    // loadFrom is stable; listed to satisfy the exhaustive-deps rule honestly.
  }, [loadFrom, mode])

  useEffect(() => {
    if (caseId === null || loadingHistory || !openingMessage || openingSent.current) return
    openingSent.current = true
    void send(openingMessage)
  }, [caseId, loadingHistory, openingMessage, send])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries, streaming])

  const ready = caseId !== null && !joining && !loadingHistory
  const problem = joinError ?? error ?? actionError

  /**
   * The customer's taps. Each one goes to `case-action`, which re-validates everything, and
   * the outcome is told back to Baz so the conversation stays in step with the case
   * (Invariant 1, Invariant 2).
   */
  const actions: CardActions = {
    onSelectProducts: (products) =>
      commit(
        { action: 'select_products', caseId: caseId ?? '', products: products as Product[] },
        'What did that start, and what do you need from me first?',
      ),
    onDeclineProducts: (products) =>
      commit(
        { action: 'decline_product', caseId: caseId ?? '', product: products[0] as Product },
        'I will leave those for now.',
      ),
    onSubmit: (applicationId, confirmations) =>
      commit(
        { action: 'submit_application', applicationId, confirmations: [...confirmations] },
        'What happens next?',
      ),
    onInvitePartner: async (name) => {
      setActionError(null)
      try {
        const result = await runCaseAction({ action: 'invite_partner', caseId: caseId ?? '', name })
        await send(`${result.summary} What happens on their side?`)
        return result.inviteUrl
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'That did not work.')
        return undefined
      }
    },
    onConsent: (applicationId, requirementId) =>
      commit(
        { action: 'grant_consent', applicationId, requirementId },
        'What do you need from me now?',
      ),
    onHealthForm: (applicationId, values) =>
      commit(
        { action: 'submit_health_form', applicationId, values: [...values] },
        'Where does that leave the application?',
      ),
    onPauseDecision: (applicationId, decision) =>
      decision === 'pause'
        ? commit({ action: 'pause_application', applicationId }, 'I have put that on hold.')
        : Promise.resolve(),
  }

  return (
    <div className={className}>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <ChatBubble author="baz">{greeting}</ChatBubble>

        {entries.map((entry, index) => {
          if (entry.kind === 'card') {
            return (
              <div key={entry.id} className="pl-10">
                <CardRenderer card={entry.card} actions={actions} disabled={streaming} />
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

        {entries.length === 0 && ready && !openingMessage && (
          <SuggestionList
            suggestions={suggestions}
            className="pt-1 pl-10"
            disabled={streaming}
            onSelect={(suggestion) => void send(suggestion.label)}
          />
        )}

        {problem !== null && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{problem}</AlertDescription>
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

      {footer !== undefined && caseId !== null && entries.length > 0 && (
        <div className="px-4 pb-2">{footer(caseId)}</div>
      )}

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
        <Composer disabled={!ready || streaming} onSend={(message) => void send(message)} />
        <p className="text-muted-foreground mt-2 text-center text-2xs">
          {joining ? 'Connecting…' : streaming ? 'Baz is typing…' : 'Baz is an AI assistant.'}
        </p>
      </div>
    </div>
  )
}
