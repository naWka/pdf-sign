// The small control strip under each page: number, rotate, move, delete.
// Page ops live on the store; this just wires buttons to them.

import { store } from '../state'
import { icons } from './icons'

export function renderPageControls(pageIndex: number): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'page__controls'

  const total = store.pages.length
  bar.innerHTML = `
    <span class="page__num tnum">Page ${pageIndex + 1} / ${total}</span>
    <div class="page__ctrl-group">
      <button class="iconbtn iconbtn--sm" data-act="up" title="Move up" aria-label="Move page up" ${pageIndex === 0 ? 'disabled' : ''}>${icons.arrowUp}</button>
      <button class="iconbtn iconbtn--sm" data-act="down" title="Move down" aria-label="Move page down" ${pageIndex === total - 1 ? 'disabled' : ''}>${icons.arrowDown}</button>
      <button class="iconbtn iconbtn--sm" data-act="rot-l" title="Rotate left" aria-label="Rotate page left">${icons.rotateLeft}</button>
      <button class="iconbtn iconbtn--sm" data-act="rot-r" title="Rotate right" aria-label="Rotate page right">${icons.rotateRight}</button>
      <button class="iconbtn iconbtn--sm iconbtn--danger" data-act="del" title="Delete page" aria-label="Delete page" ${total <= 1 ? 'disabled' : ''}>${icons.trash}</button>
    </div>`

  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (!btn) return
    switch (btn.dataset.act) {
      case 'up':
        store.movePage(pageIndex, pageIndex - 1)
        break
      case 'down':
        store.movePage(pageIndex, pageIndex + 1)
        break
      case 'rot-l':
        store.rotatePage(pageIndex, -1)
        break
      case 'rot-r':
        store.rotatePage(pageIndex, 1)
        break
      case 'del':
        store.deletePage(pageIndex)
        break
    }
  })

  return bar
}
