import { createClient } from '@supabase/supabase-js'
import { serveJson } from '../_shared/http/serve.ts'
import type { Database, Json } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import {
  mustWrite,
  writeEvent,
} from '../_shared/db/case-repository.ts'
import { formSnapshot } from '../_shared/tenants/boi/forms/snapshots.ts'
import { env } from '../_shared/env.ts'

/**
 * `upload` — the only way a document enters a case (§6 Stage 7, §10).
 *
 * Multipart rather than JSON, so the bytes are never base64 in a request body. The file goes
 * to a private bucket under the service role; nothing is readable from a browser. The request
 * row is what authorises the write: the customer can only upload against a document the bank
 * has actually asked for, and only on a case they are a participant in.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Matches the bucket, so an oversized file is refused before it is read into memory. */
const MAX_BYTES = 10 * 1024 * 1024

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/heic', 'application/pdf'])

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const errorResponse = (code: Parameters<typeof statusFor>[0], message: string) =>
  json(fail(code, message), statusFor(code))


serveJson(CORS, async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return errorResponse('bad_request', 'Use POST.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return errorResponse('unauthorised', 'Sign in first.')

  const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const caller = await admin.auth.getUser(authorization.replace('Bearer ', ''))
  const authUserId = caller.data.user?.id
  if (!authUserId) return errorResponse('unauthorised', 'Sign in first.')

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse('bad_request', 'Send the file as multipart form data.')
  }

  const requestId = form.get('requestId')
  const formApplicationId = form.get('formApplicationId')
  const fieldId = form.get('fieldId')
  const file = form.get('file')

  /*
   * Two kinds of document, and they are not the same thing.
   *
   * A journey document answers a requirement Baz wrote, and is tracked in `documents` with a
   * verification state the bank controls. A form document answers an upload control on the
   * bank's own published form, and is a reference in a packet. Mixing them would mean
   * inventing a requirement id for every upload field on every form the bank publishes.
   */
  const toForm = typeof formApplicationId === 'string' && formApplicationId.length > 0

  if (!toForm && (typeof requestId !== 'string' || requestId.length === 0)) {
    return errorResponse('bad_request', 'Which document is this for?')
  }
  if (!(file instanceof File)) return errorResponse('bad_request', 'No file was attached.')
  if (file.size === 0) return errorResponse('bad_request', 'That file is empty.')
  if (file.size > MAX_BYTES) {
    return errorResponse('bad_request', 'That file is larger than 10MB. Try a smaller one.')
  }
  if (!ALLOWED.has(file.type)) {
    return errorResponse('bad_request', 'Send a PDF or a photo.')
  }

  if (toForm) {
    return await attachToForm({
      admin,
      authUserId,
      formApplicationId,
      fieldId: typeof fieldId === 'string' ? fieldId : '',
      file,
    })
  }

  // The open request is the authorisation: it names the application, and the application names
  // the case the caller must be a participant in.
  if (typeof requestId !== 'string') {
    return errorResponse('bad_request', 'Which document is this for?')
  }

  const requestRow = await admin
    .from('application_requests')
    .select('id, status, requirement_id, application_id, applications!inner(case_id)')
    .eq('id', requestId)
    .maybeSingle()

  const row = requestRow.data as
    | { id: string; status: string; requirement_id: string; application_id: string; applications: { case_id: string } }
    | null

  if (!row) return errorResponse('not_found', 'There is no such request.')
  if (row.status !== 'open') return errorResponse('conflict', 'That has already been dealt with.')

  const caseId = row.applications.case_id

  const session = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', authUserId)
    .limit(50)

  const attached = ((session.data ?? []) as any[]).find(
    (entry) => entry.participants?.case_id === caseId,
  )
  if (!attached) return errorResponse('forbidden', 'This is not your case.')

  const documentType = form.get('documentType')
  const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
  const storagePath = `${caseId}/${crypto.randomUUID()}${extension}`

  const stored = await admin.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (stored.error) return errorResponse('internal', 'That upload did not complete.')

  mustWrite(
    await admin.from('documents').insert({
      case_id: caseId,
      application_id: row.application_id,
      requirement_id: row.requirement_id,
      participant_id: attached.participant_id,
      document_type: typeof documentType === 'string' ? documentType : 'bank_statement',
      storage_path: storagePath,
      file_name: file.name,
      // Nothing has checked it. A requirement marked requiresVerification stays outstanding
      // until the bank says otherwise, which is the truthful state (§14).
      verified: false,
    }),
    'the document',
  )

  mustWrite(
    await admin
      .from('application_requests')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', row.id),
    'the request',
  )

  await writeEvent(admin, {
    caseId,
    type: 'document_uploaded',
    actor: attached.participants.role === 'partner' ? 'partner' : 'customer',
    payload: { requirementId: row.requirement_id, fileName: file.name },
  })

  return json(ok({ fileName: file.name, requirementId: row.requirement_id }), 200)
})

/**
 * A file attached to an upload control on the bank's own form.
 *
 * What goes in the packet is a reference, never the bytes and never a signature. The genuine
 * journey uploads to a service that issues `x-file-hash` and `x-signed-file-hash`, and those
 * are the one thing in this whole feature that must not be invented: a fabricated signature is
 * a forged credential, however synthetic the file it describes (§9 of the feature note).
 */
async function attachToForm(input: {
  admin: ReturnType<typeof createClient<Database>>
  authUserId: string
  formApplicationId: string
  fieldId: string
  file: File
}): Promise<Response> {
  const { admin, file } = input

  if (input.fieldId === '') return errorResponse('bad_request', 'Which part of the form is this for?')

  const row = await admin
    .from('form_applications')
    .select('id, case_id, form_id')
    .eq('id', input.formApplicationId)
    .maybeSingle()

  if (row.error) return errorResponse('conflict', row.error.message)
  if (!row.data) return errorResponse('not_found', 'There is no such form application.')

  const caseId = row.data.case_id

  const session = await admin
    .from('participant_sessions')
    .select('participant_id, participants!inner(case_id, role)')
    .eq('auth_user_id', input.authUserId)
    .limit(50)

  const attached = ((session.data ?? []) as any[]).find(
    (entry) => entry.participants?.case_id === caseId,
  )
  if (!attached) return errorResponse('forbidden', 'This is not your case.')

  const snapshot = formSnapshot(row.data.form_id)
  const field = snapshot?.definition.fields.find((candidate) => candidate.id === input.fieldId)
  if (!field || field.type !== 'fileupload') {
    return errorResponse('bad_request', 'That is not a document this form asks for.')
  }

  /*
   * The form's own limits, not ours.
   *
   * The control declares `maxFileSize` in megabytes and the extensions it accepts. Enforcing
   * the published rule rather than a rule of our own is the same principle as everywhere else
   * here: the definition is the contract.
   */
  const maxMb = Number(field.platform?.['maxFileSize'] ?? 0)
  if (Number.isFinite(maxMb) && maxMb > 0 && file.size > maxMb * 1024 * 1024) {
    return errorResponse('bad_request', `That file is larger than ${String(maxMb)}MB.`)
  }

  const allowed = String(field.platform?.['allowedExtensions'] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)

  const extension = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
    : ''

  if (allowed.length > 0 && !allowed.includes(extension)) {
    return errorResponse('bad_request', `This one takes ${allowed.join(', ')}.`)
  }

  const storagePath = `${caseId}/form-${row.data.form_id}-${input.fieldId}-${crypto.randomUUID()}.${extension}`

  const stored = await admin.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (stored.error) return errorResponse('internal', 'That upload did not complete.')

  mustWrite(
    await admin.from('form_answers').upsert(
      {
        form_application_id: row.data.id,
        field_id: input.fieldId,
        value: {
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          storagePath,
        } as unknown as Json,
        source: 'document',
        participant_id: attached.participant_id,
      },
      { onConflict: 'form_application_id,field_id' },
    ),
    'the document reference',
  )

  await writeEvent(admin, {
    caseId,
    type: 'document_uploaded',
    actor: attached.participants.role === 'partner' ? 'partner' : 'customer',
    payload: { form: row.data.form_id, fieldId: input.fieldId, fileName: file.name },
  })

  return json(ok({ fileName: file.name, fieldId: input.fieldId }), 200)
}
