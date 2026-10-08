import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';

export async function POST(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or SVG images allowed.' }, { status: 400 });
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 });
    }

    const ext = file.type.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `products/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false
    });
    if (error) throw error;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: pub.publicUrl, path: data.path });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'Path is required.' }, { status: 400 });

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed.' }, { status: 500 });
  }
}