# Supabase — licensing backend

Issues and validates lifetime licenses. It never sees or stores user PDFs; it
only turns a completed Paddle payment into a signed token the extension verifies
locally (offline).

## Pieces

| Path | Role |
|---|---|
| `migrations/0001_licenses.sql` | `licenses` table (RLS on, service-role only) |
| `functions/paddle-webhook` | Verifies Paddle signature, issues + stores a signed Ed25519 token (idempotent on `paddle_txn_id`) |
| `functions/get-license` | Success page fetches the token by Paddle transaction id |
| `functions/license-status` | Public: returns only `{ status }` for a `license_id` (offline re-check) |
| `functions/_shared` | Signature verify, Ed25519 signing, CORS |

## Setup (human)

1. Create a Supabase project. Copy `SUPABASE_URL`, `service_role` key.
2. Generate the Ed25519 keypair:
   ```bash
   openssl genpkey -algorithm ed25519 -out private.pem
   openssl pkey -in private.pem -pubout -out public.pem
   # Private (PKCS8 DER, base64) -> LICENSE_PRIVATE_KEY_B64 (server secret):
   openssl pkey -in private.pem -outform DER | base64
   # Public (raw 32 bytes, base64) -> paste into the extension's
   # src/license/public-key.ts (LICENSE_PUBLIC_KEY_B64):
   openssl pkey -in public.pem -pubin -outform DER | tail -c 32 | base64
   ```
3. Fill `supabase/.env` from `.env.example`, then:
   ```bash
   supabase link --project-ref YOUR_REF
   supabase db push                                   # applies the migration
   supabase secrets set --env-file supabase/.env
   supabase functions deploy paddle-webhook --no-verify-jwt
   supabase functions deploy get-license   --no-verify-jwt
   supabase functions deploy license-status --no-verify-jwt
   ```
4. In Paddle, point a webhook/notification destination at the deployed
   `paddle-webhook` URL and copy its signing secret into `PADDLE_WEBHOOK_SECRET`.

## Security notes

- `service_role`, `PADDLE_WEBHOOK_SECRET`, and `LICENSE_PRIVATE_KEY_B64` are
  server-only. They must never appear in the extension bundle or the site client.
- `license-status` deliberately returns only `{ status }`, and reports unknown
  ids as `revoked` so a fabricated id can never unlock the product.
- RLS is enabled with no anon policies: the table is unreachable with the anon key.
