import { storage } from '@/shared/storage'
import { CHECKOUT_URL, PRIVACY_URL } from '@/shared/constants'
import { applyLicenseKey, clearLicense } from '@/license/license'
import { icons } from '@/editor/ui/icons'
import { toast } from '@/editor/ui/toast'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

$<HTMLAnchorElement>('#privacy-link').href = PRIVACY_URL

// --- License section -----------------------------------------------------

async function renderLicense(): Promise<void> {
  const body = $('#license-body')
  const license = await storage.getLicense()

  if (license?.valid) {
    body.innerHTML = `
      <div class="license-status">
        <div class="license-status__icon">${icons.check}</div>
        <div>
          <div class="license-status__title">Lifetime unlocked</div>
          <div class="license-status__body">
            ${license.email ? escapeHtml(license.email) + ' · ' : ''}Unlimited exports on this device, offline.
          </div>
        </div>
      </div>
      <div class="license-buy"><button class="btn btn--ghost btn--sm" id="license-remove">Remove license from this device</button></div>`
    $('#license-remove').addEventListener('click', async () => {
      await clearLicense()
      toast('License removed from this device.', 'info')
      void renderLicense()
    })
    return
  }

  body.innerHTML = `
    <p class="opt__hint">Paste the license key from your receipt to unlock unlimited exports. It is verified on your device and works offline.</p>
    <div class="license-row">
      <input class="license-input" id="license-input" type="text" placeholder="Paste your license key" autocomplete="off" spellcheck="false" />
      <button class="btn btn--primary" id="license-apply">Unlock</button>
    </div>
    <p class="license-msg" id="license-msg" hidden></p>
    <p class="license-buy">Don't have a key yet? <a href="${CHECKOUT_URL}" target="_blank" rel="noopener">Get lifetime access</a>.</p>`

  const input = $<HTMLInputElement>('#license-input')
  const apply = async () => {
    const msg = $('#license-msg')
    const value = input.value.trim()
    if (!value) return
    const result = await applyLicenseKey(value)
    msg.hidden = false
    msg.textContent = result.message
    msg.className = 'license-msg' + (result.ok ? '' : ' license-msg--error')
    if (result.ok) {
      toast('Unlocked. Thank you.', 'success')
      void renderLicense()
    }
  }
  $('#license-apply').addEventListener('click', apply)
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') void apply()
  })
}

// --- Saved signatures ----------------------------------------------------

async function renderSignatures(): Promise<void> {
  const list = $('#sig-list')
  const count = $('#sig-count')
  const sigs = await storage.getSavedSignatures()
  count.textContent = sigs.length ? `${sigs.length} saved` : ''

  if (sigs.length === 0) {
    list.innerHTML = `<p class="opt__sigs-empty">No saved signatures yet. Create one in the editor and keep “Save for reuse” on.</p>`
    return
  }
  list.innerHTML = ''
  for (const sig of sigs) {
    const item = document.createElement('div')
    item.className = 'opt-sig'
    item.innerHTML = `
      <img src="${sig.dataUrl}" alt="Saved signature" />
      <button class="iconbtn opt-sig__del" aria-label="Delete signature" title="Delete">${icons.trash}</button>`
    item.querySelector('.opt-sig__del')!.addEventListener('click', async () => {
      const next = (await storage.getSavedSignatures()).filter((s) => s.id !== sig.id)
      await storage.setSavedSignatures(next)
      void renderSignatures()
    })
    list.append(item)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

// React to changes made elsewhere (e.g. editor saved a signature).
storage.onChanged((changes) => {
  if (changes['ssp.savedSignatures.v1']) void renderSignatures()
  if (changes['ssp.license.v1']) void renderLicense()
})

void renderLicense()
void renderSignatures()
