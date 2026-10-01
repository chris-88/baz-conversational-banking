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
    root: '/admin',
    cases: '/admin/cases',
    persona: '/admin/persona',
    domain: '/admin/domain',
    audience: '/admin/audience',
  },
} as const
