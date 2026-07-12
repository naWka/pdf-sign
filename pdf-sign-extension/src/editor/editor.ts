// Editor entry point. Wires file intake (drag & drop / picker / ?src= URL),
// mounts the UI, handles keyboard, and runs the gated download flow. All PDF work
// is local; the only fetch is an explicit user-chosen PDF URL from the context
// menu, which is the file the user asked to open (never an upload).

// Handwriting fonts, bundled locally (no remote fetch) for the "type" tools.
import '@fontsource/caveat'
import '@fontsource/dancing-script'
import '@fontsource/sacramento'

import { store } from './state'
import { mountPages } from './render'
import { mountTopbar } from './ui/topbar'
import { mountToolRail } from './ui/toolRail'
import { mountInspector } from './ui/inspector'
import { toast } from './ui/toast'
import { icons } from './ui/icons'
import { exportPdf, downloadPdf } from './export'
import { checkGate, recordExport, openPaywall } from './paywall'
import { maybeRecheckOnline } from '@/license/license'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

const intake = $('#intake')
const editor = $('#editor')

function mountUI(): void {
  mountTopbar($('#topbar'), handleDownload)
  mountToolRail($('#toolrail'))
  mountInspector($('#inspector'))
  mountPages($('#pages'))
  // Paint the dropzone icon (kept out of HTML so we reuse the icon set).
  $('.dropzone__icon').innerHTML = icons.file
  paintAssurances()
}

function paintAssurances(): void {
  document.querySelectorAll<HTMLElement>('.intake__assurances li').forEach((li) => {
    const name = li.dataset.icon as keyof typeof icons
    li.insertAdjacentHTML('afterbegin', icons[name] ?? '')
  })
}

// --- File intake ---------------------------------------------------------

function setupIntake(): void {
  const dropzone = $('#dropzone')
  const input = $<HTMLInputElement>('#file-input')

  $('#choose-file').addEventListener('click', (e) => {
    e.stopPropagation()
    input.click()
  })
  dropzone.addEventListener('click', () => input.click())
  dropzone.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') input.click()
  })
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (file) void loadFile(file)
  })

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('is-drag')
  })
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-drag'))
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('is-drag')
    const file = e.dataTransfer?.files?.[0]
    if (file) void loadFile(file)
  })

  // Prevent the browser from navigating away if a file is dropped outside the zone.
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', (e) => {
    e.preventDefault()
    if (!store.isLoaded) {
      const file = e.dataTransfer?.files?.[0]
      if (file) void loadFile(file)
    }
  })
}

async function loadFile(file: File): Promise<void> {
  if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    return showIntakeError('That is not a PDF. Please choose a .pdf file.')
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    await store.loadFromBytes(bytes, file.name)
    showEditor()
  } catch {
    showIntakeError('This PDF could not be opened. It may be corrupted or password-protected.')
  }
}

async function loadFromUrl(src: string): Promise<void> {
  try {
    // The user explicitly asked to open this PDF (context-menu link). We fetch it
    // to read it locally; nothing about the user's file is uploaded.
    const res = await fetch(src)
    if (!res.ok) throw new Error(String(res.status))
    const bytes = new Uint8Array(await res.arrayBuffer())
    const name = decodeURIComponent(src.split('/').pop()?.split('?')[0] || 'document.pdf')
    await store.loadFromBytes(bytes, name)
    showEditor()
  } catch {
    showIntakeError(
      'Could not open that PDF automatically (the site may block it). Download it, then drop it here.',
    )
  }
}

function showEditor(): void {
  intake.hidden = true
  editor.hidden = false
}

function showIntakeError(msg: string): void {
  const el = $('#intake-error')
  el.textContent = msg
  el.hidden = false
}

// --- Download flow (gated) ----------------------------------------------

let exporting = false
async function handleDownload(): Promise<void> {
  if (!store.isLoaded || exporting) return
  const gate = await checkGate()
  if (!gate.allowed) {
    openPaywall()
    return
  }
  exporting = true
  toast('Preparing your PDF…', 'info', 1500)
  try {
    const bytes = await exportPdf()
    downloadPdf(bytes, store.fileName)
    await recordExport()
    toast('Downloaded. Your file never left this device.', 'success')
  } catch (e) {
    toast('Export failed: ' + (e as Error).message, 'error', 5000)
  } finally {
    exporting = false
  }
}

// --- Keyboard ------------------------------------------------------------

function setupKeyboard(): void {
  document.addEventListener('keydown', (e) => {
    // Ignore while typing in a field / editing a text mark.
    const t = e.target as HTMLElement
    const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
    if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId && !typing) {
      e.preventDefault()
      store.removeElement(store.selectedId)
    }
    if (e.key === 'Escape') store.select(null)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void handleDownload()
    }
  })
}

// --- Boot ----------------------------------------------------------------

function boot(): void {
  mountUI()
  setupIntake()
  setupKeyboard()

  const src = new URLSearchParams(location.search).get('src')
  if (src) void loadFromUrl(src)

  // Best-effort license status refresh (offline-safe, throttled internally).
  void maybeRecheckOnline()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
