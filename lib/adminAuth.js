import 'server-only';
import crypto from 'node:crypto';
import { getSessionSecret } from './adminSecrets';

/**
 * Admin session tokens.
 *
 * Two interchangeable backends:
 *
 * - `memory` (default): random token stored in a process-local Map. Supports
 *   immediate server-side revocation on logout. Requires one long-running Node
 *   process (HostSeba / `node server.js` / `next start`).
 *
 * - `stateless`: HMAC-SHA256-signed token (`expiry.nonce.signature`). No shared
 *   state, so it works across serverless functions and multiple instances
 *   (Vercel). Logout clears the cookie but cannot revoke an already-issued token
 *   before its 12-hour expiry. Production requires a dedicated
 *   ADMIN_SESSION_SECRET; the ADMIN_PASSWORD fallback is development-only.
 *
 * Mode selection: ADMIN_SESSION_MODE=memory|stateless overrides; otherwise
 * stateless is used automatically when running on Vercel, memory elsewhere.
 *
 * Both replace the old `x-admin-password` header, which sent the raw admin
 * password on every request.
 */
const SESSION_MODE =
  process.env.ADMIN_SESSION_MODE === 'memory'
    ? 'memory'
    : process.env.ADMIN_SESSION_MODE === 'stateless'
      ? 'stateless'
      : process.env.VERCEL === '1'
        ? 'stateless'
        : 'memory';

const STATELESS_SECRET = getSessionSecret();

export function sessionSecretConfigured() {
  return Boolean(STATELESS_SECRET);
}

// Store sessions on globalThis as well as in module scope. Next's dev server
// and some bundled deployments can load separate copies of this module for
// different route handlers; a module-local Map would then fail to see sessions
// created by another route. globalThis keeps one Map per Node process.
const MEMORY_SESSIONS_KEY = '__pureRootsAdminSessions';
if (!(globalThis[MEMORY_SESSIONS_KEY] instanceof Map)) {
  globalThis[MEMORY_SESSIONS_KEY] = new Map();
}
const adminSessions = globalThis[MEMORY_SESSIONS_KEY];

// Session TTL: 12 hours in milliseconds
const ADMIN_SESSION_TTL_MS = 60 * 60 * 12 * 1000;

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  return crypto.createHmac('sha256', STATELESS_SECRET).update(payload).digest('base64url');
}

function createMemorySession() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  adminSessions.set(token, { expiresAt });
  return token;
}

function createStatelessSession() {
  if (!STATELESS_SECRET) return '';
  const payload = `${Date.now() + ADMIN_SESSION_TTL_MS}.${crypto.randomBytes(16).toString('hex')}`;
  return `${base64url(payload)}.${signPayload(payload)}`;
}

function validateStatelessSession(token) {
  if (!STATELESS_SECRET || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, signature] = parts;
  let payload;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const expected = signPayload(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  // Require the exact session payload shape. A pending-challenge token is signed
  // with the same key, so without this check a numeric-looking challenge id
  // could otherwise be mistaken for a session expiry.
  const payloadParts = payload.split('.');
  if (
    payloadParts.length !== 2 ||
    !/^\d{13}$/.test(payloadParts[0]) ||
    !/^[a-f0-9]{32}$/.test(payloadParts[1])
  ) {
    return false;
  }
  const expiresAt = Number(payloadParts[0]);
  return Date.now() < expiresAt;
}

function createAdminSession() {
  return SESSION_MODE === 'stateless' ? createStatelessSession() : createMemorySession();
}

export function validateAdminSession(token) {
  if (!token) return false;
  if (SESSION_MODE === 'stateless') return validateStatelessSession(token);

  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  // Sliding expiry: refresh on valid activity.
  session.expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  return true;
}

export function destroyAdminSession(token) {
  // Stateless tokens cannot be revoked server-side without shared state; the
  // cookie is cleared by the caller and the token expires on its own.
  if (SESSION_MODE === 'memory' && token) adminSessions.delete(token);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (now > session.expiresAt) adminSessions.delete(token);
  }
}
// Run cleanup every hour. unref() so it never keeps the process alive.
const cleanupTimer = setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

/**
 * Cookie attributes. Secure is only added in production, which is required for
 * HTTPS deployments. Tests/dev over plain HTTP run with NODE_ENV != production.
 */
function cookieSuffix({ httpOnly = true, maxAgeSeconds } = {}) {
  const maxAge =
    Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0
      ? Math.floor(maxAgeSeconds)
      : Math.floor(ADMIN_SESSION_TTL_MS / 1000);
  const parts = ['Path=/', `Max-Age=${maxAge}`];
  if (httpOnly) parts.push('HttpOnly');
  parts.push('SameSite=Strict');
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

function expiredCookieSuffix({ httpOnly = true } = {}) {
  const parts = ['Path=/', 'Max-Age=0'];
  if (httpOnly) parts.push('HttpOnly');
  parts.push('SameSite=Strict');
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function createAdminSessionCookie() {
  const token = createAdminSession();
  if (!token) return { token: '', cookie: clearAdminSessionCookie() };
  return { token, cookie: `pr_admin=${token}; ${cookieSuffix()}` };
}

export function clearAdminSessionCookie() {
  return `pr_admin=; ${expiredCookieSuffix()}`;
}

/**
 * CSRF double-submit token. Stored in a JS-readable (non-HttpOnly) cookie so the
 * dashboard can echo it back in the `X-CSRF-Token` header on mutations.
 */
function generateCsrfToken() {
  return crypto.randomBytes(16).toString('hex');
}

export function createCsrfTokenCookie() {
  const token = generateCsrfToken();
  return { token, cookie: `csrf_token=${token}; ${cookieSuffix({ httpOnly: false })}` };
}

export function clearCsrfTokenCookie() {
  return `csrf_token=; ${expiredCookieSuffix({ httpOnly: false })}`;
}

export function validateCsrfToken(request, csrfTokenHeader) {
  const csrfCookie = request.cookies?.get?.('csrf_token')?.value;
  if (!csrfCookie || !csrfTokenHeader) return false;
  const a = Buffer.from(String(csrfCookie));
  const b = Buffer.from(String(csrfTokenHeader));
  // Constant-time comparison; length check first because timingSafeEqual throws.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Reject cross-origin mutations as defense in depth. Browsers send an Origin
 * header on non-GET requests; if it does not match the request host the request
 * is cross-site. Non-browser clients (curl, server-to-server) may omit Origin —
 * those still need a valid CSRF token, so this is an extra gate, not the only one.
 */
export function isSameOrigin(request) {
  const origin = request.headers?.get?.('origin');
  if (!origin) return true;
  const host = request.headers?.get?.('x-forwarded-host') || request.headers?.get?.('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Single authorization gate for every /api/admin/* route.
 *
 * - Requires a valid server-side session cookie (never the raw password).
 * - For state-changing methods (POST/PUT/PATCH/DELETE) also requires a valid
 *   CSRF token and a same-origin request, so a cross-site form/fetch cannot
 *   mutate admin data even if a session cookie is present.
 */
export function adminAuthorized(request) {
  const token = request.cookies?.get?.('pr_admin')?.value;
  if (!validateAdminSession(token)) return false;

  const method = String(request.method || 'GET').toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    if (!isSameOrigin(request)) return false;
    const header = request.headers?.get?.('x-csrf-token');
    if (!validateCsrfToken(request, header)) return false;
  }
  return true;
}

/**
 * Pending-login challenge cookie.
 *
 * The challenge itself lives in shared storage (Supabase on Vercel); the cookie
 * only carries a signed id + expiry. It is HttpOnly and cannot be used as an
 * authenticated session — adminAuthorized() only trusts `pr_admin`.
 */
const CHALLENGE_COOKIE = 'pr_admin_challenge';

export function createChallengeCookie(challengeId, ttlSeconds) {
  if (!STATELESS_SECRET || !challengeId) {
    return { token: '', cookie: clearChallengeCookie() };
  }
  const ttl = Math.max(1, Math.floor(Number(ttlSeconds) || 300));
  const expiresAt = Date.now() + ttl * 1000;
  const payload = `${challengeId}.${expiresAt}`;
  const token = `${base64url(payload)}.${signPayload(payload)}`;
  return {
    token,
    cookie: `${CHALLENGE_COOKIE}=${token}; ${cookieSuffix({ maxAgeSeconds: ttl })}`
  };
}

export function readChallengeId(request) {
  const token = request?.cookies?.get?.(CHALLENGE_COOKIE)?.value;
  if (!STATELESS_SECRET || !token) return '';

  const parts = token.split('.');
  if (parts.length !== 2) return '';
  const [encoded, signature] = parts;

  let payload;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return '';
  }

  const expected = signPayload(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return '';

  const dot = payload.lastIndexOf('.');
  if (dot <= 0) return '';
  const id = payload.slice(0, dot);
  const expiresAt = Number(payload.slice(dot + 1));
  if (!/^[a-f0-9]{32,64}$/i.test(id)) return '';
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return '';
  return id;
}

export function clearChallengeCookie() {
  return `${CHALLENGE_COOKIE}=; ${expiredCookieSuffix()}`;
}
