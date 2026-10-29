# Pure Roots — Cloudflare Setup Guide

**Domain:** `purerootbd.shop`  
**Status:** Cloudflare is not yet confirmed as active.  
**Approval required:** Do not change nameservers, DNS records, or live settings without explicit approval.

---

## Current DNS State (Observed)

- **Nameservers:** `launch1.spaceship.net`, `launch2.spaceship.net` (Spaceship)
- **Apex A records:** `34.216.117.25`, `54.149.79.189`
- **`www` record:** None detected
- **Vercel requirement:** Apex `A` record → `216.198.79.1`; `www` → `CNAME cname.vercel-dns.com` (confirm exact value in Vercel Domains dashboard)

---

## Option A — Stay on Spaceship DNS + Vercel (Recommended if DNS stays where it is)

If you continue using Spaceship for DNS and Vercel for hosting:

1. In **Vercel Project Settings → Domains**, add both:
   - `purerootbd.shop` (apex)
   - `www.purerootbd.shop` (www)
2. Copy the exact DNS records Vercel displays for each domain.
3. In **Spaceship DNS management**, update records:
   - **A @** → `216.198.79.1` (replace existing apex A records `34.216.117.25` and `54.149.79.189`)
   - **CNAME www** → `cname.vercel-dns.com` (or the value Vercel shows)
   - Remove any conflicting `AAAA`, `CNAME @`, or parking records
4. Preserve MX, SPF, DKIM, DMARC, and any other email/service records.
5. Wait for propagation. Vercel will issue SSL automatically.
6. In **Vercel Project Settings → Environment Variables**, set:
   - `NEXT_PUBLIC_SITE_URL=https://purerootbd.shop`
7. Redeploy.

---

## Option B — Cloudflare in Front of Vercel (Full Setup)

If you want Cloudflare's WAF, caching, and security between visitors and the origin:

### 1. Add Domain to Cloudflare
- Add `purerootbd.shop` in Cloudflare Dashboard.
- Cloudflare will scan existing DNS records.
- **Important:** Cloudflare will assign new nameservers (e.g., `alex.ns.cloudflare.com`, `leah.ns.cloudflare.com`).
- **Approval required before changing nameservers at Spaceship.**

### 2. DNS Records in Cloudflare

| Type | Name | Value | Proxy | Notes |
|---|---|---|---|---|
| A | `@` | `216.198.79.1` | DNS-only (grey) initially | Apex, required by Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied (orange) | Confirm exact value in Vercel |
| A | `@` | `216.198.79.1` | Proxied (orange) | After Vercel confirms apex works |
| MX | `@` | *(existing MX)* | DNS-only | Preserve email routing |
| TXT | `@` | *(existing SPF)* | DNS-only | Preserve SPF |
| TXT | `default._domainkey` | *(existing DKIM)* | DNS-only | Preserve DKIM |
| TXT | `_dmarc` | *(existing DMARC)* | DNS-only | Preserve DMARC |

### 3. SSL/TLS Configuration

- **SSL/TLS encryption mode:** Start with `Full`, verify origin HTTPS works, then move to `Full (strict)`.
- **Origin certificate:** If using Full (strict), the origin (Vercel) already has a valid certificate from Vercel's automatic SSL. Cloudflare-to-origin uses that certificate.
- **Always Use HTTPS:** On.
- **Automatic HTTPS Rewrites:** On.
- **Minimum TLS Version:** TLS 1.2.
- **Opportunistic Encryption:** On.

### 4. HSTS Prerequisites

Before enabling HSTS with `includeSubDomains` or a long `max-age`:
- Confirm HTTPS works on both `purerootbd.shop` and `www.purerootbd.shop`.
- Confirm no subdomains will break under HSTS.
- Start with Cloudflare HSTS (or Next.js header) with a short `max-age` (e.g., 300 seconds), then increase gradually.

### 5. WAF and Rate-Limit Recommendations

| Rule | Target | Action |
|---|---|---|
| Rate limit | `/api/orders` POST | 30 req/min per IP |
| Rate limit | `/api/orders/track` POST | 30 req/min per IP |
| Rate limit | `/api/admin/login` POST | 10 req/10min per IP |
| Rate limit | `/api/admin/login/verify` POST | 30 req/10min per IP |
| Rate limit | `/api/admin/login/resend` POST | 10 req/10min per IP |
| WAF managed rules | All traffic | Challenge on high-risk scores |
| Block | Known bots/scanners | Block or JS challenge |

### 6. Cache Exclusions (Bypass Cache)

Set **Cache Level: Bypass** or **Edge Cache TTL: 0** for:

- `/admin/*`
- `/api/*` (all API routes)
- `/cart`, `/checkout`, `/payment`, `/order-confirmation`
- `/track-order`
- `/wishlist`, `/account`
- Any route with `cookie` header present (authenticated/sensitive)

Cacheable:
- `/`, `/shop`, `/category/*`, `/product/*`, `/about`, `/contact`, `/faq`, `/reviews`, `/shipping`, `/returns`, `/privacy`, `/terms`
- `/sitemap.xml`, `/robots.txt`
- Static assets (`/icon.svg`, `/opengraph-image`)

### 7. Security Headers

Cloudflare can add response headers via **Transform Rules** or **Response Header Modification**. Recommended:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=0` initially; increase after HTTPS verification |

> [!NOTE]  
> Next.js `next.config.mjs` already sets several of these headers. Avoid duplicating conflicting values between Next.js, Cloudflare, and HostSeba (if used). Pick one layer as the source of truth for each header.

### 8. Optional: Cloudflare Turnstile

Add Turnstile to:
- Admin login (`/api/admin/login`)
- Contact form
- Any public form susceptible to spam

Do not add Turnstile to checkout or payment flows unless required — it adds friction to conversion.

---

## Option C — HostSeba Hosting with Cloudflare

If you move hosting to HostSeba (MERN Starter / Webuzo / cPanel):

1. Point Cloudflare DNS A record `@` to the HostSeba server IP (obtain from HostSeba panel).
2. Set SSL/TLS to `Full (strict)` only after confirming the HostSeba origin serves a valid certificate.
3. Configure origin certificate or use Cloudflare Origin CA if HostSeba supports custom SSL.
4. Update `HOSTSEBA_DEPLOYMENT.md` with the actual origin IP and port/proxy details.

---

## Manual Steps Checklist

- [ ] Verify current DNS provider and nameservers for `purerootbd.shop`
- [ ] Add domain in Vercel Dashboard (apex + www)
- [ ] Obtain exact A and CNAME values from Vercel
- [ ] Update DNS at Spaceship (or Cloudflare nameservers if adopting Cloudflare)
- [ ] Preserve MX, SPF, DKIM, DMARC records
- [ ] Wait for DNS propagation
- [ ] Verify SSL issued by Vercel (or Cloudflare)
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://purerootbd.shop` in hosting environment
- [ ] Test `https://purerootbd.shop` and `https://www.purerootbd.shop`
- [ ] Configure cache exclusions for admin/checkout/API routes
- [ ] Enable WAF rate limits on abuse-prone endpoints
- [ ] Enable HSTS only after HTTPS verified on all hostnames

---

**Do not change nameservers, DNS, Cloudflare rules, or live payment settings without explicit approval.**