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
