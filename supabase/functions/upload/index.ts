import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/db/database.types.ts'
import { fail, ok, statusFor } from '../_shared/contracts/common.ts'
import { writeEvent } from '../_shared/db/case-repository.ts'

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

function env(name: string): string {
  const value = (globalThis as any).Deno?.env?.get(name)
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing environment variable ${name}`)
  }
  return value
}

Deno.serve(async (request: Request): Promise<Response> => {
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
  const file = form.get('file')

  if (typeof requestId !== 'string' || requestId.length === 0) {
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

  // The open request is the authorisation: it names the application, and the application names
  // the case the caller must be a participant in.
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
  })

  await admin
    .from('application_requests')
    .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
    .eq('id', row.id)

  await writeEvent(admin, {
    caseId,
    type: 'document_uploaded',
    actor: attached.participants.role === 'partner' ? 'partner' : 'customer',
    payload: { requirementId: row.requirement_id, fileName: file.name },
  })

  return json(ok({ fileName: file.name, requirementId: row.requirement_id }), 200)
})
