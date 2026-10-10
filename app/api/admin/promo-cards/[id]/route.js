import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

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

export async function PUT(request, { params }) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  try {
    const body = await request.json().catch(() => ({}));
    const row = { updated_at: new Date().toISOString() };
    for (const key of FIELDS) {
      if (key in body) row[key] = body[key];
    }
    if ('title' in row && !String(row.title).trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('promo_cards')
      .update(row)
      .eq('id', params.id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Promo card not found.' }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ card: data });
  } catch (error) {
    console.error('Admin promo-card PUT error:', error);
    return NextResponse.json({ error: error.message || 'Unable to update promo card.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  try {
    const { error } = await supabase.from('promo_cards').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin promo-card DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Unable to delete promo card.' }, { status: 500 });
  }
}
