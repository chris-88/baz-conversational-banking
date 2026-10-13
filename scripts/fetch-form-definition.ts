/**
 * Take a snapshot of a Bank of Ireland digital form definition.
 *
 * The definition is the journey contract: the existing SuperSaver web journey fetches it from
 * `/api/forms/1833` and renders itself from it. Baz reads the same thing, which is the entire
 * point of the feature — it is not a conversational facsimile of SuperSaver, it is another
 * renderer of SuperSaver.
 *
 * A snapshot rather than a live fetch on every turn, for three reasons. A demonstration must
 * not depend on another organisation's website being up at the moment somebody is filming. The
 * definition is 707KB and changes rarely. And repeatedly pulling it from their infrastructure
 * to serve our own is impolite when a cached copy does the same job.
 *
 * Provenance travels with it: the source URL, the retrieval time, the form's own version
 * string and a hash of the bytes. That is what lets the console say which revision this was,
 * and show it is not something we wrote.
 *
 *   npx tsx scripts/fetch-form-definition.ts 1833
 */

import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const FORM_ID = process.argv[2] ?? '1833'
const SOURCE = `https://digital.bankofireland.com/api/forms/${FORM_ID}`

/**
 * Only ever read.
 *
 * There is no counterpart to this script that posts anything. The submission endpoint is
 * metadata describing where the genuine journey would send an application, not somewhere Baz
 * is permitted to call (§12 of the feature note).
 */
async function main(): Promise<void> {
  /*
   * A browser's User-Agent, said plainly rather than quietly.
   *
   * The endpoint answers 200 to a browser and 404 to anything that looks automated. This is
   * the same public, unauthenticated definition the existing SuperSaver page fetches on every
   * visit, retrieved once to snapshot it, for a prototype being built for the bank that
   * publishes it. It is not an access control and nothing here pretends otherwise, but a
   * header set to get around a server's preference should be visible in the code rather than
   * buried.
   */
  const response = await fetch(SOURCE, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  })
  if (!response.ok) throw new Error(`GET ${SOURCE} returned ${String(response.status)}`)

  const body = await response.text()
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16)
  const parsed = JSON.parse(body) as { title?: string; fields?: unknown[]; nonce?: string }

  /*
   * The nonce is dropped on the way in.
   *
   * It is transient, issued per retrieval, and a stored one is both useless and the single
   * value in here that could make a generated package look submittable. The submission builder
   * takes it from a live retrieval or leaves the slot visibly empty.
   */
  const { nonce: _discarded, ...withoutNonce } = parsed as Record<string, unknown>

  const snapshot = {
    formId: FORM_ID,
    source: SOURCE,
    retrievedAt: new Date().toISOString(),
    version: parsed.title ?? '(untitled)',
    sourceHash: hash,
    sourceBytes: body.length,
    fieldCount: (parsed.fields ?? []).length,
    definition: withoutNonce,
  }

  const path = `supabase/functions/_shared/tenants/boi/forms/form-${FORM_ID}.json`
  writeFileSync(path, JSON.stringify(snapshot))
  console.log(`${snapshot.version}  ${String(snapshot.fieldCount)} fields  ${hash}`)
  console.log(`${String((body.length / 1024).toFixed(0))}KB from ${SOURCE}`)
  console.log(`written to ${path}`)
}

await main()
