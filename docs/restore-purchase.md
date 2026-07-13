# Restore purchase — implementation brief

Handoff spec for finishing the "restore purchase" flow. Written so another agent
can implement it end to end without re-deriving the design. Read `03-monetization.md`
and `supabase/README.md` first for context.

## Why this exists

The product has **no accounts** (iron rule) and unlocks **offline**. So a license
is a **bearer token**: a compact Ed25519-signed string the extension verifies
locally against the bundled public key. Whoever holds the token is unlocked, on
any device. This is deliberate (see `03-monetization.md` — casual-piracy only).

"Restore purchase" therefore means: **help a paying user get their token back**
on a new device / after a reinstall, without creating an account.

## Current state (already built)

- `supabase/functions/paddle-webhook` — on `transaction.completed`, verifies the
  Paddle signature, creates a `licenses` row (idempotent on `paddle_txn_id`), and
  stores a signed token (`token` column). Refund/cancel events flip `status`.
- `supabase/functions/get-license` — success page fetches the token by
  `paddle_txn_id` (`?txn=`), returns `{ token }`.
- `supabase/functions/license-status` — returns only `{ status }` for a `license_id`.
- Site `/success` (`pdf-sign-site/components/SuccessClient.tsx`) reads `?_ptxn=` from
  the Paddle redirect and polls `get-license`, then shows the key to copy.
- Extension Options (`pdf-sign-extension/src/options/options.ts`) accepts a pasted
  key; `applyLicenseKey()` verifies + caches it (works offline).

**The gap:** if the user closes the success page without saving the key and never
received it by email, there is no way to get it back. Restore closes that.

## Goal

1. **Email the key on purchase** so it always lands in the buyer's inbox.
2. **A `/restore` page** where a user enters the email they paid with and we email
   their key(s) to that address (never shown on screen — anti-enumeration).
3. **A "Restore purchase" link in the extension Options** that opens `/restore`.

Keep every iron rule: no accounts, no file data anywhere, secrets server-only.

---

## Work items

### 1. Shared email helper — `supabase/functions/_shared/email.ts` (new)

Send transactional email from Edge Functions. Use a provider with a simple HTTP
API; **Resend** is the default (swap if the owner prefers Postmark/SES).

```ts
// Env: RESEND_API_KEY (secret), LICENSE_FROM_EMAIL (e.g. "Sign & Fill PDF <keys@signfillpdf.com>")
export async function sendLicenseEmail(to: string, tokens: string[]): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')!
  const from = Deno.env.get('LICENSE_FROM_EMAIL')!
  const keysHtml = tokens.map((t) => `<pre style="...">${escapeHtml(t)}</pre>`).join('')
  const html = `
    <p>Here is your Sign &amp; Fill PDF license key. Paste it into the extension:
       Settings → License → Unlock.</p>
    ${keysHtml}
    <p>It is verified on your device and works offline. Keep this email to restore
       on another device.</p>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: 'Your Sign & Fill PDF license key', html }),
  })
  if (!res.ok) throw new Error(`email send failed: ${res.status}`)
}
```

HUMAN-TODO: create a Resend account + verified sending domain, set `RESEND_API_KEY`
and `LICENSE_FROM_EMAIL` as Supabase secrets.

### 2. Email the key on purchase — edit `paddle-webhook/index.ts`

In `handleCompleted`, after inserting the license, send the email (best-effort;
do not fail the webhook if email fails — Paddle would retry the whole event):

```ts
await supabase.from('licenses').insert({ id: licenseId, paddle_txn_id: txnId, email, status: 'active', token })
if (email) {
  try { await sendLicenseEmail(email, [token]) } catch (e) { console.error('email failed', e) }
}
```

### 3. Restore endpoint — `supabase/functions/restore-by-email/index.ts` (new)

`POST { email }` → find that email's **active** licenses → email the token(s) →
**always** return the same generic 200. Never return the token in the HTTP body
(prevents email-enumeration + scraping).

```ts
// Deploy: supabase functions deploy restore-by-email --no-verify-jwt
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const { email } = await req.json().catch(() => ({}))
  const generic = json({ ok: true, message: 'If that email has a purchase, the key is on its way.' })
  if (!email || !isEmail(email)) return generic

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data } = await supabase
    .from('licenses')
    .select('token, status')
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'active')

  const tokens = (data ?? []).map((r) => r.token)
  if (tokens.length) {
    try { await sendLicenseEmail(email, tokens) } catch (e) { console.error(e) }
  }
  return generic // identical response whether or not a license was found
})
```

Notes:
- Store/compare email lowercased+trimmed. Consider normalizing in the webhook too.
- **Rate limit**: add a lightweight per-IP limit (e.g. a `restore_attempts` table or
  Supabase's built-in rate limiting) so the endpoint can't be used to spam inboxes.
- Refunded/revoked licenses are excluded by `status = 'active'`.

### 4. DB — `supabase/migrations/0002_email_index.sql` (new)

```sql
create index if not exists licenses_email_idx on public.licenses (email);
```
(Optionally add `email_sent_at timestamptz` if you want to track/throttle sends.)

### 5. Site `/restore` page — `pdf-sign-site/app/restore/page.tsx` (new)

Client form: one email input + submit → `POST ${NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/restore-by-email`
→ show the generic success message regardless of result. Reuse `Nav`/`Footer` and
existing styles (mirror `SuccessClient.tsx` structure). Copy:
- Heading: "Restore your license"
- Body: "Enter the email you used at checkout. If we find a purchase, we'll email
  your key. Paste it into the extension to unlock."
- After submit: "Check your inbox. If that email has a purchase, your key is on its way."

Add a link to `/restore` from: `/success` ("Didn't get it? Restore"), pricing page
footer, and the site footer (`components/SiteChrome.tsx`).

### 6. Extension — "Restore purchase" link in Options

- `pdf-sign-extension/src/shared/constants.ts`: add
  `export const RESTORE_URL = ` `${SITE_URL}/restore` `.
- `pdf-sign-extension/src/options/options.ts`: in the license section (the
  not-unlocked branch), add next to "Get lifetime access":
  `Already bought it? <a href="${RESTORE_URL}" target="_blank" rel="noopener">Restore purchase</a>.`
- Optional: same link in the paywall modal (`src/editor/paywall.ts`) under
  "I already have a key".

No rebuild-blocking changes; `SITE_URL` already exists.

---

## Env additions (update the `.env.example` files + HUMAN-TODO)

| Var | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Supabase secret (server) | send license emails |
| `LICENSE_FROM_EMAIL` | Supabase secret (server) | From: address (verified domain) |

`NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` already exists on the site for calling functions.

## Security checklist

- [ ] `/restore` and `restore-by-email` return an **identical** response whether or
      not the email has a purchase (no account enumeration).
- [ ] Token is delivered **only by email**, never in an HTTP response body.
- [ ] Rate-limit `restore-by-email` per IP/email to prevent inbox spam.
- [ ] `RESEND_API_KEY`, `SERVICE_ROLE`, signing key stay server-only.
- [ ] Email stored/compared normalized (lowercase, trimmed).
- [ ] Refunded/revoked licenses are not restorable (`status = 'active'` filter).

## Acceptance criteria

1. Completing a Paddle **sandbox** purchase emails the key to the buyer.
2. Submitting the buyer's email on `/restore` re-sends the key; submitting an
   unknown email returns the same success message and sends nothing.
3. Pasting the emailed key into Options unlocks the extension, **offline**.
4. A refunded license is not restored.
5. No token ever appears in a network response body (check DevTools).

## Test plan

- Unit-ish: call `restore-by-email` with (a) known active email, (b) unknown email,
  (c) refunded email → assert identical bodies; assert email sent only for (a).
- E2E (extension side is already covered by `pdf-sign-extension/tests/editor.spec.ts`
  for the paste→unlock path; reuse `applyLicenseKey` with a real signed token).
- Manual: Paddle sandbox purchase → inbox → paste → unlock offline (airplane mode).

## Out of scope (do NOT add)

- User accounts / login. Restore stays email-only, no password.
- Device limits / fingerprinting (see `03-monetization.md`).
- Storing anything about the user's PDFs (never).
