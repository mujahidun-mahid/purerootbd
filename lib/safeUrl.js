// Guard for admin-authored link/image fields rendered as href/src.
// Only relative site paths and http(s) URLs are allowed — this blocks
// `javascript:`, `data:` and other dangerous schemes even if an admin
// account is compromised or a value is mistyped.
export function safeHref(value, fallback = '/shop') {
  const v = String(value || '').trim();
  if (!v) return fallback;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (/^https?:\/\/[^/\s]+\.?[^/\s]*/i.test(v)) return v;
  return fallback;
}

export function isSafeHttpUrl(value) {
  const v = String(value || '').trim();
  return /^https?:\/\/\S+\.\S+/i.test(v);
}
