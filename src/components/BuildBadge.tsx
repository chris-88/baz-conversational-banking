import type { ReactNode } from 'react'

/**
 * TEMPORARY (2026-10-01) — shows which branch and commit is deployed.
 *
 * Rendered once in `providers.tsx`, so it covers every surface including the 404. To remove
 * it: delete this file, its line in `providers.tsx`, the `define` block and `buildInfo()` in
 * `vite.config.ts`, the mirrored define in `vitest.config.ts`, the three declarations in
 * `src/vite-env.d.ts`, and the two e2e tests.
 *
 * `pointer-events-none` matters: this sits over the bottom of a 390px-wide screen, and must
 * never swallow a tap meant for a button underneath it.
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]"
    >
      <p className="bg-foreground/85 text-background text-2xs tabular rounded-t-md px-2.5 py-1 font-mono leading-none backdrop-blur-sm">
        <span className="font-semibold">{__BUILD_BRANCH__}</span>
        <span className="opacity-50"> · </span>
        {__BUILD_SHA__}
        <span className="opacity-50"> · </span>
        <span className="opacity-75">{when}</span>
      </p>
    </div>
  )
}
