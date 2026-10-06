import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.session_id) return NextResponse.json({ ok: false }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('site_events').insert({
      event_type: body.event_type || 'page_view',
      path: body.path || '/',
      session_id: String(body.session_id),
      referrer: body.referrer || '',
      metadata: body.metadata || {}
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics error', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
