// The editor's single source of truth. A tiny observable store: mutate through
// methods, subscribe for re-render. Keeps the pristine source bytes (for pdf-lib
// export) separate from the pdf.js document (for on-screen rendering).

import { loadPdf, type PDFDocumentProxy } from '@/lib/pdfjs'
import type { OverlayElement, PageState } from '@/shared/types'
import { uid } from '@/shared/geometry'

export type Tool = 'select' | 'signature' | 'text' | 'date' | 'initials' | 'checkbox'

export interface RenderedSize {
  cssWidth: number
  cssHeight: number
  pointWidth: number
  pointHeight: number
}

type Listener = () => void

export class EditorStore {
  sourceBytes: Uint8Array | null = null
  pdfDoc: PDFDocumentProxy | null = null
  fileName = 'document.pdf'

  /** Display order of pages. Reordering permutes, deleting removes entries. */
  pages: PageState[] = []
  elements: OverlayElement[] = []

  tool: Tool = 'select'
  selectedId: string | null = null

  /** Rendered CSS size per display page index, filled in as pages render. */
  readonly pageSizes = new Map<number, RenderedSize>()

  private listeners = new Set<Listener>()
  /** Bumped on any structural change so views know to fully re-render pages. */
  structureVersion = 0

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit(): void {
    for (const fn of this.listeners) fn()
  }

  get isLoaded(): boolean {
    return this.pdfDoc !== null
  }

  async loadFromBytes(bytes: Uint8Array, fileName: string): Promise<void> {
    // Keep a pristine copy for export; hand pdf.js its own copy.
    this.sourceBytes = bytes.slice()
    this.pdfDoc = await loadPdf(bytes)
    this.fileName = fileName
    this.pages = Array.from({ length: this.pdfDoc.numPages }, (_, i) => ({
      originalIndex: i,
      rotation: 0,
    }))
    this.elements = []
    this.selectedId = null
    this.pageSizes.clear()
    this.structureVersion++
    this.emit()
  }

  setTool(tool: Tool): void {
    this.tool = tool
    if (tool !== 'select') this.selectedId = null
    this.emit()
  }

  select(id: string | null): void {
    if (this.selectedId === id) return
    this.selectedId = id
    this.emit()
  }

  addElement(el: Omit<OverlayElement, 'id'>): OverlayElement {
    const withId = { ...el, id: uid('el') } as OverlayElement
    this.elements.push(withId)
    this.selectedId = withId.id
    this.emit()
    return withId
  }

  updateElement(id: string, patch: Partial<OverlayElement>): void {
    const el = this.elements.find((e) => e.id === id)
    if (!el) return
    Object.assign(el, patch)
    this.emit()
  }

  removeElement(id: string): void {
    this.elements = this.elements.filter((e) => e.id !== id)
    if (this.selectedId === id) this.selectedId = null
    this.emit()
  }

  elementsForPage(pageIndex: number): OverlayElement[] {
    return this.elements.filter((e) => e.pageIndex === pageIndex)
  }

  // --- Page operations (Milestone 3) -------------------------------------
  rotatePage(pageIndex: number, dir: 1 | -1): void {
    const p = this.pages[pageIndex]
    if (!p) return
    p.rotation = (((p.rotation + dir * 90) % 360) + 360) % 360 as PageState['rotation']
    this.structureVersion++
    this.emit()
  }

  deletePage(pageIndex: number): void {
    if (this.pages.length <= 1) return
    this.pages.splice(pageIndex, 1)
    // Drop overlays on the removed page and reindex the rest.
    this.elements = this.elements
      .filter((e) => e.pageIndex !== pageIndex)
      .map((e) => (e.pageIndex > pageIndex ? { ...e, pageIndex: e.pageIndex - 1 } : e))
    this.selectedId = null
    this.structureVersion++
    this.emit()
  }

  movePage(from: number, to: number): void {
    if (from === to || to < 0 || to >= this.pages.length) return
    const [moved] = this.pages.splice(from, 1)
    this.pages.splice(to, 0, moved)
    // Remap element pageIndex to follow the page move.
    this.elements = this.elements.map((e) => {
      if (e.pageIndex === from) return { ...e, pageIndex: to }
      if (from < to && e.pageIndex > from && e.pageIndex <= to)
        return { ...e, pageIndex: e.pageIndex - 1 }
      if (from > to && e.pageIndex >= to && e.pageIndex < from)
        return { ...e, pageIndex: e.pageIndex + 1 }
      return e
    })
    this.structureVersion++
    this.emit()
  }
}

export const store = new EditorStore()
