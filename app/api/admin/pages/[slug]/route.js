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

export async function GET(request, { params }) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const slug = params.slug;
    const { data, error } = await supabase.from('site_pages').select('*').eq('slug', slug).single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ page: data });
  } catch (error) {
    console.error('Admin page GET error:', error);
    return NextResponse.json({ error: error.message || 'Unable to load page' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const row = { updated_at: new Date().toISOString() };
    for (const key of ['title', 'meta_title', 'meta_description', 'hero_title', 'hero_subtitle', 'hero_image', 'hero_cta_text', 'hero_cta_link', 'content_html', 'content_markdown', 'sections', 'is_active', 'show_in_nav', 'nav_order', 'template']) {
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
    console.error('Admin page PUT error:', error);
    return NextResponse.json({ error: error.message || 'Unable to update page' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('site_pages').delete().eq('slug', slug);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin page DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Unable to delete page' }, { status: 500 });
  }
}