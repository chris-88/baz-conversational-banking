import { describe, expect, it } from 'vitest'
import { AWAITING_CARDS } from '../../contracts/cards.ts'
import { awaitingCard, type AwaitingContext } from './awaiting.ts'

type Message = AwaitingContext['messages'][number]

const baz = (cards: readonly string[] = []): Message => ({ role: 'baz', cards })
const customer = (): Message => ({ role: 'customer', cards: [] })
/** What a tap leaves behind: the app reports it to Baz, and the report is saved as `system`. */
const tap = (): Message => ({ role: 'system', cards: [] })

const loaded = (over: Partial<AwaitingContext> = {}): AwaitingContext => ({
  authLevel: 'anonymous',
  messages: [],
  applications: [],
  productInterests: [],
  requests: [],
  participants: [{ role: 'primary' }],
  ...over,
})

describe('the card still waiting for the customer', () => {
  it('is nothing when no card has been shown', () => {
    expect(awaitingCard(loaded())).toBeNull()
    expect(awaitingCard(loaded({ messages: [customer(), baz()] }))).toBeNull()
  })

  it('is nothing when the only cards are things to read', () => {
    expect(awaitingCard(loaded({ messages: [baz(['status']), customer(), baz(['data_notice'])] })))
      .toBeNull()
  })

  /**
   * The turn this was built from. Baz put a joint current account on screen, the customer
   * wrote "Great", and Baz took the word for the tap.
   */
  it('is the options card the customer answered in words', () => {
    expect(awaitingCard(loaded({ messages: [customer(), baz(['product_options'])] }))).toEqual({
      type: 'product_options',
      turnsAgo: 1,
    })
  })

  it('counts how far back the card is in Baz’s own replies', () => {
    // The case is loaded before the message being answered is saved, so the reply in hand is
    // not in the transcript: a card on the last Baz message is one turn back, not none.
    const messages = [baz(['product_options']), customer(), baz(), customer(), baz()]
    expect(awaitingCard(loaded({ messages }))?.turnsAgo).toBe(3)
  })

  /** §67: the mortgage is under way when the joint account is offered. */
  it('still waits when an older application exists but nothing was tapped since', () => {
    const result = awaitingCard(
      loaded({
        applications: [{ state: 'in_progress' }],
        messages: [baz(['product_options'])],
      }),
    )
    expect(result?.type).toBe('product_options')
  })

  it('is settled by the tap that started something', () => {
    expect(
      awaitingCard(
        loaded({
          applications: [{ state: 'in_progress' }],
          messages: [baz(['product_options']), tap(), baz()],
        }),
      ),
    ).toBeNull()
  })

  it('is settled by leaving every option on it', () => {
    expect(
      awaitingCard(
        loaded({
          productInterests: [{ status: 'declined' }],
          messages: [baz(['product_options']), tap(), baz()],
        }),
      ),
    ).toBeNull()
  })

  it('is not settled by a tap that left the case as it was', () => {
    // Signing in is reported as a tap too. It starts nothing, so the options are still open.
    const result = awaitingCard(loaded({ messages: [baz(['product_options']), tap(), baz()] }))
    expect(result?.type).toBe('product_options')
  })

  it('ignores a tap that came before the card', () => {
    const result = awaitingCard(
      loaded({
        applications: [{ state: 'in_progress' }],
        messages: [tap(), baz(['product_options'])],
      }),
    )
    expect(result?.type).toBe('product_options')
  })

  it('is replaced by a later card that asks something else', () => {
    const messages = [baz(['product_options']), customer(), baz(['review'])]
    expect(awaitingCard(loaded({ messages }))).toEqual({ type: 'review', turnsAgo: 1 })
  })

  it('skips a reply that drew nothing waiting, back to the one that did', () => {
    const messages = [baz(['product_options']), customer(), baz(['status'])]
    expect(awaitingCard(loaded({ messages }))).toEqual({ type: 'product_options', turnsAgo: 2 })
  })
})

describe('what settles each card', () => {
  it('a review, once the application is with the bank', () => {
    const messages = [baz(['review']), tap(), baz()]
    expect(awaitingCard(loaded({ messages, applications: [{ state: 'submitted' }] }))).toBeNull()
    expect(awaitingCard(loaded({ messages, applications: [{ state: 'ready' }] }))?.type).toBe(
      'review',
    )
  })

  it('a plan, by either decision', () => {
    expect(awaitingCard(loaded({ messages: [baz(['plan_proposal']), tap()] }))).toBeNull()
    expect(awaitingCard(loaded({ messages: [baz(['plan_proposal'])] }))?.type).toBe(
      'plan_proposal',
    )
  })

  it('an arrangement, once the accounts exist', () => {
    const messages = [baz(['arrangement']), tap(), baz()]
    expect(awaitingCard(loaded({ messages, applications: [{ state: 'in_progress' }] }))).toBeNull()
    expect(awaitingCard(loaded({ messages }))?.type).toBe('arrangement')
  })

  it('a pause prompt, by pausing or by carrying on', () => {
    expect(awaitingCard(loaded({ messages: [baz(['pause_prompt']), tap()] }))).toBeNull()
    // Continuing commits nothing, so nothing is saved: somebody who talks on has continued.
    expect(awaitingCard(loaded({ messages: [baz(['pause_prompt']), customer(), baz()] }))).toBeNull()
    expect(awaitingCard(loaded({ messages: [baz(['pause_prompt'])] }))?.type).toBe('pause_prompt')
  })

  it('a partner invite, once the partner exists', () => {
    const messages = [baz(['partner_invite']), tap()]
    expect(
      awaitingCard(
        loaded({ messages, participants: [{ role: 'primary' }, { role: 'partner' }] }),
      ),
    ).toBeNull()
    expect(awaitingCard(loaded({ messages }))?.type).toBe('partner_invite')
  })

  it('an upload request, once a request was fulfilled', () => {
    const messages = [baz(['upload_request']), tap()]
    expect(awaitingCard(loaded({ messages, requests: [{ status: 'fulfilled' }] }))).toBeNull()
    expect(awaitingCard(loaded({ messages, requests: [{ status: 'open' }] }))?.type).toBe(
      'upload_request',
    )
  })

  it('the consent and form cards, on the tap alone', () => {
    for (const type of ['consent', 'form_declarations', 'form_upload', 'health_form'] as const) {
      expect(awaitingCard(loaded({ messages: [baz([type]), tap()] })), type).toBeNull()
      expect(awaitingCard(loaded({ messages: [baz([type])] }))?.type, type).toBe(type)
    }
  })

  it('the sign-in offer, by signing in or by moving on', () => {
    expect(
      awaitingCard(loaded({ authLevel: 'authenticated', messages: [baz(['sign_in'])] })),
    ).toBeNull()
    expect(awaitingCard(loaded({ messages: [baz(['sign_in']), customer(), baz()] }))).toBeNull()
    expect(awaitingCard(loaded({ messages: [baz(['sign_in'])] }))?.type).toBe('sign_in')
  })

  it('does not let the server’s sign-in offer outrank the card the model asked with', () => {
    const messages = [baz(['product_options', 'sign_in'])]
    expect(awaitingCard(loaded({ messages }))?.type).toBe('product_options')
  })

  it('never waits on a comparison or a quote, which words answer', () => {
    expect(awaitingCard(loaded({ messages: [baz(['comparison'])] }))).toBeNull()
    expect(awaitingCard(loaded({ messages: [baz(['quote'])] }))).toBeNull()
  })

  it('lets a comparison end the wait on anything older', () => {
    const messages = [baz(['product_options']), customer(), baz(['comparison'])]
    expect(awaitingCard(loaded({ messages }))).toBeNull()
  })

  it('classifies every card the contract says waits for the customer', () => {
    for (const type of AWAITING_CARDS) {
      const result = awaitingCard(loaded({ messages: [baz([type])] }))
      expect(result === null || result.type === type, type).toBe(true)
    }
  })
})
