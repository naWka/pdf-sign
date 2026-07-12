import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

// Manifest V3 only. Every permission below is justified inline; adding any host
// permission or new permission must be argued for — each one hurts install
// conversion and store review. No `host_permissions`, no `<all_urls>`.
export default defineManifest({
  manifest_version: 3,
  name: 'Sign PDF — Fill & Sign PDF Free, No Upload',
  short_name: 'Sign & Fill PDF',
  description:
    'Sign and fill any PDF in your browser. No upload, no account — your files never leave your computer. Free, private, offline.',
  version: pkg.version,
  icons: {
    16: 'src/assets/icons/icon-16.png',
    32: 'src/assets/icons/icon-32.png',
    48: 'src/assets/icons/icon-48.png',
    128: 'src/assets/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'Sign & Fill PDF',
    default_icon: {
      16: 'src/assets/icons/icon-16.png',
      32: 'src/assets/icons/icon-32.png',
    },
  },
  options_page: 'src/options/options.html',
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  // storage:      saved signatures, free-action counter, cached license.
  // downloads:    save the finished PDF to disk.
  // contextMenus: right-click a PDF link -> "Open in Sign & Fill".
  permissions: ['storage', 'downloads', 'contextMenus'],
  // Strict CSP for extension pages: only self-hosted, bundled scripts. No eval,
  // no remote code. This is what keeps the extension review-safe.
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  // No web_accessible_resources: the editor tab is opened by the extension
  // itself via chrome.tabs.create(runtime.getURL(...)), which needs no WAR.
})
