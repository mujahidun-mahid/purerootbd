import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  clearAdminSessionCookie,
  clearCsrfTokenCookie,
  clearChallengeCookie,
  destroyAdminSession,
  getAdminPassword,
  createChallengeCookie,
  readChallengeId,
  sessionSecretConfigured
} from '@/lib/supabaseServer';
import { throttle, bodyTooLarge, tooLargeResponse } from '@/lib/apiSecurity';
import { adminPasswordIsStrong } from '@/lib/adminSecrets';
import { getOtpConfig, generateOtp, hashOtp, maskEmail, otpHashConfigured } from '@/lib/adminOtp';
import { createChallenge, deleteChallenge } from '@/lib/adminOtpStore';
import { sendOtpToRecipients } from '@/lib/otpMailer';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 10;

function passwordsMatch(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  // Constant-time comparison: no early-exit timing signal on prefix matches.
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Step 1 of admin login: verify the password and email a one-time code.
 *
 * A correct password alone never returns a session. The only thing issued here
 * is an HttpOnly pending-challenge cookie; `pr_admin` is created later by
 * /api/admin/login/verify after the code is checked.
 */
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

  // Production must not sign sessions/OTP hashes with a short password, and both
  // dedicated secrets are required. Fail closed before creating a challenge or
  // sending any email.
  if (!adminPasswordIsStrong(expected) || !sessionSecretConfigured() || !otpHashConfigured()) {
    return NextResponse.json(
      { error: 'Admin authentication is not configured securely.' },
      { status: 503 }
    );
  }

  const config = getOtpConfig();
  if (!config.configured) {
    // Fail closed if Resend/recipients are not configured; never fall back to
    // single-factor login.
    return NextResponse.json(
      { error: 'Admin email verification is not configured.' },
      { status: 503 }
    );
  }

  // Discard any previous pending challenge from this browser so only the newest
  // code is valid.
  const previousChallenge = readChallengeId(request);
  if (previousChallenge) await deleteChallenge(previousChallenge).catch(() => {});

  const challengeId = crypto.randomBytes(24).toString('hex');
  const otp = generateOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(challengeId, otp, salt);
  if (!otpHash) {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
  }

  const now = Date.now();
  const expiresAt = new Date(now + config.ttlSeconds * 1000).toISOString();
  const created = await createChallenge({
    id: challengeId,
    otp_hash: otpHash,
    salt,
    recipients: config.recipients,
    attempts: 0,
    max_attempts: config.maxAttempts,
    resend_count: 0,
    last_sent_at: new Date(now).toISOString(),
    expires_at: expiresAt,
    consumed_at: null
  });

  if (!created) {
    return NextResponse.json(
      { error: 'Admin email verification is temporarily unavailable.' },
      { status: 503 }
    );
  }

  // Sign the pending-challenge cookie before emailing. If signing is not
  // configured, delete the challenge and fail without sending an unusable code.
  const { token: challengeToken, cookie: challengeCookie } = createChallengeCookie(
    challengeId,
    config.ttlSeconds
  );
  if (!challengeToken) {
    await deleteChallenge(challengeId).catch(() => {});
    return NextResponse.json(
      { error: 'Admin authentication is not configured.' },
      { status: 503 }
    );
  }

  const delivered = await sendOtpToRecipients({
    recipients: config.recipients,
    otp,
    ttlSeconds: config.ttlSeconds,
    from: config.from
  });

  if (!delivered) {
    await deleteChallenge(challengeId).catch(() => {});
    const failed = NextResponse.json(
      { error: 'Could not send the verification code. Try again later.' },
      { status: 502 }
    );
    failed.headers.set('set-cookie', clearChallengeCookie());
    return failed;
  }

  const response = NextResponse.json({
    ok: true,
    otpRequired: true,
    expiresInSeconds: config.ttlSeconds,
    resendCooldownSeconds: config.resendCooldownSeconds,
    recipients: config.recipients.map(maskEmail)
  });
  response.headers.set('set-cookie', challengeCookie);
  return response;
}

export async function DELETE(request) {
  // Revoke the server-side session, not just the browser cookie, so the token
  // cannot be replayed after logout.
  const token = request?.cookies?.get?.('pr_admin')?.value;
  destroyAdminSession(token);

  // Also discard any pending OTP challenge, so logging out cannot leave a
  // still-verifiable code behind.
  const challengeId = readChallengeId(request);
  if (challengeId) await deleteChallenge(challengeId).catch(() => {});

  const response = NextResponse.json({ ok: true });
  response.headers.set(
    'set-cookie',
    [clearAdminSessionCookie(), clearCsrfTokenCookie(), clearChallengeCookie()]
  );
  return response;
}
