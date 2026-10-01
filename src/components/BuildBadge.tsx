import type { ReactNode } from 'react'

/**
 * TEMPORARY (2026-10-01) — shows which branch and commit is deployed.
 *
 * A thin strip at the very top of the document, in normal flow. It was a fixed overlay at the
 * bottom, which covered the app's tab bar labels; in flow it can never obscure anything.
 *
 * Rendered once in `providers.tsx`, before the router, so it covers every surface. To remove:
 * delete this file, its line in `providers.tsx`, the `define` block and `buildInfo()` in
 * `vite.config.ts`, the mirrored define in `vitest.config.ts`, the three declarations in
 * `src/vite-env.d.ts`, and the two e2e tests.
 */
export function BuildBadge(): ReactNode {
  const built = new Date(__BUILD_TIME__)
  const when = Number.isNaN(built.getTime())
    ? __BUILD_TIME__
    : `${built.toISOString().slice(0, 16).replace('T', ' ')} UTC`

  return (
    <div
      data-testid="build-badge"
      aria-label={`Build: branch ${__BUILD_BRANCH__}, commit ${__BUILD_SHA__}, built ${when}`}
      className="bg-foreground text-background flex items-center justify-center gap-1.5 px-3 py-1 text-center font-mono text-2xs leading-none tabular"
    >
      <span className="font-semibold">{__BUILD_BRANCH__}</span>
      <span className="opacity-50">·</span>
      <span>{__BUILD_SHA__}</span>
      <span className="opacity-50">·</span>
      <span className="opacity-75">{when}</span>
    </div>
  )
}
