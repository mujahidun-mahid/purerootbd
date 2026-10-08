import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const COLUMNS =
  'id,name,slug,category,price,old_price,image,stock,packages,rating,reviews,short,description,ingredients,nutrition,benefits,use,storage,related,active,created_at,updated_at';

const FIELDS = {
  name: 'name', slug: 'slug', category: 'category', price: 'price',
  oldPrice: 'old_price', image: 'image', stock: 'stock', packages: 'packages',
  rating: 'rating', reviews: 'reviews', short: 'short', description: 'description',
  ingredients: 'ingredients', nutrition: 'nutrition', benefits: 'benefits',
  use: 'use', storage: 'storage', related: 'related', active: 'active'
};

function slugify(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildRow(body) {
  const row = {};
  for (const key of Object.keys(FIELDS)) {
    if (!(key in body)) continue;
    const col = FIELDS[key];
    const v = body[key];
    if (col === 'price' || col === 'old_price') {
      row[col] = v === '' || v === null || v === undefined ? null : Number(v);
      if (row[col] !== null && Number.isNaN(row[col])) row[col] = null;
      if (col === 'price' && row[col] === null) row[col] = 0;
    } else if (col === 'stock' || col === 'rating' || col === 'reviews') {
      const n = Number(v || 0);
      row[col] = Number.isNaN(n) ? 0 : n;
    } else if (col === 'packages' || col === 'related') {
      row[col] = Array.isArray(v) ? v : [];
    } else if (col === 'active') {
      row[col] = v !== false && v !== 'false';
    } else {
      row[col] = typeof v === 'string' ? v.trim() : v;
    }
  }
  return row;
}

function guard(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  return supabase;
}

function fail(error, fallback) {
  console.error('Admin products error:', error);
  return NextResponse.json({ error: error.message || fallback }, { status: 500 });
}

export async function GET(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const { data, error } = await supabase.from('products').select(COLUMNS).order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ products: data || [] }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return fail(error, 'Unable to load products.');
  }
}

export async function POST(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const row = buildRow(body || {});
    if (!row.name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    if (typeof row.price !== 'number') return NextResponse.json({ error: 'Product price is required.' }, { status: 400 });
    if (!row.slug) row.slug = slugify(row.name);
    if (!row.slug) return NextResponse.json({ error: 'Could not build a slug for this product.' }, { status: 400 });
    if (!row.category) row.category = 'nuts';
    if (!Array.isArray(row.packages) || !row.packages.length) {
      row.packages = [{ size: '500g', price: row.price }];
    }
    if (row.active === undefined) row.active = true;
    row.id = String(body.id || row.slug);
    const now = new Date().toISOString();
    row.created_at = now;
    row.updated_at = now;

    const { data, error } = await supabase.from('products').insert(row).select(COLUMNS).single();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A product with this slug already exists.' }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    return fail(error, 'Unable to create product.');
  }
}

export async function PATCH(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
    const row = buildRow(body || {});
    delete row.id;
    delete row.created_at;
    if (!Object.keys(row).length) return NextResponse.json({ error: 'No changes supplied.' }, { status: 400 });
    if ('slug' in row && !row.slug) return NextResponse.json({ error: 'Slug cannot be empty.' }, { status: 400 });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('products').update(row).eq('id', id).select(COLUMNS).single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 });
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ product: data });
  } catch (error) {
    return fail(error, 'Unable to update product.');
  }
}

export async function DELETE(request) {
  const supabase = guard(request);
  if (supabase instanceof NextResponse) return supabase;
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || new URL(request.url).searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
    const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data || !data.length) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    return NextResponse.json({ deleted: data[0].id });
  } catch (error) {
    return fail(error, 'Unable to delete product.');
  }
}
