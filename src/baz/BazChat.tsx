import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChatBubble } from '@/baz/ChatBubble'
import { TypingBubble } from '@/baz/TypingBubble'
import { Composer } from '@/baz/Composer'
import { SuggestionList, type Suggestion } from '@/baz/SuggestionList'
import { QUOTE_FOLLOW_UPS } from '@/baz/suggestions'
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

  /**
   * The fork offered after a quote option has been talked through.
   *
   * Local and short-lived: anything the customer does next clears it, because a pair of chips
   * still sitting there two turns later is answering a question nobody is still asking.
   */
  const [followUps, setFollowUps] = useState<readonly Suggestion[]>([])
  const [loadingHistory, setLoadingHistory] = useState(isBackendConfigured)

  const transcript = useRef<HTMLDivElement>(null)
  /** Whether they were reading the newest turn, remembered from before the keyboard opens. */
  const atBottom = useRef(true)
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
    nudge: string,
  ): Promise<boolean> => {
    setActionError(null)
    try {
      const result = await runCaseAction(action)

      /**
       * Reported as an action, not as something the customer said.
       *
       * It used to go through as a `message`, so the server stored it as customer speech and
       * the transcript showed "Started Savings account, Joint current account, Mortgage. 7
       * things carried over." in their own bubble. They ticked two boxes.
       *
       * Sent as soon as the server confirms rather than awaited: telling Baz is a full streamed
       * turn, and waiting left the card that committed the action sitting on "Submitting…" with
       * the answer already in hand. Cards are disabled while a turn streams, so nothing else
       * can be committed in the meantime.
       */
      void send(result.summary, 'action', nudge)
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
    atBottom.current = true
  }, [entries, streaming])

  /**
   * And keep it in view when the keyboard opens.
   *
   * The transcript gets shorter the moment the keyboard appears, which pushes whatever was at
   * the bottom out of sight — the reply and the options the customer was about to tap. Nothing
   * in the conversation changed, so the effect above never runs.
   *
   * Whether they were at the bottom has to be remembered from before the resize. Measuring it
   * afterwards always says no: shrinking the box is itself what put the bottom out of reach.
   */
  useEffect(() => {
    const el = transcript.current
    const viewport = window.visualViewport
    if (el === null || !viewport) return undefined

    const remember = () => {
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 160
    }

    const pin = () => {
      if (!atBottom.current) return

      /*
       * After the next frame, not now. The resize handler runs before the browser has
       * reflowed for the new height, so scrolling here lands on where the bottom used to be
       * and leaves the newest turn just as hidden.
       */
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }

    el.addEventListener('scroll', remember, { passive: true })
    viewport.addEventListener('resize', pin)

    return () => {
      el.removeEventListener('scroll', remember)
      viewport.removeEventListener('resize', pin)
    }
  }, [])

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
        'Say what is now in progress and what you need from them first.',
      )
    },
    /**
     * A quote option the customer wants to go through.
     *
     * Nothing is committed — no application, no recorded decision.
     *
     * The instruction used to end "then keep finding out what the money is for and how soon they
     * expect to clear it", and Baz did exactly that: it explained the four-year fixed and in the
     * same breath asked what the two of them earned and which county the house was in. Somebody
     * who has just chosen something to look at more closely has not finished looking at it.
     *
     * So the turn ends on their move instead — more about this option, or what applying would
     * involve — and discovery picks up after they have answered. Same reason the product options
     * card says not to ask a question in the turn that offers it: explaining and interrogating at
     * once reads as not listening.
     */
    onDiscussQuote: async (option) => {
      setFollowUps([])
      await send(
        `Chose "${option.name}" to talk through.`,
        'action',
        'Explain what that option means in practice and what is good and less good about it, in ' +
          'a few sentences. Then stop and let them steer: ask whether they want to go further ' +
          'into this one or hear what applying would actually involve. Ask nothing else in this ' +
          'turn — no income, no property, no timing, however obviously you need it next. Do not ' +
          'start an application.',
      )
      setFollowUps(QUOTE_FOLLOW_UPS)
    },

    onDeclineProducts: async (products) => {
      await commit(
        { action: 'decline_product', caseId: caseId ?? '', product: products[0] as Product },
        'Acknowledge briefly and move on; do not raise those again.',
      )
    },
    onSubmit: (applicationId, confirmations) =>
      commit(
        { action: 'submit_application', applicationId, confirmations: [...confirmations] },
        'Say what happens next and roughly when.',
      ),
    onInvitePartner: async (name) => {
      setActionError(null)
      try {
        const result = await runCaseAction({ action: 'invite_partner', caseId: caseId ?? '', name })

        // The link exists the moment the server returns it, so it goes on screen now rather
        // than ten seconds later when Baz has finished talking about it.
        void send(result.summary, 'action', 'Say what happens on their side.')
        return result.inviteUrl
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'That did not work.')
        return undefined
      }
    },
    onConsent: async (applicationId, requirementId) => {
      await commit(
        { action: 'grant_consent', applicationId, requirementId },
        'Say what is still outstanding on that application.',
      )
    },
    onHealthForm: async (applicationId, values) => {
      await commit(
        { action: 'submit_health_form', applicationId, values: [...values] },
        'Say where that leaves the application.',
      )
    },
    onConfirmPlan: (planId) =>
      commit(
        { action: 'decide_plan', caseId: caseId ?? '', planId, decision: 'keep' },
        'Say what is worth doing first.',
      ),
    onDeclinePlan: async (planId) => {
      await commit(
        { action: 'decide_plan', caseId: caseId ?? '', planId, decision: 'not_now' },
        'Confirm it is parked and say what would bring it back.',
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
      void send(
        `Uploaded ${file.name}.`,
        'action',
        'Say whether that clears the request and what is still outstanding.',
      )
    },
    onPauseDecision: async (applicationId, decision) => {
      if (decision === 'pause') {
        await commit({ action: 'pause_application', applicationId }, 'I have put that on hold.')
      }
    },
  }

  return (
    <div className={className}>
      <div ref={transcript} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
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

        {/*
          Only after a turn has finished. Offering a choice while Baz is still mid-sentence
          invites a tap that lands in the middle of the answer it is replying to.
        */}
        {followUps.length > 0 && !streaming && (
          <SuggestionList
            suggestions={followUps}
            className="pt-1 pl-10"
            disabled={streaming}
            onSelect={(suggestion) => {
              setFollowUps([])
              void send(suggestion.label)
            }}
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

      {/*
        Nothing under the composer.
        
        "Baz is an AI assistant." sat there taking a line and a margin on the one screen where
        space is scarcest, and the header says it already. `--safe-bottom` is the home indicator
        when there is one and zero when the keyboard covers it, which is where the rest of the
        dead space was going.
      */}
      <div
        className={cn(
          'bg-background/95 supports-[backdrop-filter]:bg-background/80 shrink-0 border-t px-4 pt-2.5 pb-[max(0.625rem,var(--safe-bottom))] backdrop-blur',
          composerClassName,
        )}
      >
        <Composer
          disabled={!ready || streaming}
          onSend={(message) => {
            setFollowUps([])
            void send(message)
          }}
          {...(joining ? { placeholder: 'Connecting…' } : {})}
        />
      </div>
    </div>
  )
}
