import { requireSupabase } from '@/lib/supabase'
import type { Card } from '@contracts/cards.ts'

/**
 * What became of a card, read from the case rather than remembered.
 *
 * A card is persisted as the payload the model asked for, which is what it offered and not
 * what happened next. Reloading a conversation therefore put every decision back on screen as
 * though it were still open: the plan could be kept again, the products chosen again, the
 * sign-in link requested again by somebody already signed in.
 *
 * Invariant 2 is the answer and it already applies everywhere else. State comes from the
 * database, so a card showing a decision renders what the database says about that decision.
 * Tapping the same card twice was always refused by `case-action`; this is about not offering.
 *
 * Read under RLS beside the messages, which only the primary customer of this case can see.
 */

export type Settled = {
  /**
   * What happened, in the customer's terms.
   *
   * This replaces the card rather than captioning it, so it has to stand on its own: the
   * options, the rates and the buttons are no longer on screen to supply the context.
   */
  readonly label: string
  /** One line of detail or reassurance, where there is something worth adding. */
  readonly note?: string
}

type CaseState = {
  readonly applications: readonly {
    readonly id: string
    readonly product: string
    readonly state: string
    readonly catalogue_id: string | null
  }[]
  readonly interests: readonly { readonly product: string; readonly status: string }[]
  readonly plans: readonly { readonly id: string; readonly status: string }[]
  readonly requests: readonly { readonly id: string; readonly status: string }[]
  readonly formAnswers: readonly { readonly field_id: string; readonly source: string }[]
  readonly signedIn: boolean
  /** Requirements satisfied without asking, per application: the §53 count, from `events`. */
  readonly reusedBy: ReadonlyMap<string, number>
}

/** Everything a card might need to know about, in one round of parallel reads. */
export async function loadCaseState(caseId: string): Promise<CaseState> {
  const supabase = requireSupabase()

  const [applications, interests, plans, requests, formApplications, user, reused] =
    await Promise.all([
      supabase
        .from('applications')
        .select('id, product, state, catalogue_id')
        .eq('case_id', caseId),
      supabase.from('product_interests').select('product, status').eq('case_id', caseId),
      supabase.from('plans').select('id, status').eq('case_id', caseId),
      supabase.from('application_requests').select('id, status'),
      supabase.from('form_applications').select('id').eq('case_id', caseId),
      supabase.auth.getUser(),
      // The same rows the admin's "questions avoided" metric counts (§53), under the customer's
      // own RLS. A settled card can then say what it saved them rather than only what it started.
      supabase
        .from('events')
        .select('application_id')
        .eq('case_id', caseId)
        .eq('type', 'context_reused'),
    ])

  const reusedBy = new Map<string, number>()
  for (const row of (reused.data ?? []) as { application_id: string | null }[]) {
    if (row.application_id === null) continue
    reusedBy.set(row.application_id, (reusedBy.get(row.application_id) ?? 0) + 1)
  }

  /*
   * Form answers hang off the form application, not the case, so they need the ids first.
   * Skipped entirely when there are none, which is most conversations.
   */
  const formIds = ((formApplications.data ?? []) as { id: string }[]).map((row) => row.id)

  const formAnswers: { field_id: string; source: string }[] =
    formIds.length === 0
      ? []
      : ((
          await supabase
            .from('form_answers')
            .select('field_id, source')
            .in('form_application_id', formIds)
        ).data ?? [])

  return {
    applications: applications.data ?? [],
    interests: interests.data ?? [],
    plans: plans.data ?? [],
    requests: requests.data ?? [],
    formAnswers,
    signedIn: user.data.user !== null && user.data.user.is_anonymous !== true,
    reusedBy,
  }
}

/**
 * Whether this card's decision has already been made, and what to say about it.
 *
 * `undefined` means still open. Only cards that commit something are resolved: a comparison or
 * a set of rates is a thing to read, and reading it again is not a problem to solve.
 */
export function settledState(card: Card, state: CaseState): Settled | undefined {
  switch (card.type) {
    case 'sign_in':
      return state.signedIn
        ? {
            label: 'Signed in',
            note: 'This conversation is saved, and it will be here on another device.',
          }
        : undefined

    case 'plan_proposal': {
      const plan = state.plans.find((candidate) => candidate.id === card.planId)
      if (!plan) return undefined
      if (plan.status === 'active') {
        // The plan's own title, exactly as the card says it the moment it is tapped.
        return { label: card.title, note: 'Saved. You can change or stop it any time.' }
      }
      if (plan.status === 'declined' || plan.status === 'abandoned') {
        return { label: 'Left for now', note: card.title }
      }
      return undefined
    }

    case 'product_options': {
      /*
       * Settled once every option has been answered, one way or the other.
       *
       * A card offering three products where one was started and two were not is still a live
       * choice: the customer may well come back for another. It settles when nothing on it is
       * still undecided.
       */
      const answered = card.options.filter((option) => {
        const started = state.applications.some(
          (application) =>
            application.product === option.product &&
            (option.catalogueId === undefined || application.catalogue_id === option.catalogueId),
        )
        const declined = state.interests.some(
          (interest) => interest.product === option.product && interest.status === 'declined',
        )
        return started || declined
      })

      if (answered.length === 0) return undefined

      const started = card.options.filter((option) =>
        state.applications.some((application) => application.product === option.product),
      )

      if (answered.length < card.options.length) return undefined

      if (started.length === 0) {
        return {
          label: 'Not for now',
          note: card.options.map((option) => option.displayName).join(' and '),
        }
      }

      /*
       * The count is the product's whole claim and it used to be dropped here. A settled card
       * that only said what was started had nothing to say about what it saved.
       */
      const carried = state.applications
        .filter((application) => started.some((option) => option.product === application.product))
        .reduce((sum, application) => sum + (state.reusedBy.get(application.id) ?? 0), 0)

      return {
        label: `Started ${started.map((option) => option.displayName).join(' and ')}`,
        note:
          carried > 0
            ? `${String(carried)} ${carried === 1 ? 'thing' : 'things'} carried over from what Baz already knew.`
            : started.length === 1
              ? 'It is in your list, and you can pick it up whenever you like.'
              : 'They are all in your list, and you can pick any of them up whenever you like.',
      }
    }

    /*
     * Settled once every account on it has been started. One tap starts all of them, so a
     * partial start means the tap failed partway, and the card should stay open to try again.
     */
    case 'arrangement': {
      const started = card.allocations.filter((allocation) =>
        state.applications.some(
          (application) => application.catalogue_id === allocation.catalogueId,
        ),
      )
      if (started.length < card.allocations.length) return undefined

      return {
        label: `Started ${started.map((allocation) => allocation.name).join(', ')}`,
        note: 'All of them are in your list, each doing its own job.',
      }
    }

    case 'review': {
      const application = state.applications.find(
        (candidate) => candidate.id === card.applicationId,
      )
      const submitted = ['submitted', 'under_review', 'approved', 'declined', 'completed']
      return application && submitted.includes(application.state)
        ? { label: 'Submitted', note: 'Nothing else is needed from you for now.' }
        : undefined
    }

    case 'pause_prompt': {
      const application = state.applications.find(
        (candidate) => candidate.id === card.applicationId,
      )
      if (!application) return undefined
      return application.state === 'paused'
        ? { label: 'On hold', note: 'Nothing happens on it until you say so.' }
        : undefined
    }

    case 'upload_request': {
      const request = state.requests.find((candidate) => candidate.id === card.requestId)
      return request && request.status !== 'open'
        ? { label: 'Sent in', note: 'Received, and it will not be asked for again.' }
        : undefined
    }

    case 'form_declarations': {
      const agreed = card.declarations.filter((declaration) =>
        state.formAnswers.some(
          (answer) => answer.field_id === declaration.fieldId && answer.source === 'consent',
        ),
      )
      return agreed.length === card.declarations.length && agreed.length > 0
        ? { label: 'Confirmed', note: 'Recorded in the words the form uses.' }
        : undefined
    }

    case 'form_upload': {
      const attached = state.formAnswers.some(
        (answer) => answer.field_id === card.fieldId && answer.source === 'document',
      )
      return attached ? { label: 'Attached', note: 'Held against this application.' } : undefined
    }

    /*
     * Everything below is something to read rather than something to decide. A comparison, a
     * quote, published rates, a status, the data notice: tapping them starts nothing, so there
     * is nothing to settle. Listed rather than defaulted, because a new card type that does
     * commit something should fail here and be thought about, not silently stay tappable
     * forever.
     */
    case 'comparison':
    case 'reuse':
    case 'consent':
    case 'data_notice':
    case 'health_form':
    case 'mortgage_rates':
    case 'partner_invite':
    case 'quote':
    case 'status':
      return undefined
  }
}
