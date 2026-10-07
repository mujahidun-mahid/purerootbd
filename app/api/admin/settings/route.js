import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body?.key || '').trim();
    const value = String(body?.value ?? '');
    const allowed = [
      'site_name',
      'site_tagline',
      'logo_image_url',
      'site_description',
      'meta_title',
      'meta_description',
      'footer_text',
      'contact_phone',
      'contact_email',
      'contact_address',
      'announcement',
      'announcement_enabled',
      'hero_title',
      'hero_subtitle',
      'hero_image_url'
    ];
    if (!allowed.includes(key)) {
      return NextResponse.json({ error: 'Unsupported setting key.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('key,value')
      .single();

    if (error) throw error;
    return NextResponse.json({ setting: data });
  } catch (error) {
    console.error('Admin settings error:', error);
    return NextResponse.json({ error: error.message || 'Unable to save site setting.' }, { status: 500 });
  }
}

