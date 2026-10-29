# Admin email OTP (Resend) — setup and operations

Admin sign-in is two-step:

1. `POST /api/admin/login` verifies the password and emails a six-digit code.
2. `POST /api/admin/login/verify` verifies the code and only then issues the
   `pr_admin` session cookie.

A correct password alone never grants access, and the OTP endpoints cannot be
reached without the signed pending-challenge cookie. This document is a
preparation guide; it does not mean live Resend delivery or live Supabase
storage has been tested.

## 1. Rotate the Resend API key first

If a Resend key was shared outside the secret manager (including in chat), treat
it as exposed. Revoke it in <https://resend.com/api-keys> and create a new one
with only the access needed to send mail. Never put a key in source code, a
`NEXT_PUBLIC_*` variable, a commit, or chat. Add the new value only to
`.env.local` and the hosting provider's server-side environment.

## 2. Verify a sending domain in Resend

A Gmail address cannot be used as the sender. Resend only sends from a domain
whose DNS records you control.

1. Open <https://resend.com/domains> and choose **Add Domain**.
2. Prefer a subdomain dedicated to transactional mail, for example
   `mail.purerootbd.shop` (a subdomain keeps the root domain's existing mail
   records untouched).
3. Add the SPF and DKIM records Resend shows at your DNS provider (Spaceship for
   `purerootbd.shop`). Do not change nameservers for this.
4. Wait until the domain shows **Verified**.
5. Set the sender to an address on that domain, for example:
   `RESEND_FROM_EMAIL="PureRoots Admin <no-reply@mail.purerootbd.shop>"`.

If the domain is not verified, Resend rejects the send and the app fails closed
with HTTP `502`; no session is issued.

## 3. Prepare the Supabase challenge table

The migration is additive and creates only
`public.admin_login_challenges`. It does not modify the storefront, products,
orders, settings, or existing tables.

### 3.1 Read-only preflight

Run these queries in the Supabase SQL editor for project `purerootbd` before
applying anything:

```sql
-- Expect NULL if the table has not been created yet.
select to_regclass('public.admin_login_challenges') as existing_table;

-- Optional: NULL means the Supabase CLI migration-history table itself has not
-- been initialized; in that case skip the next query.
select to_regclass('supabase_migrations.schema_migrations') as migration_history_table;

-- Check for a conflicting migration-history entry. A manual SQL-editor apply
-- will not create this row; that is expected and is why the migration is
-- written to be idempotent. If this table does not exist yet, there is no
-- migration history to conflict with.
select version, name
from supabase_migrations.schema_migrations
where version = '20261029120000'
   or name = 'admin_login_challenges'
order by version;

-- If the table already exists, inspect it before deciding whether anything is
-- missing. Do not drop or recreate it without a backup and approval.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admin_login_challenges'
order by ordinal_position;
```

If the table is absent and no history row exists, apply the migration. If the
table exists, compare its columns/constraints with the migration instead of
re-running blindly. The migration uses `if not exists`, but it does not repair a
partially created or differently shaped table.

### 3.2 Apply the migration

Open the Supabase SQL editor, paste the **entire** contents of
`supabase/migrations/20261029120000_admin_login_challenges.sql`, and run it
once. Do not use `supabase db reset` (destructive).

If you prefer the CLI, first confirm the remote migration history with
`supabase migration list --linked`, then apply only after approval. Avoid
`supabase db push` if the remote history is unknown, because it can apply other
pending migrations too.

Applying through the SQL editor does not add a row to
`supabase_migrations.schema_migrations`. The script is idempotent, but if you
later adopt the CLI, reconcile that history before running a push.

### 3.3 Post-application verification

Run these read-only checks after applying:

```sql
-- RLS must be enabled. relforcerowsecurity is expected to be false because the
-- service role is intentionally allowed to bypass RLS.
select c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.admin_login_challenges'::regclass;

-- Expected: no rows. RLS is enabled with no policies, so browser-facing roles
-- have no path in even if they learn the table name.
select polname, polcmd, polroles::regrole[]
from pg_policy
where polrelid = 'public.admin_login_challenges'::regclass;

-- Expected: service_role has SELECT/INSERT/UPDATE/DELETE; public, anon, and
-- authenticated have no table grants.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'admin_login_challenges'
order by grantee, privilege_type;

-- Boolean form of the same check. Expected: false, false, true, true.
select
  has_table_privilege('anon', 'public.admin_login_challenges', 'select') as anon_select,
  has_table_privilege('authenticated', 'public.admin_login_challenges', 'select') as authenticated_select,
  has_table_privilege('service_role', 'public.admin_login_challenges', 'select') as service_role_select,
  has_table_privilege('service_role', 'public.admin_login_challenges', 'insert') as service_role_insert;
```

Without this table, login returns `503` and deliberately does not fall back to
password-only authentication. For local tests only, `ADMIN_OTP_STORE=memory`
skips the table.

## 4. Generate the password and dedicated secrets

Do not reuse values and do not paste generated values into chat or a commit.
Generate them locally and store them in a password manager or the hosting
provider's secret manager:

```bash
openssl rand -base64 24   # ADMIN_PASSWORD: 20+ random characters
openssl rand -hex 32      # ADMIN_SESSION_SECRET: 64 hex characters
openssl rand -hex 32      # ADMIN_OTP_HASH_SECRET: different 64 hex characters
```

The application enforces these production rules:

- `ADMIN_PASSWORD` is at least 20 characters.
- `ADMIN_SESSION_SECRET` is at least 32 characters and is not the password.
- `ADMIN_OTP_HASH_SECRET` is at least 32 characters, is not the password, and is
  different from `ADMIN_SESSION_SECRET`.
- If any rule fails, login returns `503` before creating a challenge or sending
  email.

## 5. Environment variables

Keep the existing Supabase variables, then add these to `.env.local` and to
Vercel → Project → Settings → Environment Variables (Production, and Preview if
you test there):

```dotenv
# Server-only. Never prefix with NEXT_PUBLIC_.
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="PureRoots Admin <no-reply@mail.purerootbd.shop>"
# The two approved admin addresses, comma-separated. Do not commit them.
ADMIN_OTP_RECIPIENTS=admin-one@example.com,admin-two@example.com

# Required in production: three different random values.
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
ADMIN_OTP_HASH_SECRET=...

# Supabase is required on Vercel. Memory is refused there.
ADMIN_OTP_STORE=supabase
```

Do not set `ADMIN_OTP_TEST_MODE=1` in production. Do not set
`NODE_TLS_REJECT_UNAUTHORIZED=0` in production.

Optional tuning (defaults shown):

```dotenv
ADMIN_OTP_TTL_SECONDS=300
ADMIN_OTP_MAX_ATTEMPTS=5
ADMIN_OTP_RESEND_COOLDOWN_SECONDS=60
ADMIN_OTP_MAX_RESENDS=3
```

Recipients are read only from `ADMIN_OTP_RECIPIENTS`. They are validated
server-side (valid address shape, max 10, de-duplicated) and are never accepted
from a request. Both recipients get the same code; either can use it, and a
successful verification invalidates it for both.

## 6. Local testing without real email

The test harness points Resend at a local mock, so no real messages are sent:

```dotenv
ADMIN_OTP_TEST_MODE=1
ADMIN_OTP_STORE=memory
RESEND_API_BASE_URL=http://127.0.0.1:3999
RESEND_API_KEY=test_key
RESEND_FROM_EMAIL="PureRoots Test <test@example.com>"
ADMIN_OTP_RECIPIENTS=test-one@example.com,test-two@example.com
```

`RESEND_API_BASE_URL` is honored only when `ADMIN_OTP_TEST_MODE=1` and the app is
not running on Vercel. Never enable test mode in production.

## 7. Production rollout order (needs approval)

Complete every prerequisite before deploying the OTP code. The currently
deployed password-only version ignores the new OTP variables; deploying the new
code without the table/configuration makes admin login fail closed with `503`.

1. Record the current healthy Vercel deployment and confirm the current admin
   login still works.
2. Revoke the exposed Resend key, create the replacement, and verify the sending
   domain. Keep the key server-side only.
3. Apply the migration and run the post-application checks in section 3.3.
4. Set the Vercel Production variables from section 5, including the exact two
   recipients, `ADMIN_OTP_STORE=supabase`, the rotated admin password, and both
   distinct secrets. Confirm `ADMIN_OTP_TEST_MODE` is absent or `0`.
5. Re-run the local production build and the OTP/fail-closed/outage tests with
   mock mail. Do not send a real message during this step.
6. Commit and push the reviewed OTP changes only after approval, then deploy.
   Vercel environment changes require a new deployment to take effect.
7. Perform the live test with the two real recipients: both should receive the
   same code; either can verify; the code works once; logout works; a protected
   admin API works only after verification.
8. Check Vercel and Resend logs for delivery status and unexpected errors. Never
   log the code, password, keys, or full recipient list.

Do not claim delivery works until step 7 has actually been performed with real
credentials and a verified sender.

## 8. Rollback considerations

- **Deployment failure:** use Vercel's instant rollback to the previous
  deployment. The challenge table is additive and the old password-only code
  ignores it, so do not drop it during an incident.
- **Missing table/configuration:** the new code fails closed with `503`. Apply
  the missing prerequisite or roll back the deployment; do not disable OTP.
- **Resend outage or delivery failure:** login returns `502` and no session is
  issued. Retry after the provider recovers; do not restore password-only login.
- **Password rotation:** changing `ADMIN_PASSWORD` prevents new password logins
  with the old password. It does not revoke already-issued stateless sessions.
- **Session-secret rotation:** changing `ADMIN_SESSION_SECRET` invalidates
  existing stateless sessions and pending challenge cookies immediately; users
  must sign in again. The database challenge rows are cleaned up separately.
- **OTP-secret rotation:** changing `ADMIN_OTP_HASH_SECRET` makes pending codes
  unverifiable; users must request a new challenge.
- **Environment rollback:** restore the previous values and redeploy. If the
  admin password was rotated, the previous password is no longer valid; use the
  new one or deliberately rotate again.

## Security notes

- Only an HMAC of the code is stored, bound to the challenge id and a random
  salt. The code itself is never written to the database or logs.
- Codes expire after 5 minutes, allow 5 wrong attempts, are single-use, and are
  replaced on resend (60-second cooldown, 3 resends).
- The pending challenge cookie is `HttpOnly`, `SameSite=Strict`, `Secure` in
  production, signed, and is not accepted as an admin session.
- A delivery failure deletes the challenge and returns `502`; no session is
  issued.
- The existing CSRF double-submit, same-origin checks, rate limits, session
  expiry, and logout behavior are unchanged.
- Production requires dedicated `ADMIN_SESSION_SECRET` and
  `ADMIN_OTP_HASH_SECRET` values (32+ characters, different from each other and
  from the password). The `ADMIN_PASSWORD` fallback exists only for local
  development; a short password weakens the HMAC and is brute-forceable offline.
- `ADMIN_PASSWORD` must be at least 20 characters in production. The login route
  returns `503` before sending email if that policy is not met.
