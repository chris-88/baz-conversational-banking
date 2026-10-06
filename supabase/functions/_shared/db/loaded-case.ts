import type { CaseKind } from '../domain/case.ts'
import type { ApplicationId, Fact, ParticipantId, ParticipantRole } from '../domain/facts.ts'
import type { Product } from '../domain/journey.ts'
import type { Application } from '../domain/state-machine.ts'
import type { PersonaSliders } from '../llm/persona.ts'

/**
 * Everything a turn needs, loaded once and then used purely.
 *
 * Deliberately free of Deno and of the Supabase client: the repository fills this in, and
 * everything downstream — the digest, the requirement engine, the advisories — is a pure
 * function of it, so a turn can be reasoned about and tested without a database.
 */

export type LoadedParticipant = {
  readonly id: ParticipantId
  readonly role: ParticipantRole
  readonly displayName: string | null
}

export type LoadedConfirmation = {
  readonly applicationId: ApplicationId
  readonly requirementId: string
}

export type LoadedDocument = {
  readonly applicationId: ApplicationId
  readonly requirementId: string
  readonly verified: boolean
}

export type LoadedRequest = {
  readonly id: string
  readonly applicationId: ApplicationId
  readonly requirementId: string
  readonly status: 'open' | 'fulfilled' | 'cancelled'
  readonly detail: string | null
}

export type LoadedProductInterest = {
  readonly product: Product
  readonly status: 'offered' | 'accepted' | 'declined' | 'deferred'
  readonly reason: string | null
}

export type LoadedMessage = {
  readonly role: 'customer' | 'baz' | 'system'
  readonly content: string
  /** Types of the cards rendered with this turn, oldest first. */
  readonly cards: readonly string[]
}

export type LoadedEvent = {
  readonly type: string
  readonly createdAt: string
  readonly payload: Record<string, unknown>
}

export type LoadedCase = {
  readonly caseId: string
  readonly kind: CaseKind
  readonly authLevel: 'anonymous' | 'authenticated'
  readonly customerName: string | null
  readonly lastSeenAt: string | null

  readonly participants: readonly LoadedParticipant[]
  readonly facts: readonly Fact[]
  readonly applications: readonly Application[]
  readonly confirmations: readonly LoadedConfirmation[]
  readonly documents: readonly LoadedDocument[]
  readonly requests: readonly LoadedRequest[]
  readonly productInterests: readonly LoadedProductInterest[]

  /** Oldest first. Only the tail is sent to the model. */
  readonly messages: readonly LoadedMessage[]
  readonly eventsSinceLastSeen: readonly LoadedEvent[]

  readonly persona: PersonaSliders
  readonly killSwitch: boolean
}

export function participantFor(
  loaded: Pick<LoadedCase, 'participants'>,
  role: ParticipantRole,
): ParticipantId | null {
  return loaded.participants.find((participant) => participant.role === role)?.id ?? null
}

/** The previous Baz turn, which the gate needs so short answers classify correctly. */
export function previousAssistantTurn(loaded: Pick<LoadedCase, 'messages'>): string | undefined {
  for (let index = loaded.messages.length - 1; index >= 0; index -= 1) {
    const message = loaded.messages[index]
    if (message?.role === 'baz') return message.content
  }
  return undefined
}
