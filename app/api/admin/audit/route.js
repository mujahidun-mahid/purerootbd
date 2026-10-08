import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const { data, error } = await supabase
      .from('site_events')
      .select('id,event_type,metadata,created_at')
      .eq('event_type', 'admin_action')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ events: data || [] });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: error.message || 'Unable to load audit log.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim().slice(0, 80);
    const detail = body?.detail ?? {};
    if (!action) return NextResponse.json({ error: 'Action is required.' }, { status: 400 });

    const { data, error } = await supabase
      .from('site_events')
      .insert({
        event_type: 'admin_action',
        path: '/admin',
        session_id: 'admin-console',
        metadata: { action, detail }
      })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error) {
    console.error('Audit record error:', error);
    return NextResponse.json({ error: error.message || 'Unable to record action.' }, { status: 500 });
  }
}
