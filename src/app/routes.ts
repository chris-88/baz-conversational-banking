/** Every surface's path in one place. Hash routing: GitHub Pages has no rewrites. */
export const routes = {
  public: '/',

  /** §6 Stage 1 — the conversation on the public website, before signing in. */
  baz: '/baz',

  app: {
    root: '/app',
    login: '/app/login',
    baz: '/app/baz',
    products: '/app/products',
  },

  partnerJoin: (token = ':token') => `/join/${token}`,

  audience: '/try',

  admin: {
    /** The case list is the console's home: everything else is a setting. */
    root: '/admin',
    case: (caseId: string) => `/admin/case/${caseId}`,
    guardrails: '/admin/guardrails',
    persona: '/admin/persona',
    engine: '/admin/engine',
  },
} as const
