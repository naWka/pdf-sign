// MV3 event-driven service worker. No DOM, no persistent state. Its only jobs:
//  1. Register a context-menu entry on PDF links -> open the editor with that URL.
//  2. Open the editor tab on demand (message from the popup).
// It never touches PDF bytes; the editor does all file work locally.

const MENU_ID = 'open-in-sign-fill'
const EDITOR_PATH = 'src/editor/editor.html'

function editorUrl(src?: string): string {
  const base = chrome.runtime.getURL(EDITOR_PATH)
  return src ? `${base}?src=${encodeURIComponent(src)}` : base
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Open in Sign & Fill PDF',
    contexts: ['link'],
    // Only offer it on things that look like PDFs.
    targetUrlPatterns: ['*://*/*.pdf', '*://*/*.PDF', '*://*/*.pdf?*'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_ID && info.linkUrl) {
    chrome.tabs.create({ url: editorUrl(info.linkUrl) })
  }
})

// The popup asks the worker to open the editor (keeps the popup markup dumb).
chrome.runtime.onMessage.addListener((msg: { type?: string; src?: string }) => {
  if (msg?.type === 'open-editor') {
    chrome.tabs.create({ url: editorUrl(msg.src) })
  }
})
