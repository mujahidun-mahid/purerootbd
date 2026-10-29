import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseConfig } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const HEADERS = { 'cache-control': 'no-store' };

/**
 * Lightweight liveness/readiness endpoint for HostSeba, PM2, or an uptime
 * monitor. It intentionally returns no credentials, URLs, or database error
 * details. A 503 means the app is running but the database is not usable.
 */
export async function GET() {
  const config = getSupabaseConfig();
  if (!config.configured) {
    return NextResponse.json(
      { status: 'degraded', database: 'not_configured' },
      { status: 503, headers: HEADERS }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Supabase client could not be initialized.');
    const { error } = await supabase.from('site_settings').select('key').limit(1);
    if (error) throw error;
    return NextResponse.json(
      { status: 'ok', database: 'reachable' },
      { headers: HEADERS }
    );
  } catch (error) {
    console.error('Health check failed:', error?.message);
    return NextResponse.json(
      { status: 'degraded', database: 'unreachable' },
      { status: 503, headers: HEADERS }
    );
  }
}
