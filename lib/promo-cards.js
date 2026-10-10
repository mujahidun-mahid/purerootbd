import { getSupabaseAdmin } from './supabaseServer';

export function rowToPromoCard(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    discount_text: r.discount_text || '',
    background_image: r.background_image || '',
    background_color: r.background_color || '',
    button_text: r.button_text || 'Shop Now',
    button_link: r.button_link || '/shop',
    display_order: r.display_order ?? 0,
    is_active: r.is_active !== false,
  };
}

export async function loadPromoCards({ includeInactive = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  try {
    let query = supabase
      .from('promo_cards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(rowToPromoCard).filter(Boolean);
  } catch (e) {
    console.warn('loadPromoCards fallback:', e.message);
    return [];
  }
}
