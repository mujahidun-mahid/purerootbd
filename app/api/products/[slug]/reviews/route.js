import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { loadProduct } from '@/lib/products-server';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ reviews: [] }, { headers: { 'cache-control': 'no-store' } });
  const { data, error } = await supabase.from('product_reviews')
    .select('id,name,rating,body,created_at')
    .eq('product_slug', slug).eq('approved', true).order('created_at', { ascending: false });
  if (error) {
    console.error('Product reviews read error:', error);
    return NextResponse.json({ error: 'Unable to load reviews.' }, { status: 503 });
  }
  return NextResponse.json({ reviews: data || [] }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const reviewBody = String(body.body || '').trim();
  const rating = Number(body.rating);
  if (!name || name.length > 80) return NextResponse.json({ error: 'Name is required (up to 80 characters).' }, { status: 400 });
  if (!reviewBody || reviewBody.length > 2000) return NextResponse.json({ error: 'Review is required (up to 2,000 characters).' }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Reviews are not configured yet.' }, { status: 503 });
  const { error } = await supabase.from('product_reviews').insert({
    product_slug: slug, name, rating, body: reviewBody, approved: false
  });
  if (error) {
    console.error('Product review submission error:', error);
    return NextResponse.json({ error: 'Unable to submit review right now.' }, { status: 503 });
  }
  return NextResponse.json({ submitted: true }, { status: 201 });
}
