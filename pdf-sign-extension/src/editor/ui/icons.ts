// Inline SVG icons. Bundled as strings (no icon font, no network). Stroke uses
// currentColor so CSS controls the color per state.

const s = (path: string, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`

export const icons = {
  select: s('<path d="M5 3l7 17 2.5-7L21 10.5 5 3z"/>'),
  signature: s(
    '<path d="M3 18c3 0 4-9 6-9s1 6 3 6 2-8 4-8"/><path d="M3 21h18"/>',
  ),
  text: s('<path d="M5 6h14M12 6v13M9 19h6"/>'),
  date: s(
    '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ),
  initials: s('<path d="M5 18V7l4 7 4-7v11M20 7v11M20 7h-3"/>'),
  checkbox: s('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
  arrowUp: s('<path d="M12 19V6M6 11l6-6 6 6"/>'),
  arrowDown: s('<path d="M12 5v13M6 13l6 6 6-6"/>'),
  rotateLeft: s('<path d="M9 5L4 9l5 4"/><path d="M4 9h9a6 6 0 1 1-6 6"/>'),
  rotateRight: s('<path d="M15 5l5 4-5 4"/><path d="M20 9h-9a6 6 0 1 0 6 6"/>'),
  trash: s('<path d="M4 7h16M9 7V5h6v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/>'),
  download: s('<path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/>'),
  shield: s('<path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>'),
  file: s('<path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  x: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  lock: s('<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  bold: s('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>'),
}

export type IconName = keyof typeof icons
