// Ed25519 license-token signing (Deno / Web Crypto). The PRIVATE key lives only
// here (Supabase secret / Vault) and never ships to the client. The extension
// verifies with the matching PUBLIC key bundled in its package.
//
// Token format:  <base64url(payloadJSON)>.<base64url(signature)>

export interface LicensePayload {
  license_id: string
  issued_at: number
  email?: string
}

/**
 * Import the private key from a base64 PKCS8 DER string. Generate with:
 *   openssl genpkey -algorithm ed25519 -out private.pem
 *   openssl pkey -in private.pem -outform DER | base64   # -> LICENSE_PRIVATE_KEY_B64
 */
async function importPrivateKey(pkcs8B64: string): Promise<CryptoKey> {
  const der = base64ToBytes(pkcs8B64)
  return crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign'])
}

export async function signLicense(
  payload: LicensePayload,
  privateKeyB64: string,
): Promise<string> {
  const key = await importPrivateKey(privateKeyB64)
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
  const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', key, payloadBytes))
  return `${bytesToBase64Url(payloadBytes)}.${bytesToBase64Url(sig)}`
}

// --- base64 helpers ------------------------------------------------------

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
