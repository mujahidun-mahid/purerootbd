import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.SUPABASE_SECRET_KEY || 
                     process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                  process.env.SUPABASE_ANON_KEY;

  const key = serviceKey || anonKey;
  const isServiceRole = Boolean(serviceKey);

  return {
    url: url ? url.trim() : null,
    key: key ? key.trim() : null,
    isServiceRole,
    hasAnonKey: Boolean(anonKey),
    configured: Boolean(url && key),
    hasPassword: Boolean(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET)
  };
}

// Supabase REST reads must never land in Next's fetch/Data cache.
// Otherwise the admin dashboard and storefront keep serving the snapshot
// taken on the very first request until the cache is invalidated.
const noStoreFetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

export function getSupabaseAdmin() {
  const { url, key, configured } = getSupabaseConfig();
  if (!configured) return null;
  return createClient(url, key, {
    global: { fetch: noStoreFetch },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || '';
}

export function getAdminSessionToken() {
  const expected = getAdminPassword();
  if (!expected) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return crypto.createHash('sha256').update(`${expected}:${url}`).digest('hex');
}

export function adminAuthorized(request) {
  const expected = getAdminPassword();
  if (!expected) return false;
  if (request.headers.get('x-admin-password') === expected) return true;
  const cookie = request.cookies?.get?.('pr_admin')?.value;
  if (!cookie) return false;
  const token = getAdminSessionToken();
  return Boolean(token) && cookie === token;
}
