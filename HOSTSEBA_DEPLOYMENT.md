# Pure Roots — HostSeba Deployment Readiness

**Status:** UNVERIFIED. HostSeba compatibility has not been confirmed.  
**Do not migrate to HostSeba or claim compatibility until the relevant hosting capabilities are tested.**  
**Keep Vercel as the active deployment until HostSeba is verified.**

---

## 1. Application Architecture Summary

| Component | Detail |
|---|---|
| Framework | Next.js 14.2.35 App Router |
| Runtime | Node.js 20 LTS (`.nvmrc` set to `20`) |
| Package manager | npm, lockfile v3 |
| Start command | `node server.js` (custom production server) |
| Alternative start | `next start` (`npm run start:next`) |
| Database | Supabase (external, REST via `@supabase/supabase-js`) |
| Storage | Supabase Storage (site-assets bucket) |
| Auth | Custom admin password + HttpOnly cookie (`pr_admin`) |
| Payments | COD, bKash, Nagad, bank transfer — manual verification, no gateway callbacks |
| Build output | `.next/` (Next.js production build) |
| Port | Configurable via `PORT` env var (default `3000`) |
| Host bind | Configurable via `HOST` env var (default `0.0.0.0`) |

---

## 2. Recommended HostSeba Plan

**MERN Starter** (preferred over MERN Basic or Budget):

| Specification | Value |
|---|---|
| RAM | 2 GB |
| Storage | 10 GB NVMe |
| CPU | 1 vCPU |
| Node.js | Latest |
| Next.js | Supported |
| Control panel | Webuzo |
| SSH | Yes |
| Git | Yes |
| SSL | Free |
| Backups | Daily |

**Avoid:**
- **MERN Basic:** 1 GB RAM — risky for `next build` (Next.js builds are memory-intensive).
- **Budget hosting:** Explicitly states Node.js/Python not supported.

---

## 3. HostSeba Capabilities Requiring Verification

The following must be confirmed with HostSeba support or via the hosting panel before deployment:

| Item | Status | Notes |
|---|---|---|
| Exact Node.js version available | Unverified | `.nvmrc` specifies `20` |
| Webuzo Application Manager behavior | Unverified | How Node.js apps are registered/started |
| Persistent process support | Unverified | Whether `node server.js` keeps running after SSH session ends |
| Restart policy | Unverified | Auto-restart on crash/reboot |
| Port/proxy configuration | Unverified | How external HTTP(S) traffic reaches the Node.js process |
| Outbound Supabase connectivity | Unverified | Firewall/egress rules for `https://*.supabase.co` |
| Custom `server.js` as startup file | Unverified | Panel may expect `npm start` or a specific entry point |
| `.env` / environment variable injection | Unverified | Where to set `NODE_ENV`, `PORT`, `HOST`, Supabase keys, `ADMIN_PASSWORD` |
| `next build` memory headroom | Unverified | 2 GB RAM may be tight with Next.js 14 build |

---

## 4. Required Environment Variables (HostSeba / Self-Hosted)

Set these in the HostSeba panel (Webuzo/cPanel application environment) or in a `.env` file read by `server.js`. Never commit real values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL, e.g. `https://purerootbd.shop` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role secret (server-side only) |
| `ADMIN_PASSWORD` | Yes | Admin dashboard master password |
| `NODE_ENV` | Recommended | `production` |
| `PORT` | Recommended | `3000` (or panel-assigned port) |
| `HOST` | Recommended | `0.0.0.0` or `127.0.0.1` depending on proxy |

**Never set:** `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.

### Admin authentication model (important for hosting)

- Login posts `ADMIN_PASSWORD` once to `POST /api/admin/login`. The password is compared in constant time and is **never** stored in the browser or sent again.
- On success the server issues:
  - `pr_admin` — `HttpOnly`, `SameSite=Strict`, `Secure` (in production), 12-hour sliding expiry.
  - `csrf_token` — JS-readable, `SameSite=Strict`, `Secure` (in production). Every mutating admin request must echo it in `X-CSRF-Token`.
- Sessions use one of two backends:
  - `memory` (default off-Vercel): revocable on logout, requires a **single long-running Node process** (`node server.js` on HostSeba). Do not run multiple instances behind a load balancer in this mode.
  - `stateless` (automatic on Vercel, or `ADMIN_SESSION_MODE=stateless`): HMAC-signed 12-hour token that works across serverless instances. Logout clears the cookie but cannot revoke the token before it expires. Signing secret is `ADMIN_SESSION_SECRET`, falling back to `ADMIN_PASSWORD`.
- Login attempts are limited to 10 per 10 minutes per IP (in-memory; resets on restart).
- `ADMIN_PASSWORD` must be a long random value. Rotating it invalidates stateless sessions immediately (and you should restart the process to clear memory sessions).

---

## 5. Build and Start Commands

On the HostSeba server (via SSH or Webuzo terminal):

```bash
# 1. Install Node.js 20 (if not already available via Webuzo)
nvm install 20
nvm use 20

# 2. Clone or pull the repository
git clone https://github.com/mujahidun-mahid/purerootbd.git
cd purerootbd
git checkout main
git pull

# 3. Install dependencies (clean install, lockfile v3)
npm ci --no-audit --no-fund

# 4. Build for production
# IMPORTANT: Set NEXT_PUBLIC_* variables BEFORE building, they are baked in at build time
npm run build

# 5. Start the production server
npm start
# or explicitly: node server.js
```

**Process management:** If HostSeba does not provide a built-in process manager, use `nohup`, `systemd`, or PM2 to keep `node server.js` running persistently. Confirm with HostSeba support what is supported on the MERN Starter plan.

---

## 6. Reverse Proxy and HTTPS

HostSeba provides free SSL. The exact reverse-proxy configuration (how the panel's LiteSpeed/Web server forwards requests to the Node.js process on `PORT`) must be confirmed with HostSeba.

Typical flow:
```
Internet (HTTPS:443) → HostSeba reverse proxy → Node.js server (http://127.0.0.1:PORT)
```

- Set `HOST=127.0.0.1` if the panel proxies locally.
- Set `HOST=0.0.0.0` if the panel connects to the public interface.
- Ensure the proxy forwards `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For` headers.

---

## 7. Health Check

After deployment, verify:

```bash
curl https://purerootbd.shop/api/health
```

Expected response:
```json
{"status":"ok","database":"reachable"}
```

A `503` means the app is running but Supabase is unreachable — check outbound connectivity and credentials.

---

## 8. Pre-Flight Checklist

- [ ] Confirm HostSeba plan: MERN Starter (2 GB RAM, 10 GB NVMe)
- [ ] Confirm Node.js version supports Next.js 14.2.35 (Node ≥ 18.17.0)
- [ ] Confirm Webuzo can run a persistent `node server.js` process
- [ ] Confirm port/proxy setup for external HTTP(S) → Node.js
- [ ] Confirm outbound HTTPS to Supabase (`*.supabase.co`) is allowed
- [ ] Set all required environment variables in the panel
- [ ] Run `npm ci` and `npm run build` successfully on the server
- [ ] Start `node server.js` and verify it stays running
- [ ] Test `/api/health`, `/`, `/shop`, `/api/products`, `/api/categories`
- [ ] Verify SSL certificate is active
- [ ] Verify `NEXT_PUBLIC_SITE_URL` matches the production domain
- [ ] Verify unauthenticated admin APIs return 401
- [ ] Verify order lookup endpoints return redacted data

---

## 9. Rollback / Abort Conditions

Do not proceed with HostSeba deployment if:
- `npm run build` fails on the server
- `/api/health` returns `503` after deployment
- Outbound Supabase connectivity is blocked
- Node.js version is below 18.17.0
- No persistent process management is available

Keep Vercel as the fallback. If using HostSeba only for the domain, point DNS to Vercel instead (see `CLOUDFLARE_SETUP.md`).

---

**Do not migrate to HostSeba or claim compatibility until the relevant hosting capabilities are confirmed.**