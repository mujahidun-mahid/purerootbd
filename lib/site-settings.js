import { getSupabaseAdmin } from './supabaseServer';
import { SETTINGS_DEFAULTS } from './site-defaults';

export { SETTINGS_DEFAULTS };

export async function getSiteSettings() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { ...SETTINGS_DEFAULTS };
    const { data, error } = await supabase.from('site_settings').select('key,value');
    if (error) throw error;
    const map = Object.fromEntries(
      (data || [])
        .filter((x) => x.key && x.value !== null && String(x.value).trim() !== '')
        .map((x) => [x.key, x.value])
    );
    return { ...SETTINGS_DEFAULTS, ...map };
  } catch (error) {
    console.warn('Site settings lookup fallback used:', error?.message);
    return { ...SETTINGS_DEFAULTS };
  }
}
