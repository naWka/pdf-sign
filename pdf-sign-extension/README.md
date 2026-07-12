# pdf-sign-extension

Sign & Fill PDF, a Chrome MV3 extension that signs and fills any PDF entirely in
the browser. No upload, no account, works offline. `pdf.js` (render) and
`pdf-lib` (export) are bundled; no remote code.

## Develop
```bash
npm install
npm run gen:icons        # rasterize src/assets/icon.svg -> PNG icons (needs sharp)
npm run dev              # Vite dev server with HMR
```
Then in Chrome: `chrome://extensions` → Developer mode → **Load unpacked** →
select the `dist/` folder after a build (or the crxjs dev output).

## Build
```bash
cp .env.example .env     # optional; sane fallbacks exist
npm run build            # tsc --noEmit + vite build -> dist/
npm run audit:remote     # proves dist/ has no eval / no http(s) script sources
```
Load `dist/` as an unpacked extension, or zip it for the Web Store.

## Architecture
```
src/
  background/   MV3 service worker (context menu -> open editor)
  editor/       the app: pdf.js render, overlay, pdf-lib export, paywall
    overlay/    signature capture + placeable marks (drag/resize/edit)
    ui/         toolbar, inspector, page controls, icons, toast
  popup/        launcher (open editor, license/usage status)
  options/      license key entry + saved-signature management
  license/      local Ed25519 token verification (bundled public key)
  lib/          pdf.js wrapper (+ bundled fonts via @fontsource)
  shared/       types, storage, constants, geometry
manifest.config.ts   typed MV3 manifest (crxjs)
```

Data flow is entirely client-side: a PDF is read into memory, rendered with
pdf.js, marked up on an overlay layer (normalized coordinates), and exported by
pdf-lib against the pristine source bytes. No network request ever carries file
content. See `../docs/02-architecture.md`.

## Guardrails (check before every commit)
- [ ] `npm run audit:remote` passes (no remote code).
- [ ] No file bytes sent over the network (grep for `fetch(` / `XMLHttpRequest`).
- [ ] `permissions` in the manifest are still only `storage`, `downloads`,
      `contextMenus`; no `host_permissions`.
- [ ] Secrets never bundled (the license **public** key is fine; the private key
      lives only in Supabase).

## Configuration to finish (human)
- `src/license/public-key.ts` — paste the real Ed25519 public key.
- `.env` — `VITE_SITE_URL`, `VITE_CHECKOUT_URL`, `VITE_LICENSE_STATUS_URL`.
- Confirm `FREE_EXPORT_LIMIT` (4 or 5) in `src/shared/constants.ts`.
See `../docs/HUMAN-TODO.md`.
