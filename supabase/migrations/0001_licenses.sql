-- Licenses issued after a completed Paddle payment. The extension verifies a
-- signed token locally (offline); this table is the source of truth for status
-- and lets the success page fetch the buyer's token by transaction id.

create table if not exists public.licenses (
  id            uuid primary key default gen_random_uuid(),
  paddle_txn_id text unique not null,                 -- idempotency for the webhook
  email         text,
  status        text not null default 'active',        -- active | refunded | revoked
  token         text not null,                          -- signed Ed25519 license token
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Status endpoint filters by license_id (= licenses.id); index the common lookups.
create index if not exists licenses_status_idx on public.licenses (status);

-- Row Level Security ON with no public policies: only the service role (used by
-- Edge Functions) can read/write. The anon key cannot touch this table directly.
alter table public.licenses enable row level security;

comment on table public.licenses is
  'Lifetime licenses. Written by the paddle-webhook function; read by get-license and license-status. No file data ever stored here.';
