# pdf-sign-site — companion site (Next.js)

Marketing site + checkout + privacy policy for Sign & Fill PDF. Next.js App
Router, deployed on Vercel. Static-friendly; it never processes user PDFs.

## Pages
- `/` landing (wedge, how-it-works, features, privacy band, pricing, FAQ)
- `/pricing` focused checkout page (Paddle)
- `/privacy` privacy policy (required for the Chrome Web Store listing)
- `/success` shows the license key after a Paddle purchase (fetches from Supabase)

## Setup
```bash
cp .env.example .env.local     # fill in Paddle + Supabase public values
npm install
npm run dev
```

## Deploy (Vercel)
1. Import the repo, set the project root to `pdf-sign-site`.
2. Add the `NEXT_PUBLIC_*` env vars from `.env.example`.
3. Deploy. Point the extension's `VITE_SITE_URL` / `VITE_CHECKOUT_URL` at the domain.

## Notes
- Fonts are self-hosted at build via `next/font` (Bricolage Grotesque + Hanken
  Grotesk). No runtime font fetch.
- The only third-party client script is Paddle.js on the pricing/checkout flow.
- Design tokens mirror the extension (`DESIGN.md`) so both surfaces feel like one
  product: warm paper, fountain-pen ink, a single gold "lifetime" accent.
