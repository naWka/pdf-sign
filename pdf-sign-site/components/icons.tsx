// Inline SVG icons as React components. Stroke uses currentColor.

type P = { className?: string }
const Svg = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className ?? 'svgicon'} aria-hidden="true">
    {children}
  </svg>
)

export const IShield = (p: P) => (
  <Svg className={p.className}>
    <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
)
export const ILock = (p: P) => (
  <Svg className={p.className}>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
)
export const IBolt = (p: P) => (
  <Svg className={p.className}>
    <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />
  </Svg>
)
export const IInfinity = (p: P) => (
  <Svg className={p.className}>
    <path d="M7 9a3 3 0 1 0 0 6c2 0 3-3 5-3s3 3 5 3a3 3 0 1 0 0-6c-2 0-3 3-5 3s-3-3-5-3z" />
  </Svg>
)
export const ICheck = (p: P) => (
  <Svg className={p.className}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
)
export const IChrome = (p: P) => (
  <Svg className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 8.8H21M8.6 10.3L4.2 6.9M10.4 14.9l-3.7 6.4" />
  </Svg>
)
export const IPen = (p: P) => (
  <Svg className={p.className}>
    <path d="M3 18c3 0 4-9 6-9s1 6 3 6 2-8 4-8" />
    <path d="M3 21h18" />
  </Svg>
)
export const IArrow = (p: P) => (
  <Svg className={p.className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
export const IWifiOff = (p: P) => (
  <Svg className={p.className}>
    <path d="M3 4l18 18M8.5 12.5a5 5 0 0 1 6 0M5 9.5a9 9 0 0 1 4-2.2M19 9.5a9 9 0 0 0-3-2M12 18h.01" />
  </Svg>
)
