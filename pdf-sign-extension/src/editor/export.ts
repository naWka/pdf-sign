// Export: take the pristine source bytes + the overlay state and produce a new,
// flattened PDF. Page edits (delete / reorder / rotate) are applied by rebuilding
// the document one page at a time; each source page is embedded upright into a
// fresh page (rotation baked in) so overlay placement is a simple top-left ->
// bottom-left mapping. Signatures embed as PNG, plain text draws as vector text,
// script-font text rasterizes to PNG, checkboxes draw as vector strokes.
//
// This runs entirely in the page; no network is touched.

import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage, type PDFFont } from 'pdf-lib'
import { store } from './state'
import type { OverlayElement, TextElement, ImageElement, CheckboxElement } from '@/shared/types'
import { FONT_FAMILIES } from '@/shared/constants'

interface PlacedPage {
  page: PDFPage
  /** Visual (upright) page size in points — overlays map into this box. */
  vw: number
  vh: number
}

export async function exportPdf(): Promise<Uint8Array> {
  if (!store.sourceBytes) throw new Error('No document loaded')
  await (document as Document & { fonts: FontFaceSet }).fonts.ready

  const src = await PDFDocument.load(store.sourceBytes)
  const out = await PDFDocument.create()

  // Embed each needed source page once, in display order.
  const orderedIndices = store.pages.map((p) => p.originalIndex)
  const embeddedPages = await out.embedPdf(store.sourceBytes, orderedIndices)

  // Cache standard fonts lazily.
  const fontCache = new Map<string, PDFFont>()
  const getStd = async (name: StandardFonts): Promise<PDFFont> => {
    const key = String(name)
    if (!fontCache.has(key)) fontCache.set(key, await out.embedFont(name))
    return fontCache.get(key)!
  }

  for (let i = 0; i < store.pages.length; i++) {
    const pageState = store.pages[i]
    const placed = addUprightPage(out, embeddedPages[i], src, pageState.originalIndex, pageState.rotation)

    for (const el of store.elementsForPage(i)) {
      await drawElement(out, placed, el, getStd)
    }
  }

  return out.save()
}

/**
 * Add a page to `out` that shows the source page upright at the requested total
 * rotation, with rotation baked into the content (the new page's /Rotate is 0).
 */
function addUprightPage(
  out: PDFDocument,
  embedded: Awaited<ReturnType<PDFDocument['embedPdf']>>[number],
  src: PDFDocument,
  originalIndex: number,
  extra: 0 | 90 | 180 | 270,
): PlacedPage {
  const srcPage = src.getPage(originalIndex)
  const srcRotate = ((srcPage.getRotation().angle % 360) + 360) % 360
  const R = ((srcRotate + extra) % 360) as 0 | 90 | 180 | 270

  const w = embedded.width // source content width (unrotated), points
  const h = embedded.height

  // Visual (upright) dimensions after rotation.
  const swap = R === 90 || R === 270
  const vw = swap ? h : w
  const vh = swap ? w : h

  const page = out.addPage([vw, vh])

  // Reproduce the viewer's clockwise /Rotate by drawing the embedded content with
  // a counterclockwise angle of (360 - R) and the matching translation so it
  // fills the page. (Derived per-case; the page dims cancel for placement.)
  let x = 0
  let y = 0
  if (R === 90) {
    x = 0
    y = w
  } else if (R === 180) {
    x = w
    y = h
  } else if (R === 270) {
    x = h
    y = 0
  }
  page.drawPage(embedded, { x, y, rotate: degrees((360 - R) % 360) })

  return { page, vw, vh }
}

async function drawElement(
  out: PDFDocument,
  placed: PlacedPage,
  el: OverlayElement,
  getStd: (n: StandardFonts) => Promise<PDFFont>,
): Promise<void> {
  const { page, vw, vh } = placed
  const x = el.xNorm * vw
  const boxW = el.wNorm * vw
  const boxH = el.hNorm * vh
  // PDF y (bottom-left origin) of the element's bottom edge.
  const yBottom = vh - (el.yNorm * vh + boxH)

  if (el.type === 'signature' || el.type === 'image') {
    await drawImageElement(out, page, el as ImageElement, x, yBottom, boxW, boxH)
  } else if (el.type === 'checkbox') {
    drawCheckbox(page, el as CheckboxElement, x, yBottom, boxW, boxH)
  } else {
    await drawTextElement(out, page, el as TextElement, x, vh, getStd)
  }
}

async function drawImageElement(
  out: PDFDocument,
  page: PDFPage,
  el: ImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  const png = await out.embedPng(el.dataUrl)
  page.drawImage(png, { x, y, width: w, height: h })
}

function drawCheckbox(
  page: PDFPage,
  el: CheckboxElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const color = hexToRgb(el.color)
  const thickness = Math.max(1, Math.min(w, h) * 0.12)
  const p = Math.min(w, h) * 0.18 // inset
  if (el.glyph === 'cross') {
    page.drawLine({ start: { x: x + p, y: y + p }, end: { x: x + w - p, y: y + h - p }, thickness, color })
    page.drawLine({ start: { x: x + w - p, y: y + p }, end: { x: x + p, y: y + h - p }, thickness, color })
  } else {
    // Checkmark: down to a low point, then up to the top-right.
    page.drawLine({ start: { x: x + p, y: y + h * 0.5 }, end: { x: x + w * 0.42, y: y + p }, thickness, color })
    page.drawLine({ start: { x: x + w * 0.42, y: y + p }, end: { x: x + w - p, y: y + h - p }, thickness, color })
  }
}

async function drawTextElement(
  out: PDFDocument,
  page: PDFPage,
  el: TextElement,
  x: number,
  vh: number,
  getStd: (n: StandardFonts) => Promise<PDFFont>,
): Promise<void> {
  const def = FONT_FAMILIES.find((f) => f.key === el.fontFamily) ?? FONT_FAMILIES[3]
  const size = el.fontSizePt
  const lineHeight = size * 1.3
  const lines = (el.text || '').split('\n')

  if (def.script || !def.pdfStandard) {
    // Script fonts can't be a StandardFont: rasterize each line to PNG.
    let topFromTop = el.yNorm * vh
    for (const line of lines) {
      if (line.trim()) {
        const img = rasterizeLine(line, def.cssFamily, size, el.color)
        const png = await out.embedPng(img.dataUrl)
        const drawH = size * 1.25
        const drawW = drawH * (img.width / img.height)
        page.drawImage(png, { x, y: vh - topFromTop - drawH, width: drawW, height: drawH })
      }
      topFromTop += lineHeight
    }
    return
  }

  const font = await getStd(stdFontFor(def.pdfStandard, el.bold))
  const color = hexToRgb(el.color)
  // Baseline sits ~0.8em below the visual top of each line.
  let baselineFromTop = el.yNorm * vh + size * 0.8
  for (const line of lines) {
    if (line.length) {
      page.drawText(line, { x, y: vh - baselineFromTop, size, font, color })
    }
    baselineFromTop += lineHeight
  }
}

function stdFontFor(
  base: NonNullable<(typeof FONT_FAMILIES)[number]['pdfStandard']>,
  bold: boolean,
): StandardFonts {
  switch (base) {
    case 'Helvetica':
    case 'HelveticaBold':
      return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
    case 'TimesRoman':
      return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman
    case 'Courier':
      return bold ? StandardFonts.CourierBold : StandardFonts.Courier
    default:
      return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
  }
}

/** Rasterize one line of script text to a tight transparent PNG. */
function rasterizeLine(
  text: string,
  cssFamily: string,
  sizePt: number,
  color: string,
): { dataUrl: string; width: number; height: number } {
  const scale = 4 // supersample for crisp output
  const px = sizePt * scale
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `${px}px ${cssFamily}`
  const w = Math.ceil(measure.measureText(text).width) + px * 0.4
  const h = Math.ceil(px * 1.5)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.font = `${px}px ${cssFamily}`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, px * 0.2, h / 2)
  return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h }
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '')
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  return rgb(r, g, b)
}

/** Save bytes to disk via chrome.downloads, falling back to an <a download>. */
export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const suggested = fileName.replace(/\.pdf$/i, '') + '-signed.pdf'
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  if (chrome?.downloads?.download) {
    chrome.downloads.download({ url, filename: suggested, saveAs: true }, () => {
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    })
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = suggested
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
