// Left tool rail. Selecting a tool sets store.tool; the next click on a page
// places that mark (see overlay.ts). The rail reflects the active tool.

import { store, type Tool } from '../state'
import { icons } from './icons'

interface ToolDef {
  tool: Tool
  label: string
  icon: keyof typeof icons
  hint: string
}

const TOOLS: ToolDef[] = [
  { tool: 'select', label: 'Select', icon: 'select', hint: 'Select and move marks' },
  { tool: 'signature', label: 'Sign', icon: 'signature', hint: 'Draw, type, or upload a signature' },
  { tool: 'text', label: 'Text', icon: 'text', hint: 'Add a text field' },
  { tool: 'date', label: 'Date', icon: 'date', hint: "Insert today's date" },
  { tool: 'initials', label: 'Initials', icon: 'initials', hint: 'Add initials' },
  { tool: 'checkbox', label: 'Check', icon: 'checkbox', hint: 'Place a check or cross' },
]

export function mountToolRail(el: HTMLElement): void {
  el.innerHTML = TOOLS.map(
    (t) => `
    <button class="toolrail__btn" data-tool="${t.tool}" title="${t.hint}" aria-label="${t.label}">
      <span class="toolrail__icon">${icons[t.icon]}</span>
      <span class="toolrail__label">${t.label}</span>
    </button>`,
  ).join('')

  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tool]')
    if (!btn) return
    store.setTool(btn.dataset.tool as Tool)
  })

  const sync = () => {
    el.querySelectorAll<HTMLElement>('[data-tool]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tool === store.tool)
    })
  }
  store.subscribe(sync)
  sync()
}
