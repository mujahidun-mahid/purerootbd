import { NextResponse } from 'next/server';
import { getSupabaseConfig, getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const isAuth = adminAuthorized(request);
  const config = getSupabaseConfig();

  let dbStatus = 'Not Configured';
  let ordersCount = 0;
  let eventsCount = 0;

  if (config.configured) {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const [{ count: oCount, error: oErr }, { count: eCount, error: eErr }] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('site_events').select('*', { count: 'exact', head: true })
        ]);

        if (oErr) dbStatus = `Orders table error: ${oErr.message}`;
        else if (eErr) dbStatus = `Connected (site_events note: ${eErr.message})`;
        else {
          dbStatus = 'Connected';
          ordersCount = oCount || 0;
          eventsCount = eCount || 0;
        }
      }
    } catch (e) {
      dbStatus = `Error: ${e.message}`;
    }
  }

  return NextResponse.json({
    authorized: isAuth,
    configured: config.configured,
    isServiceRole: config.isServiceRole,
    hasPassword: config.hasPassword,
    hasAnonKey: config.hasAnonKey,
    dbStatus,
    ordersCount,
    eventsCount,
    supabaseUrlProvided: Boolean(config.url)
  });
}

