# Sign & Fill PDF

Sign and fill any PDF **locally in the browser**. No upload, no account, works
offline. Free to start; a one-time lifetime unlock removes the export gate.

The wedge, which every decision is checked against:
**Sign & fill any PDF right in your browser. No upload. No account. Your files never leave your computer.**

See `docs/` for the full brief (product, architecture, monetization, roadmap).

## Repository layout

| Folder | What | Stack |
|---|---|---|
| `pdf-sign-extension/` | The Chrome MV3 extension (the product) | TypeScript, Vite, crxjs, pdf.js, pdf-lib |
| `pdf-sign-site/` | Companion site: landing, pricing, privacy, success | Next.js (App Router), Vercel |
| `supabase/` | Licensing backend: `licenses` table + Edge Functions | Supabase, Deno |
| `store-assets/` | Chrome Web Store listing copy + 5 screenshot templates | HTML |
| `docs/` | Product brief and the human-owned TODO list | Markdown |
| `PRODUCT.md`, `DESIGN.md` | Brand + design system (shared by both surfaces) | Markdown |

## Iron rules (do not break)
1. **A user's file never touches a server.** All PDF work is client-side. This is the product.
2. **No remote code** (MV3): pdf.js, pdf-lib, and fonts are all bundled. `npm run audit:remote` proves it.
3. **Minimum permissions** in the manifest: only `storage`, `downloads`, `contextMenus`.
4. **No accounts inside the product.** License by key, verified locally (offline).
5. **Secrets never ship in the bundle.** The license *public* key is bundled; the private key lives only in Supabase.

## Quick start

Extension:
```bash
cd pdf-sign-extension && npm install && npm run gen:icons && npm run build
# load pdf-sign-extension/dist as an unpacked extension in chrome://extensions
```
Site:
```bash
cd pdf-sign-site && npm install && npm run dev
```
Licensing backend: see `supabase/README.md`.

## What a human still needs to do
Accounts, secrets, and business decisions the agent cannot make are tracked in
`docs/HUMAN-TODO.md` (with the exact files/placeholders to fill).

## Design
Both surfaces share one identity, defined in `DESIGN.md`: a refined document
workspace, a white paper sheet on a warm neutral desk, marked with fountain-pen
ink (indigo), with a single warm gold accent reserved for the lifetime moment.
The extension is product-register (the tool disappears into the task); the site
is brand-register (more ambitious type and motion).
