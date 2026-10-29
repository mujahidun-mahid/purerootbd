import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  createAdminSessionCookie,
  clearAdminSessionCookie,
  createCsrfTokenCookie,
  clearCsrfTokenCookie,
  destroyAdminSession,
  getAdminPassword,
} from '@/lib/supabaseServer';
import { throttle, bodyTooLarge, tooLargeResponse } from '@/lib/apiSecurity';

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
  // Count every login attempt (successful or not). `throttle` both checks the
  // window and records this hit, so repeated guesses are cut off at LOGIN_MAX.
  const limited = throttle(request, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX, key: 'admin-login' });
  if (limited) return limited;
  const { password } = await request.json().catch(() => ({}));
  const expected = getAdminPassword();
  if (!expected || !password || !passwordsMatch(password, expected)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token: sessionToken, cookie: sessionCookie } = createAdminSessionCookie();
  if (!sessionToken) {
    // Fail closed if the session backend is not configured (e.g. stateless
    // mode without ADMIN_PASSWORD / ADMIN_SESSION_SECRET).
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
  }
  const { token: csrfToken, cookie: csrfCookie } = createCsrfTokenCookie();

  const response = NextResponse.json({
    ok: true,
    csrfToken,
  });

  // Set both cookies. The session cookie is HttpOnly; the CSRF cookie is
  // readable by JavaScript for the double-submit pattern.
  response.headers.set('set-cookie', [sessionCookie, csrfCookie]);
  return response;
}

export async function DELETE(request) {
  // Revoke the server-side session, not just the browser cookie, so the token
  // cannot be replayed after logout.
  const token = request?.cookies?.get?.('pr_admin')?.value;
  destroyAdminSession(token);

  const response = NextResponse.json({ ok: true });
  response.headers.set(
    'set-cookie',
    [clearAdminSessionCookie(), clearCsrfTokenCookie()]
  );
  return response;
}
