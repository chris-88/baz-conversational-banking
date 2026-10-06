/**
 * What a case is.
 *
 * `presenter` / `audience` came from a scripted demonstration: one rehearsed case driven from
 * the stage, throwaway ones for everybody else. A live demonstration where the room invents
 * the situation has no rehearsed case to join, so an ordinary case is just a `customer` one.
 * `presenter` survives for a case being driven on screen, and `audience` so old rows still
 * load (migration 20261006090000).
 *
 * Defined here, once, because this union is written down in four places — a Zod row schema, a
 * loaded-case type, an admin response contract and the admin handler — and the moment the
 * database moved on its own, every case in the system failed to parse.
 */
export const CASE_KINDS = ['customer', 'presenter', 'audience'] as const

export type CaseKind = (typeof CASE_KINDS)[number]

/**
 * Whether clearing out test conversations should spare this case (§47).
 *
 * Three things survive: the case on screen, anything still marked `presenter`, and anything
 * somebody named. The label is what matters in practice — the seeded canonical customer is the
 * only case anybody bothered to name, and the migration above took away the `presenter` kind
 * that used to protect it, so a purge would have quietly taken the one case worth keeping.
 *
 * `named` is passed in rather than read off a label, because the two sides have different
 * labels: the console is sent a display label that falls back to "Unnamed · 1a2b3c4d", so
 * sniffing it there found a name on every case and spared the lot. One rule, and the fact it
 * turns on supplied explicitly by whoever actually knows it.
 */
export function isPurgeable(
  row: { readonly id: string; readonly kind: string; readonly named: boolean },
  keepCaseId: string | null,
): boolean {
  if (row.id === keepCaseId) return false
  if (row.kind === 'presenter') return false
  return !row.named
}
