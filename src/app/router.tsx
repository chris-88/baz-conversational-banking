import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom'
import { PublicSite } from '@/shells/boi/PublicSite'
import { AppShell } from '@/shells/boi/AppShell'
import { AppLogin } from '@/shells/boi/AppLogin'
import { AppHome } from '@/shells/boi/AppHome'
import { AppBaz } from '@/shells/boi/AppBaz'
import { PartnerJoin } from '@/partner/PartnerJoin'
import { AudienceEntry } from '@/audience/AudienceEntry'
import { AdminConsole } from '@/admin/AdminConsole'
import { AdminOverview } from '@/admin/AdminOverview'
import { NotFound } from '@/components/NotFound'

const routeObjects: RouteObject[] = [
  { path: '/', element: <PublicSite /> },

  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <AppHome /> },
      { path: 'login', element: <AppLogin /> },
      { path: 'baz', element: <AppBaz /> },
    ],
  },

  { path: '/join/:token', element: <PartnerJoin /> },

  { path: '/try', element: <AudienceEntry /> },

  {
    path: '/admin',
    element: <AdminConsole />,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'cases', element: <AdminOverview section="cases" /> },
      { path: 'persona', element: <AdminOverview section="persona" /> },
      { path: 'domain', element: <AdminOverview section="domain" /> },
      { path: 'audience', element: <AdminOverview section="audience" /> },
    ],
  },

  { path: '/index.html', element: <Navigate to="/" replace /> },
  { path: '*', element: <NotFound /> },
]

export const router = createHashRouter(routeObjects)
