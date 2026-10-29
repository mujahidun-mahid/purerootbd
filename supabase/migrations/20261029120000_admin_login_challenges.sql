-- Pending admin login challenges (email OTP, step 2 of admin sign-in).
--
-- Written by /api/admin/login, read/updated by /api/admin/login/verify and
-- /api/admin/login/resend. Only the service role (server) may touch this table:
-- RLS is enabled with no policies, so anon/authenticated clients cannot read or
-- write it even if they discover the table name.
--
-- The OTP itself is never stored: `otp_hash` is an HMAC of the code with a
-- server-only secret, bound to the challenge id and a random salt.

create table if not exists public.admin_login_challenges (
  id text primary key
    check (id ~ '^[a-f0-9]{32,64}$'),
  otp_hash text not null
    check (otp_hash ~ '^[a-f0-9]{64}$'),
  salt text not null
    check (salt ~ '^[a-f0-9]{32}$'),
  recipients text[] not null default '{}'::text[]
    check (cardinality(recipients) between 1 and 10),
  attempts integer not null default 0
    check (attempts >= 0),
  max_attempts integer not null default 5
    check (max_attempts between 1 and 10),
  resend_count integer not null default 0
    check (resend_count between 0 and 10),
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_login_challenges_expiry_check
    check (expires_at > created_at),
  constraint admin_login_challenges_consumed_check
    check (consumed_at is null or consumed_at >= created_at)
);

create index if not exists admin_login_challenges_expires_idx
  on public.admin_login_challenges (expires_at);

alter table public.admin_login_challenges enable row level security;

-- Defense in depth: the REST API is only used with the service role, which
-- bypasses RLS. Browser-facing roles must have no access at all.
revoke all on public.admin_login_challenges from public;
revoke all on public.admin_login_challenges from anon, authenticated;
grant select, insert, update, delete on public.admin_login_challenges to service_role;

comment on table public.admin_login_challenges is
  'Short-lived pending admin OTP challenges. Server/service-role only.';
