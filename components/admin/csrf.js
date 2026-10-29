'use client';

// CSRF double-submit helper for admin UI requests.
//
// The session itself lives in the HttpOnly `pr_admin` cookie and is sent
// automatically. The CSRF token lives in the JS-readable `csrf_token` cookie and
// must be echoed in the `X-CSRF-Token` header on state-changing requests.

export function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function adminHeaders({ json = true } = {}) {
  const headers = {};
  if (json) headers['content-type'] = 'application/json';
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  return headers;
}
