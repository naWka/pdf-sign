// Paddle webhook receiver. On a completed transaction it: verifies the Paddle
// signature, then idempotently creates a license (unique on paddle_txn_id) and
// stores a freshly signed Ed25519 token. Refund/chargeback events flip status so
// the extension's periodic re-check can revoke access.
//
// Secrets (service role key, webhook secret, private signing key) come from env
// and never leave the server.
//
// Deploy:  supabase functions deploy paddle-webhook --no-verify-jwt
// (Paddle cannot send a Supabase JWT, so JWT verification must be off; we verify
//  the Paddle signature ourselves instead.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyPaddleSignature } from '../_shared/paddle.ts'
import { signLicense } from '../_shared/sign.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET')!
const PRIVATE_KEY_B64 = Deno.env.get('LICENSE_PRIVATE_KEY_B64')!

const REVOKE_EVENTS = new Set([
  'transaction.canceled',
  'adjustment.created', // refunds arrive as adjustments
])

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const rawBody = await req.text()
  const ok = await verifyPaddleSignature(rawBody, req.headers.get('Paddle-Signature'), WEBHOOK_SECRET)
  if (!ok) return new Response('Invalid signature', { status: 401 })

  let event: PaddleEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  try {
    if (event.event_type === 'transaction.completed') {
      await handleCompleted(supabase, event)
    } else if (REVOKE_EVENTS.has(event.event_type)) {
      await handleRevoke(supabase, event)
    }
  } catch (e) {
    console.error('webhook error', e)
    return new Response('Error', { status: 500 })
  }

  // Always 200 quickly so Paddle does not retry a handled event.
  return new Response('ok', { status: 200 })
})

async function handleCompleted(
  supabase: ReturnType<typeof createClient>,
  event: PaddleEvent,
): Promise<void> {
  const txnId = event.data.id
  const email = event.data.customer?.email ?? event.data.customer_email ?? null

  // Idempotency: if this transaction already has a license, do nothing.
  const { data: existing } = await supabase
    .from('licenses')
    .select('id')
    .eq('paddle_txn_id', txnId)
    .maybeSingle()
  if (existing) return

  const licenseId = crypto.randomUUID()
  const token = await signLicense(
    { license_id: licenseId, issued_at: Date.now(), email: email ?? undefined },
    PRIVATE_KEY_B64,
  )

  await supabase.from('licenses').insert({
    id: licenseId,
    paddle_txn_id: txnId,
    email,
    status: 'active',
    token,
  })
}

async function handleRevoke(
  supabase: ReturnType<typeof createClient>,
  event: PaddleEvent,
): Promise<void> {
  const txnId = event.data.transaction_id ?? event.data.id
  if (!txnId) return
  await supabase
    .from('licenses')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('paddle_txn_id', txnId)
}

interface PaddleEvent {
  event_type: string
  data: {
    id: string
    transaction_id?: string
    customer_email?: string
    customer?: { email?: string }
  }
}
