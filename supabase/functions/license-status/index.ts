// Public status endpoint. Given a license_id, returns ONLY { status } so the
// extension can do a best-effort periodic re-check (to honor refunds/revocations)
// without exposing any sensitive data. Never returns email, token, or txn id.
//
// Deploy:  supabase functions deploy license-status --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const licenseId = url.searchParams.get('license_id')
  if (!licenseId) return json({ error: 'missing license_id' }, 400)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data, error } = await supabase
    .from('licenses')
    .select('status')
    .eq('id', licenseId)
    .maybeSingle()

  if (error) return json({ error: 'lookup failed' }, 500)
  // Unknown ids are reported as 'revoked' so a fabricated id can't unlock.
  return json({ status: data?.status ?? 'revoked' })
})
