import 'server-only';
import crypto from 'node:crypto';
import { getOtpHashSecret } from './adminSecrets';

/**
 * Server-only configuration and helpers for the admin email OTP challenge.
 *
 * Nothing in this file may be imported from a client component. The recipient
 * list is read exclusively from `ADMIN_OTP_RECIPIENTS`; it is never accepted
 * from a request body, query string or header.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

function intEnv(name, fallback, min, max) {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

/**
 * Parse and validate the allowlisted recipient list. Returns an empty array if
 * anything is wrong, which makes callers fail closed rather than silently send
 * codes to a partial list.
 */
export function parseRecipients(raw) {
  const list = String(raw || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(list)];
  if (!unique.length || unique.length > MAX_RECIPIENTS) return [];
  if (unique.some((value) => !EMAIL_RE.test(value))) return [];
  return unique;
}

function senderAddress(from) {
  if (!from || /[\r\n]/.test(from)) return '';
  const angle = from.match(/<([^<>]+)>\s*$/);
  return (angle ? angle[1] : from).trim();
}

export function getOtpConfig() {
  const recipients = parseRecipients(process.env.ADMIN_OTP_RECIPIENTS);
  const from = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const fromAddress = senderAddress(from);
  const fromDomain = fromAddress.split('@')[1]?.toLowerCase() || '';
  const freeMailSender = fromDomain === 'gmail.com' || fromDomain === 'googlemail.com';

  return {
    recipients,
    from,
    hasApiKey: Boolean(apiKey),
    configured: Boolean(
      apiKey && EMAIL_RE.test(fromAddress) && !freeMailSender && recipients.length
    ),
    ttlSeconds: intEnv('ADMIN_OTP_TTL_SECONDS', 300, 1, 900),
    maxAttempts: intEnv('ADMIN_OTP_MAX_ATTEMPTS', 5, 1, 10),
    resendCooldownSeconds: intEnv('ADMIN_OTP_RESEND_COOLDOWN_SECONDS', 60, 1, 300),
    maxResends: intEnv('ADMIN_OTP_MAX_RESENDS', 3, 0, 10),
    // Test mode may only redirect outbound mail to a local mock outside Vercel.
    testMode: process.env.ADMIN_OTP_TEST_MODE === '1' && process.env.VERCEL !== '1'
  };
}

/** Cryptographically secure six-digit code, zero-padded. */
export function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function otpSecret() {
  return getOtpHashSecret();
}

export function otpHashConfigured() {
  return Boolean(otpSecret());
}

/**
 * Keyed hash of the code bound to the challenge id, so a leaked database row
 * cannot be brute-forced offline without the server secret.
 */
export function hashOtp(challengeId, otp, salt) {
  const secret = otpSecret();
  if (!secret) return '';
  return crypto
    .createHmac('sha256', secret)
    .update(`${challengeId}:${salt}:${otp}`)
    .digest('hex');
}

export function otpMatches(challengeId, otp, salt, expectedHash) {
  const actual = hashOtp(challengeId, otp, salt);
  if (!actual || !expectedHash) return false;
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(String(expectedHash), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isSixDigitOtp(value) {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

/** Show only enough of an address for the admin to recognise the inbox. */
export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return '***';
  const start = name.slice(0, 1);
  const end = name.length > 2 ? name.slice(-1) : '';
  return `${start}***${end}@${domain}`;
}
