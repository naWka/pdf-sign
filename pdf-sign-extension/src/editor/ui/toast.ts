// Minimal transient notifications. Used for save confirmations and soft errors.

type ToastKind = 'info' | 'success' | 'error'

export function toast(message: string, kind: ToastKind = 'info', ms = 3200): void {
  const root = document.getElementById('toast-root')
  if (!root) return
  const el = document.createElement('div')
  el.className = `toast toast--${kind}`
  el.textContent = message
  root.append(el)
  requestAnimationFrame(() => el.classList.add('is-in'))
  setTimeout(() => {
    el.classList.remove('is-in')
    setTimeout(() => el.remove(), 220)
  }, ms)
}
