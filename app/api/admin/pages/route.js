import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = [
  'slug', 'title', 'meta_title', 'meta_description',
  'hero_title', 'hero_subtitle', 'hero_image', 'hero_cta_text', 'hero_cta_link',
  'content_html', 'content_markdown', 'sections',
  'is_active', 'show_in_nav', 'nav_order', 'template'
];

async function getSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Database not configured');
  return supabase;
}

export async function GET(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .order('nav_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ pages: [] });
      }
      throw error;
    }
    return NextResponse.json({ pages: data || [] });
  } catch (error) {
    console.error('Admin pages GET error:', error);
    return NextResponse.json({ pages: [] });
  }
}

export async function POST(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = await getSupabase();

    const { data: existing } = await supabase.from('site_pages').select('slug').eq('slug', slug).single();
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });

    const row = { slug };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) row[key] = body[key];
    }
    row.is_active = row.is_active ?? true;
    row.show_in_nav = row.show_in_nav ?? false;
    row.nav_order = row.nav_order ?? 0;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('site_pages').insert(row).select().single();
    if (error) throw error;

    return NextResponse.json({ page: data }, { status: 201 });
  } catch (error) {
    console.error('Admin pages POST error:', error);
    return NextResponse.json({ error: error.message || 'Unable to create page' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const slug = String(body.slug || '').trim();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = await getSupabase();

    const row = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) row[key] = body[key];
    }

    const { data, error } = await supabase
      .from('site_pages')
      .update(row)
      .eq('slug', slug)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ page: data });
  } catch (error) {
    console.error('Admin pages PUT error:', error);
    return NextResponse.json({ error: error.message || 'Unable to update page' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = await getSupabase();
    const { error } = await supabase.from('site_pages').delete().eq('slug', slug);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin pages DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Unable to delete page' }, { status: 500 });
  }
}