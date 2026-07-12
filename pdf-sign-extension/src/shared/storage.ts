// Thin, typed promise wrappers over chrome.storage.local. PDF bytes are NEVER
// written here; only saved signatures (PNG), the usage counter, and the cached
// license live in storage. That is the whole persistence surface of the product.

import { STORAGE_KEYS } from './constants'
import type { SavedSignature, LicenseCache, UsageState } from './types'

async function get<T>(key: string, fallback: T): Promise<T> {
  const res = await chrome.storage.local.get(key)
  return (res[key] as T | undefined) ?? fallback
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

export const storage = {
  async getSavedSignatures(): Promise<SavedSignature[]> {
    return get<SavedSignature[]>(STORAGE_KEYS.savedSignatures, [])
  },
  async setSavedSignatures(list: SavedSignature[]): Promise<void> {
    await set(STORAGE_KEYS.savedSignatures, list)
  },

  async getUsage(): Promise<UsageState> {
    return get<UsageState>(STORAGE_KEYS.usage, { exportsUsed: 0 })
  },
  async setUsage(usage: UsageState): Promise<void> {
    await set(STORAGE_KEYS.usage, usage)
  },

  async getLicense(): Promise<LicenseCache | null> {
    return get<LicenseCache | null>(STORAGE_KEYS.license, null)
  },
  async setLicense(license: LicenseCache | null): Promise<void> {
    await set(STORAGE_KEYS.license, license)
  },

  /** Subscribe to cross-surface changes (e.g. options unlocks -> editor updates). */
  onChanged(cb: (changes: Record<string, chrome.storage.StorageChange>) => void): () => void {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local') cb(changes)
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  },
}
