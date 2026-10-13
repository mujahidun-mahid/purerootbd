import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';
import { isSafeHttpUrl } from '@/lib/safeUrl';

export const dynamic = 'force-dynamic';

const FIELDS = [
  'title',
  'description',
  'discount_text',
  'background_image',
  'background_color',
  'button_text',
  'button_link',
  'display_order',
  'is_active'
];

export async function GET(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  try {
    const { data, error } = await supabase
      .from('promo_cards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ cards: data || [] });
  } catch (error) {
    console.error('Admin promo-cards GET error:', error);
    return NextResponse.json({ error: error.message || 'Unable to load promo cards.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

    const row = { title, updated_at: new Date().toISOString() };
    for (const key of FIELDS) {
      if (key !== 'title' && key in body) row[key] = body[key];
    }
    for (const key of ['background_image', 'button_link']) {
      const v = String(row[key] ?? '').trim();
      if (v !== '' && !isSafeHttpUrl(v) && !v.startsWith('/')) {
        return NextResponse.json({ error: `Invalid ${key.replace('_', ' ')}: use a site path or http(s) URL.` }, { status: 400 });
      }
    }
    if (row.is_active === undefined) row.is_active = true;
    if (row.display_order === undefined) row.display_order = 0;
    if (!row.button_text) row.button_text = 'Shop Now';
    if (!row.button_link) row.button_link = '/shop';

    const { data, error } = await supabase.from('promo_cards').insert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ card: data }, { status: 201 });
  } catch (error) {
    console.error('Admin promo-cards POST error:', error);
    return NextResponse.json({ error: error.message || 'Unable to create promo card.' }, { status: 500 });
  }
}
