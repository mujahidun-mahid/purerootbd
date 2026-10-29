# Pure Roots live admin

1. Run `supabase-schema.sql` once in the Supabase SQL Editor if the base schema
   has not been applied.
2. Run `supabase/migrations/20261029120000_admin_login_challenges.sql` once so
   pending email-OTP challenges can be shared across serverless instances. See
   `RESEND_OTP_SETUP.md` for the read-only preflight and post-application
   verification queries. Do not use `supabase db reset`.
3. Set these in Vercel → Project → Settings → Environment Variables for
   Production (and Preview if used):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
   - `ADMIN_PASSWORD` (20+ random characters)
   - `ADMIN_SESSION_SECRET` (required, 32+ random characters)
   - `ADMIN_OTP_HASH_SECRET` (required, 32+ different random characters)
   - `RESEND_API_KEY` (server-only)
   - `RESEND_FROM_EMAIL` (sender on a domain verified in Resend, never Gmail)
   - `ADMIN_OTP_RECIPIENTS` (comma-separated allowlist; do not commit)
   - `ADMIN_OTP_STORE=supabase` (required on serverless)
4. Build and run the mock-mail OTP/fail-closed/outage tests locally, then deploy
   through Vercel after approval. Environment changes require a new deployment.
5. Open `/admin`, enter the password, then the emailed six-digit code. Verify
   both approved recipients receive the same code and that logout and protected
   admin routes behave correctly.

The admin dashboard uses a protected server-sent event stream. It refreshes the
server snapshot every second without browser refresh and automatically
reconnects. Service-role/secret credentials never enter browser code.

If login returns `503`, the OTP table or required server-side configuration is
missing; do not fall back to password-only authentication. See
`RESEND_OTP_SETUP.md` for rollback guidance.
