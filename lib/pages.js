import { getSupabaseAdmin } from "./supabaseServer";

export async function getPage(slug) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getPages() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("is_active", true)
    .order("nav_order", { ascending: true });

  if (error) return [];
  return data || [];
}