// Bundled Ed25519 PUBLIC key used to verify license tokens locally (offline).
// This is a PUBLIC key: safe to ship. The matching PRIVATE key lives only in the
// Supabase Vault and signs tokens server-side — it must NEVER be in this bundle.
//
// HUMAN-TODO: replace the placeholder below with the real public key.
//   openssl genpkey -algorithm ed25519 -out private.pem
//   openssl pkey -in private.pem -pubout -out public.pem
//   # raw 32-byte public key, base64:
//   openssl pkey -in public.pem -pubin -outform DER | tail -c 32 | base64
// Paste that base64 string here. Until then, license verification fails closed
// (the free tier still works; unlock just won't validate).

export const LICENSE_PUBLIC_KEY_B64 = 'REPLACE_WITH_ED25519_PUBLIC_KEY_BASE64'

export function hasRealPublicKey(): boolean {
  return LICENSE_PUBLIC_KEY_B64 !== 'REPLACE_WITH_ED25519_PUBLIC_KEY_BASE64'
}
