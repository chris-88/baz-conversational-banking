import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom'
import { Landing } from '@/surfaces/Landing'
import { BazScreen } from '@/surfaces/BazScreen'
import { PartnerJoin } from '@/partner/PartnerJoin'
import { LazyAdminConsole, LazyAdminOverview } from '@/app/lazyAdmin'
import { NotFound } from '@/components/NotFound'

const routeObjects: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/baz', element: <BazScreen /> },

  { path: '/join/:token', element: <PartnerJoin /> },

  {
    path: '/admin',
    element: <LazyAdminConsole />,
    children: [
      { index: true, element: <LazyAdminOverview section="cases" /> },
      { path: 'case/:caseId', element: <LazyAdminOverview section="case" /> },
      { path: 'guardrails', element: <LazyAdminOverview section="guardrails" /> },
      { path: 'persona', element: <LazyAdminOverview section="persona" /> },
      { path: 'engine', element: <LazyAdminOverview section="engine" /> },
    ],
  },

  /**
   * The authenticated app and the audience entry used to live here.
   *
   * Anyone with the old links — an installed PWA pinned to `/app`, a QR printed on a slide —
   * lands on Baz rather than a dead end.
   */
  { path: '/app/*', element: <Navigate to="/baz" replace /> },
  { path: '/try', element: <Navigate to="/baz" replace /> },

  { path: '/index.html', element: <Navigate to="/" replace /> },
  { path: '*', element: <NotFound /> },
]

export const router = createHashRouter(routeObjects)
