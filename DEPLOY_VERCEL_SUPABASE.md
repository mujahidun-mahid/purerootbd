# Pure Roots — Vercel + Supabase Setup Guide

## 1. Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Copy and run the entire contents of `supabase-schema.sql`.

### What the schema configures:
- **`public.orders`**: Stores order details (customer info, delivery addresses, item arrays, status, totals).
- **`public.order_status_history`**: Automatically tracks every status change (Order Placed, Confirmed, Shipped, Delivered) with timestamps.
- **`public.site_settings`**: Stores customizable storefront hero image, headline, and subtitle.
- **`public.site_events`**: Tracks real-time storefront pageviews and visitor sessions.
- **`storage.buckets` (`site-assets`)**: Public storage for hero banner images uploaded via the admin panel.
- **Exception-safe Realtime Broadcast**: Uses database triggers with error-handling to notify the admin panel instantly without risking database write failures.
- **Row Level Security (RLS)**: Protects order data from direct public reading while allowing server APIs to process orders securely.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` for local development, or add these in **Vercel Project Settings → Environment Variables**:

| Variable Name | Description | Example / Location |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` (Supabase Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon key for Realtime WebSocket | Supabase Project Settings → API (`anon public`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Service Role key for server writes | Supabase Project Settings → API (`service_role secret`) |
| `ADMIN_PASSWORD` | Master password for `/admin` console | 20+ random characters (enforced in production) |
| `ADMIN_SESSION_SECRET` | Required HMAC secret for stateless sessions and challenge cookies | 32+ random characters, not the password |
| `ADMIN_OTP_HASH_SECRET` | Required HMAC secret for OTP hashes | 32+ random characters, different from `ADMIN_SESSION_SECRET` |
| `RESEND_API_KEY` | Resend API key for admin OTP email | <https://resend.com/api-keys> (server-only) |
| `RESEND_FROM_EMAIL` | Sender on a verified Resend domain | `PureRoots Admin <no-reply@mail.purerootbd.shop>` |
| `ADMIN_OTP_RECIPIENTS` | Comma-separated OTP recipient allowlist | Two approved admin addresses |
| `ADMIN_OTP_STORE` | Pending-challenge backend | `supabase` on Vercel |

*(Note: `SUPABASE_SECRET_KEY` is also accepted as an alias for `SUPABASE_SERVICE_ROLE_KEY`)*

Before the first login, run
`supabase/migrations/20261029120000_admin_login_challenges.sql` in the Supabase
SQL editor. On Vercel, pending OTP challenges use Supabase because serverless
memory is not shared. See `RESEND_OTP_SETUP.md` for the preflight/post-check SQL,
domain verification, secure secret generation, rollout order, rollback, and
local mock testing.

The Vercel project is currently configured with Node.js 24.x. The repository
now declares Node.js 22.12.0 in `.nvmrc` and `>=22.12.0` in `package.json`
`engines`; Vercel 24.x satisfies both. Keep the deployment runtime at or above
Node.js 22.12.0: the installed Supabase SDK requires Node.js 22+ and the fixed
`sanitize-html` release requires 22.12+. Local verification was performed on
Node.js 24.22.2 and 26.8.1; still confirm Vercel reports 24.x after deployment.
HostSeba must independently confirm a 22.12+ runtime before it is used.

> [!WARNING]
> Never set `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix. It must remain server-side only.

### Deployment order and rollback

1. Confirm the current production deployment and admin login are healthy.
2. Revoke/create the Resend key and verify the sender domain.
3. Apply the challenge-table migration and run the post-application checks.
4. Set the Production environment variables and rotate the admin password and
   both dedicated secrets. Do not enable test mode.
5. Run the production build and mock-mail OTP/fail-closed/outage tests.
6. Commit, push, and deploy only after approval; environment changes require a
   new deployment.
7. Verify both recipients receive the same code, verification issues a session,
   logout works, and a protected admin route rejects anonymous requests.

If deployment or delivery fails, use Vercel's instant rollback. The challenge
table is additive and can remain in place; the previous password-only
deployment ignores it. Do not restore password-only authentication or drop the
table during an incident.

---

## 3. Admin Console Features

Navigate to `/admin`, enter your configured `ADMIN_PASSWORD`, then enter the
six-digit code emailed to the addresses in `ADMIN_OTP_RECIPIENTS`:

- **Overview Dashboard**:
  - Live Revenue, Total Orders, Unique Customers, and Live Online Visitors.
  - Fulfillment pipeline progress bars.
  - Top purchased products and most viewed storefront pages.
- **Orders Management**:
  - Live real-time incoming orders with automatic WebSocket push + polling sync.
  - Instant search by Order Number, Customer Name, Mobile Number, or Status.
  - One-click status updates (`Order Placed`, `Confirmed`, `Processing`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`).
  - Full Order Details modal with itemized pricing, customer delivery address, and chronological status timeline.
  - **Export CSV**: One-click download of all orders formatted for courier delivery sheets (Steadfast, Pathao, RedX).
- **Customers Management**:
  - Aggregated customer database with verified mobile numbers, lifetime value, total orders, and order history.
- **Catalog Overview**:
  - View all 17 organic products, package sizes, and active statuses.
- **Live Analytics**:
  - Real-time visitor activity stream (`site_events`), 14-day daily sales trend chart, and page view counters.
- **Site Controls & Diagnostics**:
  - Upload banner images directly to Supabase Storage with live preview.
  - Edit homepage headline and subtitle.
  - Live system diagnostic check showing database connectivity, table record counts, and credentials status.
