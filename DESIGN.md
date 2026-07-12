# DESIGN

Design system for the Sign & Fill PDF extension UI (product register). The companion site reuses these tokens but leans brand-register.

## Direction

A refined **document workspace**, not a SaaS dashboard. The metaphor is paper and ink on a desk: a white PDF sheet floating on a warm neutral workspace, marked up with fountain-pen ink. Calm, precise, trustworthy, fast.

Deliberately dodges the category reflexes: not Adobe red, not productivity-blue, not "secure = teal", not finance navy-and-gold. The one committed color is an **ink indigo** (hue ~275) that reads as a real pen, reinforcing "you are signing," and the same ink is the default signature-stroke color.

### Theme: light
Scene: a freelancer at a home desk mid-morning, signing a client contract they would rather not upload, wanting it done in twenty seconds. Document editing is a paper act. The sheet is light; the workspace around it is a warm, low-glare neutral. (A dark workspace shell is a future option for the editor chrome only; the sheet always stays paper-light.)

### Color strategy: restrained
Warm-tinted neutrals carry the surface; the ink accent appears only on primary actions, active tools, focus rings, and signature strokes (≤10% of surface). A warm gold marks the one "lifetime / forever" moment. Semantic red only for destructive page actions.

## Tokens (OKLCH)

All neutrals are tinted toward the ink hue (275) at very low chroma. Never `#000` / `#fff`.

```css
:root {
  /* Neutrals — warm, ink-tinted */
  --workspace:      oklch(0.955 0.006 275);  /* desk behind the sheet */
  --surface:        oklch(0.992 0.004 275);  /* toolbars, panels, popup */
  --surface-2:      oklch(0.975 0.005 275);  /* insets, hover rows */
  --sheet:          oklch(0.998 0.002 275);  /* PDF page fallback bg + shadow host */
  --border:         oklch(0.905 0.008 275);
  --border-strong:  oklch(0.840 0.010 275);

  --text:           oklch(0.255 0.020 275);  /* near-ink, warm */
  --text-2:         oklch(0.470 0.016 275);
  --text-muted:     oklch(0.620 0.012 275);

  /* Accent — fountain-pen ink (indigo ~275) */
  --ink:            oklch(0.480 0.140 275);
  --ink-hover:      oklch(0.420 0.150 275);
  --ink-active:     oklch(0.370 0.150 275);
  --ink-soft:       oklch(0.950 0.030 275);  /* tint bg for selected/active */
  --ink-ring:       oklch(0.480 0.140 275 / 0.40);
  --on-ink:         oklch(0.985 0.005 275);

  /* Lifetime / forever — warm gold, used once */
  --gold:           oklch(0.760 0.115 80);
  --gold-soft:      oklch(0.955 0.045 85);
  --gold-text:      oklch(0.480 0.090 70);

  /* Semantic */
  --success:        oklch(0.560 0.110 155);
  --success-soft:   oklch(0.955 0.035 155);
  --danger:         oklch(0.555 0.160 25);
  --danger-soft:    oklch(0.955 0.040 25);

  /* Elevation — soft, warm, low-contrast; sheet gets the strongest */
  --shadow-sm:  0 1px 2px oklch(0.255 0.02 275 / 0.06);
  --shadow-md:  0 4px 12px oklch(0.255 0.02 275 / 0.08);
  --shadow-sheet: 0 8px 30px oklch(0.255 0.02 275 / 0.12), 0 1px 3px oklch(0.255 0.02 275 / 0.10);

  /* Radius */
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-pill: 999px;

  /* Motion — ease-out-quint, no bounce */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 120ms; --dur: 200ms; --dur-slow: 320ms;
}
```

## Typography

- **UI:** system stack — `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web font fetch (MV3 bans remote code); the OS font is fast and native.
- **Signature "type" mode:** two handwriting fonts bundled **locally** as woff2 in `/src/lib/fonts` and declared with `@font-face` using `chrome-extension://` package-relative URLs. Fallback `cursive`.
- **Scale** (1.25 ratio): 12 / 13 / 15(base) / 19 / 24 / 30 / 38. Line-height 1.5 for body, 1.2 for headings. Body measure capped 65–75ch.
- Hierarchy via **weight contrast**: 400 body, 500 labels, 600 headings/primary buttons. Numerals `font-variant-numeric: tabular-nums` in counters.

## Components

- **Buttons:** primary = solid `--ink` / `--on-ink`; secondary = `--surface` with `--border`; ghost = transparent, text `--text-2`. Height 36px default, 32px compact. Radius `--r-md`. Focus: 2px `--ink-ring` outline offset 2px.
- **Toolbar:** single `--surface` bar, `--border` bottom, tools as ghost icon buttons; active tool gets `--ink-soft` bg + `--ink` icon. No nested cards.
- **The sheet:** PDF canvas centered on `--workspace`, `--shadow-sheet`, `--r-sm`, subtle 1px `--border`. Overlay elements sit in an absolutely-positioned layer matched to canvas size.
- **Overlay handles:** selected element gets a 1.5px `--ink` outline + small square resize handles; drag cursor `move`.
- **Panels (signatures, license):** `--surface`, `--border`, `--shadow-sm`. Not cards-in-cards.
- **Paywall:** the single moment gold is allowed. Calm, honest, one-payment framing. Never a dark-pattern countdown.

## Motion

- Tool switches, panel opens: `opacity` + `transform` only, `--dur` `--ease`. Never animate layout props.
- Signature "drop onto page": quick scale-in 0.96→1, `--dur-fast`.
- No bounce, no elastic, no looping attention-grabbers.

## Absolute bans (project-specific + shared)
No side-stripe accent borders, no gradient text, no decorative glass, no hero-metric template, no identical card grids, no em dashes in copy, modals only when genuinely needed (signature capture is a justified modal; most else is inline).
