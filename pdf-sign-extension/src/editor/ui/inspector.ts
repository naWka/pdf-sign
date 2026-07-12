// Right-hand contextual panel: edits the currently selected mark. Empty-state
// teaches the tools instead of saying "nothing selected".

import { store } from '../state'
import type { TextElement, CheckboxElement } from '@/shared/types'
import { FONT_FAMILIES, INK_COLOR } from '@/shared/constants'
import { icons } from './icons'

const SWATCHES = [INK_COLOR, '#111318', '#c0392b', '#1e6f3f']

export function mountInspector(el: HTMLElement): void {
  const render = () => {
    const sel = store.selectedId
      ? store.elements.find((e) => e.id === store.selectedId)
      : null

    if (!sel) {
      el.innerHTML = emptyState()
      return
    }

    if (sel.type === 'text' || sel.type === 'date' || sel.type === 'initials') {
      el.innerHTML = textPanel(sel)
      wireText(el, sel.id)
    } else if (sel.type === 'checkbox') {
      el.innerHTML = checkboxPanel(sel)
      wireCheckbox(el, sel.id)
    } else {
      el.innerHTML = imagePanel()
    }
    wireCommon(el, sel.id)
  }

  store.subscribe(render)
  render()
}

function emptyState(): string {
  return `
    <div class="inspector__empty">
      <h3>Add to your document</h3>
      <p class="muted">Pick a tool on the left, then click the page to place it.</p>
      <ul class="inspector__legend">
        <li>${icons.signature}<span>Signature — draw, type, or upload</span></li>
        <li>${icons.text}<span>Text — type anywhere</span></li>
        <li>${icons.checkbox}<span>Check — tick a box</span></li>
        <li>${icons.date}<span>Date — today, formatted</span></li>
      </ul>
    </div>`
}

function header(title: string): string {
  return `
    <div class="inspector__head">
      <h3>${title}</h3>
      <button class="btn btn--danger btn--sm" data-act="delete">${icons.trash} Delete</button>
    </div>`
}

function textPanel(el: TextElement): string {
  return `
    ${header(el.type === 'date' ? 'Date' : el.type === 'initials' ? 'Initials' : 'Text')}
    <label class="field">
      <span class="field__label">Font</span>
      <select class="field__select" data-field="font">
        ${FONT_FAMILIES.map(
          (f) =>
            `<option value="${f.key}" ${f.key === el.fontFamily ? 'selected' : ''}>${f.label}</option>`,
        ).join('')}
      </select>
    </label>
    <div class="field">
      <span class="field__label">Size</span>
      <div class="stepper">
        <button class="stepper__btn" data-act="size-dn" aria-label="Smaller">–</button>
        <span class="stepper__val tnum" data-role="size">${Math.round(el.fontSizePt)}</span>
        <button class="stepper__btn" data-act="size-up" aria-label="Larger">+</button>
      </div>
    </div>
    <div class="field">
      <span class="field__label">Color</span>
      <div class="swatches" data-role="swatches">
        ${SWATCHES.map(
          (c) =>
            `<button class="swatch ${c === el.color ? 'is-active' : ''}" data-color="${c}" style="--sw:${c}" aria-label="Color ${c}"></button>`,
        ).join('')}
      </div>
    </div>
    <button class="toggle ${el.bold ? 'is-on' : ''}" data-act="bold" aria-pressed="${el.bold}">
      ${icons.bold} Bold
    </button>`
}

function checkboxPanel(el: CheckboxElement): string {
  return `
    ${header('Check mark')}
    <div class="field">
      <span class="field__label">Mark</span>
      <div class="segmented" data-role="glyph">
        <button data-glyph="check" class="${el.glyph === 'check' ? 'is-active' : ''}">✓ Check</button>
        <button data-glyph="cross" class="${el.glyph === 'cross' ? 'is-active' : ''}">✕ Cross</button>
      </div>
    </div>
    <div class="field">
      <span class="field__label">Color</span>
      <div class="swatches" data-role="swatches">
        ${SWATCHES.map(
          (c) =>
            `<button class="swatch ${c === el.color ? 'is-active' : ''}" data-color="${c}" style="--sw:${c}" aria-label="Color ${c}"></button>`,
        ).join('')}
      </div>
    </div>`
}

function imagePanel(): string {
  return `
    ${header('Signature')}
    <p class="muted inspector__note">Drag to move. Use the corner handles to resize;
    the aspect ratio stays locked.</p>`
}

function wireCommon(root: HTMLElement, id: string): void {
  root.querySelector('[data-act="delete"]')?.addEventListener('click', () => {
    store.removeElement(id)
  })
}

function wireText(root: HTMLElement, id: string): void {
  const el = () => store.elements.find((e) => e.id === id) as TextElement | undefined
  root.querySelector<HTMLSelectElement>('[data-field="font"]')?.addEventListener('change', (e) => {
    store.updateElement(id, { fontFamily: (e.target as HTMLSelectElement).value })
  })
  root.querySelector('[data-act="size-up"]')?.addEventListener('click', () => {
    const cur = el()
    if (cur) store.updateElement(id, { fontSizePt: Math.min(96, cur.fontSizePt + 1) })
  })
  root.querySelector('[data-act="size-dn"]')?.addEventListener('click', () => {
    const cur = el()
    if (cur) store.updateElement(id, { fontSizePt: Math.max(6, cur.fontSizePt - 1) })
  })
  root.querySelector('[data-act="bold"]')?.addEventListener('click', () => {
    const cur = el()
    if (cur) store.updateElement(id, { bold: !cur.bold })
  })
  wireSwatches(root, id)
}

function wireCheckbox(root: HTMLElement, id: string): void {
  root.querySelector('[data-role="glyph"]')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-glyph]')
    if (btn) store.updateElement(id, { glyph: btn.dataset.glyph as 'check' | 'cross' })
  })
  wireSwatches(root, id)
}

function wireSwatches(root: HTMLElement, id: string): void {
  root.querySelector('[data-role="swatches"]')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-color]')
    if (btn) store.updateElement(id, { color: btn.dataset.color! })
  })
}
