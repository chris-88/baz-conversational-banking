import { useEffect } from 'react'

/**
 * What the browser tab says.
 *
 * Every route rendered as "Bank of Ireland", so a customer with Baz open alongside their
 * banking had two identical tabs, the back button offered a list of identical entries, and a
 * screenshot of any page named the bank rather than the page. The title is the one piece of
 * chrome that has to work before the page is even read.
 *
 * Suffixed rather than replaced: this is a Bank of Ireland prototype and the tab should still
 * say so.
 */
const SUFFIX = 'Bank of Ireland'

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    const previous = document.title
    document.title = title === null ? SUFFIX : `${title} · ${SUFFIX}`

    // Restored on unmount so a route that sets nothing cannot inherit the last one's title.
    return () => {
      document.title = previous
    }
  }, [title])
}
