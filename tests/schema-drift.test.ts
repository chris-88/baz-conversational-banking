import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FACT_SOURCES } from '../supabase/functions/_shared/domain/facts.ts'
import { DOCUMENT_TYPES, PRODUCTS } from '../supabase/functions/_shared/domain/journey.ts'
import { APPLICATION_STATES } from '../supabase/functions/_shared/domain/state-machine.ts'

/**
 * Lives outside `_shared/domain` on purpose: it reads the filesystem, and the domain folder
 * must stay free of platform APIs so the same files compile under Deno and the browser.
 *
 * The schema uses CHECK constraints rather than Postgres enums so the spec can still move.
 * The cost is that a literal can drift: a state added to the TypeScript union but not to the
 * database would fail at write time, in the demo. These tests close that gap.
 */

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

const migrations = readdirSync(migrationsDir)
  .filter((name: string) => name.endsWith('.sql'))
  .sort()
  .map((name: string) => readFileSync(join(migrationsDir, name), 'utf8'))
  .join('\n')

/**
 * Pulls the literals out of the LAST `check (<column> in (...))` for a column, so a later
 * migration that widens a constraint is the one that counts.
 */
function checkConstraintLiterals(column: string): readonly string[] {
  const pattern = new RegExp(`${column}\\s+in\\s*\\(([^)]*)\\)`, 'gis')
  const matches = [...migrations.matchAll(pattern)]
  const last = matches.at(-1)
  if (!last?.[1]) return []

  return [...last[1].matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined)
}

describe('the database agrees with the TypeScript unions', () => {
  it('finds the migration to check against', () => {
    expect(migrations.length).toBeGreaterThan(1_000)
  })

  it('accepts exactly the twelve application states (§13)', () => {
    expect([...checkConstraintLiterals('state')].sort()).toEqual([...APPLICATION_STATES].sort())
  })

  it('accepts exactly the five products (§7)', () => {
    expect([...checkConstraintLiterals('product')].sort()).toEqual([...PRODUCTS].sort())
  })

  it('accepts exactly the six fact sources (§10)', () => {
    expect([...checkConstraintLiterals('source')].sort()).toEqual([...FACT_SOURCES].sort())
  })

  it('accepts exactly the five document types', () => {
    expect([...checkConstraintLiterals('document_type')].sort()).toEqual([...DOCUMENT_TYPES].sort())
  })

  it('only allows resuming into a pre-submission state', () => {
    expect([...checkConstraintLiterals('resume_to')].sort()).toEqual(
      ['in_progress', 'ready', 'waiting_customer', 'waiting_partner'],
    )
  })
})

describe('the schema keeps the invariants', () => {
  it('grants no client insert, update or delete anywhere (Invariant 2)', () => {
    const writePolicies = [...migrations.matchAll(/for\s+(insert|update|delete|all)\b/gi)]
    expect(writePolicies.map((m) => m[0])).toEqual([])
  })

  it('gives tokens, sessions, customers and the admin roster no read policy at all', () => {
    for (const table of ['tokens', 'participant_sessions', 'customers', 'admin_users']) {
      expect(migrations, table).not.toMatch(
        new RegExp(`create policy \\w+ on public\\.${table}`, 'i'),
      )
    }
  })

  it('enables row level security on every table it creates', () => {
    const created = [...migrations.matchAll(/create table public\.(\w+)/g)].map((m) => m[1])
    const secured = new Set(
      [...migrations.matchAll(/alter table public\.(\w+) enable row level security/g)].map(
        (m) => m[1],
      ),
    )

    expect(created.length).toBeGreaterThan(10)
    expect(created.filter((table) => table !== undefined && !secured.has(table))).toEqual([])
  })

  it('stores only a hash of a token, never the token (Invariant 8)', () => {
    expect(migrations).toMatch(/token_hash text not null unique/)
    expect(migrations).not.toMatch(/\btoken text\b/)
  })
})
