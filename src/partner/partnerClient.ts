import { requireSupabase } from '@/lib/supabase'
import { ensureAnonymousUser } from '@/lib/session'
import { apiErrorSchema } from '@contracts/common.ts'
import { partnerViewSchema, type PartnerRequest, type PartnerView } from '@contracts/partner.ts'

/** The partner gets their own anonymous session, separate from the primary customer's (§33). */
export async function callPartner(action: PartnerRequest): Promise<PartnerView> {
  const supabase = requireSupabase()
  await ensureAnonymousUser()

  const invoked = await supabase.functions.invoke<unknown>('partner', { body: action })
  if (invoked.error) {
    throw new Error(invoked.error instanceof Error ? invoked.error.message : 'That did not work.')
  }

  const envelope = invoked.data as { ok?: boolean; data?: unknown; error?: unknown }
  if (envelope.ok !== true) {
    const parsed = apiErrorSchema.safeParse(envelope.error)
    throw new Error(parsed.success ? parsed.data.message : 'That did not work.')
  }

  return partnerViewSchema.parse(envelope.data)
}
