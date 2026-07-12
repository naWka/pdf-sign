// Factory for freshly-placed overlay elements. Sizes are chosen in page units so
// they look right at any zoom and export 1:1; the placement point becomes the
// element's center.

import type {
  OverlayElement,
  ImageElement,
  TextElement,
  CheckboxElement,
} from '@/shared/types'
import type { RenderedSize } from '../state'
import type { CapturedImage } from './signature'
import { clamp } from '@/shared/geometry'
import { DEFAULT_TEXT_FONT, INK_COLOR } from '@/shared/constants'

type PlaceTool = 'signature' | 'text' | 'date' | 'initials' | 'checkbox'

export function createDefaultElement(
  tool: PlaceTool,
  pageIndex: number,
  xNorm: number,
  yNorm: number,
  size: RenderedSize,
  captured?: CapturedImage,
): Omit<OverlayElement, 'id'> {
  const pageAspect = size.cssWidth / size.cssHeight // == pointWidth / pointHeight

  if (tool === 'signature' && captured) {
    const wNorm = 0.28
    // Preserve the captured image's pixel aspect on the page.
    const hNorm = wNorm * (captured.naturalHeight / captured.naturalWidth) * pageAspect
    const el: Omit<ImageElement, 'id'> = {
      type: 'signature',
      pageIndex,
      xNorm: clamp(xNorm - wNorm / 2, 0, 1 - wNorm),
      yNorm: clamp(yNorm - hNorm / 2, 0, 1 - hNorm),
      wNorm,
      hNorm,
      dataUrl: captured.dataUrl,
      naturalWidth: captured.naturalWidth,
      naturalHeight: captured.naturalHeight,
    }
    return el
  }

  if (tool === 'checkbox') {
    const sizePt = 15
    const wNorm = sizePt / size.pointWidth
    const hNorm = wNorm * pageAspect // visually square
    const el: Omit<CheckboxElement, 'id'> = {
      type: 'checkbox',
      pageIndex,
      xNorm: clamp(xNorm - wNorm / 2, 0, 1 - wNorm),
      yNorm: clamp(yNorm - hNorm / 2, 0, 1 - hNorm),
      wNorm,
      hNorm,
      checked: true,
      glyph: 'check',
      color: INK_COLOR,
    }
    return el
  }

  // Text-family: text / date / initials.
  const isInitials = tool === 'initials'
  const isDate = tool === 'date'
  const fontSizePt = isInitials ? 22 : 14
  const wNorm = isInitials ? 0.1 : isDate ? 0.2 : 0.34
  const approxHNorm = (fontSizePt * 1.3) / size.pointHeight
  const el: Omit<TextElement, 'id'> = {
    // signature/checkbox already returned above; this is a text-family tool.
    type: tool as TextElement['type'],
    pageIndex,
    xNorm: clamp(xNorm - wNorm / 2, 0, 1 - wNorm),
    yNorm: clamp(yNorm - approxHNorm / 2, 0, 1 - approxHNorm),
    wNorm,
    hNorm: approxHNorm,
    text: isDate ? formatToday() : '',
    fontSizePt,
    color: INK_COLOR,
    fontFamily: DEFAULT_TEXT_FONT,
    bold: false,
  }
  return el
}

function formatToday(): string {
  // Local short date, matching how people fill forms by hand.
  return new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
