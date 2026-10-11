import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';
import { validateImageUpload } from '@/lib/uploadValidation';

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
    const bytes = Buffer.from(await file.arrayBuffer());
    // Same policy as product uploads: JPEG/PNG/WebP only, magic-byte
    // verified. SVG is rejected (stored-XSS risk when served inline).
    const check = validateImageUpload({ declaredType: file.type, bytes, maxBytes: 6 * 1024 * 1024 });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const path = `hero/hero-${Date.now()}.${check.ext}`;

    const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, bytes, {
      contentType: check.type,
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

