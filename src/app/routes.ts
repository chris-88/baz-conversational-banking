/** Every surface's path in one place. Hash routing: GitHub Pages has no rewrites. */
export const routes = {
  public: '/',

  app: {
    root: '/app',
    login: '/app/login',
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
