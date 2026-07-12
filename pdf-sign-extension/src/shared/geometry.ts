// Pure geometry helpers shared by the overlay (screen px) and export (PDF points).

export interface Size {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** Normalized rect (0..1, top-left origin) -> pixel rect for a rendered page. */
export function normToPx(
  n: { xNorm: number; yNorm: number; wNorm: number; hNorm: number },
  page: Size,
): Rect {
  return {
    x: n.xNorm * page.width,
    y: n.yNorm * page.height,
    width: n.wNorm * page.width,
    height: n.hNorm * page.height,
  }
}

/** Pixel rect on a rendered page -> normalized rect, clamped into [0,1]. */
export function pxToNorm(
  r: Rect,
  page: Size,
): { xNorm: number; yNorm: number; wNorm: number; hNorm: number } {
  return {
    xNorm: clamp(r.x / page.width, 0, 1),
    yNorm: clamp(r.y / page.height, 0, 1),
    wNorm: clamp(r.width / page.width, 0, 1),
    hNorm: clamp(r.height / page.height, 0, 1),
  }
}

export function rectContains(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height
}

/** Short unique-enough id without pulling in a dependency. Not crypto-sensitive. */
export function uid(prefix = 'el'): string {
  const rand = crypto.getRandomValues(new Uint32Array(2))
  return `${prefix}_${rand[0].toString(36)}${rand[1].toString(36)}`
}
