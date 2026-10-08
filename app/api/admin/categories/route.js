import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const COLS = 'slug,name,icon,description,image,active,featured,sort_order,created_at,updated_at';

function guard(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  return supabase;
}

function fail(error, fallback) {
  console.error('Admin categories error:', error);
  return NextResponse.json({ error: error.message || fallback }, { status: 500 });
}

export async function GET(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const { data, error } = await supabase.from('categories').select(COLS).order('sort_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ categories: data || [] }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return fail(error, 'Unable to load categories.');
  }
}

export async function POST(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const slug = String(body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    const row = {
      slug,
      name: body.name.trim(),
      icon: body.icon?.trim() || '📦',
      description: body.description?.trim() || '',
      image: body.image?.trim() || '',
      active: body.active !== false,
      featured: body.featured === true || body.featured === 'true',
      sort_order: Number(body.sort_order) || 0
    };

    const { data, error } = await supabase.from('categories').insert(row).select(COLS).single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Category slug already exists.' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    return fail(error, 'Unable to create category.');
  }
}

export async function PATCH(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const slug = String(body?.slug || '').trim();
    if (!slug) return NextResponse.json({ error: 'Category slug is required.' }, { status: 400 });
    const { slug: _ignore, ...updates } = body;
    if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes supplied.' }, { status: 400 });

    if ('slug' in updates) return NextResponse.json({ error: 'Cannot change slug.' }, { status: 400 });
    if ('name' in updates && !updates.name?.trim()) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    if ('sort_order' in updates) updates.sort_order = Number(updates.sort_order) || 0;
    if ('active' in updates) updates.active = updates.active !== false && updates.active !== 'false';
    if ('featured' in updates) updates.featured = updates.featured === true || updates.featured === 'true';
    if ('icon' in updates) updates.icon = updates.icon?.trim() || '📦';
    if ('image' in updates) updates.image = updates.image?.trim() || '';
    if ('description' in updates) updates.description = updates.description?.trim() || '';
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('categories').update(updates).eq('slug', slug).select(COLS).single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ category: data });
  } catch (error) {
    return fail(error, 'Unable to update category.');
  }
}

export async function DELETE(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Category slug is required.' }, { status: 400 });

    const { data, error } = await supabase.from('categories').delete().eq('slug', slug).select('slug');
    if (error) throw error;
    if (!data || !data.length) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    return NextResponse.json({ deleted: data[0].slug });
  } catch (error) {
    return fail(error, 'Unable to delete category.');
  }
}

export async function PUT(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const updates = body?.updates;
    if (!Array.isArray(updates) || !updates.length) {
      return NextResponse.json({ error: 'Updates array is required.' }, { status: 400 });
    }
    for (const u of updates) {
      if (!u.slug || typeof u.sort_order !== 'number') continue;
      await supabase.from('categories').update({ sort_order: u.sort_order, updated_at: new Date().toISOString() }).eq('slug', u.slug);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, 'Unable to reorder categories.');
  }
}