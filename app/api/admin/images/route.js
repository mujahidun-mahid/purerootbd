import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';
import { validateImageUpload, isPathInPrefix } from '@/lib/uploadValidation';

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
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    // MIME type is client-supplied: enforce allowlist AND magic bytes.
    // SVG is rejected — scripts inside a bucket-served SVG run as stored XSS.
    const check = validateImageUpload({ declaredType: file.type, bytes, maxBytes: 5 * 1024 * 1024 });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${check.ext}`;
    const path = `products/${filename}`;

    const { data, error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: check.type,
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
    if (!isPathInPrefix(path, 'products/')) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed.' }, { status: 500 });
  }
}