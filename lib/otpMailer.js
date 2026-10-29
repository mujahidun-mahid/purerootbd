import 'server-only';

/**
 * Resend delivery for admin OTP codes.
 *
 * Uses the documented REST API (https://resend.com/docs/api-reference/emails/send-email)
 * with the server-only `RESEND_API_KEY`. Codes are never logged here or in any
 * caller; only delivery status is reported.
 */

const RESEND_URL = 'https://api.resend.com/emails';

function endpoint() {
  // Only a local test process may redirect mail. On Vercel this branch is
  // disabled even if ADMIN_OTP_TEST_MODE is accidentally left set.
  if (process.env.ADMIN_OTP_TEST_MODE === '1' && process.env.VERCEL !== '1') {
    const base = String(process.env.RESEND_API_BASE_URL || '').trim();
    if (base) return `${base.replace(/\/+$/, '')}/emails`;
  }
  return RESEND_URL;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

async function sendOne({ to, otp, ttlSeconds, from }) {
  const minutes = Math.max(1, Math.round(ttlSeconds / 60));
  const subject = 'Your PureRoots admin verification code';
  const text = [
    `Your PureRoots admin verification code is ${otp}.`,
    `It expires in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    'If you did not try to sign in, ignore this email and consider rotating the admin password.'
  ].join('\n\n');
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#17261a">
      <h2 style="margin:0 0 8px;font-size:20px">PureRoots admin verification</h2>
      <p style="margin:0 0 16px;color:#52605a;line-height:1.6">Enter this code to finish signing in:</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;padding:16px 18px;border-radius:10px;background:#f1f6ef;border:1px solid #d8e5d2;text-align:center">${escapeHtml(otp)}</div>
      <p style="margin:16px 0 0;color:#52605a;line-height:1.6">This code expires in ${minutes} minute${minutes === 1 ? '' : 's'} and can be used once.</p>
      <p style="margin:16px 0 0;color:#7a857f;font-size:12px;line-height:1.6">If you did not try to sign in, ignore this email and consider rotating the admin password.</p>
    </div>
  `.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY || ''}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      // Log only the status. Provider bodies can contain request details, and
      // the OTP must never be written to logs.
      console.error(`Resend OTP delivery failed with HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      'Resend OTP delivery error:',
      error?.name === 'AbortError' ? 'timeout' : error?.message || 'network error'
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send the same code to every configured recipient. Delivery must succeed for
 * all of them; any failure makes the caller discard the challenge so no session
 * can be issued from a partially delivered code.
 */
export async function sendOtpToRecipients({ recipients, otp, ttlSeconds, from }) {
  if (!Array.isArray(recipients) || !recipients.length) return false;
  const results = await Promise.all(
    recipients.map((to) => sendOne({ to, otp, ttlSeconds, from }))
  );
  return results.every(Boolean);
}
