import { getSupabaseAdmin } from './supabaseServer';

export async function getSiteSettings() {
  const fallback = {
    hero_image_url: '',
    hero_title: "Nature’s Nutrition, Delivered Pure",
    hero_subtitle: 'Premium nuts, seeds, spices, natural honey and nutritious food mixes, carefully selected for your everyday wellness.'
  };

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return fallback;
    const { data, error } = await supabase.from('site_settings').select('key,value');
    if (error) throw error;
    const map = Object.fromEntries((data || []).map((x) => [x.key, x.value]));
    return { ...fallback, ...map };
  } catch (error) {
    console.warn('Site settings lookup fallback used:', error?.message);
    return fallback;
  }
}

