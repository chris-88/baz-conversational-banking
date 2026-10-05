import { useCallback, useRef, useState } from 'react'
import type { Card } from '@contracts/cards.ts'
import { streamBazTurn } from '@/baz/bazTurnClient'

export type TurnEntry =
  | { readonly kind: 'message'; readonly id: string; readonly author: 'baz' | 'customer'; readonly text: string }
  | { readonly kind: 'card'; readonly id: string; readonly card: Card }

/**
 * Drives one conversation.
 *
 * Deliberately local state rather than TanStack Query: a turn is a stream of deltas, not a
 * fetched resource. Persisted history is loaded separately and this holds only what is
 * happening now.
 */
export function useConversation(caseId: string | null) {
  const [entries, setEntries] = useState<readonly TurnEntry[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const counter = useRef(0)

  const nextId = () => {
    counter.current += 1
    return `entry-${String(counter.current)}`
  }

  const send = useCallback(
    async (message: string, trigger: 'message' | 'opening' | 'return' = 'message') => {
      if (!caseId || streaming) return

      setError(null)
      setStreaming(true)

      if (trigger === 'message' && message.length > 0) {
        // Shown immediately: the customer should never wonder whether it sent.
        setEntries((current) => [
          ...current,
          { kind: 'message', id: nextId(), author: 'customer', text: message },
        ])
      }

      const replyId = nextId()
      let reply = ''

      try {
        await streamBazTurn(
          { caseId, trigger, ...(trigger === 'message' ? { message } : {}) },
          (event) => {
            switch (event.type) {
              case 'text_delta': {
                reply += event.text
                setEntries((current) => {
                  const existing = current.find((entry) => entry.id === replyId)
                  if (!existing) {
                    return [...current, { kind: 'message', id: replyId, author: 'baz', text: reply }]
                  }
                  return current.map((entry) =>
                    entry.id === replyId && entry.kind === 'message'
                      ? { ...entry, text: reply }
                      : entry,
                  )
                })
                break
              }

              case 'card':
                setEntries((current) => [...current, { kind: 'card', id: nextId(), card: event.card }])
                break

              case 'error':
                setError(event.error.message)
                break

              case 'status':
              case 'done':
                break
            }
          },
        )
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Something went wrong.')
      } finally {
        setStreaming(false)
      }
    },
    [caseId, streaming],
  )

  /** Replaces the transcript with what is persisted, before any new turn is taken. */
  const loadFrom = useCallback(
    (messages: readonly { id: string; author: 'baz' | 'customer'; text: string }[]) => {
      setEntries(messages.map((message) => ({ kind: 'message', ...message })))
    },
    [],
  )

  return { entries, streaming, error, send, loadFrom }
}
