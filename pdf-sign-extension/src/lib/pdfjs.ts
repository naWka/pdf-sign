// pdf.js configured for MV3: the worker is bundled from node_modules via Vite's
// `new URL(..., import.meta.url)` asset handling, so it ships inside the package.
// Nothing is fetched from a CDN. Used only for on-screen rendering; export is
// done separately with pdf-lib against the original bytes.

import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

// Vite rewrites this to a local, hashed asset URL at build time.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export type { PDFDocumentProxy, PDFPageProxy }

/**
 * Parse PDF bytes into a pdf.js document. We hand pdf.js a *copy* of the bytes
 * (Uint8Array) because it transfers/detaches the buffer; the pristine original
 * is kept elsewhere for pdf-lib export.
 */
export async function loadPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const task = pdfjsLib.getDocument({
    data: bytes.slice(),
    // No external resources; everything the doc needs must be embedded.
    isEvalSupported: false,
    disableAutoFetch: true,
    disableStream: true,
  })
  return task.promise
}

/**
 * Render a page to a canvas at a target CSS width, honoring device pixel ratio
 * for crispness. Returns the CSS size used so the overlay layer can match it.
 */
export interface RenderResult {
  cssWidth: number
  cssHeight: number
  /** Page size in PDF points at this rotation (for font sizing + export map). */
  pointWidth: number
  pointHeight: number
}

export async function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  extraRotation: 0 | 90 | 180 | 270,
): Promise<RenderResult> {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rotation = (page.rotate + extraRotation) % 360
  const unscaled = page.getViewport({ scale: 1, rotation })
  const scale = cssWidth / unscaled.width
  const viewport = page.getViewport({ scale, rotation })

  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const ctx = canvas.getContext('2d', { alpha: false })!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  await page.render({ canvasContext: ctx, viewport }).promise

  return {
    cssWidth: viewport.width,
    cssHeight: viewport.height,
    pointWidth: unscaled.width,
    pointHeight: unscaled.height,
  }
}
