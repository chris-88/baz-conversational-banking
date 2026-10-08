import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { initSentry } from '@/lib/sentry'
import { recoverFromStaleDeploy } from '@/app/staleDeploy'
import '@/styles/fonts.css'
import '@/index.css'

initSentry()

/*
 * Vite raises this when a dynamic import 404s, which on a static host means one thing: the
 * build this page came from is no longer the build on the server. Reload into the current one.
 *
 * Preventing the default stops the rejection surfacing, so nothing flashes on the way out. If
 * the reload is refused — because we just tried one — the error goes through to the route
 * boundary, which says so plainly.
 */
window.addEventListener('vite:preloadError', (event) => {
  if (recoverFromStaleDeploy()) event.preventDefault()
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
