// Local, offline verification of a signed license token using the Web Crypto
// Ed25519 primitive. No network required — this is what makes the paid unlock
// work offline, honoring the product's core promise.
//
// Token format (compact, URL-safe):  <base64url(payloadJSON)>.<base64url(sig)>
// The Supabase Edge Function signs the exact payloadJSON bytes with the private
// key; here we verify against the bundled public key.

import { LICENSE_PUBLIC_KEY_B64, hasRealPublicKey } from './public-key'

export interface LicensePayload {
  license_id: string
  issued_at: number
  email?: string
}

export interface VerifyResult {
  valid: boolean
  payload?: LicensePayload
  reason?: string
}

let cachedKey: CryptoKey | null = null

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const raw = base64ToBytes(LICENSE_PUBLIC_KEY_B64)
  cachedKey = await crypto.subtle.importKey('raw', raw as BufferSource, { name: 'Ed25519' }, false, [
    'verify',
  ])
  return cachedKey
}

export async function verifyLicenseToken(token: string): Promise<VerifyResult> {
  if (!hasRealPublicKey()) {
    return { valid: false, reason: 'no-public-key' }
  }
  const trimmed = token.trim()
  const dot = trimmed.indexOf('.')
  if (dot < 0) return { valid: false, reason: 'malformed' }

  const payloadB64 = trimmed.slice(0, dot)
  const sigB64 = trimmed.slice(dot + 1)

  let payloadBytes: Uint8Array
  let sigBytes: Uint8Array
  try {
    payloadBytes = base64UrlToBytes(payloadB64)
    sigBytes = base64UrlToBytes(sigB64)
  } catch {
    return { valid: false, reason: 'malformed' }
  }

  let ok = false
  try {
    const key = await getPublicKey()
    ok = await crypto.subtle.verify(
      'Ed25519',
      key,
      sigBytes as BufferSource,
      payloadBytes as BufferSource,
    )
  } catch (e) {
    return { valid: false, reason: 'verify-error:' + (e as Error).message }
  }
  if (!ok) return { valid: false, reason: 'bad-signature' }

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as LicensePayload
    if (!payload.license_id) return { valid: false, reason: 'no-license-id' }
    return { valid: true, payload }
  } catch {
    return { valid: false, reason: 'bad-payload' }
  }
}

// --- base64 helpers ------------------------------------------------------

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function base64UrlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return base64ToBytes(b64)
}
