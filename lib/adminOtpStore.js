import 'server-only';
import { getSupabaseAdmin, getSupabaseConfig } from './supabaseServer';

/**
 * Pending-login challenge storage.
 *
 * Vercel runs each request in a fresh serverless function, so process-local
 * memory cannot hold the pending challenge between "password accepted" and
 * "OTP verified". Production therefore uses a Supabase table
 * (`admin_login_challenges`, see supabase/migrations). A memory backend exists
 * only for local tests and self-hosted single-process use, and is refused on
 * Vercel even if requested by configuration.
 */

const TABLE = 'admin_login_challenges';

// Shared across route-handler bundles within one Node process (see the same
// pattern for sessions in adminAuth.js). This backend is for local tests and a
// single long-running self-hosted process only.
const MEMORY_STORE_KEY = '__pureRootsAdminOtpChallenges';
if (!(globalThis[MEMORY_STORE_KEY] instanceof Map)) {
  globalThis[MEMORY_STORE_KEY] = new Map();
}
const memory = globalThis[MEMORY_STORE_KEY];

export function otpStoreMode() {
  const explicit = String(process.env.ADMIN_OTP_STORE || '').toLowerCase();
  if (explicit === 'memory') {
    // Never keep pending login state in per-instance memory on serverless.
    if (process.env.VERCEL === '1') return 'unconfigured';
    return 'memory';
  }
  const config = getSupabaseConfig();
  return config.url && config.key ? 'supabase' : 'unconfigured';
}

function pruneMemory() {
  const now = Date.now();
  for (const [id, row] of memory.entries()) {
    if (!row || Date.parse(row.expires_at) <= now - 60 * 60 * 1000) memory.delete(id);
  }
}

export async function createChallenge(record) {
  const mode = otpStoreMode();
  if (mode === 'memory') {
    pruneMemory();
    memory.set(record.id, { ...record, consumed_at: null, created_at: new Date().toISOString() });
    return true;
  }
  if (mode !== 'supabase') return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  // Best-effort cleanup of old challenges; never block login on it.
  try {
    await supabase
      .from(TABLE)
      .delete()
      .lt('expires_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  } catch {
    // ignore cleanup failures
  }

  const { error } = await supabase.from(TABLE).insert(record);
  if (error) {
    console.error('OTP challenge insert failed:', error.message);
    return false;
  }
  return true;
}

export async function getChallenge(id) {
  if (!id) return null;
  const mode = otpStoreMode();
  if (mode === 'memory') return memory.get(id) || null;
  if (mode !== 'supabase') return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('OTP challenge read failed:', error.message);
    return null;
  }
  return data || null;
}

/**
 * Increment the failed-attempt counter. Uses optimistic concurrency so two
 * parallel guesses cannot both read the same count and overwrite each other.
 */
export async function registerFailedAttempt(id, maxAttempts) {
  const mode = otpStoreMode();
  if (mode === 'memory') {
    const row = memory.get(id);
    if (!row || row.consumed_at) return { attempts: 0, exhausted: true, missing: true };
    row.attempts = Number(row.attempts || 0) + 1;
    const exhausted = row.attempts >= maxAttempts;
    if (exhausted) memory.delete(id);
    return { attempts: row.attempts, exhausted };
  }
  if (mode !== 'supabase') return { attempts: 0, exhausted: true, missing: true };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { attempts: 0, exhausted: true, missing: true };

  for (let i = 0; i < 4; i += 1) {
    const row = await getChallenge(id);
    if (!row || row.consumed_at) return { attempts: 0, exhausted: true, missing: true };

    const current = Number(row.attempts || 0);
    const next = current + 1;
    const { data, error } = await supabase
      .from(TABLE)
      .update({ attempts: next })
      .eq('id', id)
      .eq('attempts', current)
      .is('consumed_at', null)
      .select('attempts')
      .maybeSingle();

    if (error) {
      // If the counter cannot be persisted, do not let repeated guesses continue
      // against the same challenge. Delete it so the caller fails closed.
      console.error('OTP attempt update failed:', error.message);
      await deleteChallenge(id).catch(() => {});
      return { attempts: next, exhausted: true, missing: true };
    }
    if (data) {
      const exhausted = data.attempts >= maxAttempts;
      if (exhausted) await deleteChallenge(id).catch(() => {});
      return { attempts: data.attempts, exhausted };
    }
  }

  // Under heavy contention, treat the challenge as exhausted (fail closed) and
  // remove it so it cannot be retried indefinitely.
  await deleteChallenge(id).catch(() => {});
  return { attempts: maxAttempts, exhausted: true };
}

/** Mark the challenge single-use. Returns true only for the winning request. */
export async function consumeChallenge(id) {
  const now = new Date();
  const mode = otpStoreMode();
  if (mode === 'memory') {
    const row = memory.get(id);
    if (!row || row.consumed_at) return false;
    if (!(Date.parse(row.expires_at) > now.getTime())) return false;
    row.consumed_at = now.toISOString();
    return true;
  }
  if (mode !== 'supabase') return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .update({ consumed_at: now.toISOString() })
    .eq('id', id)
    .is('consumed_at', null)
    .gt('expires_at', now.toISOString())
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('OTP consume failed:', error.message);
    return false;
  }
  return Boolean(data);
}

/** Replace the code on resend. Optimistic on resend_count to stop parallel resends. */
export async function rotateChallenge(id, expectedResendCount, updates) {
  const now = new Date();
  const mode = otpStoreMode();
  if (mode === 'memory') {
    const row = memory.get(id);
    if (!row || row.consumed_at) return false;
    if (!(Date.parse(row.expires_at) > now.getTime())) return false;
    Object.assign(row, updates);
    return true;
  }
  if (mode !== 'supabase') return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .eq('resend_count', expectedResendCount)
    .is('consumed_at', null)
    .gt('expires_at', now.toISOString())
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('OTP resend update failed:', error.message);
    return false;
  }
  return Boolean(data);
}

export async function deleteChallenge(id) {
  if (!id) return;
  const mode = otpStoreMode();
  if (mode === 'memory') {
    memory.delete(id);
    return;
  }
  if (mode !== 'supabase') return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) console.error('OTP challenge delete failed:', error.message);
}
