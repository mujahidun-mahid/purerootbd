# Pure Roots live admin

1. Run `supabase-schema.sql` once in Supabase SQL Editor.
2. Netlify environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
   - `ADMIN_PASSWORD`
3. Deploy this ZIP with Netlify's Next.js build support.
4. Open `/admin` and sign in.

The admin dashboard uses a protected server-sent event stream. It refreshes the server snapshot every second without browser refresh and automatically reconnects. Service-role/secret credentials never enter browser code.
