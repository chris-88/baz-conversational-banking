import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChatBubble } from '@/baz/ChatBubble'
import { TypingBubble } from '@/baz/TypingBubble'
import { Composer } from '@/baz/Composer'
import { SuggestionList, type Suggestion } from '@/baz/SuggestionList'
import { CardRenderer } from '@/baz/cards/CardRenderer'
import { useConversation } from '@/baz/useConversation'
import { startSession } from '@/lib/session'
import { loadHistory } from '@/baz/history'
import { runCaseAction } from '@/lib/caseActions'
import { callFunctionWithFile } from '@/lib/callFunction'
import type { CardActions } from '@/baz/cards/CardRenderer'
import type { Product } from '@domain/journey.ts'
import { isBackendConfigured } from '@/lib/env'
import { cn } from '@/lib/utils'

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
  mode = 'new',
  footer,
  composerClassName,
  className,
}: {
  suggestions: readonly Suggestion[]
  /** A line typed elsewhere and carried in, sent automatically on arrival. */
  openingMessage?: string | null
  greeting: ReactNode
  /** `fresh` knows nothing about the visitor; `demo` joins the seeded customer (§46). */
  mode?: 'new' | 'known'
  /** Shown once there is something worth carrying into the app (§29). */
  footer?: (caseId: string) => ReactNode
  /** Extra space under the composer, for shells with a fixed bar of their own. */
  composerClassName?: string | undefined
  className?: string | undefined
}): ReactNode {
  const [caseId, setCaseId] = useState<string | null>(null)
  const [joining, setJoining] = useState(isBackendConfigured)
  const [joinError, setJoinError] = useState<string | null>(null)
  const { entries, streaming, error, send, loadFrom, reset } = useConversation(caseId)
  const [loadingHistory, setLoadingHistory] = useState(isBackendConfigured)

  const transcript = useRef<HTMLDivElement>(null)
  const openingSent = useRef(false)
  const returnSent = useRef(false)
  const [hasUpdates, setHasUpdates] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  /**
   * Runs an action, then tells Baz what happened so it can react. The follow-up is phrased as
   * the customer, because from the model's point of view the customer did it — which is true.
   */
  /**
   * Returns whether the action actually went through. A card may only tell the customer
   * something is done once the server has said so — the model's reply arrives separately and
   * cannot be the evidence (Invariant 2).
   */
  const commit = async (
    action: Parameters<typeof runCaseAction>[0],
    followUp: string,
  ): Promise<boolean> => {
    setActionError(null)
    try {
      const result = await runCaseAction(action)

      // Report the outcome as soon as the server confirms it. Telling Baz is a full streamed
      // turn, and awaiting that first left the card that committed the action sitting on
      // "Submitting…" for the whole reply with the answer already in hand. Cards are disabled
      // while a turn streams, so nothing else can be committed in the meantime.
      void send(`${result.summary} ${followUp}`)
      return true
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'That did not work.')
      return false
    }
  }

  /**
   * The presenter resets the case from the console and every open screen is suddenly attached
   * to a participant that no longer exists, so the next turn fails with "This is not your
   * case." and the phone is dead until someone clears its storage. That will happen on the
   * day, so it recovers itself: a fresh session on the rebuilt case, and a clean transcript.
   */
  useEffect(() => {
    if (error === null || !/not your case|no such case/i.test(error)) return

    let cancelled = false
    startSession(mode)
      .then((session) => {
        if (cancelled) return
        reset()
        setCaseId(session.caseId)
      })
      .catch(() => {
        // Leave the original error on screen; a second failure is not more informative.
      })

    return () => {
      cancelled = true
    }
  }, [error, mode, reset])

  useEffect(() => {
    if (!isBackendConfigured) return

    let cancelled = false
    startSession(mode)
      .then(async (session) => {
        if (cancelled) return
        setCaseId(session.caseId)
        setHasUpdates(session.hasUpdates)

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

  /**
   * §36 — the customer did not ask anything, they came back. The turn runs itself so the first
   * thing they see is what changed, not an empty composer.
   */
  useEffect(() => {
    if (caseId === null || loadingHistory || !hasUpdates || returnSent.current) return
    if (openingMessage) return
    returnSent.current = true
    void send('', 'return')
  }, [caseId, loadingHistory, hasUpdates, openingMessage, send])

  /**
   * Keep the newest turn in view.
   *
   * `scrollIntoView` moved the nearest scrollable ancestor — the page, not the transcript —
   * which nudged the whole screen and left Baz's reply under the composer. Scrolling the
   * transcript itself is exact. It only follows when the customer is already at the bottom,
   * so scrolling up to re-read something is not yanked back down mid-stream.
   */
  useEffect(() => {
    const el = transcript.current
    if (el === null) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom > 160) return

    el.scrollTop = el.scrollHeight
  }, [entries, streaming])

  // Once Baz's own bubble exists the dots would sit beneath it saying the same thing.
  const last = entries.at(-1)
  const lastIsBaz = last !== undefined && last.kind === 'message' && last.author === 'baz'

  const ready = caseId !== null && !joining && !loadingHistory
  const problem = joinError ?? error ?? actionError

  /**
   * The customer's taps. Each one goes to `case-action`, which re-validates everything, and
   * the outcome is told back to Baz so the conversation stays in step with the case
   * (Invariant 1, Invariant 2).
   */
  const actions: CardActions = {
    onSelectProducts: async (products) => {
      await commit(
        { action: 'select_products', caseId: caseId ?? '', products: products as Product[] },
        'What did that start, and what do you need from me first?',
      )
    },
    onDeclineProducts: async (products) => {
      await commit(
        { action: 'decline_product', caseId: caseId ?? '', product: products[0] as Product },
        'I will leave those for now.',
      )
    },
    onSubmit: (applicationId, confirmations) =>
      commit(
        { action: 'submit_application', applicationId, confirmations: [...confirmations] },
        'What happens next?',
      ),
    onInvitePartner: async (name) => {
      setActionError(null)
      try {
        const result = await runCaseAction({ action: 'invite_partner', caseId: caseId ?? '', name })

        // The link exists the moment the server returns it, so it goes on screen now rather
        // than ten seconds later when Baz has finished talking about it.
        void send(`${result.summary} What happens on their side?`)
        return result.inviteUrl
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'That did not work.')
        return undefined
      }
    },
    onConsent: async (applicationId, requirementId) => {
      await commit(
        { action: 'grant_consent', applicationId, requirementId },
        'What do you need from me now?',
      )
    },
    onHealthForm: async (applicationId, values) => {
      await commit(
        { action: 'submit_health_form', applicationId, values: [...values] },
        'Where does that leave the application?',
      )
    },
    onConfirmPlan: (planId) =>
      commit(
        { action: 'decide_plan', caseId: caseId ?? '', planId, decision: 'keep' },
        'What should we do first?',
      ),
    onDeclinePlan: async (planId) => {
      await commit(
        { action: 'decide_plan', caseId: caseId ?? '', planId, decision: 'not_now' },
        'We can come back to it.',
      )
    },
    onUpload: async (requestId, file, documentType) => {
      setActionError(null)
      const form = new FormData()
      form.append('requestId', requestId)
      form.append('documentType', documentType)
      form.append('file', file)

      // Throws on failure so the card can say so where the customer is looking, rather than
      // the error appearing somewhere else on screen.
      await callFunctionWithFile('upload', form)
      void send(`I have uploaded ${file.name}. What is next?`)
    },
    onPauseDecision: async (applicationId, decision) => {
      if (decision === 'pause') {
        await commit({ action: 'pause_application', applicationId }, 'I have put that on hold.')
      }
    },
  }

  return (
    <div className={className}>
      <div ref={transcript} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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

        {streaming && !lastIsBaz && <TypingBubble />}

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

      </div>

      {footer !== undefined && caseId !== null && entries.length > 0 && (
        <div className="px-4 pb-2">{footer(caseId)}</div>
      )}

      <div
        className={cn(
          'bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur',
          composerClassName,
        )}
      >
        <Composer disabled={!ready || streaming} onSend={(message) => void send(message)} />
        <p className="text-muted-foreground mt-2 text-center text-2xs">
          {joining ? 'Connecting…' : 'Baz is an AI assistant.'}
        </p>
      </div>
    </div>
  )
}
