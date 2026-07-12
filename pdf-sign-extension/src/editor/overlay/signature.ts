// Signature capture: draw, type, or upload -> a trimmed transparent PNG. Returns
// the PNG plus its intrinsic size, or null if cancelled. Also owns the saved-
// signatures library (max SAVED_SIGNATURE_LIMIT) in chrome.storage.local. All of
// this is local: nothing is uploaded.

import { storage } from '@/shared/storage'
import {
  SAVED_SIGNATURE_LIMIT,
  FONT_FAMILIES,
  DEFAULT_SIGNATURE_FONT,
  INK_COLOR,
} from '@/shared/constants'
import { uid } from '@/shared/geometry'
import type { SavedSignature } from '@/shared/types'

export interface CapturedImage {
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
}

type Mode = 'draw' | 'type' | 'upload' | 'saved'

const scriptFonts = FONT_FAMILIES.filter((f) => f.script)

export function openSignatureCapture(
  opts: { title?: string } = {},
): Promise<CapturedImage | null> {
  return new Promise((resolve) => {
    const modal = new SignatureModal(opts.title ?? 'Add signature', resolve)
    modal.open()
  })
}

class SignatureModal {
  private root!: HTMLElement
  private mode: Mode = 'draw'
  private drawCanvas!: HTMLCanvasElement
  private hasDrawing = false
  private typeValue = ''
  private typeFont = DEFAULT_SIGNATURE_FONT
  private uploaded: CapturedImage | null = null
  private saveForLater = true

  constructor(
    private title: string,
    private done: (r: CapturedImage | null) => void,
  ) {}

  async open(): Promise<void> {
    this.root = document.createElement('div')
    this.root.className = 'modal-backdrop'
    this.root.innerHTML = this.template()
    document.body.append(this.root)

    this.drawCanvas = this.root.querySelector('.sig-draw__canvas')!
    this.setupDraw()
    this.setupTabs()
    this.setupType()
    this.setupUpload()
    await this.renderSaved()
    this.setupFooter()

    this.root.addEventListener('pointerdown', (e) => {
      if (e.target === this.root) this.close(null)
    })
    document.addEventListener('keydown', this.onKey)
    requestAnimationFrame(() => this.root.classList.add('is-open'))
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close(null)
  }

  private template(): string {
    return `
      <div class="modal sig" role="dialog" aria-modal="true" aria-label="${this.title}">
        <header class="modal__head">
          <h2 class="modal__title">${this.title}</h2>
          <button class="iconbtn sig__close" aria-label="Close">${xIcon}</button>
        </header>
        <div class="sig__tabs" role="tablist">
          <button class="sig__tab is-active" data-mode="draw">Draw</button>
          <button class="sig__tab" data-mode="type">Type</button>
          <button class="sig__tab" data-mode="upload">Upload</button>
          <button class="sig__tab" data-mode="saved">Saved</button>
        </div>

        <div class="sig__panel" data-panel="draw">
          <div class="sig-draw">
            <canvas class="sig-draw__canvas" width="640" height="240"></canvas>
            <div class="sig-draw__baseline"></div>
            <span class="sig-draw__hint">Draw your signature</span>
          </div>
          <button class="btn btn--ghost btn--sm sig-draw__clear">Clear</button>
        </div>

        <div class="sig__panel" data-panel="type" hidden>
          <input class="sig-type__input" type="text" placeholder="Type your name"
                 autocomplete="off" spellcheck="false" maxlength="40" />
          <div class="sig-type__fonts">
            ${scriptFonts
              .map(
                (f, i) =>
                  `<button class="sig-type__font ${i === 0 ? 'is-active' : ''}" data-font="${f.key}"
                     style="font-family:${f.cssFamily}">Signature</button>`,
              )
              .join('')}
          </div>
          <div class="sig-type__preview" aria-live="polite"></div>
        </div>

        <div class="sig__panel" data-panel="upload" hidden>
          <label class="sig-upload">
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden />
            <div class="sig-upload__drop">
              <span>Choose an image of your signature</span>
              <span class="muted">PNG or JPG, transparent background works best</span>
            </div>
          </label>
          <div class="sig-upload__preview" hidden></div>
        </div>

        <div class="sig__panel" data-panel="saved" hidden>
          <div class="sig-saved__list"></div>
        </div>

        <footer class="modal__foot">
          <label class="sig__save">
            <input type="checkbox" class="sig__save-check" checked />
            Save for reuse
          </label>
          <div class="modal__foot-actions">
            <button class="btn btn--secondary sig__cancel">Cancel</button>
            <button class="btn btn--primary sig__confirm">Add signature</button>
          </div>
        </footer>
      </div>`
  }

  private setupTabs(): void {
    this.root.querySelectorAll<HTMLElement>('.sig__tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode as Mode))
    })
  }

  private switchMode(mode: Mode): void {
    this.mode = mode
    this.root.querySelectorAll<HTMLElement>('.sig__tab').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.mode === mode)
    })
    this.root.querySelectorAll<HTMLElement>('.sig__panel').forEach((p) => {
      p.hidden = p.dataset.panel !== mode
    })
    // The "Save for reuse" checkbox is meaningless for the saved list.
    ;(this.root.querySelector('.sig__save') as HTMLElement).style.visibility =
      mode === 'saved' ? 'hidden' : 'visible'
  }

  // --- Draw --------------------------------------------------------------
  private setupDraw(): void {
    const canvas = this.drawCanvas
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = 640 * dpr
    canvas.height = 240 * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = INK_COLOR
    ctx.lineWidth = 2.6
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    let drawing = false
    let last: { x: number; y: number } | null = null
    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * 640, y: ((e.clientY - r.top) / r.height) * 240 }
    }
    canvas.addEventListener('pointerdown', (e) => {
      drawing = true
      last = pos(e)
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing || !last) return
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      // Quadratic smoothing for a more natural stroke.
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 }
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y)
      ctx.stroke()
      last = p
      this.hasDrawing = true
      this.root.querySelector('.sig-draw__hint')?.classList.add('is-hidden')
    })
    const stop = () => {
      drawing = false
      last = null
    }
    canvas.addEventListener('pointerup', stop)
    canvas.addEventListener('pointercancel', stop)

    this.root.querySelector('.sig-draw__clear')!.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      this.hasDrawing = false
      this.root.querySelector('.sig-draw__hint')?.classList.remove('is-hidden')
    })
  }

  // --- Type --------------------------------------------------------------
  private setupType(): void {
    const input = this.root.querySelector<HTMLInputElement>('.sig-type__input')!
    const preview = this.root.querySelector<HTMLElement>('.sig-type__preview')!
    const update = () => {
      this.typeValue = input.value
      const font = FONT_FAMILIES.find((f) => f.key === this.typeFont)!
      preview.textContent = input.value || 'Signature'
      preview.style.fontFamily = font.cssFamily
      preview.style.color = INK_COLOR
      preview.classList.toggle('is-placeholder', !input.value)
    }
    input.addEventListener('input', update)
    this.root.querySelectorAll<HTMLElement>('.sig-type__font').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.typeFont = btn.dataset.font!
        this.root
          .querySelectorAll('.sig-type__font')
          .forEach((b) => b.classList.toggle('is-active', b === btn))
        update()
      })
    })
    update()
  }

  // --- Upload ------------------------------------------------------------
  private setupUpload(): void {
    const input = this.root.querySelector<HTMLInputElement>('.sig-upload input[type=file]')!
    const preview = this.root.querySelector<HTMLElement>('.sig-upload__preview')!
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      const img = await fileToImage(file)
      const trimmed = trimTransparent(img)
      this.uploaded = trimmed
      preview.hidden = false
      preview.innerHTML = `<img src="${trimmed.dataUrl}" alt="Uploaded signature preview" />`
    })
  }

  // --- Saved -------------------------------------------------------------
  private async renderSaved(): Promise<void> {
    const list = this.root.querySelector<HTMLElement>('.sig-saved__list')!
    const saved = await storage.getSavedSignatures()
    if (saved.length === 0) {
      list.innerHTML = `<p class="sig-saved__empty muted">No saved signatures yet. Create one in Draw, Type, or Upload and keep “Save for reuse” on.</p>`
      return
    }
    list.innerHTML = ''
    for (const sig of saved) {
      const item = document.createElement('div')
      item.className = 'sig-saved__item'
      item.innerHTML = `
        <button class="sig-saved__use" title="Use this signature">
          <img src="${sig.dataUrl}" alt="Saved signature" />
        </button>
        <button class="iconbtn sig-saved__del" title="Delete" aria-label="Delete signature">${trashIcon}</button>`
      item.querySelector('.sig-saved__use')!.addEventListener('click', () => {
        this.close({
          dataUrl: sig.dataUrl,
          naturalWidth: sig.naturalWidth,
          naturalHeight: sig.naturalHeight,
        })
      })
      item.querySelector('.sig-saved__del')!.addEventListener('click', async () => {
        const next = (await storage.getSavedSignatures()).filter((s) => s.id !== sig.id)
        await storage.setSavedSignatures(next)
        await this.renderSaved()
      })
      list.append(item)
    }
  }

  // --- Footer / confirm --------------------------------------------------
  private setupFooter(): void {
    this.root.querySelector('.sig__close')!.addEventListener('click', () => this.close(null))
    this.root.querySelector('.sig__cancel')!.addEventListener('click', () => this.close(null))
    const saveCheck = this.root.querySelector<HTMLInputElement>('.sig__save-check')!
    saveCheck.addEventListener('change', () => (this.saveForLater = saveCheck.checked))
    this.root.querySelector('.sig__confirm')!.addEventListener('click', () => this.confirm())
  }

  private async confirm(): Promise<void> {
    const captured = await this.buildCaptured()
    if (!captured) {
      this.shake()
      return
    }
    if (this.saveForLater && this.mode !== 'saved') {
      await this.persist(captured)
    }
    this.close(captured)
  }

  private async buildCaptured(): Promise<CapturedImage | null> {
    if (this.mode === 'draw') {
      if (!this.hasDrawing) return null
      return trimTransparent(this.drawCanvas)
    }
    if (this.mode === 'type') {
      if (!this.typeValue.trim()) return null
      return renderTypedSignature(this.typeValue.trim(), this.typeFont)
    }
    if (this.mode === 'upload') {
      return this.uploaded
    }
    return null // 'saved' resolves directly on click
  }

  private async persist(cap: CapturedImage): Promise<void> {
    const saved = await storage.getSavedSignatures()
    const entry: SavedSignature = {
      id: uid('sig'),
      dataUrl: cap.dataUrl,
      naturalWidth: cap.naturalWidth,
      naturalHeight: cap.naturalHeight,
      createdAt: Date.now(),
    }
    const next = [entry, ...saved].slice(0, SAVED_SIGNATURE_LIMIT)
    await storage.setSavedSignatures(next)
  }

  private shake(): void {
    const modal = this.root.querySelector('.modal')!
    modal.classList.remove('shake')
    void (modal as HTMLElement).offsetWidth
    modal.classList.add('shake')
  }

  private close(result: CapturedImage | null): void {
    document.removeEventListener('keydown', this.onKey)
    this.root.classList.remove('is-open')
    setTimeout(() => this.root.remove(), 180)
    this.done(result)
  }
}

// --- Image helpers -------------------------------------------------------

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

/** Render typed text in a script font to a trimmed transparent PNG. */
function renderTypedSignature(text: string, fontKey: string): CapturedImage {
  const font = FONT_FAMILIES.find((f) => f.key === fontKey)!
  const fontSize = 120
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `${fontSize}px ${font.cssFamily}`
  const w = Math.ceil(measure.measureText(text).width) + 60
  const h = Math.ceil(fontSize * 1.6)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontSize}px ${font.cssFamily}`
  ctx.fillStyle = INK_COLOR
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 30, h / 2)
  return trimTransparent(canvas)
}

/**
 * Crop transparent/white margins so the placed signature hugs its ink. Works on
 * a canvas or an image; treats near-white as background for uploaded scans.
 */
function trimTransparent(source: HTMLCanvasElement | HTMLImageElement): CapturedImage {
  const sw = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth
  const sh = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, sw, sh)
  const { data } = ctx.getImageData(0, 0, sw, sh)

  let top = sh,
    left = sw,
    right = 0,
    bottom = 0
  const isInk = (i: number) => {
    const a = data[i + 3]
    if (a < 24) return false
    // For opaque uploads, also drop near-white pixels.
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    return !(a > 200 && r > 240 && g > 240 && b > 240)
  }
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4
      if (isInk(i)) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  if (right < left || bottom < top) {
    // Nothing found; return the source untrimmed.
    return { dataUrl: canvas.toDataURL('image/png'), naturalWidth: sw, naturalHeight: sh }
  }
  const pad = 6
  left = Math.max(0, left - pad)
  top = Math.max(0, top - pad)
  right = Math.min(sw - 1, right + pad)
  bottom = Math.min(sh - 1, bottom + pad)
  const w = right - left + 1
  const h = bottom - top + 1
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  out.getContext('2d')!.drawImage(canvas, left, top, w, h, 0, 0, w, h)
  return { dataUrl: out.toDataURL('image/png'), naturalWidth: w, naturalHeight: h }
}

// Inline icons (no icon font, no remote assets).
const xIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
const trashIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/></svg>`
