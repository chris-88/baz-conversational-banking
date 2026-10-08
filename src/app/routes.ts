/**
 * Every surface's path in one place. Hash routing: GitHub Pages has no rewrites.
 *
 * Three for the customer and one for the operator. There was a replica of a bank website and an
 * authenticated app behind a simulated login, which was a lot of scaffolding around the only
 * thing worth showing — a conversation that understands what someone is trying to do.
 */
export const routes = {
  /** The landing page: what Baz is, and the two ways in. */
  landing: '/',

  /** Baz itself. The same screen in a browser tab and in the installed app. */
  baz: '/baz',

  /**
   * The explainer, for somebody evaluating the work rather than using it.
   *
   * Three sections under one address so a single one can be sent on its own.
   */
  howItWorks: '/how-it-works',

  /** §33 — a second applicant, arriving on a single-use link. */
  partnerJoin: (token = ':token') => `/join/${token}`,

  admin: {
    /** Separate, and only reachable by typing the address. */
    root: '/admin',
    case: (caseId: string) => `/admin/case/${caseId}`,
    guardrails: '/admin/guardrails',
    persona: '/admin/persona',
    engine: '/admin/engine',
    analytics: '/admin/analytics',
    profile: '/admin/profile',
  },
} as const
