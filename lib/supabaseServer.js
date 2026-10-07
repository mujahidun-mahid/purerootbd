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

export function getSupabaseAdmin() {
  const { url, key, configured } = getSupabaseConfig();
  if (!configured) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function adminAuthorized(request) {
  const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;
  if (!expected) return false;
  if (request.headers.get('x-admin-password') === expected) return true;
  const cookie = request.cookies?.get?.('pr_admin')?.value;
  if (!cookie) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const token = crypto.createHash('sha256').update(`${expected}:${url}`).digest('hex');
  return cookie === token;
}
