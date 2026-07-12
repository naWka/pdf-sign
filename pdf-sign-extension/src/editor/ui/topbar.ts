// Editor top bar: brand, file name, the privacy assurance, license/usage pill,
// and the primary Download action. The pill updates live when the license or
// usage changes (e.g. the user unlocks in Options while the editor is open).

import { store } from '../state'
import { storage } from '@/shared/storage'
import { FREE_EXPORT_LIMIT, PRIVACY_URL } from '@/shared/constants'
import { icons } from './icons'

export function mountTopbar(el: HTMLElement, onDownload: () => void): void {
  el.innerHTML = `
    <div class="topbar__left">
      <img class="topbar__logo" src="../assets/icons/icon-48.png" alt="Sign & Fill PDF" width="24" height="24" />
      <span class="topbar__file" id="topbar-file">${escapeHtml(store.fileName)}</span>
    </div>
    <div class="topbar__center">
      <span class="privacy-chip" title="Your file is processed locally and never uploaded">
        ${icons.shield}<span>Local &amp; private</span>
      </span>
    </div>
    <div class="topbar__right">
      <span class="license-pill" id="license-pill"></span>
      <button class="btn btn--primary" id="download-btn">${icons.download} Download PDF</button>
    </div>`

  el.querySelector('#download-btn')!.addEventListener('click', onDownload)

  const fileEl = el.querySelector<HTMLElement>('#topbar-file')!
  store.subscribe(() => {
    if (fileEl.textContent !== store.fileName) fileEl.textContent = store.fileName
  })

  const pill = el.querySelector<HTMLElement>('#license-pill')!
  void refreshPill(pill)
  storage.onChanged((changes) => {
    if (changes['ssp.license.v1'] || changes['ssp.usage.v1']) void refreshPill(pill)
  })
}

async function refreshPill(pill: HTMLElement): Promise<void> {
  const [license, usage] = await Promise.all([storage.getLicense(), storage.getUsage()])
  if (license?.valid) {
    pill.className = 'license-pill license-pill--unlocked'
    pill.innerHTML = `${icons.check}<span>Lifetime</span>`
    pill.title = 'Lifetime unlocked — unlimited exports'
    return
  }
  const left = Math.max(0, FREE_EXPORT_LIMIT - usage.exportsUsed)
  pill.className = 'license-pill'
  pill.innerHTML = `<a href="${PRIVACY_URL.replace('/privacy', '/pricing')}" target="_blank" rel="noopener" class="license-pill__link"><span class="tnum">${left}</span> free left</a>`
  pill.title = `${left} of ${FREE_EXPORT_LIMIT} free exports remaining`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}
