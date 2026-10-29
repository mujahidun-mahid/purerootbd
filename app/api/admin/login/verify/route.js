import { NextResponse } from 'next/server';
import {
  createAdminSessionCookie,
  createCsrfTokenCookie,
  clearChallengeCookie,
  readChallengeId,
  isSameOrigin
} from '@/lib/supabaseServer';
import { throttle, bodyTooLarge, tooLargeResponse } from '@/lib/apiSecurity';
import { isSixDigitOtp, otpMatches } from '@/lib/adminOtp';
import {
  getChallenge,
  registerFailedAttempt,
  consumeChallenge,
  deleteChallenge
} from '@/lib/adminOtpStore';

const VERIFY_WINDOW_MS = 10 * 60 * 1000;
const VERIFY_MAX = 30;
const GENERIC_ERROR = 'Invalid or expired verification code.';

function rejection(message = GENERIC_ERROR, { clear = false } = {}) {
  const response = NextResponse.json({ error: message }, { status: 401 });
  if (clear) response.headers.set('set-cookie', clearChallengeCookie());
  return response;
}

/**
 * Step 2 of admin login: verify the emailed code and only then issue `pr_admin`.
 *
 * This route is intentionally unreachable without the signed pending-challenge
 * cookie created by step 1. It never accepts a password, so a direct API call
 * cannot skip the email factor.
 */
export async function POST(request) {
  if (bodyTooLarge(request, 4 * 1024)) return tooLargeResponse(4 * 1024);

  const limited = throttle(request, {
    windowMs: VERIFY_WINDOW_MS,
    max: VERIFY_MAX,
    key: 'admin-otp-verify'
  });
  if (limited) return limited;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const challengeId = readChallengeId(request);
  if (!challengeId) return rejection(GENERIC_ERROR, { clear: true });

  const { otp } = await request.json().catch(() => ({}));
  if (!isSixDigitOtp(otp)) return rejection();

  const row = await getChallenge(challengeId);
  if (!row || row.consumed_at) return rejection(GENERIC_ERROR, { clear: true });

  const maxAttempts = Number(row.max_attempts) || 5;
  if (Number(row.attempts || 0) >= maxAttempts) {
    await deleteChallenge(challengeId).catch(() => {});
    return rejection('Too many incorrect codes. Sign in again.', { clear: true });
  }

  const expiresAt = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await deleteChallenge(challengeId).catch(() => {});
    return rejection('Verification code expired. Sign in again.', { clear: true });
  }

  if (!otpMatches(challengeId, otp, row.salt, row.otp_hash)) {
    const result = await registerFailedAttempt(challengeId, maxAttempts);
    if (result.exhausted) {
      return rejection('Too many incorrect codes. Sign in again.', { clear: true });
    }
    return rejection(GENERIC_ERROR);
  }

  // Single-use: only the first successful verification wins, even under parallel
  // requests or across serverless instances.
  const consumed = await consumeChallenge(challengeId);
  if (!consumed) return rejection(GENERIC_ERROR, { clear: true });

  const { token: sessionToken, cookie: sessionCookie } = createAdminSessionCookie();
  if (!sessionToken) {
    const failed = NextResponse.json(
      { error: 'Admin authentication is not configured.' },
      { status: 503 }
    );
    failed.headers.set('set-cookie', clearChallengeCookie());
    return failed;
  }
  const { token: csrfToken, cookie: csrfCookie } = createCsrfTokenCookie();

  const response = NextResponse.json({ ok: true, csrfToken });
  response.headers.set('set-cookie', [sessionCookie, csrfCookie, clearChallengeCookie()]);
  return response;
}
