// Returns the signed license token for a completed Paddle transaction. The site's
// success page calls this with the transaction id from the Paddle redirect
// (?_ptxn=...). Only returns a token for an existing, active transaction; the
// unguessable transaction id acts as the bearer secret for this one-time fetch.
//
// Deploy:  supabase functions deploy get-license --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const txn = url.searchParams.get('txn')
  if (!txn) return json({ error: 'missing txn' }, 400)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data, error } = await supabase
    .from('licenses')
    .select('token, email, status')
    .eq('paddle_txn_id', txn)
    .maybeSingle()

  if (error) return json({ error: 'lookup failed' }, 500)
  if (!data || data.status !== 'active') return json({ status: 'pending' }, 404)

  return json({ token: data.token, email: data.email, status: data.status })
})
