import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminPassword, getAdminSessionToken } from '@/lib/supabaseServer';

// Brute-force throttle via the shared limiter (best-effort per instance;
// distributed enforcement belongs in Vercel Firewall, not app code).
import { isRateLimited, recordHit, bodyTooLarge, tooLargeResponse } from '@/lib/apiSecurity';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 10;

function passwordsMatch(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  // Constant-time comparison: no early-exit timing signal on prefix matches.
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request) {
  if (bodyTooLarge(request, 16 * 1024)) return tooLargeResponse(16 * 1024);
  if (isRateLimited(request, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX, key: 'admin-login' })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  const { password } = await request.json().catch(() => ({}));
  const expected = getAdminPassword();
  if (!expected || !password || !passwordsMatch(password, expected)) {
    recordHit(request, { windowMs: LOGIN_WINDOW_MS, key: 'admin-login' });
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
