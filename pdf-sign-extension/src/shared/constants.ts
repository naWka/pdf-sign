// Central knobs. Business-tunable numbers live here so there is one place to
// change them, and the free limit is confirmable by the product owner (4 or 5).

/** Free exports before the paywall gates further downloads. Owner-confirmed. */
export const FREE_EXPORT_LIMIT = 5

/** How many reusable signatures a user may keep locally. */
export const SAVED_SIGNATURE_LIMIT = 3

/** chrome.storage.local keys (single namespace, versioned for future migrations). */
export const STORAGE_KEYS = {
  savedSignatures: 'ssp.savedSignatures.v1',
  usage: 'ssp.usage.v1',
  license: 'ssp.license.v1',
  settings: 'ssp.settings.v1',
} as const

/** Re-check license status online at most this often (best-effort, offline-safe). */
export const LICENSE_RECHECK_INTERVAL_MS = 10 * 24 * 60 * 60 * 1000 // ~10 days

/**
 * Companion-site URLs. Injected at build time from .env (see .env.example) so the
 * same code points at localhost / staging / prod without edits. Fallbacks keep
 * dev builds working before the site exists.
 */
export const SITE_URL =
  import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || 'https://signfillpdf.com'
export const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || `${SITE_URL}/pricing`
export const PRIVACY_URL = `${SITE_URL}/privacy`
/** Public endpoint that returns only { status } for a license (best-effort recheck). */
export const LICENSE_STATUS_URL =
  import.meta.env.VITE_LICENSE_STATUS_URL || `${SITE_URL}/api/license/status`

/** Fonts bundled locally for the "type" signature + text tools. No remote fetch. */
export interface FontDef {
  key: string
  label: string
  /** CSS font-family as declared by @fontsource, used in the DOM overlay. */
  cssFamily: string
  /** Standard-14 PDF font is impossible for script faces, so export rasterizes
   *  script fonts to PNG; `pdfStandard` names a StandardFont for plain text. */
  pdfStandard?: 'Helvetica' | 'HelveticaBold' | 'TimesRoman' | 'Courier'
  script: boolean
}

export const FONT_FAMILIES: FontDef[] = [
  { key: 'caveat', label: 'Caveat', cssFamily: '"Caveat", cursive', script: true },
  {
    key: 'dancing',
    label: 'Dancing Script',
    cssFamily: '"Dancing Script", cursive',
    script: true,
  },
  {
    key: 'sacramento',
    label: 'Sacramento',
    cssFamily: '"Sacramento", cursive',
    script: true,
  },
  {
    key: 'sans',
    label: 'Sans',
    cssFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    pdfStandard: 'Helvetica',
    script: false,
  },
  {
    key: 'serif',
    label: 'Serif',
    cssFamily: 'Georgia, "Times New Roman", serif',
    pdfStandard: 'TimesRoman',
    script: false,
  },
  {
    key: 'mono',
    label: 'Mono',
    cssFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    pdfStandard: 'Courier',
    script: false,
  },
]

export const DEFAULT_TEXT_FONT = 'sans'
export const DEFAULT_SIGNATURE_FONT = 'caveat'

/** Ink color used for signature strokes and default text (matches DESIGN.md --ink). */
export const INK_COLOR = '#3a3d8f'
