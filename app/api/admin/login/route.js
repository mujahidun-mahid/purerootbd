import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminPassword, getAdminSessionToken } from '@/lib/supabaseServer';

// Minimal per-instance brute-force throttle for the single shared admin
// password. Best-effort on serverless (memory is per-instance), but it
// raises the cost of guessing well above zero. 10 tries / 10 min per IP.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  return list.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const list = attempts.get(ip) || [];
  list.push(Date.now());
  attempts.set(ip, list);
}

function passwordsMatch(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  // Constant-time comparison: no early-exit timing signal on prefix matches.
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  const { password } = await request.json().catch(() => ({}));
  const expected = getAdminPassword();
  if (!expected || !password || !passwordsMatch(password, expected)) {
    recordAttempt(ip);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = getAdminSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Admin session could not be created.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('pr_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('pr_admin', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  return response;
}
