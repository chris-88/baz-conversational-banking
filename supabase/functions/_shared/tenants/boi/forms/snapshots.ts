import { formDefinitionSchema, type FormDefinition } from '../../../domain/forms/definition.ts'
import form1833 from './form-1833.json' with { type: 'json' }
import form1940 from './form-1940.json' with { type: 'json' }

/**
 * The form definitions Baz has taken a copy of, and where each came from.
 *
 * A snapshot rather than a live fetch: a demonstration must not depend on another
 * organisation's website answering at the moment somebody is filming, and re-pulling 691KB
 * from their infrastructure on every turn to serve our own is impolite when the definition
 * changes rarely.
 *
 * The provenance travels with it. The console shows the source URL, when it was retrieved, the
 * form's own version string and a hash of the bytes, which is what lets somebody in the room
 * satisfy themselves this is the bank's document and not ours.
 */

export type FormSnapshot = {
  readonly formId: string
  readonly source: string
  readonly retrievedAt: string
  readonly version: string
  readonly sourceHash: string
  readonly definition: FormDefinition
  /** Where the genuine journey is completed. Submitted as `page_location`. */
  readonly pageLocation: string
}

type RawSnapshot = {
  formId: string
  source: string
  retrievedAt: string
  version: string
  sourceHash: string
  definition: unknown
}

const PAGE_LOCATIONS: Readonly<Record<string, string>> = {
  '1833': 'https://digital.bankofireland.com/personal-banking/supersaver/',
  '1940': 'https://digital.bankofireland.com/consumer-lending/personal-loan',
}

const RAW: readonly RawSnapshot[] = [form1833, form1940]

/** Parsed once. The definition is large and does not change between requests. */
const SNAPSHOTS: ReadonlyMap<string, FormSnapshot> = new Map(
  RAW.map((raw) => [
    raw.formId,
    {
      formId: raw.formId,
      source: raw.source,
      retrievedAt: raw.retrievedAt,
      version: raw.version,
      sourceHash: raw.sourceHash,
      definition: formDefinitionSchema.parse(raw.definition),
      pageLocation: PAGE_LOCATIONS[raw.formId] ?? '',
    },
  ]),
)

export function formSnapshot(formId: string): FormSnapshot | undefined {
  return SNAPSHOTS.get(formId)
}

export function allFormSnapshots(): readonly FormSnapshot[] {
  return [...SNAPSHOTS.values()]
}
