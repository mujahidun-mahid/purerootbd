import 'server-only';

/**
 * Server-only admin secret policy.
 *
 * In production, session signing and OTP hashing must use dedicated, strong
 * secrets. Falling back to a short ADMIN_PASSWORD silently weakens both HMACs,
 * so production refuses to derive either secret from the password.
 *
 * Development and the local test harness may still use the legacy fallback.
 */

const MIN_PASSWORD_LENGTH = 20;
const MIN_SECRET_LENGTH = 32;

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || '';
}

function strongDedicatedSecret(value) {
  const secret = String(value || '');
  return secret.length >= MIN_SECRET_LENGTH && secret !== adminPassword();
}

export function getSessionSecret() {
  const dedicated = String(process.env.ADMIN_SESSION_SECRET || '');
  if (isProductionRuntime()) return strongDedicatedSecret(dedicated) ? dedicated : '';
  return dedicated || adminPassword();
}

export function getOtpHashSecret() {
  const dedicated = String(process.env.ADMIN_OTP_HASH_SECRET || '');
  if (isProductionRuntime()) {
    // Keep the session and OTP keys independent as well as password-independent.
    const session = String(process.env.ADMIN_SESSION_SECRET || '');
    return strongDedicatedSecret(dedicated) && dedicated !== session ? dedicated : '';
  }
  return (
    dedicated ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_SECRET ||
    ''
  );
}

export function adminPasswordIsStrong(password) {
  if (!isProductionRuntime()) return true;
  const value = String(password || '');
  return value.length >= MIN_PASSWORD_LENGTH && value.trim().length >= MIN_PASSWORD_LENGTH;
}

export function adminSecretsConfigured() {
  return Boolean(getSessionSecret() && getOtpHashSecret());
}
