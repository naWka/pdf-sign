// Shared data model for the whole extension. Coordinates are stored *normalized*
// (0..1) relative to the page they sit on, with a top-left origin. That makes the
// overlay resolution-independent: the same element renders correctly at any zoom
// and maps cleanly onto PDF points at export time, regardless of device DPI.

export type ElementType =
  | 'signature'
  | 'image'
  | 'text'
  | 'date'
  | 'initials'
  | 'checkbox'

export interface BaseElement {
  id: string
  type: ElementType
  /** Index into the current (possibly reordered) page list. */
  pageIndex: number
  /** Top-left corner, normalized to page size. */
  xNorm: number
  yNorm: number
  /** Size, normalized to page size. */
  wNorm: number
  hNorm: number
}

/** A raster mark: drawn/typed/uploaded signature, initials image, or any PNG. */
export interface ImageElement extends BaseElement {
  type: 'signature' | 'image'
  /** PNG data URL. Kept in memory / storage, never uploaded. */
  dataUrl: string
  /** Intrinsic pixel size of the source image, for aspect-ratio locking. */
  naturalWidth: number
  naturalHeight: number
}

/** A vector text mark: free text, a date, or typed initials. */
export interface TextElement extends BaseElement {
  type: 'text' | 'date' | 'initials'
  text: string
  /** Font size in PDF points (page-space), so it exports 1:1. */
  fontSizePt: number
  color: string
  /** One of FONT_FAMILIES keys. */
  fontFamily: string
  bold: boolean
}

export interface CheckboxElement extends BaseElement {
  type: 'checkbox'
  checked: boolean
  /** 'check' or 'cross' glyph. */
  glyph: 'check' | 'cross'
  color: string
}

export type OverlayElement = ImageElement | TextElement | CheckboxElement

/** One page slot in display order. Deleting drops the slot; reorder permutes. */
export interface PageState {
  /** Index of this page in the *source* PDF (stable across reorders). */
  originalIndex: number
  /** Extra clockwise rotation applied on top of the page's own /Rotate. */
  rotation: 0 | 90 | 180 | 270
}

/** A reusable signature the user saved (max SAVED_SIGNATURE_LIMIT). */
export interface SavedSignature {
  id: string
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
  createdAt: number
}

/** Cached license status. Verified locally against the bundled public key. */
export interface LicenseCache {
  token: string
  valid: boolean
  /** epoch ms of last successful *local* verification. */
  verifiedAt: number
  /** epoch ms of last best-effort *online* re-check (0 = never). */
  lastOnlineCheck: number
  email?: string
}

export interface UsageState {
  /** How many exports the user has spent. Gated at FREE_EXPORT_LIMIT. */
  exportsUsed: number
}
