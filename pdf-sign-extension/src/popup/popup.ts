import { storage } from '@/shared/storage'
import { FREE_EXPORT_LIMIT, PRIVACY_URL } from '@/shared/constants'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

$('#open-editor').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'open-editor' })
  window.close()
})

$('#open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
  window.close()
})

const privacy = $<HTMLAnchorElement>('#privacy')
privacy.href = PRIVACY_URL

async function renderStatus() {
  const status = $('#status')
  const [license, usage] = await Promise.all([
    storage.getLicense(),
    storage.getUsage(),
  ])

  if (license?.valid) {
    status.className = 'status status--unlocked'
    status.innerHTML = `
      <div class="status__title">Lifetime unlocked</div>
      <div class="status__body">Unlimited exports on this device, forever.</div>`
    status.hidden = false
    return
  }

  const used = Math.min(usage.exportsUsed, FREE_EXPORT_LIMIT)
  const left = Math.max(0, FREE_EXPORT_LIMIT - used)
  status.className = 'status'
  status.innerHTML = `
    <div class="status__title">Free plan</div>
    <div class="status__body">
      <span class="tnum">${left}</span> of
      <span class="tnum">${FREE_EXPORT_LIMIT}</span> free exports left.
    </div>
    <div class="status__meter"><span style="width:${(used / FREE_EXPORT_LIMIT) * 100}%"></span></div>`
  status.hidden = false
}

renderStatus()
