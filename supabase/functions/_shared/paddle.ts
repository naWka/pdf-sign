// Verify a Paddle (Billing) webhook signature. Paddle sends a `Paddle-Signature`
// header of the form `ts=<unix>;h1=<hmac_sha256_hex>` where the HMAC is computed
// over `${ts}:${rawBody}` using the webhook secret. Reject anything that does not
// match, or whose timestamp is too old (replay protection).

export async function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 60 * 5,
): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(
    signatureHeader.split(';').map((kv) => {
      const [k, v] = kv.split('=')
      return [k?.trim(), v?.trim()]
    }),
  ) as { ts?: string; h1?: string }

  if (!parts.ts || !parts.h1) return false

  const ts = Number(parts.ts)
  if (!Number.isFinite(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > toleranceSeconds) return false

  const expected = await hmacSha256Hex(secret, `${parts.ts}:${rawBody}`)
  return timingSafeEqual(expected, parts.h1)
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
