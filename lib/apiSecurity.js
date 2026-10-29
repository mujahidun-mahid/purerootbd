import { NextResponse } from 'next/server';

// ---- Safe error responses ----
// Database/driver messages can leak schema, constraint and permission
// details. Log the real error server-side, send a generic message out.
export function safeError(error, publicMessage, status = 500) {
  console.error('API error:', error);
  return NextResponse.json({ error: publicMessage }, { status });
}

export const NO_STORE = { 'cache-control': 'no-store' };

// ---- Request body size gate ----
// Route handlers buffer the whole body via request.json()/formData().
// Reject obviously oversized payloads on Content-Length before parsing.
// (Chunked bodies without a length header still parse — Next.js caps
// worker memory per request — so this is a cheap first filter, not a
// complete guarantee.)
export function bodyTooLarge(request, maxBytes) {
  const len = Number(request.headers.get('content-length') || 0);
  return Number.isFinite(len) && len > maxBytes;
}

export function tooLargeResponse(maxBytes) {
  const label =
    maxBytes >= 1024 * 1024
      ? `${Math.round((maxBytes / 1024 / 1024) * 10) / 10}MB`
      : `${Math.round(maxBytes / 1024)}KB`;
  return NextResponse.json({ error: `Request too large (max ${label}).` }, { status: 413 });
}

// ---- Minimal per-instance rate limiter ----
// Best-effort on serverless (memory is per-instance, resets on cold start).
// It raises abuse cost meaningfully; true distributed limiting belongs in
// Vercel Firewall / WAF, not application code.
const buckets = new Map();

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function isRateLimited(request, { windowMs, max, key = '' } = {}) {
  const now = Date.now();
  const id = `${key}:${clientIp(request)}`;
  const list = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  buckets.set(id, list);
  return list.length >= max;
}

export function recordHit(request, { windowMs, key = '' } = {}) {
  const now = Date.now();
  const id = `${key}:${clientIp(request)}`;
  const list = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  list.push(now);
  buckets.set(id, list);
}

// Returns a 429 response when over budget, otherwise null.
export function throttle(request, opts) {
  if (isRateLimited(request, opts)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }
  recordHit(request, opts);
  return null;
}
