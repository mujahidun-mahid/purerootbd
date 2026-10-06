# Pure Roots — Vercel + Supabase

## 1. Supabase

Open Supabase → SQL Editor and run `supabase-schema.sql` once.

The schema keeps `orders`, `order_status_history`, and `site_events` private. The browser never reads them directly.

Realtime Broadcast sends only a small `admin_data_changed` notification. The admin page then calls the protected Vercel API to retrieve the actual data.

If your Supabase Realtime settings have **Allow public access** disabled, enable it for this public notification channel, or switch the notification channel to a private/authenticated setup.

## 2. Vercel environment variables

Add these to the Vercel project for Production (and Preview if you want admin testing there):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_PASSWORD`

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are also accepted by the code, but the newer publishable/secret key names are preferred.

**Never put `SUPABASE_SECRET_KEY` in a `NEXT_PUBLIC_` variable.**

## 3. Deploy

Push the ZIP contents to your Git repository, import that repository into Vercel, and deploy.

Build command: `next build` (Vercel detects this automatically for Next.js).

## 4. Admin

Open:

`https://YOUR-DOMAIN/admin`

Sign in with `ADMIN_PASSWORD`.

The dashboard receives Supabase Broadcast events in real time. It does not use Netlify, SSE, or a 1-second database polling loop.
