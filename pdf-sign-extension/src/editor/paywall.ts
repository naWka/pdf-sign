// Free-tier gate. The first FREE_EXPORT_LIMIT exports are free; after that the
// download is gated behind a one-time lifetime unlock. The counter lives in
// chrome.storage.local so a plain reload does not reset it. Unlocking (a valid
// license) removes the gate entirely — including offline.

import { storage } from '@/shared/storage'
import { FREE_EXPORT_LIMIT, CHECKOUT_URL } from '@/shared/constants'
import { isUnlocked } from '@/license/license'
import { icons } from './ui/icons'

export interface GateStatus {
  allowed: boolean
  unlocked: boolean
  used: number
  remaining: number
}

export async function checkGate(): Promise<GateStatus> {
  const unlocked = await isUnlocked()
  const usage = await storage.getUsage()
  const used = usage.exportsUsed
  const remaining = Math.max(0, FREE_EXPORT_LIMIT - used)
  return {
    allowed: unlocked || used < FREE_EXPORT_LIMIT,
    unlocked,
    used,
    remaining,
  }
}

/** Count one successful export (no-op once unlocked, to avoid overflow). */
export async function recordExport(): Promise<void> {
  if (await isUnlocked()) return
  const usage = await storage.getUsage()
  await storage.setUsage({ exportsUsed: usage.exportsUsed + 1 })
}

export function openPaywall(): void {
  const root = document.createElement('div')
  root.className = 'modal-backdrop'
  root.innerHTML = `
    <div class="modal paywall" role="dialog" aria-modal="true" aria-label="Unlock lifetime">
      <button class="iconbtn paywall__close" aria-label="Close">${icons.x}</button>
      <div class="paywall__badge">${icons.lock}</div>
      <h2 class="paywall__title">You have used your free exports</h2>
      <p class="paywall__lede">
        Unlock unlimited signing and filling with a single payment. No subscription,
        no account. It keeps working offline on this device.
      </p>
      <ul class="paywall__list">
        <li>${icons.check}<span>Unlimited exports, forever</span></li>
        <li>${icons.check}<span>One payment, no subscription</span></li>
        <li>${icons.check}<span>Still 100% local — nothing is uploaded</span></li>
      </ul>
      <div class="paywall__actions">
        <button class="btn btn--gold btn--block" id="pw-buy">Unlock lifetime</button>
        <button class="btn btn--ghost btn--block btn--sm" id="pw-key">I already have a key</button>
      </div>
      <p class="paywall__fine muted">Everything you have added so far is kept. You can finish and download after unlocking.</p>
    </div>`

  const close = () => {
    root.classList.remove('is-open')
    setTimeout(() => root.remove(), 180)
  }
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close()
  })
  root.querySelector('.paywall__close')!.addEventListener('click', close)
  root.querySelector('#pw-buy')!.addEventListener('click', () => {
    window.open(CHECKOUT_URL, '_blank', 'noopener')
  })
  root.querySelector('#pw-key')!.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
  document.body.append(root)
  requestAnimationFrame(() => root.classList.add('is-open'))
}
