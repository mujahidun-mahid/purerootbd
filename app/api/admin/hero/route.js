import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose an image file first.' }, { status: 400 });
    }
    if (!String(file.type || '').startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
    }
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be 6 MB or less.' }, { status: 400 });
    }

    const ext = (String(file.name || 'jpg').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `hero/hero-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
      cacheControl: '3600'
    });

    if (uploadError) {
      console.warn('Storage upload warning:', uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage.from('site-assets').getPublicUrl(path);
    const url = publicData.publicUrl;

    const { error: settingsError } = await supabase.from('site_settings').upsert({
      key: 'hero_image_url',
      value: url
    }, { onConflict: 'key' });

    if (settingsError) throw settingsError;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Hero upload error:', error);
    return NextResponse.json({ error: error.message || 'Unable to upload image to Supabase Storage.' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  try {
    const { url } = await request.json().catch(() => ({}));
    if (!url || !/^https?:\/\//i.test(String(url || ''))) {
      return NextResponse.json({ error: 'Enter a valid image URL (e.g. https://...)' }, { status: 400 });
    }

    const { error } = await supabase.from('site_settings').upsert({
      key: 'hero_image_url',
      value: String(url).trim()
    }, { onConflict: 'key' });

    if (error) throw error;
    return NextResponse.json({ url: String(url).trim() });
  } catch (error) {
    console.error('Hero URL save error:', error);
    return NextResponse.json({ error: error.message || 'Unable to save image URL.' }, { status: 500 });
  }
}

