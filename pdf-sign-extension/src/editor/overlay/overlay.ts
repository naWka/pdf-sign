// The overlay layer: interaction + DOM for marks on one page. Element positions
// are stored normalized (0..1) so a single % layout scales with any zoom. During
// a drag/resize we mutate the node's style live and only commit to the store on
// release, so the store never re-renders mid-gesture (keeps editing smooth and
// preserves text-edit focus).

import { store } from '../state'
import type { OverlayElement, TextElement, ImageElement, CheckboxElement } from '@/shared/types'
import { clamp } from '@/shared/geometry'
import { FONT_FAMILIES, INK_COLOR } from '@/shared/constants'
import { openSignatureCapture } from './signature'
import { createDefaultElement } from './elements'

// Per-overlay map of element id -> DOM node, so sync can reconcile without
// destroying nodes that are focused or mid-edit.
const nodeMaps = new WeakMap<HTMLElement, Map<string, HTMLElement>>()

function mapFor(overlay: HTMLElement): Map<string, HTMLElement> {
  let m = nodeMaps.get(overlay)
  if (!m) {
    m = new Map()
    nodeMaps.set(overlay, m)
  }
  return m
}

/** Reconcile the DOM nodes on this overlay with the store's elements. */
export function syncOverlay(overlay: HTMLElement, pageIndex: number): void {
  const map = mapFor(overlay)
  const elements = store.elementsForPage(pageIndex)
  const wanted = new Set(elements.map((e) => e.id))

  // Remove stale nodes.
  for (const [id, node] of map) {
    if (!wanted.has(id)) {
      node.remove()
      map.delete(id)
    }
  }

  for (const el of elements) {
    let node = map.get(el.id)
    if (!node) {
      node = createNode(el, overlay, pageIndex)
      map.set(el.id, node)
      overlay.append(node)
    }
    updateNode(node, el, pageIndex)
    node.classList.toggle('is-selected', store.selectedId === el.id)
  }
}

/** Attach placement + selection handlers to an overlay (called once per render). */
export function attachOverlayInteractions(overlay: HTMLElement, pageIndex: number): void {
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target !== overlay) return // clicks on elements are handled per-node
    if (store.tool === 'select') {
      store.select(null)
      return
    }
    void placeAt(e, overlay, pageIndex)
  })
}

async function placeAt(e: PointerEvent, overlay: HTMLElement, pageIndex: number): Promise<void> {
  const rect = overlay.getBoundingClientRect()
  const xNorm = clamp((e.clientX - rect.left) / rect.width, 0, 1)
  const yNorm = clamp((e.clientY - rect.top) / rect.height, 0, 1)
  const size = store.pageSizes.get(pageIndex)
  if (!size) return

  const tool = store.tool
  if (tool === 'select') return
  if (tool === 'signature') {
    const captured = await openSignatureCapture({ title: 'Add signature' })
    if (!captured) return
    const el = createDefaultElement('signature', pageIndex, xNorm, yNorm, size, captured)
    store.addElement(el)
  } else {
    const el = createDefaultElement(tool, pageIndex, xNorm, yNorm, size)
    const added = store.addElement(el)
    if (added.type === 'text' || added.type === 'date' || added.type === 'initials') {
      // Enter edit mode on the freshly placed text node.
      requestAnimationFrame(() => beginEdit(added.id))
    }
  }
  store.setTool('select')
}

// --- Node creation / update ---------------------------------------------

function createNode(el: OverlayElement, overlay: HTMLElement, pageIndex: number): HTMLElement {
  const node = document.createElement('div')
  node.className = `ov ov--${el.type}`
  node.dataset.id = el.id

  if (el.type === 'signature' || el.type === 'image') {
    const img = document.createElement('img')
    img.className = 'ov__img'
    img.draggable = false
    img.alt = 'Signature'
    node.append(img)
  } else if (el.type === 'checkbox') {
    const glyph = document.createElement('span')
    glyph.className = 'ov__glyph'
    node.append(glyph)
  } else {
    const text = document.createElement('div')
    text.className = 'ov__text'
    text.contentEditable = 'false'
    text.spellcheck = false
    text.addEventListener('input', () => {
      store.updateElement(el.id, { text: text.innerText } as Partial<TextElement>)
    })
    text.addEventListener('blur', () => endEdit(el.id, node))
    node.append(text)
  }

  attachNodeInteractions(node, overlay, pageIndex)
  addHandles(node)
  return node
}

function updateNode(node: HTMLElement, el: OverlayElement, pageIndex: number): void {
  const size = store.pageSizes.get(pageIndex)
  node.style.left = `${el.xNorm * 100}%`
  node.style.top = `${el.yNorm * 100}%`
  node.style.width = `${el.wNorm * 100}%`

  if (el.type === 'signature' || el.type === 'image') {
    node.style.height = `${el.hNorm * 100}%`
    const img = node.querySelector<HTMLImageElement>('.ov__img')!
    if (img.src !== (el as ImageElement).dataUrl) img.src = (el as ImageElement).dataUrl
  } else if (el.type === 'checkbox') {
    node.style.height = `${el.hNorm * 100}%`
    const cb = el as CheckboxElement
    const glyph = node.querySelector<HTMLElement>('.ov__glyph')!
    glyph.textContent = cb.glyph === 'cross' ? '✕' : '✓'
    glyph.style.color = cb.color
    node.style.setProperty('--glyph-size', size ? `${el.hNorm * size.cssHeight * 0.9}px` : '16px')
  } else {
    node.style.height = 'auto'
    const t = el as TextElement
    const text = node.querySelector<HTMLElement>('.ov__text')!
    if (text.innerText !== t.text && document.activeElement !== text) text.innerText = t.text
    const font = FONT_FAMILIES.find((f) => f.key === t.fontFamily) ?? FONT_FAMILIES[3]
    const scale = size ? size.cssWidth / size.pointWidth : 1
    text.style.fontFamily = font.cssFamily
    text.style.fontSize = `${t.fontSizePt * scale}px`
    text.style.color = t.color
    text.style.fontWeight = t.bold ? '600' : '400'
    text.dataset.placeholder =
      el.type === 'initials' ? 'AB' : el.type === 'date' ? 'Date' : 'Text'
  }
}

// --- Per-node drag / resize / select ------------------------------------

function attachNodeInteractions(node: HTMLElement, overlay: HTMLElement, pageIndex: number): void {
  node.addEventListener('pointerdown', (e) => {
    const id = node.dataset.id!
    const el = store.elements.find((x) => x.id === id)
    if (!el) return

    // If a text node is being edited, let the caret handle the pointer.
    if (node.classList.contains('is-editing')) return

    const handle = (e.target as HTMLElement).closest('.ov__handle') as HTMLElement | null
    e.stopPropagation()
    store.select(id)

    const rect = overlay.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const start = { x: el.xNorm, y: el.yNorm, w: el.wNorm, h: el.hNorm }
    const aspectLocked = el.type === 'signature' || el.type === 'image'
    let moved = false

    node.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const dxN = (ev.clientX - startX) / rect.width
      const dyN = (ev.clientY - startY) / rect.height
      if (!moved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 3) return
      moved = true

      if (handle) {
        resizeLive(node, handle.dataset.dir!, start, dxN, dyN, aspectLocked, pageIndex, el)
      } else {
        const nx = clamp(start.x + dxN, 0, 1 - start.w)
        const ny = clamp(start.y + dyN, 0, 1 - start.h)
        node.style.left = `${nx * 100}%`
        node.style.top = `${ny * 100}%`
      }
    }

    const onUp = () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerup', onUp)
      if (!moved) return
      // Commit final geometry (read back from style %).
      const patch = readGeometry(node)
      store.updateElement(id, patch)
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerup', onUp)
  })

  // Double-click a text node to edit it.
  node.addEventListener('dblclick', () => {
    const el = store.elements.find((x) => x.id === node.dataset.id)
    if (el && (el.type === 'text' || el.type === 'date' || el.type === 'initials')) {
      beginEdit(el.id)
    }
  })
}

function resizeLive(
  node: HTMLElement,
  dir: string,
  start: { x: number; y: number; w: number; h: number },
  dxN: number,
  dyN: number,
  aspectLocked: boolean,
  pageIndex: number,
  el: OverlayElement,
): void {
  let { x, y, w, h } = start
  const east = dir.includes('e')
  const south = dir.includes('s')
  const west = dir.includes('w')
  const north = dir.includes('n')

  if (east) w = clamp(start.w + dxN, 0.02, 1 - start.x)
  if (west) {
    w = clamp(start.w - dxN, 0.02, start.x + start.w)
    x = start.x + start.w - w
  }

  const isText = el.type === 'text' || el.type === 'date' || el.type === 'initials'

  if (aspectLocked && start.w > 0) {
    // Preserve aspect. The page's px dims cancel out, so keeping the *normalized*
    // ratio keeps the pixel ratio: h = w * (start.h / start.w).
    h = w * (start.h / start.w)
    if (north) y = start.y + start.h - h
  } else if (el.type === 'checkbox') {
    // Keep it visually square: pxW == pxH  ->  h = w * cssW/cssH.
    const size = store.pageSizes.get(pageIndex)!
    h = w * (size.cssWidth / size.cssHeight)
    if (north) y = start.y + start.h - h
  } else if (!isText) {
    if (south) h = clamp(start.h + dyN, 0.02, 1 - start.y)
    if (north) {
      h = clamp(start.h - dyN, 0.02, start.y + start.h)
      y = start.y + start.h - h
    }
  }

  node.style.left = `${x * 100}%`
  node.style.top = `${y * 100}%`
  node.style.width = `${w * 100}%`
  if (!isText) {
    node.style.height = `${h * 100}%`
  } else {
    // Text has auto height; scale the font with the box width instead.
    const t = el as TextElement
    const size = store.pageSizes.get(pageIndex)!
    const factor = w / start.w
    const scale = size.cssWidth / size.pointWidth
    node.querySelector<HTMLElement>('.ov__text')!.style.fontSize = `${t.fontSizePt * factor * scale}px`
    node.dataset.fontFactor = String(factor)
  }
}

function readGeometry(node: HTMLElement): Partial<OverlayElement> {
  const pct = (v: string) => parseFloat(v) / 100
  const patch: Partial<OverlayElement> = {
    xNorm: pct(node.style.left),
    yNorm: pct(node.style.top),
    wNorm: pct(node.style.width),
  }
  if (node.style.height && node.style.height !== 'auto') {
    ;(patch as { hNorm?: number }).hNorm = pct(node.style.height)
  }
  const factor = node.dataset.fontFactor
  if (factor) {
    const id = node.dataset.id!
    const el = store.elements.find((x) => x.id === id) as TextElement | undefined
    if (el) (patch as Partial<TextElement>).fontSizePt = el.fontSizePt * parseFloat(factor)
    delete node.dataset.fontFactor
  }
  return patch
}

// --- Text editing --------------------------------------------------------

function beginEdit(id: string): void {
  const node = document.querySelector<HTMLElement>(`.ov[data-id="${id}"]`)
  if (!node) return
  const text = node.querySelector<HTMLElement>('.ov__text')
  if (!text) return
  node.classList.add('is-editing')
  text.contentEditable = 'true'
  text.focus()
  const range = document.createRange()
  range.selectNodeContents(text)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function endEdit(id: string, node: HTMLElement): void {
  node.classList.remove('is-editing')
  const text = node.querySelector<HTMLElement>('.ov__text')
  if (text) text.contentEditable = 'false'
  const el = store.elements.find((x) => x.id === id) as TextElement | undefined
  if (el && !el.text.trim()) store.removeElement(id) // discard empty text marks
}

// --- Resize handles ------------------------------------------------------

function addHandles(node: HTMLElement): void {
  for (const dir of ['nw', 'ne', 'sw', 'se']) {
    const h = document.createElement('span')
    h.className = `ov__handle ov__handle--${dir}`
    h.dataset.dir = dir
    node.append(h)
  }
}

// default ink for text placement (referenced by elements.ts consumers)
export const DEFAULT_INK = INK_COLOR
