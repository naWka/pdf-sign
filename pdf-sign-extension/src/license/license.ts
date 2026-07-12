// License lifecycle on the client: verify a pasted token locally, cache it, and
// occasionally re-check status online (best-effort). Offline users are never
// punished: if the network is unavailable, a previously-valid license stays valid.

import { storage } from '@/shared/storage'
import { LICENSE_RECHECK_INTERVAL_MS, LICENSE_STATUS_URL } from '@/shared/constants'
import type { LicenseCache } from '@/shared/types'
import { verifyLicenseToken } from './verify'

export interface ApplyResult {
  ok: boolean
  message: string
}

/** Verify a pasted token and, if valid, cache it as the active license. */
export async function applyLicenseKey(token: string): Promise<ApplyResult> {
  const result = await verifyLicenseToken(token)
  if (!result.valid || !result.payload) {
    return { ok: false, message: reasonToMessage(result.reason) }
  }
  const cache: LicenseCache = {
    token: token.trim(),
    valid: true,
    verifiedAt: Date.now(),
    lastOnlineCheck: 0,
    email: result.payload.email,
  }
  await storage.setLicense(cache)
  return { ok: true, message: 'Unlocked. Thank you.' }
}

export async function isUnlocked(): Promise<boolean> {
  const license = await storage.getLicense()
  return !!license?.valid
}

export async function clearLicense(): Promise<void> {
  await storage.setLicense(null)
}

/**
 * Best-effort online re-check. Runs at most every LICENSE_RECHECK_INTERVAL_MS.
 * Only a 'refunded' / 'revoked' response downgrades the license; any network
 * failure is ignored so offline use keeps working.
 */
export async function maybeRecheckOnline(): Promise<void> {
  const license = await storage.getLicense()
  if (!license?.valid) return
  if (Date.now() - license.lastOnlineCheck < LICENSE_RECHECK_INTERVAL_MS) return

  try {
    const payload = decodePayload(license.token)
    if (!payload?.license_id) return
    const url = `${LICENSE_STATUS_URL}?license_id=${encodeURIComponent(payload.license_id)}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return
    const data = (await res.json()) as { status?: string }
    const revoked = data.status === 'refunded' || data.status === 'revoked'
    await storage.setLicense({
      ...license,
      valid: !revoked,
      lastOnlineCheck: Date.now(),
    })
  } catch {
    // Offline or endpoint down: keep the cached status untouched.
  }
}

function decodePayload(token: string): { license_id?: string } | null {
  try {
    const b64 = token.slice(0, token.indexOf('.')).replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

function reasonToMessage(reason?: string): string {
  switch (reason) {
    case 'no-public-key':
      return 'License verification is not configured yet in this build.'
    case 'malformed':
    case 'bad-payload':
      return 'That key does not look right. Paste the full key from your receipt.'
    case 'bad-signature':
      return 'This key could not be verified. Check for a copy/paste error.'
    default:
      return 'Could not verify this key. Please try again.'
  }
}
