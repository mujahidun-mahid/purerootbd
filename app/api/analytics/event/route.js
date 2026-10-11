import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

const ALLOWED_EVENTS = new Set(['page_view', 'heartbeat', 'admin_action']);

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.session_id) return NextResponse.json({ ok: false, error: 'session_id is required.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database is not configured.' }, { status: 503 });
    }
    // Unauthenticated endpoint: strict allowlist + size caps so it cannot
    // be used to stuff arbitrary strings / oversized JSON into the DB.
    const eventType = String(body.event_type || 'page_view').slice(0, 40);
    if (!ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false, error: 'Unsupported event type.' }, { status: 400 });
    }
    let metadata = {};
    if (body.metadata && typeof body.metadata === 'object') {
      try {
        const raw = JSON.stringify(body.metadata);
        if (raw.length > 2000) {
          return NextResponse.json({ ok: false, error: 'Metadata too large.' }, { status: 400 });
        }
        metadata = JSON.parse(raw);
      } catch {
        return NextResponse.json({ ok: false, error: 'Invalid metadata.' }, { status: 400 });
      }
    }
    const { error } = await supabase.from('site_events').insert({
      event_type: eventType,
      path: String(body.path || '/').slice(0, 500),
      session_id: String(body.session_id).slice(0, 100),
      referrer: String(body.referrer || '').slice(0, 1000),
      metadata
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics error', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
