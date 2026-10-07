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
| `ADMIN_PASSWORD` | Master password for `/admin` console | Choose any secure password |

*(Note: `SUPABASE_SECRET_KEY` is also accepted as an alias for `SUPABASE_SERVICE_ROLE_KEY`)*

> [!WARNING]
> Never set `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix. It must remain server-side only.

---

## 3. Admin Console Features

Navigate to `/admin` and log in with your configured `ADMIN_PASSWORD`:

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
