// Renders the page list into the scroll area: one sheet per display page, each a
// pdf.js canvas plus an absolutely-positioned overlay layer for marks. Canvases
// are only re-rendered on structural change (load / rotate / delete / reorder /
// resize); moving a mark just restyles DOM, so editing stays smooth.

import { store } from './state'
import { renderPageToCanvas } from '@/lib/pdfjs'
import { syncOverlay, attachOverlayInteractions } from './overlay/overlay'
import { renderPageControls } from './ui/pageControls'

interface PageDom {
  root: HTMLElement
  sheet: HTMLElement
  canvas: HTMLCanvasElement
  overlay: HTMLElement
}

let container: HTMLElement
const pageDom = new Map<number, PageDom>()
let lastStructureVersion = -1
let targetWidth = 820
// Guards against overlapping async renders (e.g. a load + a resize firing close
// together). Each fullRender claims a token; a superseded run stops appending.
let renderSeq = 0

function computeWidth(): number {
  // Fit the sheet to the scroll area with comfortable margins, capped for readability.
  const avail = container.clientWidth - 96
  return Math.max(360, Math.min(920, avail))
}

export function mountPages(el: HTMLElement): void {
  container = el
  store.subscribe(onChange)
  const ro = new ResizeObserver(() => {
    const w = computeWidth()
    if (Math.abs(w - targetWidth) > 8 && store.isLoaded) {
      targetWidth = w
      void fullRender()
    }
  })
  ro.observe(container)
}

function onChange(): void {
  if (store.structureVersion !== lastStructureVersion) {
    void fullRender()
  } else {
    // Element-only change: resync overlays + selection.
    for (const [pageIndex, dom] of pageDom) {
      syncOverlay(dom.overlay, pageIndex)
    }
  }
}

async function fullRender(): Promise<void> {
  const myTurn = ++renderSeq
  lastStructureVersion = store.structureVersion
  targetWidth = computeWidth()
  container.innerHTML = ''
  pageDom.clear()
  store.pageSizes.clear()

  if (!store.isLoaded || !store.pdfDoc) return

  for (let i = 0; i < store.pages.length; i++) {
    // A newer render started while we were awaiting; abandon this one so we
    // never append stale pages into a container the newer run already cleared.
    if (myTurn !== renderSeq) return
    const pageState = store.pages[i]
    const root = document.createElement('div')
    root.className = 'page'
    root.dataset.page = String(i)

    const sheet = document.createElement('div')
    sheet.className = 'page__sheet'

    const canvas = document.createElement('canvas')
    canvas.className = 'page__canvas'

    const overlay = document.createElement('div')
    overlay.className = 'overlay'

    sheet.append(canvas, overlay)

    const controls = renderPageControls(i)

    root.append(sheet, controls)
    container.append(root)

    const dom: PageDom = { root, sheet, canvas, overlay }
    pageDom.set(i, dom)

    // Render the source page (1-based in pdf.js) with any extra rotation.
    const page = await store.pdfDoc.getPage(pageState.originalIndex + 1)
    const size = await renderPageToCanvas(page, canvas, targetWidth, pageState.rotation)
    sheet.style.width = `${size.cssWidth}px`
    sheet.style.height = `${size.cssHeight}px`
    overlay.style.width = `${size.cssWidth}px`
    overlay.style.height = `${size.cssHeight}px`
    store.pageSizes.set(i, size)

    attachOverlayInteractions(overlay, i)
    syncOverlay(overlay, i)
  }
}

/** Force a re-render (e.g. after a font finishes loading and text metrics shift). */
export function rerenderPages(): void {
  void fullRender()
}
