import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  createChallengeCookie,
  clearChallengeCookie,
  readChallengeId,
  isSameOrigin
} from '@/lib/supabaseServer';
import { throttle, bodyTooLarge, tooLargeResponse } from '@/lib/apiSecurity';
import { getOtpConfig, generateOtp, hashOtp } from '@/lib/adminOtp';
import { getChallenge, rotateChallenge, deleteChallenge } from '@/lib/adminOtpStore';
import { sendOtpToRecipients } from '@/lib/otpMailer';

const RESEND_WINDOW_MS = 10 * 60 * 1000;
const RESEND_MAX = 10;
const GENERIC_ERROR = 'Invalid or expired verification code.';

function rejection(message = GENERIC_ERROR, { clear = false } = {}) {
  const response = NextResponse.json({ error: message }, { status: 401 });
  if (clear) response.headers.set('set-cookie', clearChallengeCookie());
  return response;
}

/**
 * Replace the pending challenge's code with a new one and re-send it.
 *
 * The old code is invalidated before delivery; if delivery fails the challenge
 * is removed, so a failed resend can never leave a usable session path behind.
 */
export async function POST(request) {
  if (bodyTooLarge(request, 4 * 1024)) return tooLargeResponse(4 * 1024);

  const limited = throttle(request, {
    windowMs: RESEND_WINDOW_MS,
    max: RESEND_MAX,
    key: 'admin-otp-resend'
  });
  if (limited) return limited;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const config = getOtpConfig();
  if (!config.configured) {
    return NextResponse.json(
      { error: 'Admin email verification is not configured.' },
      { status: 503 }
    );
  }

  const challengeId = readChallengeId(request);
  if (!challengeId) return rejection(GENERIC_ERROR, { clear: true });

  const row = await getChallenge(challengeId);
  if (!row || row.consumed_at) return rejection(GENERIC_ERROR, { clear: true });

  const maxAttempts = Number(row.max_attempts) || 5;
  if (Number(row.attempts || 0) >= maxAttempts) {
    await deleteChallenge(challengeId).catch(() => {});
    return rejection('Too many incorrect codes. Sign in again.', { clear: true });
  }

  const now = Date.now();
  const expiresAt = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    await deleteChallenge(challengeId).catch(() => {});
    return rejection('Verification code expired. Sign in again.', { clear: true });
  }

  const resendCount = Number(row.resend_count || 0);
  if (resendCount >= config.maxResends) {
    await deleteChallenge(challengeId).catch(() => {});
    return rejection('Too many resend requests. Sign in again.', { clear: true });
  }

  const lastSentAt = Date.parse(row.last_sent_at);
  if (Number.isFinite(lastSentAt)) {
    const waitMs = lastSentAt + config.resendCooldownSeconds * 1000 - now;
    if (waitMs > 0) {
      const retryAfterSeconds = Math.ceil(waitMs / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} before requesting another code.`,
          retryAfterSeconds
        },
        { status: 429 }
      );
    }
  }

  const otp = generateOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(challengeId, otp, salt);
  if (!otpHash) {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
  }

  const newExpiresAt = new Date(now + config.ttlSeconds * 1000).toISOString();
  const rotated = await rotateChallenge(challengeId, resendCount, {
    otp_hash: otpHash,
    salt,
    recipients: config.recipients,
    expires_at: newExpiresAt,
    resend_count: resendCount + 1,
    last_sent_at: new Date(now).toISOString()
  });
  if (!rotated) return rejection(GENERIC_ERROR, { clear: true });

  const delivered = await sendOtpToRecipients({
    recipients: config.recipients,
    otp,
    ttlSeconds: config.ttlSeconds,
    from: config.from
  });

  if (!delivered) {
    await deleteChallenge(challengeId).catch(() => {});
    const response = NextResponse.json(
      { error: 'Could not send a new verification code. Sign in again.' },
      { status: 502 }
    );
    response.headers.set('set-cookie', clearChallengeCookie());
    return response;
  }

  const { cookie } = createChallengeCookie(challengeId, config.ttlSeconds);
  const response = NextResponse.json({
    ok: true,
    expiresInSeconds: config.ttlSeconds,
    resendCooldownSeconds: config.resendCooldownSeconds,
    resendsRemaining: Math.max(0, config.maxResends - (resendCount + 1))
  });
  response.headers.set('set-cookie', cookie);
  return response;
}
